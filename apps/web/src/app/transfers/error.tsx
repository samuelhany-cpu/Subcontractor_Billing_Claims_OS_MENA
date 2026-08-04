'use client';

import Link from 'next/link';

export default function TransfersError({
  error,
  reset,
}: {
  readonly error: Error;
  readonly reset: () => void;
}) {
  return (
    <div className="page-stack" dir="rtl">
      <section className="empty-state">
        <h2>تعذر تحميل التحويلات</h2>
        <p>
          {error.message || 'حدث خطأ غير متوقع أثناء تحميل بيانات التحويلات.'}
        </p>
        <div className="form-actions">
          <button
            className="button button-primary"
            onClick={() => reset()}
            type="button"
          >
            إعادة المحاولة
          </button>
          <Link className="button button-secondary" href="/projects">
            العودة للمشروعات
          </Link>
        </div>
      </section>
    </div>
  );
}
