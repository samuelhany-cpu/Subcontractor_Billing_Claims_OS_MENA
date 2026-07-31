import Link from 'next/link';

export default function ProjectNotFound() {
  return (
    <div className="error-state">
      <h1>المشروع غير موجود</h1>
      <p>ربما تغير الرابط أو لم يعد هذا المشروع متاحًا.</p>
      <Link className="button button-primary" href="/projects">
        العودة إلى المشروعات
      </Link>
    </div>
  );
}
