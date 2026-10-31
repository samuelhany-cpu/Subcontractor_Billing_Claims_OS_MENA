import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AutomationAuthGuard } from '../src/automation/automation-auth.guard';
import { AutomationController } from '../src/automation/automation.controller';
import { AutomationService } from '../src/automation/automation.service';
import {
  API_RUNTIME_CONFIG,
  type ApiRuntimeConfig,
} from '../src/config/api-config';
import { AuditService } from '../src/audit/audit.service';
import { ExpenseAmountService } from '../src/expenses/expense-amount.service';
import { ExpensesRepository } from '../src/expenses/expenses.repository';
import { ExpensesService } from '../src/expenses/expenses.service';
import { ProjectStateService } from '../src/projects/project-state.service';
import { ProjectsRepository } from '../src/projects/projects.repository';
import { TransfersRepository } from '../src/transfers/transfers.repository';
import { TransfersService } from '../src/transfers/transfers.service';

const url = process.env.DATABASE_URL;
if (url === undefined || /claims_os(\?|$)/.test(url))
  throw new Error('Automation tests require the disposable database URL');
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});
const config = {
  automation: { secret: 'test-secret', allowedChatId: 'test-chat' },
} as ApiRuntimeConfig;
const projects = new ProjectsRepository(prisma);
const audit = new AuditService(prisma);
const state = new ProjectStateService(projects);
const expenses = new ExpensesService(
  new ExpensesRepository(prisma),
  new ExpenseAmountService(),
  state,
  audit,
);
const transfers = new TransfersService(
  new TransfersRepository(prisma),
  state,
  audit,
  { getCorrelationId: () => undefined } as never,
  prisma,
);
const automation = new AutomationService(prisma, config, expenses, transfers);
let projectId: string;
let categoryId: string;
let app: INestApplication<App>;

function expenseDraft(key: string) {
  return automation.create({
    telegramChatId: 'test-chat',
    telegramMsgId: key,
    intent: 'ADD_EXPENSE',
    idempotencyKey: key,
    payload: {
      projectId,
      expenseDate: '2026-08-01',
      description: key,
      categoryId,
      amount: '10.00',
    },
  });
}
function transferDraft(key: string) {
  return automation.create({
    telegramChatId: 'test-chat',
    telegramMsgId: key,
    intent: 'ADD_TRANSFER',
    idempotencyKey: key,
    payload: { projectId, transferDate: '2026-08-01', amount: '20.00' },
  });
}

beforeAll(async () => {
  await prisma.$connect();
  const project = await prisma.project.create({
    data: { name: 'automation-test-project' },
  });
  projectId = project.id;
  categoryId = (
    await prisma.category.create({ data: { name: 'automation-test-category' } })
  ).id;
  const module = await Test.createTestingModule({
    controllers: [AutomationController],
    providers: [
      { provide: AutomationService, useValue: automation },
      { provide: API_RUNTIME_CONFIG, useValue: config },
      AutomationAuthGuard,
    ],
  }).compile();
  app = module.createNestApplication();
  await app.init();
});
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

describe('AutomationService PostgreSQL confirmation', () => {
  it('creates one Telegram expense only after confirmation and is idempotent', async () => {
    const draft = await expenseDraft('expense-single');
    expect(await prisma.expense.count({ where: { projectId } })).toBe(0);
    const confirmed = await automation.confirm(draft.id);
    const repeated = await automation.confirm(draft.id);
    expect(confirmed.resultEntityType).toBe('Expense');
    expect(repeated.resultEntityId).toBe(confirmed.resultEntityId);
    expect(await prisma.expense.count({ where: { source: 'TELEGRAM' } })).toBe(
      1,
    );
    expect(
      await prisma.auditEvent.count({
        where: { entityType: 'Expense', source: 'TELEGRAM', action: 'CREATE' },
      }),
    ).toBe(1);
  });
  it('creates exactly one expense under twenty simultaneous confirmations', async () => {
    const draft = await expenseDraft('expense-concurrent');
    await Promise.allSettled(
      Array.from({ length: 20 }, () => automation.confirm(draft.id)),
    );
    const saved = await prisma.automationDraft.findUniqueOrThrow({
      where: { id: draft.id },
    });
    expect(saved.status).toBe('CONFIRMED');
    expect(
      await prisma.expense.count({ where: { id: saved.resultEntityId ?? '' } }),
    ).toBe(1);
    expect(
      await prisma.auditEvent.count({
        where: { entityId: saved.resultEntityId ?? '', action: 'CREATE' },
      }),
    ).toBe(1);
    expect((await automation.confirm(draft.id)).resultEntityId).toBe(
      saved.resultEntityId,
    );
  });
  it('creates exactly one transfer under twenty simultaneous confirmations', async () => {
    const draft = await transferDraft('transfer-concurrent');
    await Promise.allSettled(
      Array.from({ length: 20 }, () => automation.confirm(draft.id)),
    );
    const saved = await prisma.automationDraft.findUniqueOrThrow({
      where: { id: draft.id },
    });
    expect(saved.status).toBe('CONFIRMED');
    expect(
      await prisma.transfer.count({
        where: { id: saved.resultEntityId ?? '', source: 'TELEGRAM' },
      }),
    ).toBe(1);
    expect(
      await prisma.auditEvent.count({
        where: { entityId: saved.resultEntityId ?? '', action: 'CREATE' },
      }),
    ).toBe(1);
  });
  it('does not confirm cancelled or expired drafts', async () => {
    const cancelled = await expenseDraft('expense-cancelled');
    await automation.cancel(cancelled.id);
    await expect(automation.confirm(cancelled.id)).rejects.toBeDefined();
    const expired = await expenseDraft('expense-expired');
    await prisma.automationDraft.update({
      where: { id: expired.id },
      data: { expiresAt: new Date(0) },
    });
    await automation.confirm(expired.id);
    expect(
      (
        await prisma.automationDraft.findUniqueOrThrow({
          where: { id: expired.id },
        })
      ).status,
    ).toBe('EXPIRED');
  });
  it('enforces the internal secret and server-authorized Telegram draft ownership over HTTP', async () => {
    const endpoint = '/automation/drafts';
    const validBody = {
      telegramChatId: 'test-chat',
      telegramMsgId: 'http-allowed',
      intent: 'ADD_EXPENSE',
      idempotencyKey: 'http-allowed',
      payload: {
        projectId,
        expenseDate: '2026-08-01',
        description: 'http allowed draft',
        categoryId,
        amount: '10.00',
      },
    };
    const draftCountBefore = await prisma.automationDraft.count();
    const expenseCountBefore = await prisma.expense.count({
      where: { projectId },
    });
    await request(app.getHttpServer())
      .post(endpoint)
      .send(validBody)
      .expect(401);
    await request(app.getHttpServer())
      .post(endpoint)
      .set('x-automation-secret', 'incorrect-test-secret')
      .send(validBody)
      .expect(401);
    await request(app.getHttpServer())
      .post(endpoint)
      .set('x-automation-secret', 'test-secret')
      .send({ ...validBody, telegramChatId: 'foreign-chat' })
      .expect(400);
    await request(app.getHttpServer())
      .post(endpoint)
      .set('x-automation-secret', 'test-secret')
      .send({ telegramChatId: 'test-chat' })
      .expect(400);
    expect(await prisma.automationDraft.count()).toBe(draftCountBefore);
    expect(await prisma.expense.count({ where: { projectId } })).toBe(
      expenseCountBefore,
    );

    const allowed = await request(app.getHttpServer())
      .post(endpoint)
      .set('x-automation-secret', 'test-secret')
      .send(validBody)
      .expect(201);
    expect(allowed.body).toMatchObject({ telegramChatId: 'test-chat' });

    const foreign = await prisma.automationDraft.create({
      data: {
        telegramChatId: 'foreign-chat',
        intent: 'ADD_EXPENSE',
        idempotencyKey: 'foreign-http-draft',
        payload: validBody.payload,
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
    await request(app.getHttpServer())
      .post(endpoint)
      .set('x-automation-secret', 'test-secret')
      .send({ ...validBody, idempotencyKey: 'foreign-http-draft' })
      .expect(404);
    for (const path of [
      `/automation/drafts/${foreign.id}`,
      `/automation/drafts/${foreign.id}/confirm`,
      `/automation/drafts/${foreign.id}/cancel`,
    ]) {
      const response = path.endsWith(foreign.id)
        ? request(app.getHttpServer()).get(path)
        : request(app.getHttpServer()).post(path);
      await response.set('x-automation-secret', 'test-secret').expect(404);
    }
    expect(
      await prisma.automationDraft.findUniqueOrThrow({
        where: { id: foreign.id },
      }),
    ).toMatchObject({ status: 'PENDING', resultEntityId: null });
    expect(await prisma.expense.count({ where: { projectId } })).toBe(
      expenseCountBefore,
    );
  });
  it('rolls back an expense claim when PostgreSQL rejects the financial insert', async () => {
    const draft = await expenseDraft('expense-insert-failure');
    const auditCountBefore = await prisma.auditEvent.count();
    await prisma.$executeRawUnsafe(
      'CREATE FUNCTION reject_test_expense() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION \'test expense failure\'; END; $$; CREATE TRIGGER reject_test_expense BEFORE INSERT ON "Expense" FOR EACH ROW EXECUTE FUNCTION reject_test_expense();',
    );
    try {
      await expect(automation.confirm(draft.id)).rejects.toBeDefined();
    } finally {
      await prisma.$executeRawUnsafe(
        'DROP TRIGGER IF EXISTS reject_test_expense ON "Expense"; DROP FUNCTION IF EXISTS reject_test_expense();',
      );
    }
    const rolledBack = await prisma.automationDraft.findUniqueOrThrow({
      where: { id: draft.id },
    });
    expect(rolledBack.status).toBe('PENDING');
    expect(rolledBack.resultEntityType).toBeNull();
    expect(rolledBack.resultEntityId).toBeNull();
    expect(
      await prisma.expense.count({
        where: { description: 'expense-insert-failure' },
      }),
    ).toBe(0);
    expect(await prisma.auditEvent.count()).toBe(auditCountBefore);
    await expect(automation.confirm(draft.id)).resolves.toMatchObject({
      status: 'CONFIRMED',
    });
  });
  it('rolls back a transfer claim when PostgreSQL rejects its audit insert', async () => {
    const draft = await transferDraft('transfer-audit-failure');
    const auditCountBefore = await prisma.auditEvent.count();
    await prisma.$executeRawUnsafe(
      'CREATE FUNCTION reject_test_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION \'test audit failure\'; END; $$; CREATE TRIGGER reject_test_audit BEFORE INSERT ON "AuditEvent" FOR EACH ROW EXECUTE FUNCTION reject_test_audit();',
    );
    try {
      await expect(automation.confirm(draft.id)).rejects.toBeDefined();
    } finally {
      await prisma.$executeRawUnsafe(
        'DROP TRIGGER IF EXISTS reject_test_audit ON "AuditEvent"; DROP FUNCTION IF EXISTS reject_test_audit();',
      );
    }
    const rolledBack = await prisma.automationDraft.findUniqueOrThrow({
      where: { id: draft.id },
    });
    expect(rolledBack.status).toBe('PENDING');
    expect(rolledBack.resultEntityType).toBeNull();
    expect(rolledBack.resultEntityId).toBeNull();
    expect(
      await prisma.transfer.count({
        where: { source: 'TELEGRAM', amount: '20.00' },
      }),
    ).toBe(1);
    expect(await prisma.auditEvent.count()).toBe(auditCountBefore);
    await expect(automation.confirm(draft.id)).resolves.toMatchObject({
      status: 'CONFIRMED',
    });
  });
  it('rolls back a transfer claim when PostgreSQL rejects the financial insert', async () => {
    const draft = await transferDraft('transfer-insert-failure');
    const auditCountBefore = await prisma.auditEvent.count();
    const transferCountBefore = await prisma.transfer.count({
      where: { source: 'TELEGRAM', amount: '20.00' },
    });
    await prisma.$executeRawUnsafe(
      'CREATE FUNCTION reject_test_transfer() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION \'test transfer failure\'; END; $$; CREATE TRIGGER reject_test_transfer BEFORE INSERT ON "Transfer" FOR EACH ROW EXECUTE FUNCTION reject_test_transfer();',
    );
    try {
      await expect(automation.confirm(draft.id)).rejects.toBeDefined();
    } finally {
      await prisma.$executeRawUnsafe(
        'DROP TRIGGER IF EXISTS reject_test_transfer ON "Transfer"; DROP FUNCTION IF EXISTS reject_test_transfer();',
      );
    }
    const rolledBack = await prisma.automationDraft.findUniqueOrThrow({
      where: { id: draft.id },
    });
    expect(rolledBack.status).toBe('PENDING');
    expect(rolledBack.resultEntityType).toBeNull();
    expect(rolledBack.resultEntityId).toBeNull();
    expect(
      await prisma.transfer.count({
        where: { source: 'TELEGRAM', amount: '20.00' },
      }),
    ).toBe(transferCountBefore);
    expect(await prisma.auditEvent.count()).toBe(auditCountBefore);
    await expect(automation.confirm(draft.id)).resolves.toMatchObject({
      status: 'CONFIRMED',
    });
  });
  it('rolls back an expense claim when PostgreSQL rejects its audit insert', async () => {
    const draft = await expenseDraft('expense-audit-failure');
    const auditCountBefore = await prisma.auditEvent.count();
    await prisma.$executeRawUnsafe(
      'CREATE FUNCTION reject_test_expense_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION \'test expense audit failure\'; END; $$; CREATE TRIGGER reject_test_expense_audit BEFORE INSERT ON "AuditEvent" FOR EACH ROW EXECUTE FUNCTION reject_test_expense_audit();',
    );
    try {
      await expect(automation.confirm(draft.id)).rejects.toBeDefined();
    } finally {
      await prisma.$executeRawUnsafe(
        'DROP TRIGGER IF EXISTS reject_test_expense_audit ON "AuditEvent"; DROP FUNCTION IF EXISTS reject_test_expense_audit();',
      );
    }
    const rolledBack = await prisma.automationDraft.findUniqueOrThrow({
      where: { id: draft.id },
    });
    expect(rolledBack.status).toBe('PENDING');
    expect(rolledBack.resultEntityType).toBeNull();
    expect(rolledBack.resultEntityId).toBeNull();
    expect(
      await prisma.expense.count({
        where: { description: 'expense-audit-failure' },
      }),
    ).toBe(0);
    expect(await prisma.auditEvent.count()).toBe(auditCountBefore);
    await expect(automation.confirm(draft.id)).resolves.toMatchObject({
      status: 'CONFIRMED',
    });
  });
});
