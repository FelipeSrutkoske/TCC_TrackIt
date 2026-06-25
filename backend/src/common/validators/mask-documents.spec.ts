import { maskCnpj, maskCpf } from './mask-documents';

describe('teste mascara de documentos', () => {
  describe('mascara cpf', () => {
    // verificar se CPF valido retorna com mascara
    it('retorna CPF valido formatado', () => {
      expect(maskCpf('12345678909')).toBe('123.456.789-09');
      expect(maskCpf('123.456.789-09')).toBe('123.456.789-09');
    });

    // rejeita mascara para cpf invalido, retornando o valor original
    it('retorna valor original quando CPF invalido', () => {
      expect(maskCpf('123.456.789-00')).toBe('123.456.789-00');
      expect(maskCpf('11111111111')).toBe('11111111111');
      expect(maskCpf('123')).toBe('123');
      expect(maskCpf('')).toBe('');
    });
  });

  describe('mascara cnpj', () => {
    // verificar se CNPJ valido retorna com mascara
    it('retorna CNPJ valido formatado', () => {
      expect(maskCnpj('11222333000181')).toBe('11.222.333/0001-81');
      expect(maskCnpj('11.222.333/0001-81')).toBe('11.222.333/0001-81');
    });

    // rejeita mascara para cnpj invalido, retornando o valor original
    it('retorna valor original quando CNPJ invalido', () => {
      expect(maskCnpj('11.222.333/0001-00')).toBe('11.222.333/0001-00');
      expect(maskCnpj('11111111111111')).toBe('11111111111111');
      expect(maskCnpj('123')).toBe('123');
      expect(maskCnpj('')).toBe('');
    });
  });
});
