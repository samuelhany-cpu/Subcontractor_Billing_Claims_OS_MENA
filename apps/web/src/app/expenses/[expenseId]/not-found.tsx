import Link from 'next/link';

export default function ExpenseNotFound() {
  return (
    <div className="error-state" dir="rtl">
      <h1>تعذر العثور على المصروف</h1>
      <p>قد يكون السجل محذوفًا أو أن الرابط غير صحيح.</p>
      <Link className="button button-primary" href="/expenses">
        العودة إلى المصروفات
      </Link>
    </div>
  );
}
