import { Injectable } from '@nestjs/common';
import { Prisma, Project } from '@prisma/client';
import { ProjectTotals } from '@claims-os/domain';
import { serializeMoney } from '../shared/decimal/decimal';
import { ProjectsRepository } from './projects.repository';

@Injectable()
export class ProjectTotalsService {
  constructor(private readonly projects: ProjectsRepository) {}

  async forProjects(
    projects: readonly Project[],
  ): Promise<ReadonlyMap<string, ProjectTotals>> {
    const aggregates = await this.projects.aggregates(
      projects.map((project) => project.id),
    );

    return new Map(
      projects.map((project) => {
        const aggregate = aggregates.get(project.id);
        const incoming = aggregate?.transferTotal ?? new Prisma.Decimal(0);
        const expenses = aggregate?.expenseTotal ?? new Prisma.Decimal(0);
        const funding = project.openingBalance.plus(incoming);
        return [
          project.id,
          {
            totalIncomingTransfers: serializeMoney(incoming),
            totalExpenses: serializeMoney(expenses),
            totalFunding: serializeMoney(funding),
            availableBalance: serializeMoney(funding.minus(expenses)),
            expenseCount: aggregate?.expenseCount ?? 0,
          },
        ] as const;
      }),
    );
  }

  async forProject(project: Project): Promise<ProjectTotals> {
    const totals = await this.forProjects([project]);
    const result = totals.get(project.id);
    if (result === undefined) {
      throw new Error('Project totals were not produced');
    }
    return result;
  }
}
