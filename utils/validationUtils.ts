
export const validateCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length !== 11 || !!cleanCPF.match(/(\d)\1{10}/)) return false;
  
  let sum = 0;
  for (let i = 1; i <= 9; i++) sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(cleanCPF.substring(9, 10))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  return rest === parseInt(cleanCPF.substring(10, 11));
};

export const validateCNPJ = (cnpj: string): boolean => {
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  if (cleanCNPJ.length !== 14 || !!cleanCNPJ.match(/(\d)\1{13}/)) return false;

  const validate = (s: string, weights: number[]) => {
    let sum = 0;
    for (let i = 0; i < weights.length; i++) sum += parseInt(s[i]) * weights[i];
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const d1 = validate(cleanCNPJ, w1);
  const d2 = validate(cleanCNPJ.substring(0, 13) + d1, w2);

  return d1 === parseInt(cleanCNPJ[12]) && d2 === parseInt(cleanCNPJ[13]);
};

export const isValidDocument = (doc: string): boolean => {
  const clean = doc.replace(/\D/g, '');
  if (clean.length === 11) return validateCPF(clean);
  if (clean.length === 14) return validateCNPJ(clean);
  return false;
};

export const validatePhone = (phone: string): boolean => {
  const clean = phone.replace(/\D/g, '');
  // Brazilian phone must have 10 (fixed) or 11 (mobile) digits
  if (clean.length < 10 || clean.length > 11) return false;
  
  // Valid DDDs are between 11 and 99
  const ddd = parseInt(clean.substring(0, 2));
  if (ddd < 11 || ddd > 99) return false;
  
  // If it's a mobile (11 digits), it must start with 9
  if (clean.length === 11 && clean[2] !== '9') return false;
  
  return true;
};

export const formatPhone = (phone: string): string => {
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 11) {
    return clean.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (clean.length === 10) {
    return clean.replace(/^(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
};

export const formatCEP = (cep: string): string => {
  return cep.replace(/\D/g, '').replace(/^(\d{5})(\d{3})/, '$1-$2');
};
