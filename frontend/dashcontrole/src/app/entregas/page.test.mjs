import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('vincular motorista mantem entrega aguardando GPS inicial do mobile', () => {
  const source = fs.readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
  const driverAssignmentBlock = source.match(/async function vincularMotorista[\s\S]+?setModalMotoristasAberto\(false\);/);

  assert.ok(driverAssignmentBlock, 'vincularMotorista deve existir na pagina de entregas');
  assert.match(driverAssignmentBlock[0], /status:\s*"AGUARDANDO_MOTORISTA"/);
  assert.doesNotMatch(driverAssignmentBlock[0], /status:\s*"EM_ROTA"/);
  assert.match(driverAssignmentBlock[0], /GPS inicial capturado no mobile/);
});

test('pagina de entregas usa toast em vez de alert nativo', () => {
  const source = fs.readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');

  assert.doesNotMatch(source, /alert\(/);
  assert.match(source, /useToast/);
  assert.match(source, /addToast\(errorMessage,\s*"error"\)/);
});

test('vinculo de motorista so fica disponivel para entrega aguardando motorista', () => {
  const source = fs.readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');

  assert.match(source, /entregaSelecionada\.status !== "AGUARDANDO_MOTORISTA"/);
  assert.match(source, /entrega\.status === "AGUARDANDO_MOTORISTA" \? \(/);
  assert.match(source, /setModalMotoristasAberto\(true\)/);
});

test('listagem de entregas nao monta comprovante pesado', () => {
  const source = fs.readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');

  assert.doesNotMatch(source, /DeliveryProofModal/);
  assert.match(source, /href=\{`\/entregas\/\$\{entrega\.id\}`\}/);
  assert.match(source, /Abrir pagina completa/);
});

test('modal de motoristas filtra e limita a lista renderizada', () => {
  const source = fs.readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');

  assert.match(source, /MAX_MOTORISTAS_VISIVEIS\s*=\s*50/);
  assert.match(source, /filtroMotorista/);
  assert.match(source, /motoristasVisiveis/);
  assert.match(source, /\.slice\(0, MAX_MOTORISTAS_VISIVEIS\)/);
});

test('admin filtra entregas por empresa antes de renderizar a lista', () => {
  const source = fs.readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');

  assert.match(source, /authService\.getUser\(\)/);
  assert.match(source, /companiesService\.getAll\(\)/);
  assert.match(source, /empresaSelecionada/);
  assert.match(source, /selectedCompanyId/);
  assert.match(source, /deliveriesService\.getAll\(selectedCompanyId\)/);
  assert.match(source, /Selecione uma empresa para visualizar as entregas\./);
});
