import { ProjectResponse } from '@claims-os/domain';
import { formatMoney } from '@/lib/project-format';

export function ProjectSummary({
  project,
}: {
  readonly project: ProjectResponse;
}) {
  const items = [
    ['الرصيد الافتتاحي', project.openingBalance],
    ['إجمالي التحويلات', project.totals.totalIncomingTransfers],
    ['إجمالي التمويل', project.totals.totalFunding],
    ['إجمالي المصروفات', project.totals.totalExpenses],
    ['الرصيد المتبقي', project.totals.availableBalance],
  ] as const;
  return (
    <section aria-labelledby="project-summary-heading">
      <h2 id="project-summary-heading">ملخص المشروع</h2>
      <div className="summary-grid">
        {items.map(([label, value]) => (
          <article className="summary-card" key={label}>
            <span>{label}</span>
            <strong dir="ltr">{formatMoney(value)}</strong>
          </article>
        ))}
        <article className="summary-card">
          <span>عدد المصروفات</span>
          <strong>{project.totals.expenseCount}</strong>
        </article>
      </div>
    </section>
  );
}
