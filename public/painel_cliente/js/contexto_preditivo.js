// Clima real da API; recursos de hardware continuam sendo demonstrativos.
// O local é uma comparação escolhida pelo usuário, sem vínculo com um hospital real.
var locaisClima = [
    { nome: "São Paulo · SP", latitude: -23.5505, longitude: -46.6333 },
    { nome: "Campinas · SP", latitude: -22.9056, longitude: -47.0608 },
    { nome: "Curitiba · PR", latitude: -25.4284, longitude: -49.2733 }
];
var dadosClima = [];
var estadoClima = "carregando";
var mensagemClima = "Consultando o histórico meteorológico…";
var cacheClima = {};
var requisicaoClima = null;
var consultaClima = 0;
var buscaCidadeAtual = 0;
var graficosContexto = {};
var principalContexto = null;

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
    document.getElementById("escopoComplementar").textContent = lotesPreditivos[principal.indice].numero + " · "
        + modelosPreditivos[document.getElementById("filtroModelo").value].nome + " · " + principal.unidades.length
        + " unidades. Os gráficos abaixo aprofundam este lote.";
    if (!document.getElementById("painelRecursos").hidden) atualizarRecursosContexto();
    atualizarClimaContexto();
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

function atualizarRecursosContexto() {
    if (!principalContexto) return;
    var leituras = principalContexto.leituras;
    var ultimas = principalContexto.unidades;
    document.getElementById("recursoRam").textContent = formatarPreditivo(Math.max.apply(null, ultimas.map(function (u) { return u.memoria_percent; })), 1) + "%";
    document.getElementById("recursoDisco").textContent = formatarPreditivo(Math.min.apply(null, ultimas.map(function (u) { return u.disco_livre_gb; })), 1) + " GB";
    document.getElementById("recursoCpu").textContent = formatarPreditivo(mediaContexto(ultimas.map(function (u) { return u.cpu_percent; })), 1) + "%";
    var ram = graficoDispersaoContexto("graficoRamUptime", "vazioRamUptime", agruparRecursoContexto(leituras, "memoria_percent"), "Uptime contínuo (h)", "Uso de RAM (%)", "h", "%", "#6d3fc0");
    var disco = graficoDispersaoContexto("graficoDiscoUptime", "vazioDiscoUptime", agruparRecursoContexto(leituras, "disco_livre_gb"), "Uptime contínuo (h)", "Espaço livre (GB)", "h", "GB", "#169b80");
    var processos = graficoDispersaoContexto("graficoProcessosCpu", "vazioProcessosCpu", leituras.map(function (l) { return { x: l.processos_ativos, y: l.cpu_percent }; }), "Processos ativos", "Uso da CPU (%)", "processos", "%", "#bc7a2e");
    document.getElementById("insightRam").textContent = ram ? "Tendência: " + (ram.inclinacao >= 0 ? "+" : "") + formatarPreditivo(ram.inclinacao, 3) + " pontos percentuais/h · R² " + formatarPreditivo(ram.r2, 2) + ". Médias por faixa de uptime do lote." : "Dados insuficientes para ajustar a tendência de RAM.";
    document.getElementById("insightDisco").textContent = disco ? "Variação de espaço livre: " + formatarPreditivo(disco.inclinacao, 3) + " GB/h · R² " + formatarPreditivo(disco.r2, 2) + ". Avalie o acúmulo de arquivos quando a tendência for negativa." : "Dados insuficientes para ajustar a tendência de disco.";
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

function parearClima(leituras, clima) {
    var porHora = {};
    var grupos = {};
    for (var i = 0; i < clima.length; i++) porHora[Math.floor(clima[i].instante / 3600000)] = clima[i];
    for (var i = 0; i < leituras.length; i++) {
        var leitura = leituras[i];
        var hora = Math.floor(new Date(leitura.data_hora_br).getTime() / 3600000);
        if (!porHora[hora] || !Number.isFinite(leitura.temperatura_cpu)) continue;
        if (!grupos[hora]) grupos[hora] = [];
        grupos[hora].push(leitura.temperatura_cpu);
    }
    return Object.keys(grupos).map(function (hora) {
        var externo = porHora[hora];
        return { x: externo.temperatura, y: mediaContexto(grupos[hora]), instante: externo.instante, umidade: externo.umidade };
    }).sort(function (a, b) { return a.instante - b.instante; });
}

async function carregarClimaContexto(forcar) {
    var local = locaisClima[Number(document.getElementById("localClima").value)];
    if (!local) return;
    var consulta = ++consultaClima;
    if (requisicaoClima) requisicaoClima.abort();
    dadosClima = [];
    estadoClima = "carregando";
    mensagemClima = "Consultando " + local.nome + " · histórico no período da telemetria demonstrativa…";
    document.getElementById("atualizarClima").disabled = true;
    atualizarClimaContexto();
    // O último dia completo evita solicitar horas futuras ao arquivo histórico.
    var inicio = new Date(referenciaPreditiva - 30 * 86400000).toISOString().slice(0, 10);
    var fim = new Date(referenciaPreditiva - 86400000).toISOString().slice(0, 10);
    var chave = local.latitude + "," + local.longitude + ":" + inicio + ":" + fim;
    var controller = new AbortController();
    requisicaoClima = controller;
    var timeout = setTimeout(function () { controller.abort(); }, 12000);
    try {
        if (!forcar && cacheClima[chave]) dadosClima = cacheClima[chave];
        else {
            var url = new URL("https://historical-forecast-api.open-meteo.com/v1/forecast");
            url.search = new URLSearchParams({ latitude: local.latitude, longitude: local.longitude, start_date: inicio, end_date: fim, hourly: "temperature_2m,relative_humidity_2m", timezone: "UTC", timeformat: "unixtime", temperature_unit: "celsius" }).toString();
            var resposta = await fetch(url.toString(), { signal: controller.signal });
            if (!resposta.ok) throw new Error("Falha na consulta meteorológica (HTTP " + resposta.status + ").");
            var normalizados = normalizarClima(await resposta.json());
            if (consulta !== consultaClima) return;
            dadosClima = normalizados;
            cacheClima[chave] = normalizados;
        }
        estadoClima = "pronto";
        mensagemClima = local.nome + " · Open-Meteo · previsões históricas arquivadas · UTC alinhado à coleta · consulta " + formatarDataContexto(Date.now(), true) + " (Brasília).";
    } catch (erro) {
        if (consulta !== consultaClima) return;
        estadoClima = "erro";
        mensagemClima = "Clima indisponível para " + local.nome + ". " + (erro.name === "AbortError" ? "Tempo de consulta excedido." : erro.message) + " Tente atualizar. A telemetria demonstrativa permanece disponível.";
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
    var clima = dadosClima.filter(function (hora) { return hora.instante >= inicio && hora.instante <= referenciaPreditiva; });
    var pares = parearClima(principalContexto.leituras, clima);
    var ajuste = pares.length >= 3 ? calcularRegressao(pares) : null;
    var temperatura = mediaContexto(pares.map(function (p) { return p.x; }));
    var umidade = mediaContexto(pares.map(function (p) { return p.umidade; }));
    document.getElementById("climaTemperatura").textContent = temperatura === null ? "—" : formatarPreditivo(temperatura, 1) + " °C";
    document.getElementById("climaUmidade").textContent = umidade === null ? "—" : formatarPreditivo(umidade, 0) + "%";
    document.getElementById("climaR2").textContent = ajuste && ajuste.r2 !== null ? formatarPreditivo(ajuste.r2, 2) : "—";
    document.getElementById("climaPares").textContent = estadoClima === "pronto" ? pares.length : "—";
    document.getElementById("climaCobertura").textContent = pares.length + " de " + principalContexto.pontos.length + " horários da coleta; horas sem clima são excluídas";
    document.getElementById("insightClima").textContent = ajuste && ajuste.pearson !== null ? "Pearson r = " + formatarPreditivo(ajuste.pearson, 2) + " · " + pares.length + " horários distintos, com média entre unidades. Associação exploratória; o hardware é simulado." : "Ainda não há horários ou variação suficientes para calcular uma associação. Nenhum dado climático é inventado para preencher lacunas.";
    document.getElementById("subtituloMargemClima").textContent = locaisClima[Number(document.getElementById("localClima").value)].nome + " · lotes do recorte · últimos " + periodo + " dias";
    var limite = modelosPreditivos[document.getElementById("filtroModelo").value].limite;
    var margens = calcularMargensClima(resultadosPreditivos, clima, limite, 28);
    var comCalor = margens.filter(function (m) { return m.quente !== null; }).sort(function (a, b) { return a.quente - b.quente; });
    document.getElementById("resumoMargemClima").textContent = comCalor.length
        ? "Menor folga média com clima ≥ 28 °C: " + comCalor[0].lote + " · " + formatarPreditivo(comCalor[0].quente, 1) + " °C de margem em " + comCalor[0].horariosQuentes + " horário(s) pareado(s). Compare as condições de operação entre os lotes."
        : "Sem horários pareados com clima ≥ 28 °C neste recorte. As barras disponíveis mostram a margem média em horários abaixo desse corte.";
    if (document.getElementById("painelAmbiente").hidden) return;
    var vazio = estadoClima === "carregando" ? "Consultando histórico da cidade…" : estadoClima === "erro" ? "Histórico indisponível. Use Atualizar clima para tentar novamente." : "";
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

async function buscarCidadeContexto(evento) {
    evento.preventDefault();
    var nome = document.getElementById("nomeCidadeClima").value.trim();
    if (nome.length < 3) { document.getElementById("statusBuscaCidade").textContent = "Digite pelo menos três caracteres."; return; }
    var busca = ++buscaCidadeAtual;
    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 10000);
    document.getElementById("botaoBuscarCidade").disabled = true;
    document.getElementById("statusBuscaCidade").textContent = "Buscando cidades…";
    try {
        var url = new URL("https://geocoding-api.open-meteo.com/v1/search");
        url.search = new URLSearchParams({ name: nome, count: 5, language: "pt", countryCode: "BR", format: "json" }).toString();
        var resposta = await fetch(url.toString(), { signal: controller.signal });
        if (!resposta.ok) throw new Error("Busca indisponível. Tente novamente.");
        var dados = await resposta.json();
        if (busca !== buscaCidadeAtual) return;
        var resultados = (Array.isArray(dados.results) ? dados.results : []).filter(function (r) {
            return Number.isFinite(r.latitude) && Number.isFinite(r.longitude) && Math.abs(r.latitude) <= 90 && Math.abs(r.longitude) <= 180 && typeof r.name === "string";
        });
        if (!resultados.length) { document.getElementById("statusBuscaCidade").textContent = "Nenhuma cidade encontrada. Tente informar também o estado."; return; }
        locaisClima = resultados.map(function (r) { return { nome: r.name + (r.admin1 ? " · " + r.admin1 : ""), latitude: r.latitude, longitude: r.longitude }; });
        var select = document.getElementById("localClima");
        select.replaceChildren();
        for (var i = 0; i < locaisClima.length; i++) {
            var opcao = document.createElement("option");
            opcao.value = String(i);
            opcao.textContent = locaisClima[i].nome;
            select.appendChild(opcao);
        }
        select.value = "0";
        document.getElementById("statusBuscaCidade").textContent = resultados.length + " localidade(s) · Geocodificação Open-Meteo / GeoNames.";
        carregarClimaContexto(false);
    } catch (erro) {
        if (busca === buscaCidadeAtual) document.getElementById("statusBuscaCidade").textContent = erro.name === "AbortError" ? "A busca demorou demais. Tente novamente." : "Não foi possível buscar cidades. Tente novamente.";
    } finally {
        clearTimeout(timeout);
        if (busca === buscaCidadeAtual) document.getElementById("botaoBuscarCidade").disabled = false;
    }
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
    document.getElementById("buscarCidadeClima").onsubmit = buscarCidadeContexto;
    document.getElementById("localClima").onchange = function () { carregarClimaContexto(false); };
    document.getElementById("atualizarClima").onclick = function () { carregarClimaContexto(true); };
    carregarClimaContexto(false);
});
