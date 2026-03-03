let vendaAtual = [];
let total = 0;
let caixaAberto = false;
let totalDia = 0;

// LOGIN
function login(){
if(document.getElementById("senha").value === "2020"){
document.getElementById("login").style.display="none";
document.getElementById("sistema").style.display="block";
carregarProdutos();
carregarHistorico();
}else{
alert("Senha incorreta");
}
}

function mostrar(tela){
document.querySelectorAll(".tela").forEach(t=>t.style.display="none");
document.getElementById(tela).style.display="block";
}

// CAIXA
function abrirCaixa(){
caixaAberto = true;
alert("Caixa aberto!");
}

function fecharCaixa(){
if(!caixaAberto) return alert("Caixa já está fechado!");
caixaAberto = false;
alert("Caixa fechado!\nTotal vendido hoje: R$ "+totalDia.toFixed(2));
gerarPDF();
}

// PRODUTOS
async function salvarProduto(){
const nome = nomeProduto.value;
const preco = parseFloat(precoProduto.value);
const estoque = parseInt(estoqueProduto.value);

await firebase.addDoc(firebase.collection(db,"produtos"),{
nome,preco,estoque
});

nomeProduto.value="";
precoProduto.value="";
estoqueProduto.value="";
carregarProdutos();
}

async function carregarProdutos(){
listaProdutos.innerHTML="";
const querySnapshot = await firebase.getDocs(firebase.collection(db,"produtos"));
querySnapshot.forEach((docu)=>{
let p = docu.data();
listaProdutos.innerHTML+=`
<div class="card">
<b>${p.nome}</b><br>
Preço: R$ ${p.preco}<br>
Estoque: ${p.estoque}
</div>`;
});
}

// VENDAS
async function buscarProduto(){
resultadoBusca.innerHTML="";
const querySnapshot = await firebase.getDocs(firebase.collection(db,"produtos"));

querySnapshot.forEach((docu)=>{
let p = docu.data();
if(p.nome.toLowerCase().includes(buscar.value.toLowerCase())){
resultadoBusca.innerHTML+=`
<div class="card">
${p.nome} - R$ ${p.preco}
<button onclick="addVenda('${docu.id}','${p.nome}',${p.preco},${p.estoque})">Adicionar</button>
</div>`;
}
});
}

async function addVenda(id,nome,preco,estoque){

if(!caixaAberto) return alert("Abra o caixa primeiro!");
if(estoque <= 0) return alert("Sem estoque!");

vendaAtual.push({nome,preco,id});
total+=preco;
document.getElementById("total").innerText=total.toFixed(2);

await firebase.updateDoc(firebase.doc(db,"produtos",id),{
estoque: estoque - 1
});

carregarProdutos();
}

async function finalizarVenda(){

if(!caixaAberto) return alert("Abra o caixa primeiro!");

let data=new Date();

await firebase.addDoc(firebase.collection(db,"vendas"),{
itens:vendaAtual,
total:total,
data:data.toLocaleDateString(),
hora:data.toLocaleTimeString()
});

vendaAtual=[];
total=0;
document.getElementById("total").innerText="0.00";
carregarHistorico();
}

// HISTÓRICO
async function carregarHistorico(){
listaHistorico.innerHTML="";
totalDia = 0;

const hoje = new Date().toLocaleDateString();
const querySnapshot = await firebase.getDocs(firebase.collection(db,"vendas"));

querySnapshot.forEach((docu)=>{
let v=docu.data();
if(v.data === hoje){
totalDia += v.total;
}

listaHistorico.innerHTML+=`
<div class="card">
${v.data} ${v.hora}<br>
Total: R$ ${v.total}
</div>`;
});
}

// PDF
function gerarPDF(){
const { jsPDF } = window.jspdf;
const doc = new jsPDF();
doc.text("Fechamento de Caixa - Estação Verde",10,10);
doc.text("Data: "+new Date().toLocaleDateString(),10,20);
doc.text("Total do dia: R$ "+totalDia.toFixed(2),10,30);
doc.save("fechamento-caixa.pdf");
}
