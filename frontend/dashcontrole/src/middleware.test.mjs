import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function loadMiddleware() {
  const source = fs.readFileSync(new URL('./middleware.ts', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const context = {
    exports: {},
    require: (name) => {
      if (name === 'next/server') {
        return {
          NextResponse: {
            next: () => ({ type: 'next' }),
            redirect: (url) => ({ type: 'redirect', url: String(url) }),
          },
        };
      }
      throw new Error(`Unexpected require: ${name}`);
    },
    Buffer,
    atob: (value) => Buffer.from(value, 'base64').toString('utf8'),
    URL,
  };

  vm.runInNewContext(compiled, context);
  return context.exports;
}

function createToken(tipoUsuario) {
  const payload = Buffer.from(JSON.stringify({ sub: 1, tipoUsuario })).toString('base64url');
  return `header.${payload}.signature`;
}

function createRequest(pathname, token) {
  return {
    cookies: {
      get: () => (token ? { value: token } : undefined),
    },
    nextUrl: { pathname },
    url: `http://localhost:3000${pathname}`,
  };
}

test('middleware redireciona token de motorista para login em rotas do dashboard', () => {
  const { middleware } = loadMiddleware();

  const response = middleware(createRequest('/entregas', createToken('MOTORISTA')));

  assert.equal(response.type, 'redirect');
  assert.equal(response.url, 'http://localhost:3000/login?motivo=perfil');
});

test('middleware permite token administrativo em rotas do dashboard', () => {
  const { middleware } = loadMiddleware();

  const response = middleware(createRequest('/entregas', createToken('DASHBOARD')));

  assert.equal(response.type, 'next');
});
