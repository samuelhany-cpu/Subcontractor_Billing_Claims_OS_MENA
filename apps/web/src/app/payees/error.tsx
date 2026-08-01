'use client';

export default function PayeesError({ reset }: { readonly reset: () => void }) {
  return (
    <div className="error-state" dir="rtl">
      <h1>تعذر تحميل الموردين والصنايعية</h1>
      <p>تحقق من تشغيل خدمة البيانات ثم حاول مرة أخرى.</p>
      <button className="button button-primary" type="button" onClick={reset}>
        إعادة المحاولة
      </button>
    </div>
  );
}
