import { listProjects } from '@/lib/projects-api';
import { listTransfers } from '@/lib/transfers-api';
import { TransferSort, TransferStatus } from '@claims-os/domain';
import Link from 'next/link';
import { formatDate, formatMoney } from '@/lib/project-format';

export default async function TransfersPage({
  searchParams,
}: {
  readonly searchParams: Promise<{
    readonly projectId?: string;
    readonly from?: string;
    readonly to?: string;
    readonly status?: string;
    readonly sort?: string;
    readonly page?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Number.parseInt(params.page ?? '1', 10) || 1;
  const status = (params.status ?? 'ACTIVE') as TransferStatus;
  const sort = (params.sort ?? 'NEWEST') as TransferSort;

  const [projects, transfersData] = await Promise.all([
    listProjects('ALL'),
    listTransfers({
      projectId: params.projectId || undefined,
      from: params.from || undefined,
      to: params.to || undefined,
      status,
      sort,
      page,
      pageSize: 25,
    }),
  ]);

  const activeProjects = projects.filter((p) => p.status === 'ACTIVE');

  return (
    <div className="page-stack" dir="rtl">
      <section className="hero">
        <div>
          <h1>تحويلات المشروعات</h1>
          <p>إدارة المبالغ والمقادير الواردة لتمويل المشروعات.</p>
        </div>
        {activeProjects.length > 0 && (
          <Link className="button button-primary" href="/transfers/new">
            إضافة تحويل
          </Link>
        )}
      </section>

      <form className="expense-filters" method="get">
        <div className="form-row">
          <div className="field">
            <label htmlFor="projectId">المشروع</label>
            <select
              defaultValue={params.projectId ?? ''}
              id="projectId"
              name="projectId"
            >
              <option value="">كل المشروعات</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}{' '}
                  {project.status === 'ARCHIVED' ? '(مؤرشف)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="status">الحالة</label>
            <select defaultValue={status} id="status" name="status">
              <option value="ACTIVE">النشطة فقط</option>
              <option value="DELETED">المحذوفة فقط</option>
              <option value="ALL">كل التحويلات</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="from">من تاريخ</label>
            <input
              defaultValue={params.from ?? ''}
              id="from"
              name="from"
              type="date"
            />
          </div>

          <div className="field">
            <label htmlFor="to">إلى تاريخ</label>
            <input
              defaultValue={params.to ?? ''}
              id="to"
              name="to"
              type="date"
            />
          </div>

          <div className="field">
            <label htmlFor="sort">الترتيب</label>
            <select defaultValue={sort} id="sort" name="sort">
              <option value="NEWEST">الأحدث أولاً</option>
              <option value="OLDEST">الأقدم أولاً</option>
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button className="button button-secondary" type="submit">
            تطبيق الفلترة
          </button>
          <Link className="button button-quiet" href="/transfers">
            إلغاء الفلاتر
          </Link>
        </div>
      </form>

      {transfersData.items.length === 0 ? (
        <section className="empty-state">
          <h2>لا توجد تحويلات</h2>
          <p>لم يتم العثور على أي تحويلات تطابق معايير البحث.</p>
        </section>
      ) : (
        <section className="expense-list">
          {transfersData.items.map((transfer) => (
            <article
              className={`expense-card ${transfer.deletedAt ? 'deleted-card' : ''}`}
              key={transfer.id}
            >
              <div className="expense-card-header">
                <div>
                  <p className="eyebrow">{transfer.project.name}</p>
                  <h3>{formatDate(transfer.transferDate)}</h3>
                </div>
                <strong className="expense-amount" dir="ltr">
                  {formatMoney(transfer.amount)}
                </strong>
              </div>

              <div className="expense-card-footer">
                <span className="source-badge">
                  {transfer.deletedAt
                    ? 'محذوف'
                    : transfer.source === 'WEB'
                      ? 'من الموقع'
                      : transfer.source === 'TELEGRAM'
                        ? 'من تيليجرام'
                        : 'من استيراد Excel'}
                </span>
                <Link
                  className="button button-quiet"
                  href={`/transfers/${transfer.id}`}
                >
                  عرض وتعديل
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}

      {transfersData.pagination.totalPages > 1 && (
        <nav className="pagination">
          {Array.from(
            { length: transfersData.pagination.totalPages },
            (_, i) => i + 1,
          ).map((p) => {
            const queryObj = new URLSearchParams();
            if (params.projectId) queryObj.set('projectId', params.projectId);
            if (params.from) queryObj.set('from', params.from);
            if (params.to) queryObj.set('to', params.to);
            if (params.status) queryObj.set('status', params.status);
            if (params.sort) queryObj.set('sort', params.sort);
            queryObj.set('page', String(p));
            return (
              <Link
                className={`page-number ${p === page ? 'active' : ''}`}
                href={`/transfers?${queryObj.toString()}`}
                key={p}
              >
                {p}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
