import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('pagina de login nao oferece cadastro publico de usuario', () => {
  const source = fs.readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');

  assert.doesNotMatch(source, /usersService\.create/);
  assert.doesNotMatch(source, /Criar nova conta/);
  assert.doesNotMatch(source, /Ainda não tem conta\?/);
  assert.doesNotMatch(source, /Registrar Usuário/);
  assert.match(source, /Entrar Seguramente/);
});
