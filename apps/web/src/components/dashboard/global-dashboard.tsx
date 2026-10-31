import { GlobalDashboardResponse } from '@claims-os/domain';
import Link from 'next/link';
import { formatMoney } from '@/lib/project-format';
import { DashboardAnalytics } from './dashboard-analytics';

export function GlobalDashboard({
  dashboard,
}: {
  readonly dashboard: GlobalDashboardResponse;
}) {
  const metrics = [
    ['إجمالي التحويلات', dashboard.totalIncomingTransfers],
    ['إجمالي التمويل', dashboard.totalFunding],
    ['إجمالي المصروفات', dashboard.totalExpenses],
    ['الرصيد المتبقي', dashboard.availableBalance],
  ] as const;
  return (
    <div className="page-stack">
      <section className="hero dashboard-hero">
        <div>
          <p className="eyebrow">الرئيسية</p>
          <h1>نظرة سريعة على كل المشاريع</h1>
          <p>تابع التمويل والمصروفات والرصيد المتبقي من مكان واحد.</p>
        </div>
        <Link className="button button-primary" href="/expenses/new">
          إضافة مصروف
        </Link>
      </section>
      <section className="global-project-counts" aria-label="ملخص المشاريع">
        <span>
          <strong>{dashboard.activeProjectCount}</strong> مشاريع نشطة
        </span>
        <span>
          <strong>{dashboard.archivedProjectCount}</strong> مشاريع مؤرشفة
        </span>
        <span>
          <strong>{dashboard.expenseCount}</strong> مصروفات نشطة
        </span>
      </section>
      <section className="summary-grid" aria-label="إجماليات كل المشاريع">
        {metrics.map(([label, value]) => (
          <article className="summary-card" key={label}>
            <span>{label}</span>
            <strong dir="ltr">{formatMoney(value)}</strong>
          </article>
        ))}
      </section>
      <section
        className="dashboard-panel active-projects"
        aria-labelledby="active-projects-heading"
      >
        <div className="dashboard-panel-heading">
          <div>
            <p className="eyebrow">المشاريع النشطة</p>
            <h2 id="active-projects-heading">تابع كل مشروع</h2>
          </div>
          <Link href="/projects">إدارة المشاريع</Link>
        </div>
        {dashboard.projects.length === 0 ? (
          <p className="dashboard-empty">
            ابدأ بإنشاء مشروعك الأول لتظهر ملخصاته هنا.
          </p>
        ) : (
          <div className="dashboard-projects-grid">
            {dashboard.projects.map((project) => (
              <Link
                className="dashboard-project-card"
                href={`/projects/${project.id}`}
                key={project.id}
              >
                <span>{project.name}</span>
                <small>الرصيد المتبقي</small>
                <strong dir="ltr">
                  {formatMoney(project.totals.availableBalance)}
                </strong>
              </Link>
            ))}
          </div>
        )}
      </section>
      <DashboardAnalytics
        categoryTotals={dashboard.categoryTotals}
        weeklyExpenses={dashboard.weeklyExpenses}
        topPayees={dashboard.topPayees}
        recentExpenses={dashboard.recentExpenses}
        recentTransfers={dashboard.recentTransfers}
      />
    </div>
  );
}
