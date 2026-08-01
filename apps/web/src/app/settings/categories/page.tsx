import {
  ClassificationFilter,
  ClassificationFilterSchema,
} from '@claims-os/domain';
import { CategoriesManager } from '@/components/categories/categories-manager';
import { listCategories } from '@/lib/categories-api';

export default async function CategoriesSettingsPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ status?: string }>;
}) {
  const rawStatus = (await searchParams).status;
  const filter: ClassificationFilter = ClassificationFilterSchema.catch(
    'ACTIVE',
  ).parse(rawStatus ?? 'ACTIVE');
  const categories = await listCategories(filter);
  return (
    <div className="page-stack">
      <section className="hero settings-hero">
        <div>
          <p className="eyebrow">الإعدادات</p>
          <h1>إدارة الفئات والتصنيفات الفرعية</h1>
          <p>
            رتّب تصنيفات المصروفات وعدّلها أو عطّلها دون حذف السجلات التاريخية.
          </p>
        </div>
      </section>
      <CategoriesManager categories={categories} filter={filter} />
    </div>
  );
}
