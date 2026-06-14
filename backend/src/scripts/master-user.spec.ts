import { buildMasterUserUpsert } from './master-user';

describe('master user seed helper', () => {
  it('builds a safe upsert payload for the master admin user', () => {
    const result = buildMasterUserUpsert({
      email: 'admin@example.com',
      name: 'Admin Master',
      passwordHash: '$2b$10$hashseguro',
    });

    expect(result.sql).toContain('INSERT INTO tb_usuarios');
    expect(result.sql).toContain('ON DUPLICATE KEY UPDATE');
    expect(result.values).toEqual([
      'Admin Master',
      'admin@example.com',
      '$2b$10$hashseguro',
      'ADMIN',
      true,
      'Admin Master',
      '$2b$10$hashseguro',
      'ADMIN',
      true,
    ]);
  });
});
