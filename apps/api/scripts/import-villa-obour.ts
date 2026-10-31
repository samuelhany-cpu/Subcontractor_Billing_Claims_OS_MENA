import 'dotenv/config';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';

const projectName = 'فيلا العبور';
const sheetName = 'Sheet1';
const firstDataRow = 7;
const lastExpenseRow = 164;

type Mapped = {
  readonly expenseDate: string | null;
  readonly description: string;
  readonly categoryName: string | null;
  readonly payeeName: string | null;
  readonly companyName: string | null;
  readonly phone: string | null;
  readonly invoiceNumber: string | null;
  readonly quantity: string | null;
  readonly unitPrice: string | null;
  readonly amount: string;
};

function text(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim().replace(/\s+/g, ' ');
  return normalized === '' ? null : normalized;
}

function dateOnly(value: unknown): string | null {
  if (!(value instanceof Date) || Number.isNaN(value.valueOf())) return null;
  return value.toISOString().slice(0, 10);
}

function decimal(value: unknown, scale: number): string | null {
  if (value === null || value === undefined || value === '') return null;
  try {
    const parsed = new Prisma.Decimal(String(value));
    if (!parsed.isFinite() || parsed.isNegative()) return null;
    return parsed.toFixed(scale);
  } catch {
    return null;
  }
}

function rowHash(
  fileSha256: string,
  sourceRow: number,
  mapped: Mapped,
): string {
  return createHash('sha256')
    .update(JSON.stringify({ fileSha256, sourceRow, mapped }))
    .digest('hex');
}

function parse(filePath: string) {
  const buffer = readFileSync(filePath);
  const fileSha256 = createHash('sha256').update(buffer).digest('hex');
  const workbook = XLSX.read(buffer, { cellDates: true });
  const sheet = workbook.Sheets[sheetName];
  if (sheet === undefined) throw new Error(`Missing worksheet ${sheetName}`);
  const rows: Array<{
    sourceRow: number;
    rowHash: string;
    status: 'VALID' | 'SKIPPED';
    rawData: Record<string, unknown>;
    mappedData: Mapped | null;
    errors: readonly string[];
  }> = [];

  for (let row = firstDataRow; row <= lastExpenseRow; row += 1) {
    const cells = Array.from(
      { length: 12 },
      (_, index) => sheet[XLSX.utils.encode_cell({ r: row - 1, c: index })]?.v,
    );
    const rawData = Object.fromEntries(
      'ABCDEFGHIJKL'
        .split('')
        .map((column, index) => [column, cells[index] ?? null]),
    );
    const description = text(cells[2]);
    const amount = decimal(cells[11], 2);
    if (
      description === null ||
      amount === null ||
      new Prisma.Decimal(amount).lte(0)
    ) {
      if (
        cells.some((cell) => cell !== null && cell !== undefined && cell !== '')
      ) {
        rows.push({
          sourceRow: row,
          rowHash: createHash('sha256')
            .update(JSON.stringify({ fileSha256, row, rawData }))
            .digest('hex'),
          status: 'SKIPPED',
          rawData,
          mappedData: null,
          errors: [
            description === null
              ? 'missing_description'
              : 'missing_or_non_positive_amount',
          ],
        });
      }
      continue;
    }
    const mapped: Mapped = {
      expenseDate: dateOnly(cells[1]),
      description,
      categoryName: text(cells[3]),
      payeeName: text(cells[4]),
      companyName: text(cells[6]),
      phone: text(cells[7]),
      invoiceNumber: text(cells[8]),
      quantity: decimal(cells[9], 4),
      unitPrice: decimal(cells[10], 4),
      amount,
    };
    rows.push({
      sourceRow: row,
      rowHash: rowHash(fileSha256, row, mapped),
      status: 'VALID',
      rawData,
      mappedData: mapped,
      errors: [],
    });
  }
  return { fileSha256, rows };
}

async function main(): Promise<void> {
  const [mode, input] = process.argv.slice(2);
  if ((mode !== '--preview' && mode !== '--commit') || input === undefined) {
    throw new Error(
      'Usage: tsx scripts/import-villa-obour.ts --preview|--commit <workbook.xlsx>',
    );
  }
  const { fileSha256, rows } = parse(resolve(input));
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined) throw new Error('DATABASE_URL is required');
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });
  try {
    const project = await prisma.project.upsert({
      where: { name: projectName },
      update: {},
      create: { name: projectName },
    });
    const committed = await prisma.importJob.findFirst({
      where: {
        projectId: project.id,
        fileSha256,
        sheetName,
        status: 'COMMITTED',
      },
    });
    if (committed !== null) {
      console.log(
        JSON.stringify({
          mode,
          result: 'already_committed',
          fileSha256,
          importedRows: 0,
        }),
      );
      return;
    }
    const job = await prisma.importJob.create({
      data: {
        projectId: project.id,
        fileName: basename(input),
        fileSha256,
        sheetName,
        totalRows: rows.length,
        validRows: rows.filter((row) => row.status === 'VALID').length,
        skippedRows: rows.filter((row) => row.status === 'SKIPPED').length,
        rows: {
          create: rows.map((row) => ({
            ...row,
            rawData: row.rawData as Prisma.InputJsonObject,
            mappedData:
              row.mappedData === null
                ? Prisma.DbNull
                : (row.mappedData as Prisma.InputJsonObject),
            errors:
              row.errors.length === 0
                ? Prisma.DbNull
                : (row.errors as Prisma.InputJsonArray),
          })),
        },
      },
    });
    if (mode === '--preview') {
      console.log(
        JSON.stringify({
          mode,
          importJobId: job.id,
          fileSha256,
          validRows: job.validRows,
          skippedRows: job.skippedRows,
          datedRows: rows.filter(
            (row) =>
              row.mappedData !== null && row.mappedData.expenseDate !== null,
          ).length,
          undatedRows: rows.filter(
            (row) =>
              row.mappedData !== null && row.mappedData.expenseDate === null,
          ).length,
        }),
      );
      return;
    }
    await prisma.$transaction(async (tx) => {
      const categories = new Map(
        (await tx.category.findMany()).map((category) => [
          category.name,
          category,
        ]),
      );
      const payees = new Map<string, string>();
      for (const record of rows) {
        if (record.mappedData === null) continue;
        const mapped = record.mappedData;
        let categoryId: string | null = null;
        if (mapped.categoryName !== null) {
          let category = categories.get(mapped.categoryName);
          if (category === undefined) {
            category = await tx.category.create({
              data: { name: mapped.categoryName },
            });
            categories.set(category.name, category);
          }
          categoryId = category.id;
        }
        let payeeId: string | null = null;
        if (mapped.payeeName !== null) {
          const key = JSON.stringify([
            mapped.payeeName,
            mapped.companyName,
            mapped.phone,
          ]);
          payeeId = payees.get(key) ?? null;
          if (payeeId === null) {
            const existing = await tx.payee.findFirst({
              where: {
                name: mapped.payeeName,
                companyName: mapped.companyName,
                phone: mapped.phone,
              },
            });
            const payee =
              existing ??
              (await tx.payee.create({
                data: {
                  name: mapped.payeeName,
                  type: 'OTHER',
                  companyName: mapped.companyName,
                  phone: mapped.phone,
                },
              }));
            payeeId = payee.id;
            payees.set(key, payeeId);
          }
        }
        const expense = await tx.expense.create({
          data: {
            projectId: project.id,
            expenseDate:
              mapped.expenseDate === null
                ? null
                : new Date(`${mapped.expenseDate}T00:00:00.000Z`),
            description: mapped.description,
            categoryId,
            payeeId,
            invoiceNumber: mapped.invoiceNumber,
            quantity:
              mapped.quantity === null
                ? null
                : new Prisma.Decimal(mapped.quantity),
            unitPrice:
              mapped.unitPrice === null
                ? null
                : new Prisma.Decimal(mapped.unitPrice),
            amount: new Prisma.Decimal(mapped.amount),
            source: 'EXCEL_IMPORT',
            importFileName: basename(input),
            importSheet: sheetName,
            importRow: record.sourceRow,
          },
        });
        await tx.importRow.update({
          where: {
            importJobId_sourceRow: {
              importJobId: job.id,
              sourceRow: record.sourceRow,
            },
          },
          data: { status: 'IMPORTED', expenseId: expense.id },
        });
      }
      await tx.importJob.update({
        where: { id: job.id },
        data: { status: 'COMMITTED', committedAt: new Date() },
      });
      await tx.auditEvent.create({
        data: {
          action: 'IMPORT',
          entityType: 'ImportJob',
          entityId: job.id,
          source: 'EXCEL_IMPORT',
          afterData: { fileSha256, importedRows: job.validRows },
        },
      });
    });
    console.log(
      JSON.stringify({
        mode,
        result: 'committed',
        importJobId: job.id,
        fileSha256,
        importedRows: job.validRows,
      }),
    );
  } finally {
    await prisma.$disconnect();
  }
}
void main();
