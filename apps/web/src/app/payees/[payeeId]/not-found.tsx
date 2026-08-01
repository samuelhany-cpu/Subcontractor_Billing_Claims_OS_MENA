import Link from 'next/link';

export default function PayeeNotFound() {
  return (
    <div className="error-state" dir="rtl">
      <h1>المستفيد غير موجود</h1>
      <p>قد يكون الرابط غير صحيح أو أن السجل لم يعد متاحًا.</p>
      <Link className="button button-primary" href="/payees">
        العودة إلى القائمة
      </Link>
    </div>
  );
}
