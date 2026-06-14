import { isValidCnpj, isValidCpf, onlyDigits } from './br-documents';

describe('br-documents validators', () => {
  describe('onlyDigits', () => {
    it('remove caracteres nao numericos', () => {
      expect(onlyDigits('123.456.789-09')).toBe('12345678909');
      expect(onlyDigits('11.222.333/0001-81')).toBe('11222333000181');
    });
  });

  describe('isValidCpf', () => {
    it('aceita CPF valido com ou sem mascara', () => {
      expect(isValidCpf('123.456.789-09')).toBe(true);
      expect(isValidCpf('12345678909')).toBe(true);
    });

    it('rejeita CPF invalido', () => {
      expect(isValidCpf('123.456.789-00')).toBe(false);
      expect(isValidCpf('111.111.111-11')).toBe(false);
      expect(isValidCpf('123')).toBe(false);
      expect(isValidCpf('')).toBe(false);
    });
  });

  describe('isValidCnpj', () => {
    it('aceita CNPJ valido com ou sem mascara', () => {
      expect(isValidCnpj('11.222.333/0001-81')).toBe(true);
      expect(isValidCnpj('11222333000181')).toBe(true);
    });

    it('rejeita CNPJ invalido', () => {
      expect(isValidCnpj('11.222.333/0001-00')).toBe(false);
      expect(isValidCnpj('11.111.111/1111-11')).toBe(false);
      expect(isValidCnpj('123')).toBe(false);
      expect(isValidCnpj('')).toBe(false);
    });
  });
});
