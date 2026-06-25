import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function loadCompaniesService(apiFetch) {
  const source = fs.readFileSync(new URL('./companies.service.ts', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const context = {
    exports: {},
    require: (name) => {
      if (name === '@/lib/api') return { apiFetch };
      throw new Error(`Unexpected require: ${name}`);
    },
  };

  vm.runInNewContext(compiled, context);
  return context.exports.companiesService;
}

test('companiesService.create envia POST para /companies', async () => {
  const calls = [];
  const service = loadCompaniesService(async (endpoint, options) => {
    calls.push([endpoint, options]);
    return { id: 10 };
  });

  const payload = { corporateName: 'Cliente Master LTDA', subscriptionStatus: 'ativo' };
  const result = await service.create(payload);

  assert.equal(result.id, 10);
  assert.equal(calls[0][0], '/companies');
  assert.equal(calls[0][1].method, 'POST');
  assert.equal(calls[0][1].body, JSON.stringify(payload));
});

test('companiesService envia companyId como query quando filtro informado', async () => {
  const calls = [];
  const service = loadCompaniesService(async (endpoint, options) => {
    calls.push([endpoint, options]);
    return [];
  });

  await service.getAll(3);
  await service.getAnalytics(3);

  assert.equal(calls[0][0], '/companies?companyId=3');
  assert.equal(calls[1][0], '/companies/analytics?companyId=3');
});
