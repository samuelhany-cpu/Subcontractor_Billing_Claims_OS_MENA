import {
  DashboardCategoryTotal,
  DashboardExpense,
  DashboardPayeeTotal,
  DashboardTransfer,
  DashboardTrendPoint,
} from '@claims-os/domain';
import Link from 'next/link';
import { formatDate, formatMoney } from '@/lib/project-format';

export function DashboardAnalytics({
  categoryTotals,
  weeklyExpenses,
  topPayees,
  recentExpenses,
  recentTransfers,
}: {
  readonly categoryTotals: readonly DashboardCategoryTotal[];
  readonly weeklyExpenses: readonly DashboardTrendPoint[];
  readonly topPayees: readonly DashboardPayeeTotal[];
  readonly recentExpenses: readonly DashboardExpense[];
  readonly recentTransfers: readonly DashboardTransfer[];
}) {
  const largestTrend = weeklyExpenses.reduce(
    (largest, point) => Math.max(largest, moneyToNumber(point.amount)),
    0,
  );
  const largestCategory = categoryTotals.reduce(
    (largest, category) => Math.max(largest, moneyToNumber(category.amount)),
    0,
  );

  return (
    <div className="dashboard-analytics">
      <section className="dashboard-panel" aria-labelledby="trend-heading">
        <div className="dashboard-panel-heading">
          <div>
            <p className="eyebrow">اتجاه الإنفاق</p>
            <h2 id="trend-heading">المصروفات خلال آخر 12 أسبوعًا</h2>
          </div>
        </div>
        <div
          className="trend-chart"
          aria-label="رسم بياني لاتجاه المصروفات الأسبوعية"
        >
          {weeklyExpenses.map((point) => {
            const value = moneyToNumber(point.amount);
            const height =
              largestTrend === 0
                ? 0
                : Math.max(5, (value / largestTrend) * 100);
            return (
              <div className="trend-column" key={point.periodStart}>
                <span className="trend-value" dir="ltr">
                  {formatMoney(point.amount)}
                </span>
                <div className="trend-track">
                  <div className="trend-bar" style={{ height: `${height}%` }} />
                </div>
                <span>{formatDate(point.periodStart)}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="dashboard-panel" aria-labelledby="category-heading">
        <div className="dashboard-panel-heading">
          <div>
            <p className="eyebrow">التصنيفات</p>
            <h2 id="category-heading">توزيع المصروفات حسب الفئة</h2>
          </div>
        </div>
        {categoryTotals.length === 0 ? (
          <DashboardEmpty text="لا توجد مصروفات لعرض توزيعها بعد." />
        ) : (
          <ul className="distribution-list">
            {categoryTotals.map((category) => (
              <li key={category.categoryId ?? 'unclassified'}>
                <div className="distribution-label">
                  <span>{category.categoryName}</span>
                  <strong dir="ltr">{formatMoney(category.amount)}</strong>
                </div>
                <div className="distribution-track" aria-hidden="true">
                  <div
                    className="distribution-bar"
                    style={{
                      width: `${largestCategory === 0 ? 0 : (moneyToNumber(category.amount) / largestCategory) * 100}%`,
                    }}
                  />
                </div>
                <small>{category.expenseCount} عملية</small>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="dashboard-panel" aria-labelledby="payees-heading">
        <div className="dashboard-panel-heading">
          <div>
            <p className="eyebrow">الموردون والصنايعية</p>
            <h2 id="payees-heading">أعلى المدفوعات</h2>
          </div>
          <Link href="/payees">عرض الكل</Link>
        </div>
        {topPayees.length === 0 ? (
          <DashboardEmpty text="لا توجد مدفوعات مرتبطة بمورد أو صنايعي بعد." />
        ) : (
          <ol className="ranked-list">
            {topPayees.map((payee, index) => (
              <li key={payee.payeeId}>
                <span className="rank">{index + 1}</span>
                <span>{payee.payeeName}</span>
                <strong dir="ltr">{formatMoney(payee.amount)}</strong>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section
        className="dashboard-panel"
        aria-labelledby="recent-expenses-heading"
      >
        <div className="dashboard-panel-heading">
          <div>
            <p className="eyebrow">آخر العمليات</p>
            <h2 id="recent-expenses-heading">أحدث المصروفات</h2>
          </div>
          <Link href="/expenses">كل المصروفات</Link>
        </div>
        <RecentExpenses expenses={recentExpenses} />
      </section>

      <section
        className="dashboard-panel"
        aria-labelledby="recent-transfers-heading"
      >
        <div className="dashboard-panel-heading">
          <div>
            <p className="eyebrow">التمويل</p>
            <h2 id="recent-transfers-heading">أحدث التحويلات</h2>
          </div>
          <Link href="/transfers">كل التحويلات</Link>
        </div>
        <RecentTransfers transfers={recentTransfers} />
      </section>
    </div>
  );
}

function RecentExpenses({
  expenses,
}: {
  readonly expenses: readonly DashboardExpense[];
}) {
  if (expenses.length === 0)
    return <DashboardEmpty text="لم تُسجل مصروفات بعد." />;
  return (
    <ul className="recent-list">
      {expenses.map((expense) => (
        <li key={expense.id}>
          <Link href={`/expenses/${expense.id}`}>
            <span>{expense.description}</span>
            <small>
              {formatDate(expense.expenseDate)} · {expense.categoryName}
              {expense.payeeName === null ? '' : ` · ${expense.payeeName}`}
            </small>
          </Link>
          <strong dir="ltr">{formatMoney(expense.amount)}</strong>
        </li>
      ))}
    </ul>
  );
}

function RecentTransfers({
  transfers,
}: {
  readonly transfers: readonly DashboardTransfer[];
}) {
  if (transfers.length === 0)
    return <DashboardEmpty text="لم تُسجل تحويلات واردة بعد." />;
  return (
    <ul className="recent-list">
      {transfers.map((transfer) => (
        <li key={transfer.id}>
          <Link href={`/transfers/${transfer.id}`}>
            <span>تحويل وارد</span>
            <small>{formatDate(transfer.transferDate)}</small>
          </Link>
          <strong dir="ltr">{formatMoney(transfer.amount)}</strong>
        </li>
      ))}
    </ul>
  );
}

function DashboardEmpty({ text }: { readonly text: string }) {
  return <p className="dashboard-empty">{text}</p>;
}

function moneyToNumber(value: string): number {
  return Number(value);
}
