import * as bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';

type MasterUserInput = {
  email: string;
  name: string;
  passwordHash: string;
};

export function buildMasterUserUpsert(input: MasterUserInput) {
  return {
    sql: `
      INSERT INTO tb_usuarios (nome, email, senha, tipo_usuario, ativo, data_criacao)
      VALUES (?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        nome = ?,
        senha = ?,
        tipo_usuario = ?,
        ativo = ?
    `,
    values: [
      input.name,
      input.email,
      input.passwordHash,
      'ADMIN',
      true,
      input.name,
      input.passwordHash,
      'ADMIN',
      true,
    ],
  };
}

async function main() {
  const email = process.env.MASTER_EMAIL;
  const password = process.env.MASTER_PASSWORD;
  const name = process.env.MASTER_NAME ?? 'Admin Master';

  if (!email || !password) {
    throw new Error('Informe MASTER_EMAIL e MASTER_PASSWORD para criar o usuario master.');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const query = buildMasterUserUpsert({ email, name, passwordHash });
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  try {
    await connection.execute(query.sql, query.values);
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  void main()
    .then(() => {
      console.log('Usuario master ADMIN criado/atualizado com sucesso.');
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
