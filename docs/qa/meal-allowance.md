# Remoção do subsídio de alimentação

Data: 2026-11-18. A funcionalidade foi retirada a pedido do utilizador.

- Campo, discriminação anual e contribuição para os totais removidos.
- Eventual `mealAllowance` histórico permanece intacto no JSON e na exportação;
  é ignorado nos cálculos. Sem migração, eliminação ou escrita em dados reais.
- IRS, salário, bónus, despesas e investimentos mantêm o funcionamento anterior.
- 8 testes Node aprovados, incluindo preservação do campo histórico sem efeito
  nos totais e comparação da normalização com uma cópia privada atual.
- 4 cenários de navegador aprovados: computador, telemóvel, gravação e conflito
  simulados. Verificam ausência do campo mensal/anual, preservação do valor
  histórico e do IRS, exportação, recarregamento e dados recentes.
- Capturas e testes contêm apenas dados fictícios. Backup atual em armazenamento
  privado, nunca neste repositório. As capturas da funcionalidade retirada foram
  removidas; as capturas do IRS mostram a interface atual.
