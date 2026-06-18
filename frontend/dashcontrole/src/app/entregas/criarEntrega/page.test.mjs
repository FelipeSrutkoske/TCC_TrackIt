import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('criacao de entrega valida numero no endereco antes do geocoding', () => {
  const source = fs.readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
  const validationBlock = source.match(/function validarFormularioCriarEntrega[\s\S]+?\n  }\n\n  async function enviarFormularioCriarEntrega/);

  assert.ok(validationBlock, 'validarFormularioCriarEntrega deve existir');
  assert.match(source, /function addressHasNumber/);
  assert.match(validationBlock[0], /!addressHasNumber\(destinationAddress\)/);
  assert.match(validationBlock[0], /Informe o número do endereço para orientar a entrega\./);
  assert.match(source, /const erroValidacao = validarFormularioCriarEntrega\(\);[\s\S]+?if \(erroValidacao\)[\s\S]+?return;[\s\S]+?geocodeAddress\(destinationAddress\)/);
});
