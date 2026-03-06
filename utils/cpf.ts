
/**
 * Remove todos os caracteres não numéricos
 */
export const normalizeDocument = (str: string): string => {
  return (str || '').replace(/\D/g, '');
};

/**
 * Validação de CPF (Módulo 11)
 */
export const isCpfValid = (input: string): boolean => {
  const cpf = normalizeDocument(input);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(cpf[i]) * (10 - i);
  let d1 = (sum * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== Number(cpf[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(cpf[i]) * (11 - i);
  let d2 = (sum * 10) % 11;
  if (d2 === 10) d2 = 0;
  return d2 === Number(cpf[10]);
};

/**
 * Validação de CNPJ (Módulo 11)
 */
export const isCnpjValid = (input: string): boolean => {
  const cnpj = normalizeDocument(input);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

  const calculate = (s: string, weights: number[]) => {
    let sum = 0;
    for (let i = 0; i < weights.length; i++) sum += Number(s[i]) * weights[i];
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };

  const d1 = calculate(cnpj.substring(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = calculate(cnpj.substring(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

  return d1 === Number(cnpj[12]) && d2 === Number(cnpj[13]);
};

export const normalizeCpf = normalizeDocument;
export const formatCpf = (cpf: string): string => {
  const pure = normalizeDocument(cpf);
  if (pure.length <= 3) return pure;
  if (pure.length <= 6) return pure.replace(/(\d{3})(\d{1,3})/, "$1.$2");
  if (pure.length <= 9) return pure.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
  return pure.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
};
