// Clima do local de instalação de cada hospital do cenário demonstrativo.
var dadosClima = {};
var assinaturaHospitaisClima = "";
var estadoClima = "carregando";
var mensagemClima = "Consultando o histórico meteorológico…";
var cacheClima = {};
var requisicaoClima = null;
var consultaClima = 0;
var graficosContexto = {};
var principalContexto = null;
// Limiar demonstrativo de espaço livre, em percentual.
var limiteEspacoLivre = 20;

function mediaContexto(valores) {
    var validos = valores.filter(function (valor) { return Number.isFinite(valor); });
    return validos.length ? validos.reduce(function (soma, valor) { return soma + valor; }, 0) / validos.length : null;
}

function formatarDataContexto(instante, hora) {
    return new Date(instante).toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit",
        hour: hora ? "2-digit" : undefined, minute: hora ? "2-digit" : undefined
    });
}

function atualizarAnalisesComplementares(principal) {
    principalContexto = principal;
    if (!principal) {
        consultaClima++;
        if (requisicaoClima) requisicaoClima.abort();
        dadosClima = {};
        assinaturaHospitaisClima = "";
        return;
    }
    document.getElementById("escopoComplementar").textContent = lotesPreditivos[principal.indice].numero + " · "
        + modelosPreditivos[document.getElementById("filtroModelo").value].nome + " · " + principal.unidades.length
        + " unidades. Os gráficos abaixo aprofundam este lote.";
    if (!document.getElementById("painelRecursos").hidden) atualizarRecursosContexto();
    var hospitais = obterHospitaisContexto();
    document.getElementById("hospitaisClima").textContent = "Locais de instalação (demonstrativos) · " + hospitais.map(function (id) {
        var hospital = hospitaisPreditivos[id];
        return hospital.nome + " — " + hospital.cidade;
    }).join(" · ");
    var assinatura = hospitais.join(",");
    if (assinatura !== assinaturaHospitaisClima) carregarClimaContexto(false);
    else atualizarClimaContexto();
}

function obterHospitaisContexto() {
    return Array.from(new Set(unidadesPreditivas.map(function (u) { return u.fk_hospital; }))).sort();
}

function mostrarAbaContexto(recursos, focar) {
    document.getElementById("painelAmbiente").hidden = recursos;
    document.getElementById("painelRecursos").hidden = !recursos;
    var abas = [document.getElementById("abaAmbiente"), document.getElementById("abaRecursos")];
    for (var i = 0; i < abas.length; i++) {
        var ativa = recursos === (i === 1);
        abas[i].classList.toggle("ativa", ativa);
        abas[i].setAttribute("aria-selected", String(ativa));
        abas[i].tabIndex = ativa ? 0 : -1;
    }
    if (recursos) atualizarRecursosContexto();
    else atualizarClimaContexto();
    if (focar) abas[recursos ? 1 : 0].focus();
}

function mensagemGraficoContexto(id, vazioId, mensagem) {
    if (graficosContexto[id]) {
        graficosContexto[id].destroy();
        delete graficosContexto[id];
    }
    document.getElementById(id).hidden = Boolean(mensagem);
    document.getElementById(vazioId).hidden = !mensagem;
    document.getElementById(vazioId).textContent = mensagem || "";
}

function criarGraficoContexto(id, vazioId, configuracao, mensagem) {
    if (typeof Chart === "undefined") mensagem = "Não foi possível carregar os gráficos. Os indicadores e resumos continuam disponíveis.";
    mensagemGraficoContexto(id, vazioId, mensagem);
    if (!mensagem) graficosContexto[id] = new Chart(document.getElementById(id), configuracao);
}

function opcoesContexto(tituloX, tituloY, unidadeX, unidadeY) {
    return {
        responsive: true, maintainAspectRatio: false, animation: false,
        plugins: {
            legend: { display: false },
            tooltip: { filter: function (item) { return !item.dataset.semTooltip; }, callbacks: {
                label: function (item) {
                    return formatarPreditivo(item.parsed.x, 1) + " " + unidadeX + " · " + formatarPreditivo(item.parsed.y, 1) + " " + unidadeY;
                }
            } }
        },
        scales: {
            x: { type: "linear", title: { display: true, text: tituloX, font: { size: 10 } }, grid: { color: "#eeebf3" }, ticks: { maxTicksLimit: 6, font: { size: 10 } } },
            y: { title: { display: true, text: tituloY, font: { size: 10 } }, grid: { color: "#eeebf3" }, ticks: { maxTicksLimit: 6, font: { size: 10 } } }
        }
    };
}

function graficoDispersaoContexto(id, vazioId, pontos, tituloX, tituloY, unidadeX, unidadeY, cor) {
    var ajuste = calcularRegressao(pontos);
    var datasets = [{ label: "Medições", data: pontos, backgroundColor: cor, pointRadius: 4, pointHoverRadius: 6 }];
    if (ajuste) {
        var inicio = Math.min.apply(null, pontos.map(function (ponto) { return ponto.x; }));
        var fim = Math.max.apply(null, pontos.map(function (ponto) { return ponto.x; }));
        datasets.push({ label: "Regressão", data: criarReta(ajuste, inicio, fim), borderColor: cor, borderWidth: 1.8, borderDash: [4, 4], showLine: true, pointRadius: 0, semTooltip: true });
    }
    var opcoes = opcoesContexto(tituloX, tituloY, unidadeX, unidadeY);
    // Estes recursos são não negativos; os percentuais usam a mesma escala.
    if (unidadeY === "%") { opcoes.scales.y.min = 0; opcoes.scales.y.max = 100; }
    if (unidadeY === "GB") opcoes.scales.y.min = 0;
    criarGraficoContexto(id, vazioId, { type: "scatter", data: { datasets: datasets }, options: opcoes }, pontos.length < 3 ? "São necessários pelo menos três horários válidos para comparar este recorte." : "");
    return ajuste;
}

function agruparRecursoContexto(leituras, campo) {
    var grupos = {};
    for (var i = 0; i < leituras.length; i++) {
        var leitura = leituras[i];
        if (!Number.isFinite(leitura[campo])) continue;
        if (!grupos[leitura.uptime_horas]) grupos[leitura.uptime_horas] = [];
        grupos[leitura.uptime_horas].push(leitura[campo]);
    }
    return Object.keys(grupos).map(function (uptime) { return { x: Number(uptime), y: mediaContexto(grupos[uptime]) }; }).sort(function (a, b) { return a.x - b.x; });
}

// Contadores acumulados não podem ser tratados como eventos de cada leitura.
function calcularTaxasRede(leituras) {
    var anteriores = {};
    var horarios = {};
    var ordenadas = leituras.slice().sort(function (a, b) { return new Date(a.data_hora_br) - new Date(b.data_hora_br); });
    for (var i = 0; i < ordenadas.length; i++) {
        var atual = ordenadas[i];
        var anterior = anteriores[atual.numero_serie];
        anteriores[atual.numero_serie] = atual;
        if (!anterior) continue;
        var horas = (new Date(atual.data_hora_br) - new Date(anterior.data_hora_br)) / 3600000;
        var entrada = atual.rede_erros_entrada - anterior.rede_erros_entrada;
        var saida = atual.rede_erros_saida - anterior.rede_erros_saida;
        var contadores = [atual.rede_erros_entrada, anterior.rede_erros_entrada, atual.rede_erros_saida, anterior.rede_erros_saida];
        if (!contadores.every(Number.isFinite) || !Number.isFinite(atual.uptime_horas) || !Number.isFinite(anterior.uptime_horas) || horas <= 0 || entrada < 0 || saida < 0 || atual.uptime_horas <= anterior.uptime_horas) continue;
        var instante = new Date(atual.data_hora_br).getTime();
        if (!horarios[instante]) horarios[instante] = [];
        horarios[instante].push((entrada + saida) / horas);
    }
    return Object.keys(horarios).map(function (instante) { return { x: Number(instante), y: mediaContexto(horarios[instante]) }; }).sort(function (a, b) { return a.x - b.x; });
}

function atualizarCardArmazenamento(unidades) {
    var validas = unidades.filter(function (unidade) {
        return Number.isFinite(unidade.disco_percent) && unidade.disco_percent >= 0 && unidade.disco_percent <= 100;
    });
    validas.sort(function (a, b) { return b.disco_percent - a.disco_percent; });
    var menorFolga = validas[0];
    var abaixoDoLimite = validas.filter(function (unidade) {
        return 100 - unidade.disco_percent < limiteEspacoLivre;
    }).length;
    document.getElementById("armazenamentoPercentual").textContent = menorFolga ? formatarPreditivo(100 - menorFolga.disco_percent, 1) + "%" : "—";
    var detalhe = "Sem leitura válida de percentual de uso do disco.";
    if (menorFolga) {
        detalhe = menorFolga.numero_serie;
        if (Number.isFinite(menorFolga.disco_livre_gb)) detalhe += " · " + formatarPreditivo(menorFolga.disco_livre_gb, 1) + " GB livres";
    }
    document.getElementById("armazenamentoUnidade").textContent = detalhe;
    document.getElementById("armazenamentoAlertas").textContent = validas.length ? abaixoDoLimite : "—";
    document.getElementById("armazenamentoLimite").textContent = "Unidades com menos de " + formatarPreditivo(limiteEspacoLivre, 0) + "% livre";
    document.getElementById("armazenamentoCobertura").textContent = validas.length + " de " + unidades.length + " unidades alocadas com leitura válida · última coleta de cada unidade.";
    document.getElementById("armazenamentoAlertas").classList.toggle("valor-alerta", abaixoDoLimite > 0);
}

function atualizarRecursosContexto() {
    if (!principalContexto) return;
    var leituras = principalContexto.leituras;
    var ultimas = principalContexto.unidades;
    document.getElementById("recursoRam").textContent = formatarPreditivo(Math.max.apply(null, ultimas.map(function (u) { return u.memoria_percent; })), 1) + "%";
    document.getElementById("recursoDisco").textContent = formatarPreditivo(Math.min.apply(null, ultimas.map(function (u) { return u.disco_livre_gb; })), 1) + " GB";
    document.getElementById("recursoCpu").textContent = formatarPreditivo(mediaContexto(ultimas.map(function (u) { return u.cpu_percent; })), 1) + "%";
    var ram = graficoDispersaoContexto("graficoRamUptime", "vazioRamUptime", agruparRecursoContexto(leituras, "memoria_percent"), "Uptime contínuo (h)", "Uso de RAM (%)", "h", "%", "#6d3fc0");
    atualizarCardArmazenamento(ultimas);
    var processos = graficoDispersaoContexto("graficoProcessosCpu", "vazioProcessosCpu", leituras.map(function (l) { return { x: l.processos_ativos, y: l.cpu_percent }; }), "Processos ativos", "Uso da CPU (%)", "processos", "%", "#bc7a2e");
    document.getElementById("insightRam").textContent = ram ? "Tendência: " + (ram.inclinacao >= 0 ? "+" : "") + formatarPreditivo(ram.inclinacao, 3) + " pontos percentuais/h · R² " + formatarPreditivo(ram.r2, 2) + ". Médias por faixa de uptime do lote." : "Dados insuficientes para ajustar a tendência de RAM.";
    document.getElementById("insightProcessos").textContent = processos && processos.pearson !== null ? "Pearson r = " + formatarPreditivo(processos.pearson, 2) + " · R² " + formatarPreditivo(processos.r2, 2) + " · " + leituras.length + " leituras individuais. Associação no cenário demonstrativo." : "Sem variação suficiente para calcular a associação.";
    var taxas = calcularTaxasRede(leituras);
    document.getElementById("recursoRede").textContent = taxas.length ? formatarPreditivo(mediaContexto(taxas.map(function (t) { return t.y; })), 2) : "—";
    var opcoes = opcoesContexto("Horário (Brasília)", "Novos erros / hora / unidade", "", "erros/h");
    opcoes.scales.x.ticks.callback = function (valor) { return formatarDataContexto(valor, false); };
    opcoes.scales.y.min = 0;
    opcoes.plugins.tooltip.callbacks.label = function (item) { return formatarDataContexto(item.parsed.x, true) + " · " + formatarPreditivo(item.parsed.y, 2) + " erros/h/unidade"; };
    criarGraficoContexto("graficoErrosRede", "vazioErrosRede", { type: "line", data: { datasets: [{ label: "Erros por hora", data: taxas, borderColor: "#dc535e", backgroundColor: "#dc535e", borderWidth: 2, pointRadius: 3, tension: 0 }] }, options: opcoes }, taxas.length ? "" : "Sem intervalos válidos para calcular a taxa de erros.");
    document.getElementById("insightRede").textContent = taxas.length ? "Pico médio do lote: " + formatarPreditivo(Math.max.apply(null, taxas.map(function (t) { return t.y; })), 2) + " erros/h por unidade · " + taxas.length + " intervalos comparáveis. Investigue aumentos persistentes." : "Reinícios, contadores inválidos e intervalos sem leitura não geram taxa.";
}

function normalizarClima(resposta) {
    var hourly = resposta && resposta.hourly;
    if (!hourly || !Array.isArray(hourly.time) || !Array.isArray(hourly.temperature_2m) || !Array.isArray(hourly.relative_humidity_2m)) throw new Error("Formato meteorológico inválido.");
    var horas = [];
    for (var i = 0; i < hourly.time.length; i++) {
        if (!Number.isFinite(hourly.time[i]) || !Number.isFinite(hourly.temperature_2m[i])) continue;
        horas.push({ instante: hourly.time[i] * 1000, temperatura: hourly.temperature_2m[i], umidade: Number.isFinite(hourly.relative_humidity_2m[i]) ? hourly.relative_humidity_2m[i] : null });
    }
    if (!horas.length) throw new Error("O período ainda não tem dados meteorológicos disponíveis.");
    return horas.sort(function (a, b) { return a.instante - b.instante; });
}

function parearClima(leituras, climaPorHospital) {
    var porHora = {};
    var grupos = {};
    Object.keys(climaPorHospital).forEach(function (id) {
        climaPorHospital[id].forEach(function (clima) {
            porHora[id + ":" + Math.floor(clima.instante / 3600000)] = clima;
        });
    });
    leituras.forEach(function (leitura) {
        if (!hospitaisPreditivos[leitura.fk_hospital] || !Number.isFinite(leitura.temperatura_cpu)) return;
        var chave = leitura.fk_hospital + ":" + Math.floor(new Date(leitura.data_hora_br).getTime() / 3600000);
        if (!porHora[chave]) return;
        if (!grupos[chave]) grupos[chave] = [];
        grupos[chave].push(leitura.temperatura_cpu);
    });
    return Object.keys(grupos).map(function (chave) {
        var externo = porHora[chave];
        return { x: externo.temperatura, y: mediaContexto(grupos[chave]), instante: externo.instante, umidade: externo.umidade };
    }).sort(function (a, b) { return a.instante - b.instante; });
}

async function carregarClimaContexto(forcar) {
    if (!principalContexto) return;
    var hospitais = obterHospitaisContexto();
    assinaturaHospitaisClima = hospitais.join(",");
    var consulta = ++consultaClima;
    if (requisicaoClima) requisicaoClima.abort();
    dadosClima = {};
    estadoClima = "carregando";
    mensagemClima = "Consultando o clima dos locais de instalação dos hospitais…";
    document.getElementById("atualizarClima").disabled = true;
    atualizarClimaContexto();
    var inicio = new Date(referenciaPreditiva - 30 * 86400000).toISOString().slice(0, 10);
    var fim = new Date(referenciaPreditiva - 86400000).toISOString().slice(0, 10);
    var controller = new AbortController();
    requisicaoClima = controller;
    var timeout = setTimeout(function () { controller.abort(); }, 12000);
    try {
        var respostas = await Promise.allSettled(hospitais.map(async function (id) {
            var hospital = hospitaisPreditivos[id];
            if (!Number.isFinite(hospital.latitude) || !Number.isFinite(hospital.longitude)) throw new Error("Localização indisponível");
            var chave = hospital.latitude + "," + hospital.longitude + ":" + inicio + ":" + fim;
            if (!forcar && cacheClima[chave]) return cacheClima[chave];
            var url = new URL("https://historical-forecast-api.open-meteo.com/v1/forecast");
            url.search = new URLSearchParams({ latitude: hospital.latitude, longitude: hospital.longitude, start_date: inicio, end_date: fim, hourly: "temperature_2m,relative_humidity_2m", timezone: "UTC", timeformat: "unixtime", temperature_unit: "celsius" }).toString();
            var resposta = await fetch(url.toString(), { signal: controller.signal });
            if (!resposta.ok) throw new Error("Clima indisponível");
            var normalizados = normalizarClima(await resposta.json());
            cacheClima[chave] = normalizados;
            return normalizados;
        }));
        if (consulta !== consultaClima) return;
        var indisponiveis = [];
        respostas.forEach(function (resposta, indice) {
            var id = hospitais[indice];
            if (resposta.status === "fulfilled") dadosClima[id] = resposta.value;
            else indisponiveis.push(hospitaisPreditivos[id].nome);
        });
        estadoClima = Object.keys(dadosClima).length ? "pronto" : "erro";
        mensagemClima = "Open-Meteo · clima disponível para " + Object.keys(dadosClima).length + " de " + hospitais.length + " hospitais · consulta " + formatarDataContexto(Date.now(), true) + " (Brasília).";
        if (indisponiveis.length) mensagemClima += " Sem clima para " + indisponiveis.join(", ") + ". Leituras desses locais são excluídas dos gráficos climáticos. Tente atualizar.";
    } finally {
        clearTimeout(timeout);
        if (consulta === consultaClima) {
            requisicaoClima = null;
            document.getElementById("atualizarClima").disabled = false;
            atualizarClimaContexto();
        }
    }
}

function calcularMargensClima(resultados, clima, limite, corte) {
    return resultados.map(function (resultado) {
        var pares = parearClima(resultado.leituras, clima);
        var amenos = pares.filter(function (p) { return p.x < corte; });
        var quentes = pares.filter(function (p) { return p.x >= corte; });
        return {
            lote: lotesPreditivos[resultado.indice].numero,
            amena: mediaContexto(amenos.map(function (p) { return limite - p.y; })),
            quente: mediaContexto(quentes.map(function (p) { return limite - p.y; })),
            horariosAmenos: amenos.length, horariosQuentes: quentes.length
        };
    });
}

function atualizarClimaContexto() {
    if (!principalContexto) return;
    document.getElementById("statusClima").textContent = mensagemClima;
    var periodo = Number(document.getElementById("filtroPeriodo").value);
    var inicio = referenciaPreditiva - periodo * 86400000;
    var clima = {};
    Object.keys(dadosClima).forEach(function (id) {
        clima[id] = dadosClima[id].filter(function (hora) { return hora.instante >= inicio && hora.instante <= referenciaPreditiva; });
    });
    var pares = parearClima(principalContexto.leituras, clima);
    var ajuste = pares.length >= 3 ? calcularRegressao(pares) : null;
    var temperatura = mediaContexto(pares.map(function (p) { return p.x; }));
    var umidade = mediaContexto(pares.map(function (p) { return p.umidade; }));
    document.getElementById("climaTemperatura").textContent = temperatura === null ? "—" : formatarPreditivo(temperatura, 1) + " °C";
    document.getElementById("climaUmidade").textContent = umidade === null ? "—" : formatarPreditivo(umidade, 0) + "%";
    document.getElementById("climaR2").textContent = ajuste && ajuste.r2 !== null ? formatarPreditivo(ajuste.r2, 2) : "—";
    document.getElementById("climaPares").textContent = estadoClima === "pronto" ? pares.length : "—";
    document.getElementById("climaCobertura").textContent = pares.length + " pares hospital/hora com clima do local de instalação";
    document.getElementById("insightClima").textContent = ajuste && ajuste.pearson !== null ? "Pearson r = " + formatarPreditivo(ajuste.pearson, 2) + " · " + pares.length + " pares hospital/hora, com média entre unidades do mesmo hospital. Hardware demonstrativo." : "Ainda não há horários ou variação suficientes para calcular uma associação. Nenhum dado climático é inventado para preencher lacunas.";
    document.getElementById("subtituloMargemClima").textContent = "Clima do hospital de cada equipamento · últimos " + periodo + " dias";
    var limite = modelosPreditivos[document.getElementById("filtroModelo").value].limite;
    var margens = calcularMargensClima(resultadosPreditivos, clima, limite, 28);
    var comCalor = margens.filter(function (m) { return m.quente !== null; }).sort(function (a, b) { return a.quente - b.quente; });
    document.getElementById("resumoMargemClima").textContent = comCalor.length
        ? "Menor folga média com clima ≥ 28 °C: " + comCalor[0].lote + " · " + formatarPreditivo(comCalor[0].quente, 1) + " °C de margem em " + comCalor[0].horariosQuentes + " horário(s) pareado(s). Compare as condições de operação entre os lotes."
        : "Sem horários pareados com clima ≥ 28 °C neste recorte. As barras disponíveis mostram a margem média em horários abaixo desse corte.";
    if (document.getElementById("painelAmbiente").hidden) return;
    var vazio = estadoClima === "carregando" ? "Consultando histórico dos hospitais…" : estadoClima === "erro" ? "Histórico indisponível. Use Atualizar clima para tentar novamente." : "";
    if (vazio) mensagemGraficoContexto("graficoClimaCpu", "vazioClimaCpu", vazio);
    else graficoDispersaoContexto("graficoClimaCpu", "vazioClimaCpu", pares, "Temperatura externa (°C)", "Temperatura média da CPU (°C)", "°C", "°C", "#6d3fc0");
    var opcoes = opcoesContexto("Lote de equipamentos", "Margem térmica média (°C)", "", "°C");
    opcoes.scales.x.type = "category";
    opcoes.scales.y.beginAtZero = true;
    opcoes.plugins.legend = { display: true, position: "bottom", labels: { boxWidth: 10, font: { size: 10 } } };
    opcoes.plugins.tooltip.callbacks.label = function (item) { return item.dataset.label + ": " + formatarPreditivo(item.parsed.y, 1) + " °C de margem média"; };
    opcoes.plugins.tooltip.callbacks.afterLabel = function (item) {
        var lote = margens[item.dataIndex];
        return (item.datasetIndex === 0 ? lote.horariosAmenos : lote.horariosQuentes) + " horário(s) pareado(s)";
    };
    criarGraficoContexto("graficoMargemClima", "vazioMargemClima", { type: "bar", data: {
        labels: margens.map(function (m) { return m.lote; }), datasets: [
            { label: "Externo < 28 °C", data: margens.map(function (m) { return m.amena; }), backgroundColor: "#169b80", borderRadius: 4, maxBarThickness: 38 },
            { label: "Externo ≥ 28 °C", data: margens.map(function (m) { return m.quente; }), backgroundColor: "#bc7a2e", borderRadius: 4, maxBarThickness: 38 }
        ]
    }, options: opcoes }, vazio || (margens.some(function (m) { return m.horariosAmenos + m.horariosQuentes > 0; }) ? "" : "Sem horários pareados entre clima e coleta no período selecionado."));
}

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("abaAmbiente").onclick = function () { mostrarAbaContexto(false); };
    document.getElementById("abaRecursos").onclick = function () { mostrarAbaContexto(true); };
    var abas = [document.getElementById("abaAmbiente"), document.getElementById("abaRecursos")];
    for (var i = 0; i < abas.length; i++) abas[i].onkeydown = function (evento) {
        if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(evento.key)) {
            evento.preventDefault();
            var recursos = evento.key === "End" || (evento.key !== "Home" && this.id === "abaAmbiente");
            mostrarAbaContexto(recursos, true);
        }
    };
    document.getElementById("atualizarClima").onclick = function () { carregarClimaContexto(true); };
});
