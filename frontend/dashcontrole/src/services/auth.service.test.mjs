import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function loadAuthService(apiFetch, contextOverrides = {}) {
  const source = fs.readFileSync(new URL('./auth.service.ts', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const context = {
    exports: {},
    require: (name) => {
      if (name === '@/lib/api') return { apiFetch };
      throw new Error(`Unexpected require: ${name}`);
    },
    ...contextOverrides,
  };

  vm.runInNewContext(compiled, context);
  return context.exports.authService;
}

test('login do dashboard rejeita motorista sem persistir sessao', async () => {
  const stored = [];
  const cookieWrites = [];
  const authService = loadAuthService(
    async () => ({
      access_token: 'token-motorista',
      user: { id: 7, nome: 'Moto', email: 'moto@example.com', tipoUsuario: 'MOTORISTA' },
    }),
    {
      window: {},
      localStorage: {
        setItem: (key, value) => stored.push([key, value]),
      },
      document: {
        set cookie(value) {
          cookieWrites.push(value);
        },
      },
    },
  );

  await assert.rejects(
    () => authService.login({ email: 'moto@example.com', senha: 'secret' }),
    /Perfil de motorista deve acessar pelo aplicativo mobile/,
  );
  assert.deepEqual(stored, []);
  assert.deepEqual(cookieWrites, []);
});

test('isAuthenticated considera invalida sessao local de motorista', () => {
  const authService = loadAuthService(async () => ({}), {
    window: {},
    localStorage: {
      getItem: (key) => {
        if (key === 'trackit_token') return 'token-motorista';
        if (key === 'trackit_user') {
          return JSON.stringify({ id: 7, nome: 'Moto', email: 'moto@example.com', tipoUsuario: 'MOTORISTA' });
        }
        return null;
      },
    },
  });

  assert.equal(authService.isAuthenticated(), false);
});

test('login persiste companyId do usuario dashboard', async () => {
  const stored = [];
  const authService = loadAuthService(
    async () => ({
      access_token: 'token-dashboard',
      user: {
        id: 8,
        nome: 'Dashboard',
        email: 'dash@example.com',
        tipoUsuario: 'DASHBOARD',
        companyId: 4,
      },
    }),
    {
      window: {},
      localStorage: {
        setItem: (key, value) => stored.push([key, value]),
      },
      document: {
        set cookie(_value) {},
      },
    },
  );

  await authService.login({ email: 'dash@example.com', senha: 'secret' });

  const persistedUser = JSON.parse(stored.find(([key]) => key === 'trackit_user')[1]);
  assert.equal(persistedUser.companyId, 4);
});
