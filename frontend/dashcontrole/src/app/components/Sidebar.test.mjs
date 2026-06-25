import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('sidebar mostra paginas corretas', () => {
  const source = fs.readFileSync(new URL('./Sidebar.tsx', import.meta.url), 'utf8');
  const navItemsBlock = source.match(/const navItems: NavItem\[] = \[[\s\S]+?\n\];/);

  assert.ok(navItemsBlock, 'navItems deve existir na Sidebar');
  assert.doesNotMatch(navItemsBlock[0], /label:\s*"Login"/);
  assert.doesNotMatch(navItemsBlock[0], /label:\s*"Componentes"/);
  assert.doesNotMatch(navItemsBlock[0], /label:\s*"Configurações"/);
  assert.match(navItemsBlock[0], /label:\s*"Dashboard"/);
  assert.match(navItemsBlock[0], /label:\s*"Entregas"/);
  assert.match(navItemsBlock[0], /label:\s*"Administrativo"/);
});
