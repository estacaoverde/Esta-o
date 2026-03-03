import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

// 🔥 COLOQUE SEUS DADOS DO FIREBASE AQUI
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_AUTH_DOMAIN",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_BUCKET",
  messagingSenderId: "SEU_ID",
  appId: "SEU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let caixaAberto = false;
let carrinho = [];
let total = 0;
let listaCache = [];

// ================= LOGIN =================
window.login = function () {
  if (usuario.value === "Nerys" && senha.value === "2020") {
    loginTela.classList.add("escondido");
    sistema.classList.remove("escondido");
    carregarProdutos();
    carregarHistorico();
  } else {
    alert("Login incorreto");
  }
};

// ================= CAIXA =================
window.abrirCaixa = () => {
  caixaAberto = true;
  statusCaixa.innerText = "CAIXA ABERTO";
  statusCaixa.className = "status aberto";
};

window.fecharCaixa = () => {
  caixaAberto = false;
  statusCaixa.innerText = "CAIXA FECHADO";
  statusCaixa.className = "status fechado";
};

window.mostrarTela = id => {
  document.querySelectorAll(".tela").forEach(t => t.classList.add("escondido"));
  document.getElementById(id).classList.remove("escondido");
};

// ================= PRODUTOS =================
function carregarProdutos() {
  onSnapshot(collection(db, "produtos"), snapshot => {
    listaProdutos.innerHTML = "";
    listaCache = [];

    snapshot.forEach(docu => {
      const p = docu.data();
      const id = docu.id;

      listaCache.push({ id, ...p });

      listaProdutos.innerHTML += `
      <div class="card">
        <b>${p.nome}</b><br>
        Preço: R$ ${p.preco}<br>
        Estoque: ${p.estoque}
        <br><br>

        <button onclick="editarProduto('${id}')">Editar</button>
        <button onclick="excluirProduto('${id}')">Excluir</button>
        <button onclick="adicionarEstoque('${id}')">+ Estoque</button>
        <button onclick="removerEstoque('${id}')">- Estoque</button>
      </div>`;
    });
  });
}

window.salvarProduto = async () => {
  await addDoc(collection(db, "produtos"), {
    nome: nomeProduto.value,
    preco: parseFloat(precoProduto.value),
    estoque: parseInt(estoqueProduto.value)
  });

  nomeProduto.value = "";
  precoProduto.value = "";
  estoqueProduto.value = "";
};

window.excluirProduto = async id => {
  await deleteDoc(doc(db, "produtos", id));
};

window.editarProduto = async id => {
  const p = listaCache.find(x => x.id === id);

  const novoNome = prompt("Novo nome:", p.nome);
  const novoPreco = prompt("Novo preço:", p.preco);
  const novoEstoque = prompt("Novo estoque:", p.estoque);

  await updateDoc(doc(db, "produtos", id), {
    nome: novoNome,
    preco: parseFloat(novoPreco),
    estoque: parseInt(novoEstoque)
  });
};

// ======== CONTROLE RÁPIDO DE ESTOQUE ========
window.adicionarEstoque = async id => {
  const produto = listaCache.find(p => p.id === id);
  const quantidade = parseInt(prompt("Quantidade para adicionar:"));

  if (!quantidade || quantidade <= 0) {
    alert("Quantidade inválida");
    return;
  }

  await updateDoc(doc(db, "produtos", id), {
    estoque: produto.estoque + quantidade
  });
};

window.removerEstoque = async id => {
  const produto = listaCache.find(p => p.id === id);
  const quantidade = parseInt(prompt("Quantidade para remover:"));

  if (!quantidade || quantidade <= 0) {
    alert("Quantidade inválida");
    return;
  }

  if (produto.estoque - quantidade < 0) {
    alert("Estoque não pode ficar negativo!");
    return;
  }

  await updateDoc(doc(db, "produtos", id), {
    estoque: produto.estoque - quantidade
  });
};

// ================= VENDAS =================
window.buscarProduto = () => {
  resultadoBusca.innerHTML = "";
  const texto = buscar.value.toLowerCase();

  listaCache.forEach(p => {
    if (p.nome.toLowerCase().includes(texto) && p.estoque > 0) {
      resultadoBusca.innerHTML += `
      <div class="card">
        ${p.nome} - R$ ${p.preco}
        <button onclick="adicionarCarrinho('${p.id}')">Adicionar</button>
      </div>`;
    }
  });
};

window.adicionarCarrinho = id => {
  const p = listaCache.find(x => x.id === id);
  carrinho.push(p);
  total += p.preco;
  atualizarCarrinho();
};

function atualizarCarrinho() {
  carrinhoDiv.innerHTML = "";
  carrinho.forEach(p => {
    carrinhoDiv.innerHTML += `<div>${p.nome} - R$ ${p.preco}</div>`;
  });
  document.getElementById("total").innerText = total.toFixed(2);
}

window.finalizarVenda = async () => {
  if (!caixaAberto) {
    alert("Abra o caixa!");
    return;
  }

  if (carrinho.length === 0) {
    alert("Carrinho vazio!");
    return;
  }

  const cliente = nomeCliente.value || "Não informado";
  const pagamento = formaPagamento.value;

  for (let item of carrinho) {
    await updateDoc(doc(db, "produtos", item.id), {
      estoque: item.estoque - 1
    });
  }

  await addDoc(collection(db, "vendas"), {
    carrinho,
    total,
    cliente,
    pagamento,
    data: new Date().toLocaleString()
  });

  carrinho = [];
  total = 0;
  nomeCliente.value = "";
  atualizarCarrinho();

  alert("Venda finalizada!");
};

// ================= HISTÓRICO =================
function carregarHistorico() {
  onSnapshot(collection(db, "vendas"), snapshot => {
    listaHistorico.innerHTML = "";
    snapshot.forEach(docu => {
      const v = docu.data();
      listaHistorico.innerHTML += `
      <div class="card">
        ${v.data}<br>
        Cliente: ${v.cliente}<br>
        Pagamento: ${v.pagamento}<br>
        Total: R$ ${v.total}
      </div>`;
    });
  });
}

// ================= PDF DIÁRIO =================
window.gerarPDF = async () => {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  const img = new Image();
  img.src = "logo.png";
  await new Promise(r => img.onload = r);

  pdf.addImage(img, "PNG", 55, 5, 100, 30);

  const snapshot = await getDocs(collection(db, "vendas"));
  let y = 45;
  let totalDia = 0;
  const hoje = new Date().toLocaleDateString();

  snapshot.forEach(docu => {
    const v = docu.data();
    if (v.data.includes(hoje)) {
      pdf.text(`${v.data} - R$ ${v.total}`, 20, y);
      y += 8;
      totalDia += v.total;
    }
  });

  pdf.text(`TOTAL DO DIA: R$ ${totalDia.toFixed(2)}`, 20, y + 10);
  pdf.save("Relatorio_Dia.pdf");
};

// ================= PDF MENSAL =================
window.gerarRelatorioMensal = async () => {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  const snapshot = await getDocs(collection(db, "vendas"));
  let totalMes = 0;
  let y = 20;

  const mes = new Date().getMonth();
  const ano = new Date().getFullYear();

  snapshot.forEach(docu => {
    const v = docu.data();
    const data = new Date(v.data);

    if (data.getMonth() === mes && data.getFullYear() === ano) {
      pdf.text(`${v.data} - R$ ${v.total}`, 20, y);
      y += 8;
      totalMes += v.total;
    }
  });

  pdf.text(`TOTAL DO MÊS: R$ ${totalMes.toFixed(2)}`, 20, y + 10);
  pdf.save("Relatorio_Mensal.pdf");
};
