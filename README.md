# E2E Treinamentos - Home Broker

Este projeto é um simulador de Home Broker desenvolvido em HTML, CSS, JavaScript puro e Bootstrap 5. Ele permite cadastro, login e simulação de operações de compra e venda de ativos, com persistência local dos dados via `localStorage`.

## Funcionalidades

- **Cadastro de Usuário:**  
  - Nome completo, CPF, e-mail, celular, senha (com confirmação e validação forte).
  - Validação em tempo real dos campos.
  - Bloqueio do botão "Criar Conta" até todos os campos estarem válidos.
  - Mensagens visuais de erro e sucesso.
  - Não permite cadastro com CPF ou e-mail já existentes.

- **Login:**  
  - Tela estilizada com Bootstrap.
  - Máscara automática para CPF.
  - Mensagens de erro para login inválido.
  - Persistência dos usuários e contas no navegador.

- **Portal do Usuário:**  
  - Visualização da carteira de ativos.
  - Book de ofertas (B3) com atualização automática.
  - Boleta de compra e venda de ativos.
  - Extrato de operações e book de ordens.
  - Cancelamento de ordens aceitas.
  - Saldo atualizado em tempo real.

## Como usar

1. **Abra o arquivo `hb.html` em seu navegador.**
2. **Cadastre um novo usuário** ou utilize os acessos de exemplo:
   - CPF: `111.111.111-11` | Senha: `123` (Conta A, saldo inicial R$ 100.000)
   - CPF: `222.222.222-22` | Senha: `456` (Conta B, saldo inicial R$ 10)
3. **Faça login** e utilize o simulador normalmente.

## Tecnologias

- HTML5
- CSS3
- [Bootstrap 5](https://getbootstrap.com/)
- JavaScript puro

## Observações

- O sistema é totalmente client-side (não há backend).
- Os dados de usuários e contas são persistidos no navegador via `localStorage`.
- Para simulação de CPF e celular, máscaras são aplicadas automaticamente.
- Para "resetar" o sistema, basta limpar o localStorage do navegador.

---

Desenvolvido para fins educacionais