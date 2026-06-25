import { isValidCnpj, isValidCpf, onlyDigits } from './br-documents';

export function maskCpf(value: string): string {
  const cpf = onlyDigits(value);

  if (cpf.length !== 11) {
    return value;
  }

  if (!isValidCpf(value)) {
    return value;
  }

  const cpfInicio = cpf.slice(0, 3);
  const cpfMeio = cpf.slice(3, 6);
  const cpfFim = cpf.slice(6, 9);
  const cpfDigVerificador = cpf.slice(9, 11);

  const maskedCpf = `${cpfInicio}.${cpfMeio}.${cpfFim}-${cpfDigVerificador}`;

  return maskedCpf;
}

export function maskCnpj(value: string): string {
  const cnpj = onlyDigits(value);

  if (cnpj.length !== 14) {
    return value;
  }

  if (!isValidCnpj(value)) {
    return value;
  }

  const cnpjInicio = cnpj.slice(0, 2);
  const cnpjMeio = cnpj.slice(2, 5);
  const cnpjFim = cnpj.slice(5, 8);
  const cnpjVerificador = cnpj.slice(8, 12);
  const cnpjDigVerificador = cnpj.slice(12, 14);

  const maskedCnpj = `${cnpjInicio}.${cnpjMeio}.${cnpjFim}/${cnpjVerificador}-${cnpjDigVerificador}`;

  return maskedCnpj;
}

// 12345678903
// 0123456789
