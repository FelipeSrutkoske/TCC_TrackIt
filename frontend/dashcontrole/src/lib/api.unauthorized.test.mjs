import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function loadApiModule(contextOverrides = {}) {
  const source = fs.readFileSync(new URL('./api.ts', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const context = {
    exports: {},
    process: { env: {} },
    ...contextOverrides,
  };

  vm.runInNewContext(compiled, context);
  return context.exports;
}

test('apiFetch limpa sessao e redireciona para login quando a API retorna 401', async () => {
  const removedKeys = [];
  const cookieWrites = [];
  const location = { href: '/entregas' };
  const { apiFetch } = loadApiModule({
    fetch: async () => ({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ message: 'Unauthorized' }),
    }),
    window: { location },
    localStorage: {
      getItem: () => 'token-antigo',
      removeItem: (key) => removedKeys.push(key),
    },
    document: {
      get cookie() {
        return 'trackit_auth_token=token-antigo';
      },
      set cookie(value) {
        cookieWrites.push(value);
      },
    },
  });

  await assert.rejects(() => apiFetch('/deliveries'), /Sessao expirada/);
  assert.deepEqual(removedKeys, ['trackit_token', 'trackit_user']);
  assert.equal(location.href, '/login');
  assert.match(cookieWrites[0], /trackit_auth_token=;/);
});
