export const detectSubject = (name = '') => {
  const n = name.toLowerCase()
  if (n.includes('eng1012') || n.includes('1012')) return 'ENG1012'
  if (n.includes('eng1013') || n.includes('1013')) return 'ENG1013'
  if (n.includes('eng1090') || n.includes('1090')) return 'ENG1090'
  if (n.includes('acc1100') || n.includes('1100')) return 'ACC1100'
  if (n.includes('gym') || n.includes('fitness') || n.includes('xl fitness')) return 'Gym'
  if (n.includes('surf')) return 'Personal'
  return 'Other'
}
