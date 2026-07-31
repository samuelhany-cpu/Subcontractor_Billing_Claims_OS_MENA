import { Prisma, ProjectStatus } from '@prisma/client';
import { ProjectStateService } from './project-state.service';
import { ProjectsRepository } from './projects.repository';

const activeProject = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'مشروع',
  status: ProjectStatus.ACTIVE,
  openingBalance: new Prisma.Decimal(0),
  openingBalanceDate: null,
  archivedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('ProjectStateService', () => {
  it('accepts an active project', async () => {
    const repository = {
      findById: jest.fn().mockResolvedValue(activeProject),
    } as unknown as ProjectsRepository;
    await expect(
      new ProjectStateService(repository).assertAcceptsWrites(activeProject.id),
    ).resolves.toBe(activeProject);
  });

  it('rejects an archived project with a standardized conflict', async () => {
    const repository = {
      findById: jest.fn().mockResolvedValue({
        ...activeProject,
        status: ProjectStatus.ARCHIVED,
      }),
    } as unknown as ProjectsRepository;
    await expect(
      new ProjectStateService(repository).assertAcceptsWrites(activeProject.id),
    ).rejects.toMatchObject({ status: 409 });
  });

  it('rejects a missing project with a standardized not-found error', async () => {
    const repository = {
      findById: jest.fn().mockResolvedValue(null),
    } as unknown as ProjectsRepository;
    await expect(
      new ProjectStateService(repository).assertAcceptsWrites(activeProject.id),
    ).rejects.toMatchObject({ status: 404 });
  });
});
