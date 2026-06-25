import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('criacao de entrega valida numero no endereco antes do geocoding', () => {
  const source = fs.readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
  const validationBlock = source.match(/function validarFormularioCriarEntrega[\s\S]+?\n  }\n\n  async function enviarFormularioCriarEntrega/);

  assert.ok(validationBlock, 'validarFormularioCriarEntrega deve existir');
  assert.match(source, /function addressHasNumber/);
  assert.match(validationBlock[0], /!addressHasNumber\(destinationAddress\)/);
  assert.match(validationBlock[0], /Informe o número do endereço para localizar o destino corretamente/);
  assert.match(source, /const erroValidacao = validarFormularioCriarEntrega\(\);[\s\S]+?if \(erroValidacao\)[\s\S]+?return;[\s\S]+?geocodeAddress\(destinationAddress\)/);
});

test('criacao de entrega lista apenas motoristas da empresa selecionada', () => {
  const source = fs.readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');

  assert.match(source, /motoristasDaEmpresaSelecionada/);
  assert.match(source, /Number\(motorista\.companyId\) === Number\(empresaId\)/);
  assert.match(source, /motoristasDaEmpresaSelecionada\.map/);
  assert.match(source, /setMotoristaId\(""\)/);
});
