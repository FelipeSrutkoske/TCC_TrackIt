import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('pagina administrativo usa filtro de empresa para admin', () => {
  const source = fs.readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');

  assert.match(source, /title=\{isAdmin \? "Administrativo" : "Configuracoes"\}/);
  assert.match(source, /authService\.getUser\(\)/);
  assert.match(source, /empresaSelecionada/);
  assert.match(source, /modalEmpresaAberto/);
  assert.match(source, /modalUsuarioAberto/);
  assert.match(source, /modalMotoristaAberto/);
  assert.match(source, /isAdmin/);
  assert.match(source, /companiesService\.create/);
  assert.match(source, /usersService\.create/);
  assert.doesNotMatch(source, /companyId:\s*1/);
  assert.match(source, /driverProfile/);
  assert.match(source, /CNH/);
  assert.match(source, /placaVeiculo/);
  assert.match(source, /Cadastrar cliente/);
  assert.match(source, /Criar usuario/);
  assert.doesNotMatch(source, /<form className="rounded-2xl[\s\S]+Cadastrar cliente[\s\S]+<form className="rounded-2xl[\s\S]+Criar usuario/);
});

test('empresa criada fica disponivel para usuario imediatamente', () => {
  const source = fs.readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
  const createCompanyBlock = source.match(/async function handleCreateCompany[\s\S]+?\n  }\n\n  async function handleCreateUser/);

  assert.ok(createCompanyBlock, 'handleCreateCompany deve existir na pagina administrativo');
  assert.match(createCompanyBlock[0], /const createdCompany = await companiesService\.create/);
  assert.match(createCompanyBlock[0], /setCompanyOptions\(\(current\) => \[\.\.\.current, createdCompany\]\)/);
  assert.match(createCompanyBlock[0], /setEmpresaSelecionada\(String\(createdCompany\.id\)\)/);
  assert.match(createCompanyBlock[0], /companyId: String\(createdCompany\.id\)/);
});

test('formulario de motorista normaliza CNH e placa antes de enviar', () => {
  const source = fs.readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');

  assert.match(source, /Número de registro da CNH/);
  assert.match(source, /maxLength=\{11\}/);
  assert.match(source, /placaVeiculo:\s*normalizeVehiclePlate\(userForm\.placaVeiculo\) \|\| null/);
  assert.match(source, /function normalizeVehiclePlate/);
  assert.match(source, /replace\(\/\[\\s-\]\/g, ""\)\.toUpperCase\(\)/);
});

test('cadastro de usuario e motorista usa feedback especifico', () => {
  const source = fs.readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');

  assert.match(source, /Motorista criado com sucesso\./);
  assert.match(source, /Usuário criado com sucesso\./);
  assert.match(source, /Já existe um usuário cadastrado com este e-mail\./);
  assert.match(source, /Nao foi possivel criar usuario\./);
});

test('controle de usuarios permite editar acessos de usuario sem listar admin', () => {
  const source = fs.readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');

  assert.match(source, /Controle de usuários/);
  assert.match(source, /usuariosOperacionais/);
  assert.match(source, /usuario\.tipoUsuario !== "ADMIN"/);
  assert.match(source, /usersService\.getAll\(\)/);
  assert.match(source, /usersService\.update/);
  assert.match(source, /modalEditarUsuarioAberto/);
  assert.match(source, /Editar acesso/);
  assert.match(source, /Dashboard/);
  assert.match(source, /Motorista/);
});

test('secoes de usuarios e carteira sao drops expansiveis com icone e usuarios ordenados por tipo de acesso', () => {
  const source = fs.readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');

  assert.match(source, /expandedSections/);
  assert.match(source, /setExpandedSections/);
  assert.match(source, /ChevronDownIcon/);
  assert.match(source, /rotate-180/);
  assert.match(source, /sort\(/);
  assert.match(source, /usuariosOrdenados/);
});
