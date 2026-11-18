# Subsídio de alimentação — verificação de regressão

Data: 2026-11-18. Base: `96f7f448b8306aad07c05d14136595e760ff8310`.

- Campo mensal opcional `mealAllowance`, apresentado como **Subsídio de alimentação**.
- Incluído uma vez em rendimento/sobra e discriminado no resumo e tabela anuais.
- Campo ausente equivale a zero; não há migração nem alteração na sincronização.
- 9 testes Node aprovados, incluindo preservação do IRS, despesas, investimentos,
  metadados, outros meses, JSON e comparação privada com a normalização anterior.
- 8 cenários de navegador aprovados: computador, telemóvel, gravação e conflito
  simulados, para ambos os campos (IRS e alimentação). Cada cenário conserva
  um valor preexistente no outro campo; exportação e recarregamento verificados.
- Apenas dados fictícios em testes e capturas. Contextos isolados, chamadas
  externas bloqueadas/simuladas, nenhum token real ou dado privado incluído.
- Criada cópia privada atual antes da alteração. Nenhuma gravação no repositório
  dos dados faz parte da implementação, dos testes ou da publicação da aplicação.

Capturas: `meal-desktop.png` e `meal-mobile.png`. Os testes existentes do IRS
permanecem ativos e as suas capturas foram atualizadas para a interface atual.
