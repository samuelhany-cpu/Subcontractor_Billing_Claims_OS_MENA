import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  createAgreementAction,
  setPayeeActivityAction,
  updateAgreementAction,
  updatePayeeAction,
} from '../actions';
import { AgreementForm } from '@/components/payees/agreement-form';
import { PayeeForm } from '@/components/payees/payee-form';
import { PayeeStateControl } from '@/components/payees/payee-state-control';
import { formatMoney } from '@/lib/project-format';
import { getPayee, PayeesApiError } from '@/lib/payees-api';
import { listProjects } from '@/lib/projects-api';

export default async function PayeeDetailPage({
  params,
}: {
  readonly params: Promise<{ payeeId: string }>;
}) {
  const { payeeId } = await params;
  let payee;
  try {
    payee = await getPayee(payeeId);
  } catch (error: unknown) {
    if (error instanceof PayeesApiError && error.status === 404) notFound();
    throw error;
  }
  const activeProjects = await listProjects('ACTIVE');
  const agreementProjectIds = new Set(
    payee.projects
      .filter(({ agreement }) => agreement !== null)
      .map(({ projectId }) => projectId),
  );
  const availableProjects = activeProjects.filter(
    ({ id }) => !agreementProjectIds.has(id),
  );
  const paidByProject = Object.fromEntries(
    payee.projects.map(({ projectId, paidAmount }) => [projectId, paidAmount]),
  );
  return (
    <div className="page-stack payee-detail" dir="rtl">
      <Link className="back-link" href="/payees">
        العودة إلى الموردين والصنايعية
      </Link>
      <section className="detail-heading">
        <div>
          <span className={`status-badge ${payee.isActive ? '' : 'archived'}`}>
            {payee.isActive ? 'نشط' : 'غير نشط — للسجلات التاريخية'}
          </span>
          <h1>{payee.name}</h1>
          <p>{payee.specialty ?? 'لا يوجد تخصص مسجل'}</p>
          <strong dir="ltr">
            إجمالي المدفوع: {formatMoney(payee.totalPaid)}
          </strong>
        </div>
        <PayeeStateControl
          active={payee.isActive}
          action={setPayeeActivityAction.bind(null, payee.id, !payee.isActive)}
        />
      </section>
      {!payee.isActive && (
        <aside className="readonly-notice">
          هذا المستفيد غير نشط ولا يتاح للاتفاقيات أو الاختيارات الجديدة، مع
          بقاء كل سجلاته السابقة محفوظة.
        </aside>
      )}
      <section className="edit-panel">
        <h2>بيانات المستفيد</h2>
        <PayeeForm
          action={updatePayeeAction.bind(null, payee.id)}
          mode="edit"
          initial={payee}
        />
      </section>
      {payee.isActive && availableProjects.length > 0 && (
        <details className="create-panel">
          <summary>إنشاء اتفاقية مع مشروع</summary>
          <AgreementForm
            action={createAgreementAction.bind(null, payee.id)}
            mode="create"
            projects={availableProjects}
            paidByProject={paidByProject}
          />
        </details>
      )}
      <section>
        <div className="section-heading">
          <div>
            <p className="eyebrow">السجل حسب المشروع</p>
            <h2>المشروعات والاتفاقيات</h2>
          </div>
        </div>
        {payee.projects.length === 0 ? (
          <div className="empty-state">
            <h3>لا توجد علاقة بمشروع بعد</h3>
            <p>
              يظهر المشروع هنا بعد إنشاء اتفاقية أو تسجيل مصروف غير محذوف لهذا
              المستفيد.
            </p>
          </div>
        ) : (
          <div className="payee-projects">
            {payee.projects.map((project) => {
              const archived = project.projectStatus === 'ARCHIVED';
              return (
                <article
                  className={`payee-project-card ${archived ? 'inactive' : ''}`}
                  key={project.projectId}
                >
                  <div className="project-card-heading">
                    <div>
                      <span
                        className={`status-badge ${archived ? 'archived' : ''}`}
                      >
                        {archived ? 'المشروع مؤرشف' : 'المشروع نشط'}
                      </span>
                      <h3>{project.projectName}</h3>
                    </div>
                    <strong dir="ltr">
                      المدفوع: {formatMoney(project.paidAmount)}
                    </strong>
                  </div>
                  {project.agreement === null ? (
                    <p className="settings-note">لا توجد اتفاقية</p>
                  ) : (
                    <>
                      <dl className="agreement-live-summary">
                        <div>
                          <dt>إجمالي الاتفاق</dt>
                          <dd dir="ltr">
                            {formatMoney(project.agreement.totalAmount)}
                          </dd>
                        </div>
                        <div>
                          <dt>المتبقي</dt>
                          <dd dir="ltr">
                            {formatMoney(project.agreement.remainingAmount)}
                          </dd>
                        </div>
                        {project.agreement.overpaidAmount !== '0.00' && (
                          <div className="overpaid">
                            <dt>مدفوع زيادة</dt>
                            <dd dir="ltr">
                              {formatMoney(project.agreement.overpaidAmount)}
                            </dd>
                          </div>
                        )}
                      </dl>
                      {archived ? (
                        <p className="readonly-notice">
                          المشروع مؤرشف؛ الاتفاقية للقراءة فقط حتى استعادة
                          المشروع.
                        </p>
                      ) : payee.isActive ? (
                        <details className="rename-panel">
                          <summary>تعديل الاتفاقية</summary>
                          <AgreementForm
                            action={updateAgreementAction.bind(
                              null,
                              payee.id,
                              project.projectId,
                            )}
                            mode="update"
                            initial={{
                              projectId: project.projectId,
                              totalAmount: project.agreement.totalAmount,
                              paidAmount: project.paidAmount,
                              notes: project.agreement.notes,
                            }}
                          />
                        </details>
                      ) : null}
                    </>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
