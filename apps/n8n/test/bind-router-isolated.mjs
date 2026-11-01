import { readFileSync, writeFileSync } from 'node:fs';

const workflow = JSON.parse(
  readFileSync('apps/n8n/workflows/telegram-router.json', 'utf8'),
);
const dollar = String.fromCharCode(36);
const quote = String.fromCharCode(39);

workflow.id = 'claims-os-router-isolated-v2';
workflow.name = 'Claims OS Router (isolated)';

for (const node of workflow.nodes) {
  if (node.type === 'n8n-nodes-base.webhook') {
    node.webhookId = '7d8236b4-495f-4192-95d2-c6ba6b6cdbdd';
    node.parameters.path = 'telegram-update-vtest2';
  }
  if (node.name === 'Validate and Route') {
    node.parameters.jsCode = node.parameters.jsCode
      .replace(
        `${dollar}env.GATEWAY_N8N_SECRET`,
        `${quote}test-gateway-secret${quote}`,
      )
      .replace(
        `${dollar}env.TELEGRAM_ALLOWED_CHAT_ID`,
        `${quote}900001${quote}`,
      );
  }
  if (node.name === 'Deliver Balance Update') {
    node.parameters.url = 'http://127.0.0.1:5678/webhook/telegram-balance-v4';
    node.parameters.headerParameters = {
      parameters: [{ name: 'x-gateway-secret', value: 'test-gateway-secret' }],
    };
  }
  if (node.name === 'Send Arabic Response') {
    node.parameters.url = 'http://tel002b1-mock:18080/telegram/sendMessage';
  }
}

writeFileSync(
  process.env.TEMP + '\\tel002b1-router-test.json',
  JSON.stringify(workflow),
);
