import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function loadGeocodingModule(env = {}, fetchImpl = undefined) {
  const source = fs.readFileSync(new URL('./geocoding.service.ts', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const context = {
    exports: {},
    process: { env },
    URLSearchParams,
    fetch: fetchImpl,
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

test('geocodeAddress usa mensagem clara quando retorna endereco nao encontrado', async () => {
  const fetchImpl = async () => ({
    ok: true,
    json: async () => ({ status: 'ZERO_RESULTS', results: [] }),
  });
  const { geocodeAddress } = loadGeocodingModule(
    { NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'fake-key' },
    fetchImpl,
  );

  await assert.rejects(
    () => geocodeAddress('Rua Inexistente, 123'),
    /Não foi possível encontrar o endereço informado\. Verifique rua, número, bairro e cidade\./,
  );
});
