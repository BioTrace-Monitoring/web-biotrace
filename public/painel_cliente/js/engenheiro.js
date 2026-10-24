// Os equipamentos e as métricas estão escritos no HTML.
// Este arquivo controla somente os filtros e a exportação da visão geral.
var filtroStatus = "todos";
var filtroComponente = "status";
var nomesStatus = {
    normal: "Sem alertas", atencao: "Em atenção", limite: "Limite excedido",
    falha: "Falha de leitura", ocioso: "Abaixo do mínimo"
};

function mudarLote() {
    var lote = document.getElementById("selectLote").value;
    var paineis = document.querySelectorAll(".painel-lote");
    for (var i = 0; i < paineis.length; i++) {
        paineis[i].classList.toggle("oculto", paineis[i].id !== lote);
    }
    filtroStatus = "todos";
    filtroComponente = "status";
    document.getElementById("buscaEquipamento").value = "";
    document.getElementById("apenasAlertas").checked = false;
    filtrarEquipamentos();
}

function selecionarStatus(status) {
    filtroStatus = status;
    if (status === "normal") document.getElementById("apenasAlertas").checked = false;
    filtrarEquipamentos();
}

function selecionarComponente(componente) {
    filtroComponente = componente;
    filtroStatus = "todos";
    filtrarEquipamentos();
}

function filtrarEquipamentos() {
    var lote = document.getElementById("selectLote").value;
    var linhas = document.querySelectorAll("#" + lote + " .linha-equipamento");
    var busca = document.getElementById("buscaEquipamento").value.toLowerCase();
    var apenasAlertas = document.getElementById("apenasAlertas").checked;
    if (apenasAlertas && filtroStatus === "normal") filtroStatus = "todos";
    var contagem = { todos: linhas.length, normal: 0, atencao: 0, limite: 0, falha: 0, ocioso: 0 };
    var visiveis = 0;

    for (var i = 0; i < linhas.length; i++) {
        var linha = linhas[i];
        var status = "normal";
        var estados = ["falha", "limite", "atencao", "ocioso"];
        for (var j = 0; j < estados.length; j++) {
            if (linha.classList.contains(filtroComponente + "-" + estados[j])) status = estados[j];
        }
        contagem[status]++;
        var selo = linha.querySelector(".status");
        selo.textContent = nomesStatus[status];
        selo.className = "status " + status;
        linha.classList.remove("normal", "atencao", "limite", "falha", "ocioso");
        linha.classList.add(status);
        var esconder = !linha.textContent.toLowerCase().includes(busca)
            || (filtroStatus !== "todos" && filtroStatus !== status)
            || (apenasAlertas && status === "normal");
        linha.classList.toggle("oculto", esconder);
        if (!esconder) visiveis++;
    }

    var cards = document.querySelectorAll(".card-indicador");
    for (var i = 0; i < cards.length; i++) {
        var statusCard = cards[i].id.replace("indicador-", "");
        cards[i].querySelector("strong").textContent = contagem[statusCard];
        cards[i].classList.toggle("ativo", statusCard === filtroStatus);
    }
    var componentes = document.querySelectorAll(".filtro-componente");
    for (var i = 0; i < componentes.length; i++) {
        componentes[i].classList.toggle("ativo", componentes[i].id === "filtro-" + filtroComponente);
    }
    document.getElementById("resultadoBusca").textContent = visiveis + " de " + linhas.length + " equipamentos";
    document.getElementById("tabelaVazia").classList.toggle("oculto", visiveis > 0);
}

function exportarCSV() {
    var lote = document.getElementById("selectLote").value;
    var linhas = document.querySelectorAll("#" + lote + " .linha-equipamento");
    var csv = "\uFEFFEquipamento;Hospital;Componentes;Metricas habilitadas;Status\n";
    for (var i = 0; i < linhas.length; i++) {
        for (var j = 0; j < 5; j++) {
            csv += '"' + linhas[i].cells[j].textContent.trim().replaceAll('"', '""') + '"' + (j === 4 ? "\n" : ";");
        }
    }
    var link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    link.download = lote + ".csv";
    link.click();
    setTimeout(function () { URL.revokeObjectURL(link.href); }, 1000);
}

// Eventos ligados por class e id, sem atributos extras no HTML.
document.getElementById("selectLote").onchange = mudarLote;
document.getElementById("buscaEquipamento").oninput = filtrarEquipamentos;
document.getElementById("apenasAlertas").onchange = filtrarEquipamentos;
document.querySelector(".botao-exportar").onclick = exportarCSV;

var cards = document.querySelectorAll(".card-indicador");
for (var i = 0; i < cards.length; i++) {
    cards[i].onclick = function () { selecionarStatus(this.id.replace("indicador-", "")); };
}
var componentes = document.querySelectorAll(".filtro-componente");
for (var i = 0; i < componentes.length; i++) {
    componentes[i].onclick = function () { selecionarComponente(this.id.replace("filtro-", "")); };
}
// O link de retorno da dashboard mantém o lote que estava aberto.
var loteInicial = new URLSearchParams(window.location.search).get("lote");
var painelInicial = document.getElementById(loteInicial);
if (painelInicial && painelInicial.classList.contains("painel-lote")) {
    document.getElementById("selectLote").value = loteInicial;
}
mudarLote();
