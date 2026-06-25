import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function loadMasksModule() {
  const source = fs.readFileSync(new URL('./masks.ts', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const context = { exports: {} };
  vm.runInNewContext(compiled, context);
  return context.exports;
}

test('mascaras brasileiras formatam documentos e contatos', () => {
  const { maskCep, maskCnpj, maskCpf, maskDate, maskPhone, onlyDigits } = loadMasksModule();
  assert.equal(onlyDigits('abc123'), '123');
  assert.equal(maskCpf('12345678909'), '123.456.789-09');
  assert.equal(maskCnpj('11222333000181'), '11.222.333/0001-81');
  assert.equal(maskPhone('4435182700'), '(44) 3518-2700');
  assert.equal(maskPhone('44999197987'), '(44) 99919-7987');
  assert.equal(maskPhone('11987654321'), '(11) 98765-4321');
  assert.equal(maskCep('01001000'), '01001-000');
  assert.equal(maskDate('11062026'), '11/06/2026');
});
