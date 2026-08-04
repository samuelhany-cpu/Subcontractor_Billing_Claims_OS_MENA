import { ProjectResponse } from '@claims-os/domain';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ProjectSelector } from '@/components/projects/project-selector';
import { listProjects } from '@/lib/projects-api';
import './globals.css';

export const metadata: Metadata = {
  title: 'متابع مصروفات المشروعات',
  description: 'إدارة محلية بسيطة لمصروفات المشروعات',
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  let projects: readonly ProjectResponse[] = [];
  let apiAvailable = true;
  try {
    projects = [...(await listProjects('ACTIVE'))];
  } catch {
    apiAvailable = false;
  }
  return (
    <html lang="ar" dir="rtl">
      <body>
        <header className="app-header">
          <div className="brand-block">
            <Link className="brand" href="/projects">
              متابع مصروفات المشروعات
            </Link>
            <span>تشغيل محلي آمن وبسيط</span>
          </div>
          <nav className="main-nav" aria-label="التنقل الرئيسي">
            <Link href="/projects">المشروعات</Link>
            <Link href="/expenses">المصروفات</Link>
            <Link href="/transfers">التحويلات</Link>
            <Link href="/payees">الموردون والصنايعية</Link>

            <Link href="/settings/categories">الإعدادات</Link>
          </nav>
          {apiAvailable ? (
            <ProjectSelector projects={projects} />
          ) : (
            <p className="service-warning">خدمة البيانات غير متاحة</p>
          )}
        </header>
        <main className="app-main">{children}</main>
      </body>
    </html>
  );
}
