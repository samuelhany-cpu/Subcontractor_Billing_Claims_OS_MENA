import { ProjectResponse, ProjectTotals } from '@claims-os/domain';
import { Project } from '@prisma/client';
import { serializeMoney } from '../shared/decimal/decimal';

export function serializeDateOnly(value: Date | null): string | null {
  return value === null ? null : value.toISOString().slice(0, 10);
}

export function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function projectSnapshot(
  project: Project,
): Readonly<Record<string, unknown>> {
  return {
    id: project.id,
    name: project.name,
    status: project.status,
    openingBalance: serializeMoney(project.openingBalance),
    openingBalanceDate: serializeDateOnly(project.openingBalanceDate),
    archivedAt: project.archivedAt,
  };
}

export function mapProject(
  project: Project,
  totals: ProjectTotals,
): ProjectResponse {
  return {
    id: project.id,
    name: project.name,
    status: project.status,
    openingBalance: serializeMoney(project.openingBalance),
    openingBalanceDate: serializeDateOnly(project.openingBalanceDate),
    archivedAt: project.archivedAt?.toISOString() ?? null,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    totals,
  };
}
