# Reembolso do IRS — verificação de regressão

Data: 2026-11-18. Base: `96b85f3eef29592694f33e52e79702999d80fe6b`.

## Alteração

Campo mensal opcional `irsRefund`, apresentado como **Reembolso do IRS**.
Entra uma única vez em rendimento e sobra, com discriminação no resumo anual.
Meses sem o campo continuam a contar zero. Sem migração, alteração da versão
do formato ou mudanças no mecanismo de sincronização.

## Resultados

- 7 testes Node aprovados: dados antigos, isolamento entre meses, cálculos,
  mês só com IRS, limpeza, persistência, separadores monetários e soma anual.
- A verificação opcional comparou a normalização de uma cópia privada atual
  com o código anterior e o novo: digests idênticos. Nenhum valor real é incluído
  neste repositório, nas capturas ou na saída dos testes.
- 4 cenários de navegador aprovados: computador, telemóvel, gravação GitHub
  simulada e conflito GitHub simulado. Incluem exportação, recarregamento,
  preservação dos registos mais recentes, ausência de overflow e erros JS.
- Os testes de navegador usam contextos isolados e dados fictícios; chamadas
  externas são bloqueadas ou simuladas. Nenhuma gravação no repositório de
  dados reais faz parte dos testes ou da disponibilização do código.

As capturas `irs-desktop.png` e `irs-mobile.png` usam somente dados fictícios.
