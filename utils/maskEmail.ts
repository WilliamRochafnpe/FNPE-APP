
/**
 * Mascara o e-mail: jose.silva@gmail.com -> jo***@g***.com
 */
export const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return '***@***.com';
  
  const [user, domainPart] = email.split('@');
  const [domain, ...rest] = domainPart.split('.');
  const extension = rest.join('.');

  const maskedUser = user.length > 2 
    ? user.substring(0, 2) + '***' 
    : user.substring(0, 1) + '***';

  const maskedDomain = domain.length > 1 
    ? domain.substring(0, 1) + '***' 
    : '***';

  return `${maskedUser}@${maskedDomain}.${extension}`;
};
