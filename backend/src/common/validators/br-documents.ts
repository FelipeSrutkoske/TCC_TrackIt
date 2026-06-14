export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function isValidCpf(value: string): boolean {
  const cpf = onlyDigits(value);

  if (cpf.length !== 11 || hasOnlyRepeatedDigits(cpf)) {
    return false;
  }

  const firstDigit = calculateCpfDigit(cpf, 9, 10);
  const secondDigit = calculateCpfDigit(cpf, 10, 11);

  return cpf[9] === String(firstDigit) && cpf[10] === String(secondDigit);
}

export function isValidCnpj(value: string): boolean {
  const cnpj = onlyDigits(value);

  if (cnpj.length !== 14 || hasOnlyRepeatedDigits(cnpj)) {
    return false;
  }

  const firstDigit = calculateCnpjDigit(cnpj.slice(0, 12));
  const secondDigit = calculateCnpjDigit(cnpj.slice(0, 12) + firstDigit);

  return cnpj[12] === String(firstDigit) && cnpj[13] === String(secondDigit);
}

function hasOnlyRepeatedDigits(value: string): boolean {
  return /^(\d)\1+$/.test(value);
}

function calculateCpfDigit(
  cpf: string,
  length: number,
  weight: number,
): number {
  const total = cpf
    .slice(0, length)
    .split('')
    .reduce((sum, digit, index) => sum + Number(digit) * (weight - index), 0);
  const rest = total % 11;

  return rest < 2 ? 0 : 11 - rest;
}

function calculateCnpjDigit(base: string): number {
  const weights =
    base.length === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const total = base
    .split('')
    .reduce((sum, digit, index) => sum + Number(digit) * weights[index], 0);
  const rest = total % 11;

  return rest < 2 ? 0 : 11 - rest;
}
