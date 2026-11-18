# Contas

Aplicação estática pessoal para acompanhar despesas. Não requer build nem dependências.

## Privacidade

Os dados financeiros não pertencem a este repositório de código: ficam exclusivamente no repositório privado `contas-dados`. Não copie dados reais, backups ou tokens para aqui, incluindo para testes.

## Reembolso do IRS

No mês em que recebe o dinheiro, preencha **Reembolso do IRS**, ao lado de Salário e Bónus / outros. O valor é somado uma única vez ao rendimento e à sobra; aparece também no resumo anual e na tabela. Aceita valores como `1250,50` ou `1.250,50`.

Os meses antigos não precisam de migração: se o campo não existir, conta como zero. Abrir a nova versão não cria nem regrava esse campo nos dados antigos. Ao editar, mantém-se a sincronização e a proteção de conflitos existentes. Não repita no novo campo um reembolso que já tenha registado em Bónus / outros.

## Utilização local

Sirva esta pasta por HTTP local e abra `index.html` no navegador. Em **Definições**, indique o proprietário `robsonsiebel`, o repositório `contas-dados`, o caminho `data.json`, a branch `main` e um token fine-grained limitado a esse repositório com `Contents: Read and write`.

O token fica apenas no `localStorage` do navegador. Nunca o adicione ao Git.

## Acesso e publicação

A aplicação está disponível em https://www.robsonsiebel.eu/contas/ pelo GitHub Pages existente (`main`, raiz). O código não inclui `data.json`; a configuração e o token continuam apenas no `localStorage` do navegador. A utilização local por HTTP também continua disponível.

## Testes de regressão

`node --test tests/irs-refund.test.mjs` verifica os cálculos e a preservação de registos usando dados fictícios. Não há dependências de execução nem etapa de build.

Para os testes de navegador, use Playwright apenas como ferramenta de desenvolvimento: `CONTAS_PLAYWRIGHT_MODULE=/caminho/para/@playwright/test node tests/irs-browser.mjs`. O script usa um servidor HTTP efémero em localhost, contextos novos e respostas GitHub simuladas; não usa tokens reais nem escreve em repositórios de dados. As capturas em `docs/qa/` contêm somente dados fictícios.
