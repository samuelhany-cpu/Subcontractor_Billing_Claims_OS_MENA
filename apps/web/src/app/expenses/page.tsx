import {
  ExpenseListQuery,
  ExpenseListQuerySchema,
  ExpenseSource,
} from '@claims-os/domain';
import Link from 'next/link';
import { listCategories } from '@/lib/categories-api';
import { listExpenses } from '@/lib/expenses-api';
import { listPayees } from '@/lib/payees-api';
import { formatDate, formatMoney } from '@/lib/project-format';
import { listProjects } from '@/lib/projects-api';

const sourceLabels: Readonly<Record<ExpenseSource, string>> = {
  WEB: 'من الموقع',
  TELEGRAM: 'من تيليجرام',
  EXCEL_IMPORT: 'من استيراد Excel',
};

function pageHref(query: ExpenseListQuery, page: number): string {
  const parameters = new URLSearchParams({
    sort: query.sort,
    page: String(page),
    pageSize: String(query.pageSize),
  });
  for (const key of [
    'projectId',
    'from',
    'to',
    'categoryId',
    'subcategoryId',
    'payeeId',
    'paymentMethod',
    'source',
    'search',
  ] as const) {
    const value = query[key];
    if (value !== undefined) parameters.set(key, value);
  }
  return `/expenses?${parameters.toString()}`;
}

export default async function ExpensesPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | undefined>>;
}) {
  const raw = await searchParams;
  const query = ExpenseListQuerySchema.catch({
    sort: 'NEWEST',
    page: 1,
    pageSize: 25,
    paymentMethod: undefined,
    search: undefined,
  }).parse(raw);
  const [result, projects, categories, payees] = await Promise.all([
    listExpenses(query),
    listProjects('ALL'),
    listCategories('ALL'),
    listPayees('ALL'),
  ]);
  const subcategories = categories.flatMap((category) =>
    category.subcategories.map((subcategory) => ({
      ...subcategory,
      categoryName: category.name,
    })),
  );
  return (
    <div className="page-stack expenses-page" dir="rtl">
      <section className="hero expense-hero">
        <div>
          <p className="eyebrow">السجل المالي النشط</p>
          <h1>المصروفات</h1>
          <p>ابحث وصفِّ المصروفات النشطة، مع قيم دقيقة ومصدر إدخال واضح.</p>
        </div>
        <Link
          className="button button-primary"
          href={
            query.projectId
              ? `/expenses/new?projectId=${query.projectId}`
              : '/expenses/new'
          }
        >
          إضافة مصروف
        </Link>
      </section>
      <form className="expense-filters" method="get">
        <div className="field">
          <label htmlFor="filter-project">المشروع</label>
          <select
            id="filter-project"
            name="projectId"
            defaultValue={query.projectId ?? ''}
          >
            <option value="">كل المشروعات</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
                {project.status === 'ARCHIVED' ? ' — مؤرشف' : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="filter-from">من تاريخ</label>
          <input
            id="filter-from"
            name="from"
            type="date"
            defaultValue={query.from ?? ''}
          />
        </div>
        <div className="field">
          <label htmlFor="filter-to">إلى تاريخ</label>
          <input
            id="filter-to"
            name="to"
            type="date"
            defaultValue={query.to ?? ''}
          />
        </div>
        <div className="field">
          <label htmlFor="filter-category">الفئة</label>
          <select
            id="filter-category"
            name="categoryId"
            defaultValue={query.categoryId ?? ''}
          >
            <option value="">كل الفئات</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="filter-subcategory">التصنيف الفرعي</label>
          <select
            id="filter-subcategory"
            name="subcategoryId"
            defaultValue={query.subcategoryId ?? ''}
          >
            <option value="">كل التصنيفات</option>
            {subcategories.map((subcategory) => (
              <option key={subcategory.id} value={subcategory.id}>
                {subcategory.categoryName} — {subcategory.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="filter-payee">المورد أو الصنايعي</label>
          <select
            id="filter-payee"
            name="payeeId"
            defaultValue={query.payeeId ?? ''}
          >
            <option value="">الكل</option>
            {payees.map((payee) => (
              <option key={payee.id} value={payee.id}>
                {payee.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="filter-payment">طريقة الدفع</label>
          <input
            id="filter-payment"
            name="paymentMethod"
            defaultValue={query.paymentMethod ?? ''}
          />
        </div>
        <div className="field">
          <label htmlFor="filter-source">المصدر</label>
          <select
            id="filter-source"
            name="source"
            defaultValue={query.source ?? ''}
          >
            <option value="">كل المصادر</option>
            {Object.entries(sourceLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="field expense-search-field">
          <label htmlFor="filter-search">البحث</label>
          <input
            id="filter-search"
            name="search"
            defaultValue={query.search ?? ''}
            placeholder="البيان أو المستفيد أو الفاتورة أو الملاحظات"
          />
        </div>
        <div className="field">
          <label htmlFor="filter-sort">الترتيب</label>
          <select id="filter-sort" name="sort" defaultValue={query.sort}>
            <option value="NEWEST">الأحدث أولًا</option>
            <option value="OLDEST">الأقدم أولًا</option>
          </select>
        </div>
        <input type="hidden" name="pageSize" value={query.pageSize} />
        <div className="filter-actions">
          <button className="button button-primary" type="submit">
            تطبيق
          </button>
          <Link className="button button-quiet" href="/expenses">
            مسح الفلاتر
          </Link>
        </div>
      </form>
      {result.items.length === 0 ? (
        <section className="empty-state">
          <h2>
            {Object.keys(raw).length === 0
              ? 'لا توجد مصروفات بعد'
              : 'لا توجد نتائج مطابقة'}
          </h2>
          <p>أضف أول مصروف أو عدّل الفلاتر. السجلات المحذوفة لا تظهر هنا.</p>
        </section>
      ) : (
        <section className="expense-list" aria-label="قائمة المصروفات">
          {result.items.map((expense) => (
            <article className="expense-card" key={expense.id}>
              <div className="expense-card-heading">
                <div>
                  <span className="source-badge">
                    {sourceLabels[expense.source]}
                  </span>
                  <h2>
                    <Link href={`/expenses/${expense.id}`}>
                      {expense.description}
                    </Link>
                  </h2>
                  <p>
                    {expense.project.name} — {formatDate(expense.expenseDate)}
                  </p>
                </div>
                <strong className="expense-amount" dir="ltr">
                  {formatMoney(expense.amount)}
                </strong>
              </div>
              <dl className="expense-meta">
                <div>
                  <dt>الفئة</dt>
                  <dd>{expense.category?.name ?? 'غير مصنف'}</dd>
                </div>
                <div>
                  <dt>التصنيف الفرعي</dt>
                  <dd>{expense.subcategory?.name ?? 'غير محدد'}</dd>
                </div>
                <div>
                  <dt>المورد أو الصنايعي</dt>
                  <dd>{expense.payee?.name ?? 'غير محدد'}</dd>
                </div>
                <div>
                  <dt>طريقة الدفع</dt>
                  <dd>{expense.paymentMethod ?? 'غير محددة'}</dd>
                </div>
              </dl>
              <div className="expense-card-actions">
                <span>
                  {expense.attachments.length > 0
                    ? `${expense.attachments.length} مرفق`
                    : 'بدون مرفقات'}
                </span>
                <Link
                  className="button button-quiet"
                  href={`/expenses/${expense.id}`}
                >
                  عرض وتعديل
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}
      {result.pagination.totalPages > 1 && (
        <nav className="pagination" aria-label="صفحات المصروفات">
          {query.page > 1 && (
            <Link
              className="button button-quiet"
              href={pageHref(query, query.page - 1)}
            >
              الصفحة السابقة
            </Link>
          )}
          <span>
            صفحة {query.page} من {result.pagination.totalPages}
          </span>
          {query.page < result.pagination.totalPages && (
            <Link
              className="button button-quiet"
              href={pageHref(query, query.page + 1)}
            >
              الصفحة التالية
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
