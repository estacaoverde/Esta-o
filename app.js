let caixaAberto = false;
let carrinho = [];
let total = 0;

function login() {
  if (usuario.value === "Nerys" && senha.value === "2020") {
    loginTela.classList.add("escondido");
    sistema.classList.remove("escondido");
    carregarProdutos();
    carregarHistorico();
  } else {
    alert("Usuário ou senha incorretos!");
  }
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

function mostrarTela(id) {
  document.querySelectorAll(".tela").forEach(t => t.classList.add("escondido"));
  document.getElementById(id).classList.remove("escondido");
}

// ==========================
// PRODUTOS
// ==========================

async function salvarProduto() {
  const { collection, addDoc } = firebaseTools;

  await addDoc(collection(db, "produtos"), {
    nome: nomeProduto.value,
    preco: parseFloat(precoProduto.value),
    estoque: parseInt(estoqueProduto.value)
  });

  nomeProduto.value = "";
  precoProduto.value = "";
  estoqueProduto.value = "";

  carregarProdutos();
}

async function carregarProdutos() {
  const { collection, getDocs, deleteDoc, doc, updateDoc } = firebaseTools;

  listaProdutos.innerHTML = "";
  const snapshot = await getDocs(collection(db, "produtos"));

  snapshot.forEach(documento => {
    const p = documento.data();
    const id = documento.id;

    listaProdutos.innerHTML += `
    <div class="card">
      <b>${p.nome}</b> - R$ ${p.preco} - Estoque: ${p.estoque}
      <br>
      <button onclick="editarProduto('${id}','${p.nome}',${p.preco},${p.estoque})">Editar</button>
      <button onclick="excluirProduto('${id}')">Excluir</button>
    </div>`;
  });
}

async function excluirProduto(id) {
  const { deleteDoc, doc } = firebaseTools;
  await deleteDoc(doc(db, "produtos", id));
  carregarProdutos();
}

async function editarProduto(id, nomeAtual, precoAtual, estoqueAtual) {
  const novoNome = prompt("Novo nome:", nomeAtual);
  const novoPreco = prompt("Novo preço:", precoAtual);
  const novoEstoque = prompt("Novo estoque:", estoqueAtual);

  const { updateDoc, doc } = firebaseTools;

  await updateDoc(doc(db, "produtos", id), {
    nome: novoNome,
    preco: parseFloat(novoPreco),
    estoque: parseInt(novoEstoque)
  });

  carregarProdutos();
}

// ==========================
// VENDAS
// ==========================

async function buscarProduto() {
  const { collection, getDocs } = firebaseTools;

  resultadoBusca.innerHTML = "";
  const busca = buscar.value.toLowerCase();
  const snapshot = await getDocs(collection(db, "produtos"));

  snapshot.forEach(documento => {
    const p = documento.data();
    const id = documento.id;

    if (p.nome.toLowerCase().includes(busca) && p.estoque > 0) {
      resultadoBusca.innerHTML += `
      <div class="card">
        ${p.nome} - R$ ${p.preco} - Estoque: ${p.estoque}
        <button onclick="adicionarCarrinho('${id}','${p.nome}',${p.preco},${p.estoque})">Adicionar</button>
      </div>`;
    }
  });
}

function adicionarCarrinho(id, nome, preco, estoque) {
  if (estoque <= 0) {
    alert("Sem estoque!");
    return;
  }

  carrinho.push({ id, nome, preco });
  total += preco;
  atualizarCarrinho();
}

function atualizarCarrinho() {
  carrinhoDiv.innerHTML = "";
  carrinho.forEach(p => {
    carrinhoDiv.innerHTML += `<div>${p.nome} - R$ ${p.preco}</div>`;
  });
  total.innerText = total.toFixed(2);
}

async function finalizarVenda() {
  if (!caixaAberto) {
    alert("Abra o caixa primeiro!");
    return;
  }

  const { collection, addDoc, updateDoc, doc, getDoc } = firebaseTools;

  // Descontar estoque
  for (let item of carrinho) {
    const produtoRef = doc(db, "produtos", item.id);
    const produtoSnap = await firebaseTools.getDocs(collection(db,"produtos"));
    
    await updateDoc(produtoRef, {
      estoque: firebase.firestore.FieldValue.increment(-1)
    });
  }

  await addDoc(collection(db, "vendas"), {
    carrinho,
    total,
    data: new Date().toLocaleString()
  });

  carrinho = [];
  total = 0;
  atualizarCarrinho();
  carregarProdutos();
  carregarHistorico();
  alert("Venda finalizada!");
}

// ==========================
// HISTÓRICO
// ==========================

async function carregarHistorico() {
  const { collection, getDocs } = firebaseTools;

  listaHistorico.innerHTML = "";
  let totalDia = 0;

  const hoje = new Date().toLocaleDateString();
  const snapshot = await getDocs(collection(db, "vendas"));

  snapshot.forEach(doc => {
    const v = doc.data();
    if (v.data.includes(hoje)) {
      totalDia += v.total;
    }

    listaHistorico.innerHTML += `
    <div class="card">
      ${v.data} <br>
      Total: R$ ${v.total}
    </div>`;
  });

  listaHistorico.innerHTML += `
  <div class="card" style="background:#d4f5d4">
    <b>Total vendido hoje: R$ ${totalDia.toFixed(2)}</b>
  </div>`;
    }
