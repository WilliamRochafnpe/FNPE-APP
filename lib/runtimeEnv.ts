/** Host típico de desenvolvimento no navegador (não confundir com deploy em produção sem env). */
export function isLikelyLocalDevHostname(): boolean {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h.endsWith('.local');
}
