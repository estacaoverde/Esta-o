let carrinho = [];
let caixaAberto = false;

function mostrar(tela) {
  document.querySelectorAll(".tela").forEach(div => div.style.display = "none");
  document.getElementById(tela).style.display = "block";
}

function abrirCaixa() {
  caixaAberto = true;
  statusCaixa.innerText = "CAIXA ABERTO";
  statusCaixa.className = "status aberto";
}

function fecharCaixa() {
  caixaAberto = false;
  statusCaixa.innerText = "CAIXA FECHADO";
  statusCaixa.className = "status fechado";
}

async function salvarProduto() {
  const { collection, addDoc, getDocs, updateDoc, doc } = window.firebase;
  const db = window.db;

  const nome = nomeProduto.value.trim();
  const preco = parseFloat(precoProduto.value);
  const estoque = parseInt(estoqueProduto.value);

  if (!nome || !preco || !estoque) return alert("Preencha tudo");

  const snapshot = await getDocs(collection(db, "produtos"));
  let existente = null;

  snapshot.forEach(p => {
    if (p.data().nome.toLowerCase() === nome.toLowerCase()) {
      existente = { id: p.id, ...p.data() };
    }
  });

  if (existente) {
    await updateDoc(doc(db, "produtos", existente.id), {
      estoque: existente.estoque + estoque,
      preco
    });
  } else {
    await addDoc(collection(db, "produtos"), { nome, preco, estoque });
  }

  listarProdutos();
  nomeProduto.value = "";
  precoProduto.value = "";
  estoqueProduto.value = "";
}

async function listarProdutos() {
  const { collection, getDocs } = window.firebase;
  const db = window.db;

  const snapshot = await getDocs(collection(db, "produtos"));
  listaProdutos.innerHTML = "";

  snapshot.forEach(p => {
    const data = p.data();
    listaProdutos.innerHTML += `
      <div class="card">
        <b>${data.nome}</b><br>
        Preço: R$ ${data.preco}<br>
        Estoque: ${data.estoque}
      </div>
    `;
  });
}

async function buscarProduto() {
  const { collection, getDocs } = window.firebase;
  const db = window.db;

  const texto = buscar.value.toLowerCase();
  const snapshot = await getDocs(collection(db, "produtos"));
  resultadoBusca.innerHTML = "";

  snapshot.forEach(p => {
    const data = p.data();
    if (data.nome.toLowerCase().includes(texto)) {
      resultadoBusca.innerHTML += `
        <div class="card" onclick="adicionarCarrinho('${data.nome}', ${data.preco})">
          ${data.nome} - R$ ${data.preco}
        </div>
      `;
    }
  });
}

function adicionarCarrinho(nome, preco) {
  carrinho.push({ nome, preco });
  atualizarTotal();
}

function atualizarTotal() {
  let total = carrinho.reduce((soma, item) => soma + item.preco, 0);
  totalVenda.innerText = total;
}

async function finalizarVenda() {
  if (!caixaAberto) return alert("Abra o caixa primeiro!");

  const { collection, addDoc } = window.firebase;
  const db = window.db;

  let total = carrinho.reduce((soma, item) => soma + item.preco, 0);

  await addDoc(collection(db, "vendas"), {
    itens: carrinho,
    total,
    data: new Date()
  });

  carrinho = [];
  atualizarTotal();
  listarHistorico();
  alert("Venda finalizada!");
}

async function listarHistorico() {
  const { collection, getDocs } = window.firebase;
  const db = window.db;

  const snapshot = await getDocs(collection(db, "vendas"));
  listaHistorico.innerHTML = "";
  let totalDia = 0;

  snapshot.forEach(v => {
    const data = v.data();
    totalDia += data.total;
    listaHistorico.innerHTML += `
      <div class="card">
        Total: R$ ${data.total}<br>
        Data: ${new Date(data.data.seconds * 1000).toLocaleString()}
      </div>
    `;
  });

  totalDiaSpan = document.getElementById("totalDia");
  totalDiaSpan.innerText = totalDia;
}

listarProdutos();
listarHistorico();
