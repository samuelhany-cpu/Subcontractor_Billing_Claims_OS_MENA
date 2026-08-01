'use client';

export default function CategoriesError({
  reset,
}: {
  readonly reset: () => void;
}) {
  return (
    <section className="error-state" dir="rtl">
      <h1>تعذر تحميل إعدادات الفئات</h1>
      <p>تحقق من تشغيل خدمة البيانات ثم حاول مرة أخرى.</p>
      <button className="button button-primary" type="button" onClick={reset}>
        إعادة المحاولة
      </button>
    </section>
  );
}
