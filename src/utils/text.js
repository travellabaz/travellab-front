export function truncate(str, max) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max).trim() + '…' : str;
}
