import Link from 'next/link';

export default function TransferNotFound() {
  return (
    <div className="page-stack" dir="rtl">
      <section className="empty-state">
        <h2>التحويل غير موجود</h2>
        <p>التحويل المطلوب غير موجود أو تعذر الوصول إليه.</p>
        <Link className="button button-primary" href="/transfers">
          العودة إلى قائمة التحويلات
        </Link>
      </section>
    </div>
  );
}
