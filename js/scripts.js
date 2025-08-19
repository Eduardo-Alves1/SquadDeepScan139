// --- DADOS INICIAIS ---
const usuarios = {};
const contas = {};
const ativosB3 = {
  PETR4: 28.50, VALE3: 72.30, ITUB4: 31.10, BBDC4: 27.80,
  ABEV3: 14.25, MGLU3: 3.45, BBAS3: 49.10, LREN3: 18.30
};
let usuarioAtual = null;
let extrato = [];
let ordens = [];

// --- CONSTANTES ---
const DIFERENCA_MAXIMA_COTACAO = 5; // Diferença máxima entre preço e cotação
const INTERVALO_ATUALIZACAO = 10000; // Atualização do book

// Função genérica para atualizar conteúdos no DOM
function atualizarElemento(id, texto) {
  const elemento = document.getElementById(id);
  if (elemento) elemento.innerText = texto;
}

// Atualiza os preços de ativos
function atualizarPrecosDeAtivos() {
  let atualizou = false;

  for (let ativo in ativosB3) {
    ativosB3[ativo] = parseFloat((ativosB3[ativo] + 0.01).toFixed(2));
  }

  ordens.forEach(ordem => {
    if (ordem.status === "Aceita" && ordem.valor === ativosB3[ordem.ativo]) {
      const conta = contas[usuarios[ordem.cpf].conta];

      if (ordem.tipo === "Compra" && conta.saldo >= ordem.total) {
        aplicarOrdemUsuario(ordem, conta);
        ordem.status = "Executada";
        extrato.unshift(ordem);
        atualizou = true;
      } else if (ordem.tipo === "Venda" && conta.carteira[ordem.ativo] >= ordem.qtd) {
        aplicarOrdemUsuario(ordem, conta);
        ordem.status = "Executada";
        extrato.unshift(ordem);
        atualizou = true;
      }
    }
  });

  if (atualizou) {
    salvarUsuariosEContas();
    localStorage.setItem('extratoOperacoes', JSON.stringify(extrato));

    const cpf = localStorage.getItem('usuarioLogado');
    if (usuarioAtual && usuarios[cpf] && contas[usuarios[cpf].conta] === usuarioAtual) {
      atualizarCarteira();
    }
  }

  atualizarBook();
  atualizarOrdens();
  atualizarExtrato();
}

// Executa atualização periódica
setInterval(atualizarPrecosDeAtivos, INTERVALO_ATUALIZACAO);

// Aguarda DOM pronto para adicionar listeners
document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('cadCpf')?.addEventListener('input', function (e) {
    let v = this.value.replace(/\D/g, '').slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    this.value = v;
  });
  document.getElementById('cadCelular')?.addEventListener('input', function (e) {
    let v = this.value.replace(/\D/g, '').slice(0, 11);
    v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
    v = v.replace(/(\d{5})(\d{1,4})$/, '$1-$2');
    this.value = v;
  });

  const camposCadastro = ['cadNome', 'cadCpf', 'cadEmail', 'cadCelular', 'cadSenha', 'cadSenha2'];
  camposCadastro.forEach(id => {
    document.getElementById(id)?.addEventListener('input', validarCadastro);
  });

  function preencherDropdownAtivos() {
    const select = document.getElementById('ativo');
    if (!select) return;
    select.innerHTML = '';
    Object.keys(ativosB3).forEach(ativo => {
      const option = document.createElement('option');
      option.value = ativo;
      option.textContent = ativo;
      select.appendChild(option);
    });
  }
  preencherDropdownAtivos();
});

function login() {
  const cpf = formataCpf(document.getElementById('cpf').value.replace(/\D/g, ''));
  const senha = document.getElementById('senha').value;
  const user = usuarios[cpf];
  if (user && user.senha === senha) {
    localStorage.setItem('usuarioLogado', cpf);
    window.location.href = "index.html";
  } else {
    document.getElementById('loginMsg').innerText = "CPF ou senha inválidos.";
  }
}
function logout() {
  usuarioAtual = null;
  extrato = [];
  ordens = [];
  localStorage.removeItem('usuarioLogado');
  window.location.href = "login.html";
}

function limparCamposCadastro() {
  document.getElementById('formCadastro').reset();
  ['erroNome', 'erroCpf', 'erroEmail', 'erroCelular', 'erroSenha', 'erroSenha2', 'cadastroMsg'].forEach(id => {
    document.getElementById(id).innerText = '';
    document.getElementById(id).classList.remove('sucesso', 'erro');
  });
  document.getElementById('btnCriarConta').disabled = true;
}

function validarCadastro() {
  let ok = true;
  const nome = document.getElementById('cadNome').value.trim();
  if (nome.length < 5) { erro('erroNome', 'Informe o nome completo.'); ok = false; } else { erro('erroNome', ''); }
  const cpf = document.getElementById('cadCpf').value.replace(/\D/g, '');
  if (!cpfValido(cpf)) { erro('erroCpf', 'CPF inválido.'); ok = false; }
  else if (cpfExiste(formataCpf(cpf))) { erro('erroCpf', 'CPF já cadastrado.'); ok = false; }
  else { erro('erroCpf', ''); }
  const email = document.getElementById('cadEmail').value.trim();
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) { erro('erroEmail', 'E-mail inválido.'); ok = false; }
  else if (emailExiste(email)) { erro('erroEmail', 'E-mail já cadastrado.'); ok = false; }
  else { erro('erroEmail', ''); }
  const cel = document.getElementById('cadCelular').value.replace(/\D/g, '');
  if (cel.length < 10) { erro('erroCelular', 'Celular inválido.'); ok = false; } else { erro('erroCelular', ''); }
  const senha = document.getElementById('cadSenha').value;
  if (!/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(senha)) { erro('erroSenha', 'Mín. 8 caracteres, 1 maiúscula, 1 número.'); ok = false; }
  else { erro('erroSenha', ''); }
  const senha2 = document.getElementById('cadSenha2').value;
  if (senha !== senha2 || !senha2) { erro('erroSenha2', 'Senhas não conferem.'); ok = false; } else { erro('erroSenha2', ''); }
  document.getElementById('btnCriarConta').disabled = !ok;
}
function erro(id, msg) {
  document.getElementById(id).innerText = msg;
}
function cpfValido(cpf) {
  if (!cpf || cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let soma = 0, resto;
  for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  resto = (soma * 10) % 11; if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;
  soma = 0;
  for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  resto = (soma * 10) % 11; if (resto === 10 || resto === 11) resto = 0;
  return resto === parseInt(cpf.substring(10, 11));
}
function cpfExiste(cpf) { return !!usuarios[formataCpf(cpf)]; }
function emailExiste(email) {
  for (let cpf in usuarios) {
    if (usuarios[cpf].email && usuarios[cpf].email.toLowerCase() === email.toLowerCase()) return true;
  }
  return false;
}
function formataCpf(cpf) {
  return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}
function criarConta() {
  const nome = document.getElementById('cadNome').value.trim();
  const cpf = formataCpf(document.getElementById('cadCpf').value.replace(/\D/g, ''));
  const email = document.getElementById('cadEmail').value.trim();
  const celular = document.getElementById('cadCelular').value.trim();
  const senha = document.getElementById('cadSenha').value;
  if (cpfExiste(cpf)) { msgCadastro('CPF já cadastrado.', false); return; }
  if (emailExiste(email)) { msgCadastro('E-mail já cadastrado.', false); return; }
  usuarios[cpf] = { senha, conta: cpf, email, nome, celular };
  contas[cpf] = { nome, saldo: 10000, carteira: {} };
  msgCadastro('Cadastro realizado com sucesso!', true);
  salvarUsuariosEContas();
  setTimeout(() => {
    localStorage.setItem('usuarioLogado', cpf);
    window.location.href = "index.html";
  }, 1200);
}
function msgCadastro(msg, sucesso) {
  const el = document.getElementById('cadastroMsg');
  el.innerText = msg;
  el.className = sucesso ? 'sucesso' : 'erro';
}

// Carrega usuários e contas
function salvarUsuariosEContas() {
  localStorage.setItem('usuarios', JSON.stringify(usuarios));
  localStorage.setItem('contas', JSON.stringify(contas));
}
function carregarUsuariosEContas() {
  const usuariosPadrao = {
    "111.111.111-11": { senha: "123", conta: "A", email: "a@a.com", nome: "Usuário A", celular: "(11) 99999-1111" },
    "222.222.222-22": { senha: "456", conta: "B", email: "b@b.com", nome: "Usuário B", celular: "(22) 99999-2222" }
  };
  const contasPadrao = {
    A: { nome: "Conta A", saldo: 100000, carteira: {} },
    B: { nome: "Conta B", saldo: 10, carteira: {} }
  };
  const usuariosSalvos = localStorage.getItem('usuarios');
  const contasSalvas = localStorage.getItem('contas');
  Object.assign(usuarios, usuariosPadrao, usuariosSalvos ? JSON.parse(usuariosSalvos) : {});
  Object.assign(contas, contasPadrao, contasSalvas ? JSON.parse(contasSalvas) : {});
}
carregarUsuariosEContas();

function carregarExtrato() {
  const salvo = localStorage.getItem('extratoOperacoes');
  extrato = salvo ? JSON.parse(salvo) : [];
}
carregarExtrato();


// --- FUNÇÕES DO PORTAL ---
function atualizarCarteira() {
  const tbody = document.querySelector("#carteira tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  for (let ativo in usuarioAtual.carteira) {
    tbody.innerHTML += `<tr><td>${ativo}</td><td>${usuarioAtual.carteira[ativo]}</td></tr>`;
  }
  document.getElementById("saldo").innerText = usuarioAtual.saldo.toFixed(2);
}
function atualizarBook() {
  const tbody = document.querySelector("#book tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  for (let ativo in ativosB3) {
    tbody.innerHTML += `<tr><td>${ativo}</td><td>${ativosB3[ativo].toFixed(2)}</td></tr>`;
  }
}
function preencherSelectAtivos() {
  const select = document.getElementById("ativo");
  if (!select) return;
  select.innerHTML = "";
  for (let ativo in ativosB3) {
    select.innerHTML += `<option value="${ativo}">${ativo}</option>`;
  }
}

// --- OUTRAS MELHORIAS ---

// Função central para validar valores, reduzindo duplicações
function validarValor(valor, cotacao) {
  if (Math.abs(valor - cotacao) > DIFERENCA_MAXIMA_COTACAO) {
    return false; // Diferença maior que o limite aceito
  }
  return true;
}

// Exemplo de refatoração em `executarOperacao`
function executarOperacao() {
  if (!usuarioAtual) return;

  const tipo = document.getElementById('tipo').value;
  const ativo = document.getElementById('ativo').value;
  const qtd = parseInt(document.getElementById('quantidade').value);
  const valor = parseFloat(document.getElementById('valor').value);
  const cotacao = ativosB3[ativo];
  const total = qtd * valor;

  // Validações
  if (isNaN(qtd) || qtd <= 0 || qtd % 100 !== 0 || isNaN(valor)) {
    atualizarElemento("mensagem", "Preencha quantidade válida (múltiplos de 100) e valor.");
    return;
  }

  if (Math.abs(valor - cotacao) > 5) {
    ordens.unshift({ tipo, ativo, qtd, valor, total, cotacao, status: "Rejeitada", id: Date.now() });
    atualizarOrdens();
    atualizarElemento("mensagem", "Ordem rejeitada (diferença > R$5).");

    // Mostra Toast com mensagem de erro
    exibirToast("A ordem foi rejeitada devido à diferença de preço.", "danger");
    return;
  }

  if (tipo === "Compra" && usuarioAtual.saldo < total) {
    atualizarElemento("mensagem", "Saldo insuficiente.");
    // Toast de erro
    exibirToast("Saldo insuficiente para realizar a compra!", "danger");
    return;
  }

  if (tipo === "Venda" && (!usuarioAtual.carteira[ativo] || usuarioAtual.carteira[ativo] < qtd)) {
    atualizarElemento("mensagem", "Quantidade insuficiente do ativo.");
    exibirToast("Quantidade insuficiente para venda!", "danger");
    return;
  }

  // Criação e execução da ordem
  const ordem = {
    tipo, ativo, qtd, valor, total, cotacao,
    status: valor === cotacao ? "Executada" : "Aceita",
    id: Date.now(),
    cpf: localStorage.getItem('usuarioLogado')
  };

  if (ordem.status === "Executada") {
    aplicarOrdem(ordem);
    extrato.unshift(ordem);
    salvarUsuariosEContas();
    localStorage.setItem("extratoOperacoes", JSON.stringify(extrato));
  }

  ordens.unshift(ordem);
  atualizarOrdens();

  // Atualiza as tabelas e exibe mensagem de sucesso
  atualizarCarteira();
  atualizarExtrato();
  exibirToast("Ordem de " + tipo + " enviada com sucesso!");
}
function aplicarOrdem(o) {
  if (o.tipo === "Compra") {
    usuarioAtual.saldo -= o.total;
    usuarioAtual.carteira[o.ativo] = (usuarioAtual.carteira[o.ativo] || 0) + o.qtd;
  } else {
    usuarioAtual.saldo += o.total;
    usuarioAtual.carteira[o.ativo] = (usuarioAtual.carteira[o.ativo] || 0) - o.qtd;
    if (usuarioAtual.carteira[o.ativo] < 0) usuarioAtual.carteira[o.ativo] = 0;
  }
}
function aplicarOrdemUsuario(o, conta) {
  if (o.tipo === "Compra") {
    conta.saldo -= o.total;
    conta.carteira[o.ativo] = (conta.carteira[o.ativo] || 0) + o.qtd;
  } else {
    conta.saldo += o.total;
    conta.carteira[o.ativo] = (conta.carteira[o.ativo] || 0) - o.qtd;
    if (conta.carteira[o.ativo] < 0) conta.carteira[o.ativo] = 0;
  }
}
function cancelarOrdem(id) {
  const index = ordens.findIndex(o => o.id === id && o.status === "Aceita");
  if (index !== -1) {
    ordens.splice(index, 1);
    atualizarOrdens();
    document.getElementById("mensagem").innerText = "Ordem cancelada.";
  }
}
function atualizarOrdens() {
  const tbody = document.querySelector("#ordens tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  ordens.forEach(o => {
    tbody.innerHTML += `
      <tr>
        <td>${o.tipo}</td>
        <td>${o.ativo}</td>
        <td>${o.qtd}</td>
        <td>${o.valor.toFixed(2)}</td>
        <td>${o.cotacao.toFixed(2)}</td>
        <td>${o.status}</td>
        <td>${o.status === "Aceita" ? `<button class="btn-cancelar" onclick="cancelarOrdem(${o.id})">Cancelar</button>` : ""}</td>
      </tr>`;
  });
}
function atualizarExtrato() {
  const tbody = document.querySelector("#extrato tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  extrato.forEach(e => {
    tbody.innerHTML += `<tr><td>${e.tipo}</td><td>${e.ativo}</td><td>${e.qtd}</td><td>${e.total.toFixed(2)}</td></tr>`;
  });
}
setInterval(() => {
  for (let ativo in ativosB3) {
    ativosB3[ativo] += 0.01;
    ativosB3[ativo] = parseFloat(ativosB3[ativo].toFixed(2));
  }
  if (atualizou) {
    salvarUsuariosEContas();
    localStorage.setItem('extratoOperacoes', JSON.stringify(extrato));

    // Se o usuário logado teve a conta afetada, atualiza visualmente a carteira
    if (usuarioAtual && contas[usuarios[localStorage.getItem('usuarioLogado')].conta] === usuarioAtual) {
      atualizarCarteira();
    }
  }

  let atualizou = false;

  ordens.forEach(o => {
    if (o.status === "Aceita" && o.valor === ativosB3[o.ativo]) {
      const contaOrdem = contas[usuarios[o.cpf].conta];
      if (o.tipo === "Compra" && contaOrdem.saldo >= o.total) {
        aplicarOrdemUsuario(o, contaOrdem);
        o.status = "Executada";
        extrato.unshift(o);
        atualizou = true;
      }
      if (o.tipo === "Venda" && contaOrdem.carteira[o.ativo] >= o.qtd) {
        aplicarOrdemUsuario(o, contaOrdem);
        o.status = "Executada";
        extrato.unshift(o);
        atualizou = true;
      }
    }
  });

  if (atualizou) {
    salvarUsuariosEContas();
    localStorage.setItem('extratoOperacoes', JSON.stringify(extrato));
  }

  atualizarBook();
  atualizarOrdens();
  atualizarCarteira();
  atualizarExtrato();
}, 10000);

document.addEventListener('DOMContentLoaded', function () {
  const cpfLogado = localStorage.getItem('usuarioLogado');
  if (cpfLogado && usuarios[cpfLogado]) {
    const contaId = usuarios[cpfLogado].conta;
    usuarioAtual = contas[contaId];
    document.getElementById('username').innerText = usuarios[cpfLogado].nome;
    document.getElementById('saldo').innerText = usuarioAtual.saldo.toFixed(2);
  } else if (document.getElementById('username')) {
    window.location.href = "login.html";
    return;
  }
  if (document.getElementById('ativo')) preencherSelectAtivos();
  if (document.getElementById('book')) atualizarBook();
});setInterval(() => {
     for (let ativo in ativosB3) {
       ativosB3[ativo] += 0.01;
       ativosB3[ativo] = parseFloat(ativosB3[ativo].toFixed(2));
     }

     let atualizou = false; // ← declare isso antes de usar

     ordens.forEach(o => {
       if (o.status === "Aceita" && o.valor === ativosB3[o.ativo]) {
         const contaOrdem = contas[usuarios[o.cpf].conta];
         if (o.tipo === "Compra" && contaOrdem.saldo >= o.total) {
           aplicarOrdemUsuario(o, contaOrdem);
           o.status = "Executada";
           extrato.unshift(o);
           atualizou = true;
         }
         if (o.tipo === "Venda" && contaOrdem.carteira[o.ativo] >= o.qtd) {
           aplicarOrdemUsuario(o, contaOrdem);
           o.status = "Executada";
           extrato.unshift(o);
           atualizou = true;
         }
       }
     });

     if (atualizou) {
       salvarUsuariosEContas();
       localStorage.setItem('extratoOperacoes', JSON.stringify(extrato));

       // 🔄 Atualiza carteira na tela se for o usuário logado
       const cpf = localStorage.getItem('usuarioLogado');
       if (usuarioAtual && usuarios[cpf] && contas[usuarios[cpf].conta] === usuarioAtual) {
         atualizarCarteira();
       }
     }

     atualizarBook();
     atualizarOrdens();
     atualizarExtrato();
   }, 10000);

function exibirToast(mensagem, tipo = "success") {
  const toastEl = document.getElementById("toastOrdem");
  const toastBody = toastEl.querySelector(".toast-body");

  // Atualiza mensagem e cor de fundo do Toast
  toastBody.innerText = mensagem;
  toastEl.className = `toast align-items-center text-bg-${tipo} border-0`;

  // Cria uma instância do Toast com o Bootstrap 5
  const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastEl);

  // Mostra o Toast
  toastBootstrap.show();
}