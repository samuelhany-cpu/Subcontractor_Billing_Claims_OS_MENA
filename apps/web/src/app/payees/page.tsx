import { PayeeFilter, PayeeListQuerySchema } from '@claims-os/domain';
import Link from 'next/link';
import { createPayeeAction, setPayeeActivityAction } from './actions';
import { PayeeForm } from '@/components/payees/payee-form';
import { PayeeStateControl } from '@/components/payees/payee-state-control';
import { formatMoney } from '@/lib/project-format';
import { listPayees } from '@/lib/payees-api';

const filters: readonly [PayeeFilter, string][] = [
  ['ACTIVE', 'النشطون'],
  ['INACTIVE', 'غير النشطين'],
  ['ALL', 'الكل'],
];
const typeLabels = {
  SUPPLIER: 'مورد',
  CRAFTSMAN: 'صنايعي',
  WORKER: 'عامل',
  COMPANY: 'شركة',
  OTHER: 'أخرى',
} as const;

export default async function PayeesPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const raw = await searchParams;
  const query = PayeeListQuerySchema.catch({
    status: 'ACTIVE',
    search: undefined,
  }).parse(raw);
  const payees = await listPayees(query.status, query.search);
  return (
    <div className="page-stack payees-page" dir="rtl">
      <section className="hero">
        <p className="eyebrow">دليل المستفيدين</p>
        <h1>الموردون والصنايعية</h1>
        <p>
          سجل عالمي واحد للموردين والصنايعية والعمال والشركات، مع إجماليات دقيقة
          عبر المشروعات.
        </p>
      </section>
      <details className="create-panel">
        <summary>إضافة مورد أو صنايعي</summary>
        <PayeeForm action={createPayeeAction} mode="create" />
      </details>
      <section>
        <div className="section-heading payee-tools">
          <form className="payee-search" method="get">
            <input type="hidden" name="status" value={query.status} />
            <label htmlFor="payee-search">البحث</label>
            <input
              id="payee-search"
              name="search"
              defaultValue={query.search ?? ''}
              placeholder="الاسم أو الشركة أو الهاتف أو التخصص"
            />
            <button className="button button-primary" type="submit">
              بحث
            </button>
          </form>
          <nav className="filter-tabs" aria-label="تصفية المستفيدين">
            {filters.map(([value, label]) => {
              const suffix = query.search
                ? `&search=${encodeURIComponent(query.search)}`
                : '';
              return (
                <Link
                  className={query.status === value ? 'active' : ''}
                  href={`/payees?status=${value}${suffix}`}
                  key={value}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
        {payees.length === 0 ? (
          <div className="empty-state">
            <h2>
              {query.search ? 'لا توجد نتائج مطابقة' : 'لا يوجد مستفيدون بعد'}
            </h2>
            <p>
              {query.search
                ? 'جرّب عبارة بحث أخرى أو اعرض كل المستفيدين.'
                : 'أضف أول مورد أو صنايعي. لا ينشئ النظام سجلات افتراضية.'}
            </p>
          </div>
        ) : (
          <div className="payee-grid">
            {payees.map((payee) => (
              <article
                className={`payee-card ${payee.isActive ? '' : 'inactive'}`}
                key={payee.id}
              >
                <div className="project-card-heading">
                  <div>
                    <span
                      className={`status-badge ${payee.isActive ? '' : 'archived'}`}
                    >
                      {payee.isActive ? 'نشط' : 'غير نشط'}
                    </span>
                    <h2>
                      <Link href={`/payees/${payee.id}`}>{payee.name}</Link>
                    </h2>
                    <p>
                      {typeLabels[payee.type]}
                      {payee.specialty ? ` — ${payee.specialty}` : ''}
                    </p>
                  </div>
                  <PayeeStateControl
                    active={payee.isActive}
                    action={setPayeeActivityAction.bind(
                      null,
                      payee.id,
                      !payee.isActive,
                    )}
                  />
                </div>
                {payee.companyName && <p>الشركة: {payee.companyName}</p>}
                {payee.phone && <p dir="ltr">{payee.phone}</p>}
                <strong className="payee-total" dir="ltr">
                  إجمالي المدفوع: {formatMoney(payee.totalPaid)}
                </strong>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
