import { fetchAttachmentContent } from '@/lib/expenses-api';

export async function GET(
  _request: Request,
  context: { readonly params: Promise<{ readonly attachmentId: string }> },
) {
  const { attachmentId } = await context.params;
  const upstream = await fetchAttachmentContent(attachmentId);
  if (!upstream.ok || upstream.body === null) {
    return new Response('تعذر تحميل المرفق.', {
      status: upstream.status,
      headers: { 'cache-control': 'private, no-store' },
    });
  }
  const headers = new Headers({
    'cache-control': 'private, no-store',
    'content-type':
      upstream.headers.get('content-type') ?? 'application/octet-stream',
    'content-disposition':
      upstream.headers.get('content-disposition') ?? 'attachment',
  });
  const length = upstream.headers.get('content-length');
  if (length !== null) headers.set('content-length', length);
  return new Response(upstream.body, { status: 200, headers });
}
