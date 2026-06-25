import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function loadDeliveriesService(apiFetch) {
  const source = fs.readFileSync(new URL('./deliveries.service.ts', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const context = {
    exports: {},
    URLSearchParams,
    require: (name) => {
      if (name === '@/lib/api') return { apiFetch };
      throw new Error(`Unexpected require: ${name}`);
    },
  };

  vm.runInNewContext(compiled, context);
  return context.exports.deliveriesService;
}

test('deliveriesService envia companyId nas consultas operacionais filtradas', async () => {
  const calls = [];
  const service = loadDeliveriesService(async (endpoint, options) => {
    calls.push([endpoint, options]);
    return endpoint.includes('stats') ? { total: 0 } : [];
  });

  await service.getAll(2);
  await service.getStats(2);
  await service.getAlerts(2);

  assert.equal(calls[0][0], '/deliveries?companyId=2');
  assert.equal(calls[1][0], '/deliveries/stats?companyId=2');
  assert.equal(calls[2][0], '/deliveries/alerts?companyId=2');
});

test('deliveriesService preserva filtros de analytics com companyId', async () => {
  const calls = [];
  const service = loadDeliveriesService(async (endpoint) => {
    calls.push(endpoint);
    return { filters: {}, kpis: {}, charts: {} };
  });

  await service.getAnalytics({ companyId: '2', status: 'EM_ROTA' });

  assert.equal(calls[0], '/deliveries/analytics?companyId=2&status=EM_ROTA');
});
