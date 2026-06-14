import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('pagina de perfil usa toast em vez de alert nativo', () => {
  const source = fs.readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');

  assert.doesNotMatch(source, /alert\(/);
  assert.match(source, /useToast/);
  assert.match(source, /addToast\("Dados atualizados com sucesso!",\s*"success"\)/);
  assert.match(source, /addToast\(errorMessage,\s*"error"\)/);
});
