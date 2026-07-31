const AZ_MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun',
  'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr',
];

// "2026-08-01" -> "1 Avqust 2026"
export function formatDateAz(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return `${day} ${AZ_MONTHS[month - 1]} ${year}`;
}
