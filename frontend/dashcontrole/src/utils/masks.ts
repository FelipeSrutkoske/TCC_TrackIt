export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function maskCpf(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);

  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
}

export function maskCnpj(value: string): string {
  const digits = onlyDigits(value).slice(0, 14);

  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, '$1.$2.$3/$4-$5');
}

export function maskPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 2) return digits;

  const ddd = digits.slice(0, 2);
  const number = digits.slice(2);
  const firstPartSize = number.length > 8 ? 5 : 4;
  const firstPart = number.slice(0, firstPartSize);
  const secondPart = number.slice(firstPartSize);

  return `(${ddd}) ${firstPart}${secondPart ? `-${secondPart}` : ''}`;
}

export function maskVehiclePlate(value: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 7);

  if (cleaned.length >= 5 && /^\d$/.test(cleaned[3]) && /^[A-Z]$/.test(cleaned[4])) {
    return cleaned;
  }

  return cleaned.length > 3 ? `${cleaned.slice(0, 3)}-${cleaned.slice(3)}` : cleaned;
}

export function maskCep(value: string): string {
  const digits = onlyDigits(value).slice(0, 8);

  return digits.replace(/^(\d{5})(\d)/, '$1-$2');
}

export function maskDate(value: string): string {
  const digits = onlyDigits(value).slice(0, 8);

  return digits
    .replace(/^(\d{2})(\d)/, '$1/$2')
    .replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3');
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

function calculateCpfDigit(cpf: string, length: number, weight: number): number {
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
