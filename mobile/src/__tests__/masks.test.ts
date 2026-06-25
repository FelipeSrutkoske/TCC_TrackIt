import { isValidCpf, maskCep, maskCnpj, maskCpf, maskDate, maskPhone, onlyDigits } from '../utils/masks';

describe('masks util', () => {
  it('normaliza apenas digitos', () => {
    expect(onlyDigits('abc123.456-xy')).toBe('123456');
  });

  it('mascara CPF', () => {
    expect(maskCpf('12345678909')).toBe('123.456.789-09');
  });

  it('valida CPF pelo digito verificador', () => {
    expect(isValidCpf('123.456.789-09')).toBe(true);
    expect(isValidCpf('123.456.789-01')).toBe(false);
    expect(isValidCpf('111.111.111-11')).toBe(false);
  });

  it('mascara CNPJ', () => {
    expect(maskCnpj('11222333000181')).toBe('11.222.333/0001-81');
  });

  it('mascara telefone', () => {
    expect(maskPhone('11987654321')).toBe('(11) 98765-4321');
  });

  it('mascara CEP', () => {
    expect(maskCep('01001000')).toBe('01001-000');
  });

  it('mascara data', () => {
    expect(maskDate('11062026')).toBe('11/06/2026');
  });
});
