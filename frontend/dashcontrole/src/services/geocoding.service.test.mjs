import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function loadGeocodingModule(env = {}) {
  const source = fs.readFileSync(new URL('./geocoding.service.ts', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const context = {
    exports: {},
    process: { env },
    URLSearchParams,
  };

  vm.runInNewContext(compiled, context);
  return context.exports;
}

test('geocodeAddress falha claramente quando a chave publica do Google Maps nao esta configurada', async () => {
  const { geocodeAddress } = loadGeocodingModule();

  await assert.rejects(
    () => geocodeAddress('Rua Teste, 123'),
    /NEXT_PUBLIC_GOOGLE_MAPS_API_KEY/,
  );
});
