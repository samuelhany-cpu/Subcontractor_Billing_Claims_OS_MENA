import http from 'node:http';

let mode = 'one';
const requests = [];

const projects = {
  one: [{ id: 'test-project-a', name: 'مشروع اختبار أ', status: 'ACTIVE' }],
  multiple: [
    { id: 'test-project-a', name: 'مشروع اختبار أ', status: 'ACTIVE' },
    { id: 'test-project-b', name: 'مشروع اختبار ب', status: 'ACTIVE' },
  ],
  none: [],
};

const dashboards = {
  'test-project-a': {
    projectId: 'test-project-a',
    openingBalance: '1000.00',
    totalIncomingTransfers: '250.50',
    totalExpenses: '300.25',
    availableBalance: '950.25',
  },
  'test-project-b': {
    projectId: 'test-project-b',
    openingBalance: '2000.00',
    totalIncomingTransfers: '100.00',
    totalExpenses: '700.00',
    availableBalance: '1400.00',
  },
};

function reply(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json' });
  response.end(JSON.stringify(body));
}

http
  .createServer((request, response) => {
    const url = new URL(request.url, 'http://mock');
    requests.push({ method: request.method, path: url.pathname, query: url.search });
    if (url.pathname === '/__mode' && request.method === 'POST') {
      mode = url.searchParams.get('value') ?? mode;
      return reply(response, 200, { mode });
    }
    if (url.pathname === '/__requests') return reply(response, 200, requests);
    if (url.pathname === '/__reset' && request.method === 'POST') {
      requests.length = 0;
      return reply(response, 200, { ok: true });
    }
    if (url.pathname === '/api/v1/projects') {
      if (mode === 'projects-500') return reply(response, 500, { message: 'synthetic failure' });
      return reply(response, 200, projects[mode] ?? projects.one);
    }
    const dashboardMatch = url.pathname.match(/^\/api\/v1\/projects\/([^/]+)\/dashboard$/);
    if (dashboardMatch) {
      if (mode === 'dashboard-500') return reply(response, 500, { message: 'synthetic failure' });
      if (mode === 'dashboard-malformed') return reply(response, 200, { projectId: dashboardMatch[1] });
      const dashboard = dashboards[dashboardMatch[1]];
      return dashboard ? reply(response, 200, dashboard) : reply(response, 404, { message: 'not found' });
    }
    if (url.pathname === '/telegram/sendMessage' || url.pathname === '/telegram/answerCallbackQuery') {
      if (mode === 'telegram-500') return reply(response, 500, { message: 'synthetic delivery failure' });
      return reply(response, 200, { ok: true });
    }
    return reply(response, 404, { message: 'not found' });
  })
  .listen(18080, '0.0.0.0');
