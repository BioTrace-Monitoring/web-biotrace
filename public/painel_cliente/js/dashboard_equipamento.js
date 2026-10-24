// Leituras fixas usadas apenas para desenhar os gráficos de demonstração.
var leiturasMock = {
    "62%": [55, 58, 60, 57, 61, 62],
    "91%": [65, 70, 75, 80, 85, 91],
    "84%": [72, 75, 78, 80, 82, 84],
    "3%": [8, 6, 5, 4, 3, 3],
    "58 °C": [54, 55, 57, 56, 58, 58],
    "55%": [50, 52, 51, 54, 53, 55],
    "3,6 GB": [4.1, 4, 3.8, 3.9, 3.7, 3.6],
    "42%": [38, 39, 40, 41, 41, 42],
    "93%": [80, 84, 88, 90, 92, 93],
    "148,48 GB": [152, 151, 150, 149.5, 149, 148.48],
    "17,92 GB": [51.2, 40.96, 30.72, 25.6, 20.48, 17.92],
    "1.450.000 bytes": [1100000, 1200000, 1250000, 1300000, 1400000, 1450000],
    "3.820.000 bytes": [3520000, 3600000, 3650000, 3700000, 3780000, 3820000],
    "Sem leitura": [3520000, 3600000, 3650000, null, null, null],
    "0 erros": [0, 0, 0, 0, 0, 0],
    "Desabilitada": [0, 0, 0, 0, 0, 0],
    "72 horas": [67, 68, 69, 70, 71, 72],
    "128 processos": [121, 125, 122, 126, 124, 128]
};
var unidadesMetricas = {
    "Uso de CPU": "%", "CPU por núcleo": "%", "Temperatura da CPU": "°C",
    "Uso de memória": "%", "Memória disponível": "GB", "Uso de disco": "%", "Espaço livre": "GB",
    "Dados enviados": "bytes", "Dados recebidos": "bytes", "Erros de entrada": "erros", "Erros de saída": "erros",
    "Tempo de atividade": "horas", "Processos ativos": "processos"
};

var graficos = [];
var equipamentoAtual;

function mudarEquipamento() {
    var serie = document.getElementById("selectEquipamento").value;
    var equipamentos = document.querySelectorAll(".dados-equipamento");
    for (var i = 0; i < equipamentos.length; i++) {
        equipamentos[i].classList.toggle("oculto", equipamentos[i].id !== "dados-" + serie);
    }
    for (var i = 0; i < graficos.length; i++) {
        if (graficos[i]) graficos[i].destroy();
    }
    graficos = [];
    equipamentoAtual = document.getElementById("dados-" + serie);
    document.getElementById("nomeEquipamento").textContent = "Equipamento " + serie;
    document.title = serie + " | BioTrace";

    var modeloLote = equipamentoAtual.querySelector(".resumo-equipamento strong").textContent;
    var lote = modeloLote.split("·")[1].trim().replace("LT-2026-", "lote-");
    document.getElementById("voltarDashboard").href = "dash_engenheiro.html?lote=" + lote;
    document.getElementById("abrirOutraAba").href = "dashboard_equipamento.html?serie=" + serie;
    // Mantém o equipamento no endereço para recarregar ou abrir em outra aba.
    history.replaceState(null, "", "?serie=" + serie);
    atualizarGraficos();
}

function atualizarGraficos() {
    var linhas = equipamentoAtual.querySelectorAll(".tabela-metricas tbody tr");
    var cards = document.querySelectorAll(".grafico-metrica");
    var opcoes = document.querySelectorAll(".opcoes-graficos input");
    var total = 0;

    for (var i = 0; i < cards.length; i++) {
        var exibir = opcoes[i].checked;
        var valor = linhas[i].cells[2].textContent.trim();
        var desabilitada = valor === "Desabilitada";
        cards[i].classList.toggle("oculto", !exibir);
        cards[i].classList.toggle("desabilitada", desabilitada);
        opcoes[i].parentElement.classList.toggle("selecionada", exibir);
        cards[i].querySelector(".valor-metrica").textContent = valor;
        cards[i].querySelector(".valor-metrica").className = "valor-metrica " + linhas[i].cells[2].className;
        cards[i].querySelector(".limite-metrica").textContent = desabilitada
            ? "Métrica desabilitada para este equipamento."
            : linhas[i].cells[3].textContent;

        if (exibir) total++;
        if (!exibir && graficos[i]) {
            graficos[i].destroy();
            graficos[i] = null;
        }
        if (exibir && !desabilitada && !graficos[i] && typeof Chart !== "undefined") {
            graficos[i] = desenharGrafico(linhas[i], cards[i].querySelector("canvas"));
        }
    }
    document.getElementById("totalGraficos").textContent = total + (total === 1 ? " métrica em exibição" : " métricas em exibição");
    document.getElementById("nenhumGrafico").classList.toggle("oculto", total > 0);
}

function desenharGrafico(linha, canvas) {
    var nome = linha.cells[1].textContent.trim();
    var valorAtual = linha.cells[2].textContent.trim();
    var nucleos = nome === "CPU por núcleo";
    var valores = leiturasMock[valorAtual];
    var unidade = unidadesMetricas[nome];
    var horarios = ["10:00", "10:05", "10:10", "10:15", "10:20", "10:25"];
    if (nucleos) {
        var partes = valorAtual.replaceAll("%", "").split(",");
        valores = [];
        horarios = [];
        for (var i = 0; i < partes.length; i++) {
            valores.push(Number(partes[i]));
            horarios.push("Núcleo " + (i + 1));
        }
    }
    var series = [{ label: unidade, data: valores, borderColor: "#6d3fc0", backgroundColor: "#f0eafa", borderWidth: 2, tension: 0.3, spanGaps: false }];
    var textoLimites = linha.cells[3].textContent;
    if (textoLimites !== "Sem limites") {
        var limites = textoLimites.replace("Mín. ", "").replace("Máx. ", "").replaceAll("%", "").split(" · ");
        for (var i = 0; i < limites.length; i++) {
            var pontos = [];
            for (var j = 0; j < valores.length; j++) pontos.push(Number(limites[i]));
            series.push({ label: i === 0 ? "Mínimo" : "Máximo", data: pontos, borderColor: i === 0 ? "#3b82f6" : "#ef4444", borderDash: [4, 4], pointRadius: 0 });
        }
    }
    return new Chart(canvas, {
        type: nucleos ? "bar" : "line",
        data: { labels: horarios, datasets: series },
        options: {
            responsive: true, maintainAspectRatio: false,
            animation: { duration: 300 },
            scales: { y: { min: 0, max: unidade === "%" ? 100 : undefined } },
            plugins: { legend: { labels: { boxWidth: 12 } } }
        }
    });
}

document.getElementById("selectEquipamento").onchange = mudarEquipamento;
var opcoes = document.querySelectorAll(".opcoes-graficos input");
for (var i = 0; i < opcoes.length; i++) opcoes[i].onchange = atualizarGraficos;

var serieInicial = new URLSearchParams(window.location.search).get("serie");
if (document.getElementById("dados-" + serieInicial)) {
    document.getElementById("selectEquipamento").value = serieInicial;
}
mudarEquipamento();
