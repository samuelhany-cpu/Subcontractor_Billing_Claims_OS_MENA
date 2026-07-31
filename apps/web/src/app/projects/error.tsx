'use client';

export default function ProjectsError({
  reset,
}: {
  readonly reset: () => void;
}) {
  return (
    <div className="error-state" role="alert">
      <h1>تعذر تحميل المشروعات</h1>
      <p>تأكد من تشغيل خدمة البيانات ثم أعد المحاولة.</p>
      <button className="button button-primary" type="button" onClick={reset}>
        إعادة المحاولة
      </button>
    </div>
  );
}
