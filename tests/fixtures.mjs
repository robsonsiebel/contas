// Synthetic records only. Never copy personal financial data into tests.
export const fixture = {
  version: 1,
  categories: [{ name: 'Compras', slot: 1 }, { name: 'Casa', slot: 2 }, { name: 'Investimentos', slot: 9, invest: true }],
  recurring: [{ desc: 'Fixa de teste', cat: 'Casa', amount: 20 }],
  shared: { name: 'Pessoa de teste', incomeMe: 2000, incomeOther: 1500, template: [{ desc: 'Água', cat: 'Casa' }], sheetUrl: '', myCol: 1 },
  extraMetadata: { preserved: true },
  months: {
    '2025-11': { salary: 700, bonus: 30, expenses: [] },
    '2026-10': { salary: 1900, bonus: 40, expenses: [{ id: 'oct-1', date: '2026-10-20', desc: 'Anterior', cat: 'Compras', amount: 50 }] },
    '2026-11': { salary: 2000, bonus: 100, sharedTab: 'Novembro26', extra: { preserve: ['recent', 'data'] }, expenses: [
      { id: 'nov-1', date: '2026-11-12', desc: 'Recente A', cat: 'Compras', amount: 150 },
      { id: 'nov-2', date: '2026-11-17', desc: 'Recente B', cat: 'Casa', amount: 50, shared: { source: 'fixture', allocation: 0.5, pct: 0.5, me: 50, other: 50 } },
      { id: 'nov-3', date: null, desc: 'Investimento', cat: 'Investimentos', amount: 100 },
    ] },
  },
};
