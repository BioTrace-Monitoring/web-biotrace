// Cenários locais de demonstração. Não consultam nem alteram a ETL ou o banco.
// Os nomes das métricas acompanham a saída Gold da coleta Python.
var modelosPreditivos = {
    i5: { nome: "Intel Core i5-13450HX", fabricante: "Intel", limite: 85, bases: [46, 49, 43], inclinacoes: [0.06, 0.026, 0.018] },
    i7: { nome: "Intel Core i7-12700", fabricante: "Intel", limite: 85, bases: [44, 45, 42], inclinacoes: [0.035, 0.045, 0.023] },
    ryzen: { nome: "AMD Ryzen 5 5600G", fabricante: "AMD", limite: 80, bases: [48, 46, 44], inclinacoes: [0.004, 0.015, 0.012] }
};
var lotesPreditivos = [
    { numero: "LT-2026-001", equipamento: "ECG-12", prefixo: "ECG12", cor: "#dc535e" },
    { numero: "LT-2026-002", equipamento: "BPAP", prefixo: "BPAP", cor: "#6d3fc0" },
    { numero: "LT-2026-003", equipamento: "Osteomax", prefixo: "OST", cor: "#169b80" }
];
// Hospitais e localizações fictícios para demonstrar a alocação dos notebooks.
var hospitaisPreditivos = {
    1: { nome: "Hospital São Lucas", cidade: "São Paulo · SP", latitude: -23.5505, longitude: -46.6333 },
    2: { nome: "Hospital Vida", cidade: "Campinas · SP", latitude: -22.9056, longitude: -47.0608 },
    3: { nome: "Santa Clara", cidade: "Curitiba · PR", latitude: -25.4284, longitude: -49.2733 }
};
var referenciaPreditiva = new Date("2026-11-03T12:00:00-03:00").getTime();
var leiturasPreditivas = criarLeiturasDemonstrativas();
var resultadosPreditivos = [];
var unidadesPreditivas = [];
var graficoTermico = null;
var graficoCarga = null;
var investigandoModelo = false;

function criarLeiturasDemonstrativas() {
    var leituras = [];
    var variacoes = [-0.6, 0.8, -0.4, 1.1, -0.9, 0.3, -0.7, 0.6, -0.3, 0.9, -0.8, 0.5, 0.1];
    // Oscilações reproduzíveis de carga, memória e limpeza de arquivos.
    // Cada recurso varia de forma própria, além da tendência de uptime.
    var picosMemoria = [0, 6, 1, 8, 2, 12, 5, 9, 3, 11, 4, 10, 2];
    var limpezasDisco = [0, -8, -16, 6, -4, -18, 12, 2, -10, 15, 5, -8, 18];
    var tarefasProcessos = [4, -12, 18, -4, 10, -18, 8, 22, -10, 14, -6, 16, 0];
    var modelos = Object.keys(modelosPreditivos);
    for (var m = 0; m < modelos.length; m++) {
        var modelo = modelosPreditivos[modelos[m]];
        for (var l = 0; l < lotesPreditivos.length; l++) {
            for (var u = 0; u < 3; u++) {
                for (var i = 0; i < variacoes.length; i++) {
                    var usoCpu = 18 + ((i * 17 + u * 9 + l * 13) % 72);
                    var oscilacaoTermica = variacoes[i] * (6 + l * 2 + m);
                    var oscilacaoMemoria = picosMemoria[i] * (1 + l * 0.5);
                    // O primeiro lote mantém um cenário de gravação mais constante.
                    var oscilacaoDisco = limpezasDisco[i] * (l === 0 ? 0.4 : 1.5);
                    var espacoLivre = Number((160 - l * 18 - m * 4 - i * (l === 0 ? 7 : 3) - u * 2 + oscilacaoDisco).toFixed(2));
                    var capacidadeDisco = u === 0 ? 512 : 256;
                    var tarefas = tarefasProcessos[(i + u + l) % tarefasProcessos.length];
                    leituras.push({
                        modelo: modelos[m], lote: l,
                        numero_serie: lotesPreditivos[l].prefixo + "-" + String(m * 100 + l * 10 + u + 1).padStart(4, "0"),
                        fk_hospital: l === 2 && u === 2 ? null : u + 1,
                        hospital: l === 2 && u === 2 ? "" : hospitaisPreditivos[u + 1].nome,
                        data_hora_br: new Date(referenciaPreditiva - (12 - i) * 50 * 3600000).toISOString(),
                        uptime_horas: i * 50,
                        temperatura_cpu: Number((modelo.bases[l] + modelo.inclinacoes[l] * i * 50 + oscilacaoTermica + (u - 1) * 1.2).toFixed(2)),
                        cpu_percent: usoCpu,
                        memoria_percent: Number((34 + l * 4 + m * 2 + i * (l === 0 ? 3.1 : 1.2) + u * 1.4 + oscilacaoMemoria).toFixed(2)),
                        disco_livre_gb: espacoLivre,
                        disco_percent: Number((100 - espacoLivre / capacidadeDisco * 100).toFixed(2)),
                        processos_ativos: 90 + Math.round(usoCpu * 0.6) + tarefas,
                        rede_erros_entrada: i * (l + 2) + Math.floor(i * i / 3),
                        rede_erros_saida: i * (l + 1) + Math.floor(i * i / 6)
                    });
                }
            }
        }
    }
    return leituras;
}

function formatarPreditivo(valor, casas) {
    return Number(valor).toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

// Mínimos quadrados: y = intercepto + inclinacao * x.
function calcularRegressao(pontos) {
    if (pontos.length < 2) return null;
    var mediaX = 0;
    var mediaY = 0;
    for (var i = 0; i < pontos.length; i++) {
        mediaX += pontos[i].x / pontos.length;
        mediaY += pontos[i].y / pontos.length;
    }
    var somaXX = 0;
    var somaYY = 0;
    var somaXY = 0;
    for (var i = 0; i < pontos.length; i++) {
        somaXX += Math.pow(pontos[i].x - mediaX, 2);
        somaYY += Math.pow(pontos[i].y - mediaY, 2);
        somaXY += (pontos[i].x - mediaX) * (pontos[i].y - mediaY);
    }
    if (somaXX === 0) return null;
    var inclinacao = somaXY / somaXX;
    var intercepto = mediaY - inclinacao * mediaX;
    var erroAbsoluto = 0;
    var erroQuadrado = 0;
    for (var i = 0; i < pontos.length; i++) {
        var erro = pontos[i].y - (intercepto + inclinacao * pontos[i].x);
        erroAbsoluto += Math.abs(erro);
        erroQuadrado += erro * erro;
    }
    return {
        inclinacao: inclinacao, intercepto: intercepto,
        r2: somaYY > 0 ? Math.max(0, Math.min(1, 1 - erroQuadrado / somaYY)) : null,
        pearson: somaYY > 0 ? Math.max(-1, Math.min(1, somaXY / Math.sqrt(somaXX * somaYY))) : null,
        mae: erroAbsoluto / pontos.length
    };
}

function preverTemperatura(ajuste, uptime) {
    return ajuste.intercepto + ajuste.inclinacao * uptime;
}

function obterSituacao(temperatura, limite) {
    if (temperatura >= limite) return { nome: "Limite atingido", classe: "alerta" };
    if (temperatura >= limite - 5) return { nome: "Em atenção", classe: "atencao" };
    return { nome: "Sem alertas", classe: "" };
}

function agruparPorUptime(leituras) {
    var faixas = {};
    for (var i = 0; i < leituras.length; i++) {
        var leitura = leituras[i];
        var faixa = faixas[leitura.uptime_horas];
        if (!faixa) faixa = faixas[leitura.uptime_horas] = { total: 0, quantidade: 0 };
        faixa.total += leitura.temperatura_cpu;
        faixa.quantidade++;
    }
    return Object.keys(faixas).map(function (uptime) {
        return { x: Number(uptime), y: faixas[uptime].total / faixas[uptime].quantidade };
    }).sort(function (a, b) { return a.x - b.x; });
}

function analisarLote(indice, leituras, limite) {
    var pontos = agruparPorUptime(leituras);
    var ajuste = calcularRegressao(pontos);
    var ultimas = {};
    for (var i = 0; i < leituras.length; i++) {
        var leitura = leituras[i];
        if (!ultimas[leitura.numero_serie] || leitura.data_hora_br > ultimas[leitura.numero_serie].data_hora_br) {
            ultimas[leitura.numero_serie] = leitura;
        }
    }
    var unidades = Object.values(ultimas);
    var maiorTemperatura = Math.max.apply(null, unidades.map(function (u) { return u.temperatura_cpu; }));
    var ultimoUptime = pontos[pontos.length - 1].x;
    var horasLimite = null;
    if (ajuste && pontos.length >= 4 && ajuste.r2 >= 0.5 && ajuste.inclinacao > 0) {
        var cruzamento = (limite - ajuste.intercepto) / ajuste.inclinacao - ultimoUptime;
        if (cruzamento >= 0 && cruzamento <= 72) horasLimite = cruzamento;
    }
    return {
        indice: indice, leituras: leituras, pontos: pontos, ajuste: ajuste,
        unidades: unidades, ultimoUptime: ultimoUptime, maiorTemperatura: maiorTemperatura,
        margem: limite - maiorTemperatura, horasLimite: horasLimite,
        situacao: obterSituacao(maiorTemperatura, limite)
    };
}

function atualizarAnalise() {
    var modeloId = document.getElementById("filtroModelo").value;
    var loteId = document.getElementById("filtroLote").value;
    var periodo = Number(document.getElementById("filtroPeriodo").value);
    var modelo = modelosPreditivos[modeloId];
    var inicio = referenciaPreditiva - periodo * 24 * 3600000;
    var leituras = leiturasPreditivas.filter(function (leitura) {
        return Boolean(hospitaisPreditivos[leitura.fk_hospital]) && leitura.modelo === modeloId && (loteId === "todos" || leitura.lote === Number(loteId))
            && new Date(leitura.data_hora_br).getTime() >= inicio;
    });
    resultadosPreditivos = [];
    unidadesPreditivas = [];
    for (var l = 0; l < lotesPreditivos.length; l++) {
        var doLote = leituras.filter(function (leitura) { return leitura.lote === l; });
        if (!doLote.length) continue;
        var resultado = analisarLote(l, doLote, modelo.limite);
        resultadosPreditivos.push(resultado);
        unidadesPreditivas = unidadesPreditivas.concat(resultado.unidades);
    }
    resultadosPreditivos.sort(function (a, b) { return a.margem - b.margem; });
    unidadesPreditivas.sort(function (a, b) { return b.temperatura_cpu - a.temperatura_cpu; });
    var principal = resultadosPreditivos[0];
    document.getElementById("conteudoAnalise").hidden = !principal;
    document.getElementById("semEquipamentosAlocados").hidden = Boolean(principal);
    document.getElementById("exportarAnalise").disabled = !principal;
    if (!principal) {
        document.getElementById("escopoAnalise").textContent = "Nenhum equipamento alocado em hospital no recorte selecionado.";
        atualizarEnderecoAnalise();
        if (typeof atualizarAnalisesComplementares === "function") atualizarAnalisesComplementares(null);
        return;
    }
    var atencao = unidadesPreditivas.filter(function (unidade) { return unidade.temperatura_cpu >= modelo.limite - 5; }).length;
    var projecoes = resultadosPreditivos.filter(function (resultado) { return resultado.horasLimite !== null; });
    projecoes.sort(function (a, b) { return a.horasLimite - b.horasLimite; });
    var proximo = projecoes[0];

    document.getElementById("escopoAnalise").innerHTML = '<strong>● Recorte demonstrativo</strong><span>' + unidadesPreditivas.length
        + ' unidades alocadas em hospitais · ' + resultadosPreditivos.length + ' lote(s) · ' + leituras.length + ' leituras</span><span>'
        + modelo.nome + ' · últimos ' + periodo + ' dias</span>';
    document.getElementById("kpiUnidades").textContent = unidadesPreditivas.length;
    document.getElementById("detalheUnidades").textContent = resultadosPreditivos.length + " lote(s) · " + leituras.length + " leituras válidas";
    document.getElementById("kpiAtencao").textContent = atencao;
    document.getElementById("detalheAtencao").textContent = formatarPreditivo(atencao / unidadesPreditivas.length * 100, 0) + "% a até 5 °C do limite ou acima";
    document.getElementById("kpiMargem").textContent = formatarPreditivo(principal.margem, 1) + " °C";
    document.getElementById("kpiTempo").textContent = proximo ? "≈ " + Math.round(proximo.horasLimite) + " h" : "—";
    document.getElementById("detalheTempo").textContent = principal.margem <= 0 ? "Há unidades no limite de projeto" : proximo ? "Projeção da média do lote prioritário" : "Sem cruzamento projetado em até 72 h";
    atualizarAviso(principal, proximo, modelo);
    atualizarTabelas();
    atualizarInvestigacao(principal, modelo);
    atualizarGraficosPreditivos(principal, modelo);
    atualizarEnderecoAnalise();
    if (typeof atualizarAnalisesComplementares === "function") atualizarAnalisesComplementares(principal);
}

function atualizarAviso(principal, proximo, modelo) {
    var emAlerta = principal.margem <= 5 || Boolean(proximo);
    document.getElementById("avisoPreditivo").classList.toggle("sem-alerta", !emAlerta);
    document.getElementById("rotuloAviso").textContent = emAlerta ? "ATENÇÃO PREVENTIVA" : "ACOMPANHAMENTO TÉRMICO";
    var titulo;
    var descricao;
    if (principal.margem <= 0) {
        titulo = "Há unidades que atingiram o limite de projeto";
        descricao = lotesPreditivos[principal.indice].numero + ": confira as unidades e as condições de operação antes de continuar a avaliação.";
    } else if (proximo) {
        titulo = "O lote pode atingir o limite térmico em ≈ " + Math.round(proximo.horasLimite) + " horas";
        descricao = lotesPreditivos[proximo.indice].numero + " · " + modelo.nome + ". Projeção da temperatura média, mantida a tendência observada. Priorize a inspeção das unidades.";
    } else if (emAlerta) {
        titulo = "O lote prioritário está próximo do limite de projeto";
        descricao = lotesPreditivos[principal.indice].numero + ": menor margem atual de " + formatarPreditivo(principal.margem, 1) + " °C. Confira a refrigeração e a carga de trabalho.";
    } else {
        titulo = "Nenhum cruzamento do limite projetado nas próximas 72 horas";
        descricao = "As unidades do recorte estão abaixo da faixa de atenção. Continue acompanhando as tendências e as condições de operação.";
    }
    document.getElementById("tituloAviso").textContent = titulo;
    document.getElementById("descricaoAviso").textContent = descricao;
}

function atualizarTabelas() {
    var html = "";
    for (var i = 0; i < resultadosPreditivos.length; i++) {
        var resultado = resultadosPreditivos[i];
        var lote = lotesPreditivos[resultado.indice];
        var ajuste = resultado.ajuste;
        var tendencia = ajuste ? (ajuste.inclinacao >= 0 ? "+" : "") + formatarPreditivo(ajuste.inclinacao, 3) + " °C/h" : "Dados insuficientes";
        html += '<tr><td><strong><span class="ponto-legenda cor-lote-' + resultado.indice + '"></span>'
            + lote.numero + '</strong><small>' + lote.equipamento + '</small></td><td>' + resultado.unidades.length + '</td><td>' + tendencia
            + '</td><td>' + (ajuste && ajuste.r2 !== null ? formatarPreditivo(ajuste.r2, 2) : "—") + '</td><td>'
            + formatarPreditivo(resultado.margem, 1) + ' °C</td><td><span class="situacao-preditiva ' + resultado.situacao.classe + '">'
            + resultado.situacao.nome + '</span></td><td><button class="botao-texto investigar-lote" type="button" value="' + resultado.indice
            + '" aria-label="Investigar ' + lote.numero + '">Investigar →</button></td></tr>';
    }
    document.getElementById("tabelaLotes").innerHTML = html;
    var botoes = document.querySelectorAll(".investigar-lote");
    for (var i = 0; i < botoes.length; i++) {
        botoes[i].onclick = function () {
            document.getElementById("filtroLote").value = this.value;
            mostrarInvestigacao(true);
        };
    }
    filtrarUnidades();
}

function filtrarUnidades() {
    var busca = document.getElementById("buscarUnidade").value.trim().toLocaleLowerCase("pt-BR");
    var modelo = modelosPreditivos[document.getElementById("filtroModelo").value];
    var html = "";
    var quantidade = 0;
    for (var i = 0; i < unidadesPreditivas.length; i++) {
        var unidade = unidadesPreditivas[i];
        if (!(unidade.numero_serie + " " + unidade.hospital).toLocaleLowerCase("pt-BR").includes(busca)) continue;
        var situacao = obterSituacao(unidade.temperatura_cpu, modelo.limite);
        quantidade++;
        html += '<tr><td><strong>' + unidade.numero_serie + '</strong><small>' + lotesPreditivos[unidade.lote].equipamento + '</small></td><td>'
            + unidade.hospital + '</td><td>' + lotesPreditivos[unidade.lote].numero + '</td><td>' + formatarPreditivo(unidade.temperatura_cpu, 1)
            + ' °C</td><td>' + unidade.cpu_percent + '%</td><td>' + formatarPreditivo(modelo.limite - unidade.temperatura_cpu, 1)
            + ' °C</td><td><span class="situacao-preditiva ' + situacao.classe + '">' + situacao.nome + '</span></td></tr>';
    }
    document.getElementById("tabelaUnidades").innerHTML = html;
    document.getElementById("unidadesVazias").hidden = quantidade > 0;
    document.getElementById("resumoInspecao").textContent = quantidade + " de " + unidadesPreditivas.length + " unidades · Ordenadas pela maior temperatura atual.";
}

function atualizarInvestigacao(principal, modelo) {
    document.getElementById("tituloAnalise").textContent = investigandoModelo ? modelo.nome : "Análise preditiva";
    document.getElementById("descricaoAnalise").textContent = investigandoModelo ? "CPU · Evidências por lote e unidades para inspeção." : "Antecipe desvios térmicos e compare o comportamento dos seus componentes.";
    document.title = (investigandoModelo ? modelo.nome : "Análise preditiva") + " | BioTrace";
    document.getElementById("tituloTendencia").textContent = "Tendência do lote " + lotesPreditivos[principal.indice].numero;
    document.getElementById("valorTendencia").textContent = principal.ajuste ? (principal.ajuste.inclinacao >= 0 ? "+" : "") + formatarPreditivo(principal.ajuste.inclinacao, 3) + " °C / hora" : "Dados insuficientes";
    document.getElementById("descricaoTendencia").textContent = "Variação estimada da temperatura média por hora de uptime. Ajuste calculado em " + principal.pontos.length + " faixas, a partir de " + principal.leituras.length + " leituras de " + principal.unidades.length + " unidades.";
    document.getElementById("avaliacaoSugerida").textContent = principal.margem <= 5
        ? "Confira ventilação, dissipação e carga das unidades mais quentes. Compare o comportamento antes e depois de uma intervenção sob condições semelhantes."
        : "Mantenha o acompanhamento e compare os lotes sob cargas semelhantes. Investigue mudanças de tendência antes de ampliar a janela de projeção.";
    document.getElementById("nomeFicha").textContent = modelo.nome;
    document.getElementById("fabricanteFicha").textContent = modelo.fabricante;
    document.getElementById("limiteFicha").textContent = modelo.limite + " °C";
}

function mostrarInvestigacao(exibir, focar) {
    investigandoModelo = exibir;
    document.getElementById("voltarAnalise").hidden = !exibir;
    document.getElementById("investigarModelo").hidden = exibir;
    document.getElementById("investigacaoModelo").hidden = !exibir;
    document.getElementById("painelUnidades").hidden = !exibir;
    document.getElementById("buscarUnidade").value = "";
    atualizarAnalise();
    if (focar !== false) {
        var titulo = document.getElementById("tituloAnalise");
        titulo.setAttribute("tabindex", "-1");
        titulo.focus();
    }
}

function criarReta(ajuste, inicio, fim) {
    return [{ x: inicio, y: preverTemperatura(ajuste, inicio) }, { x: fim, y: preverTemperatura(ajuste, fim) }];
}

function opcoesRegressao(tituloX, inicioX, fimX) {
    return {
        responsive: true, maintainAspectRatio: false, animation: false,
        plugins: {
            legend: { display: false },
            tooltip: { filter: function (item) { return !item.dataset.semTooltip; }, callbacks: {
                label: function (item) {
                    return item.dataset.label + ": " + formatarPreditivo(item.parsed.x, 0) + (tituloX.includes("CPU") ? "%" : " h") + " · " + formatarPreditivo(item.parsed.y, 1) + " °C";
                }
            } }
        },
        scales: {
            x: { type: "linear", min: inicioX, max: fimX, title: { display: true, text: tituloX, color: "#77717d", font: { size: 10 } }, grid: { color: "#eeebf3" }, ticks: { maxTicksLimit: 7, color: "#77717d", font: { size: 10 } } },
            y: { min: 35, max: 100, title: { display: true, text: "Temperatura da CPU (°C)", color: "#77717d", font: { size: 10 } }, grid: { color: "#eeebf3" }, ticks: { stepSize: 10, color: "#77717d", font: { size: 10 } } }
        }
    };
}

function atualizarGraficosPreditivos(principal, modelo) {
    if (graficoTermico) graficoTermico.destroy();
    if (graficoCarga) graficoCarga.destroy();
    var datasets = [];
    var legenda = "";
    var inicio = Math.min.apply(null, resultadosPreditivos.map(function (r) { return r.pontos[0].x; }));
    var fim = Math.max.apply(null, resultadosPreditivos.map(function (r) { return r.ultimoUptime; })) + 72;
    for (var i = 0; i < resultadosPreditivos.length; i++) {
        var resultado = resultadosPreditivos[i];
        var lote = lotesPreditivos[resultado.indice];
        datasets.push({ label: lote.numero, data: resultado.pontos, backgroundColor: lote.cor, borderColor: lote.cor, pointRadius: 4, pointHoverRadius: 6 });
        if (resultado.ajuste) {
            datasets.push({ label: "Ajuste · " + lote.numero, data: criarReta(resultado.ajuste, resultado.pontos[0].x, resultado.ultimoUptime), borderColor: lote.cor, borderWidth: 1.8, pointRadius: 0, showLine: true, semTooltip: true });
            if (resultado.pontos.length >= 4 && resultado.ajuste.r2 >= 0.5 && resultado.ajuste.inclinacao > 0) {
                datasets.push({ label: "Projeção · " + lote.numero, data: criarReta(resultado.ajuste, resultado.ultimoUptime, resultado.ultimoUptime + 72), borderColor: lote.cor, borderWidth: 1.8, borderDash: [4, 4], pointRadius: 0, showLine: true, semTooltip: true });
            }
        }
        legenda += '<span class="item-legenda"><span class="ponto-legenda cor-lote-' + resultado.indice + '"></span>' + lote.numero + ' (' + lote.equipamento + ')</span>';
    }
    datasets.push({ label: "Limite de projeto", data: [{ x: inicio, y: modelo.limite }, { x: fim, y: modelo.limite }], borderColor: "#b98a91", borderDash: [7, 5], borderWidth: 1, pointRadius: 0, showLine: true, semTooltip: true });
    document.getElementById("legendaTermica").innerHTML = legenda + '<span class="item-legenda"><span class="linha-legenda"></span>Limite: ' + modelo.limite + ' °C</span>';
    document.getElementById("subtituloTermico").textContent = modelo.nome + " · médias por faixa de uptime e lote";
    document.getElementById("rotuloAjuste").textContent = "R² · " + lotesPreditivos[principal.indice].numero;
    document.getElementById("resumoAjuste").textContent = principal.ajuste && principal.ajuste.r2 !== null ? formatarPreditivo(principal.ajuste.r2, 2) : "—";
    document.getElementById("resumoErro").textContent = principal.ajuste ? formatarPreditivo(principal.ajuste.mae, 2) + " °C" : "—";
    document.getElementById("resumoLimite").textContent = modelo.limite + " °C";

    var carga = principal.leituras.map(function (leitura) { return { x: leitura.cpu_percent, y: leitura.temperatura_cpu }; });
    var ajusteCarga = calcularRegressao(carga);
    document.getElementById("subtituloCarga").textContent = lotesPreditivos[principal.indice].numero + " · medições individuais";
    document.getElementById("cargaPearson").textContent = ajusteCarga && ajusteCarga.pearson !== null ? (ajusteCarga.pearson >= 0 ? "+" : "") + formatarPreditivo(ajusteCarga.pearson, 2) : "—";
    document.getElementById("cargaAjuste").textContent = ajusteCarga && ajusteCarga.r2 !== null ? formatarPreditivo(ajusteCarga.r2, 2) : "—";
    document.getElementById("cargaAmostras").textContent = carga.length;

    if (typeof Chart === "undefined") {
        document.getElementById("areaTermica").innerHTML = '<p class="erro-grafico">Não foi possível carregar os gráficos. Verifique sua conexão e recarregue a página. Os resultados estão disponíveis na tabela abaixo.</p>';
        document.getElementById("areaCarga").innerHTML = '<p class="erro-grafico">Gráfico indisponível. Pearson: ' + document.getElementById("cargaPearson").textContent + ' · R²: ' + document.getElementById("cargaAjuste").textContent + '.</p>';
        return;
    }
    graficoTermico = new Chart(document.getElementById("graficoTermico"), { type: "scatter", data: { datasets: datasets }, options: opcoesRegressao("Uptime contínuo (horas)", inicio, fim) });
    var dadosCarga = [{ label: "Medição", data: carga, backgroundColor: "#6d3fc0", pointRadius: 3, pointHoverRadius: 5 }];
    if (ajusteCarga) {
        var menorCarga = Math.min.apply(null, carga.map(function (p) { return p.x; }));
        var maiorCarga = Math.max.apply(null, carga.map(function (p) { return p.x; }));
        dadosCarga.push({ label: "Regressão", data: criarReta(ajusteCarga, menorCarga, maiorCarga), borderColor: "#6d3fc0", borderWidth: 1.8, borderDash: [4, 4], pointRadius: 0, showLine: true, semTooltip: true });
    }
    graficoCarga = new Chart(document.getElementById("graficoCarga"), { type: "scatter", data: { datasets: dadosCarga }, options: opcoesRegressao("Uso da CPU (%)", 0, 100) });
}

function atualizarEnderecoAnalise() {
    var parametros = new URLSearchParams();
    parametros.set("modelo", document.getElementById("filtroModelo").value);
    parametros.set("lote", document.getElementById("filtroLote").value);
    parametros.set("periodo", document.getElementById("filtroPeriodo").value);
    if (investigandoModelo) parametros.set("visao", "investigacao");
    history.replaceState(null, "", "?" + parametros.toString());
}

function exportarAnalisePreditiva() {
    var modelo = modelosPreditivos[document.getElementById("filtroModelo").value];
    var linhas = [["Dados simulados", "Modelo", "Período (dias)", "Lote", "Equipamento", "Unidades", "Leituras", "Tendência (°C/h)", "R² do ajuste", "MAE do ajuste (°C)", "Margem atual (°C)", "Limite de projeto (°C)", "Projeção até limite (h)", "Situação"]];
    for (var i = 0; i < resultadosPreditivos.length; i++) {
        var r = resultadosPreditivos[i];
        var lote = lotesPreditivos[r.indice];
        linhas.push(["Sim", modelo.nome, document.getElementById("filtroPeriodo").value, lote.numero, lote.equipamento, r.unidades.length, r.leituras.length,
            r.ajuste ? formatarPreditivo(r.ajuste.inclinacao, 4) : "", r.ajuste && r.ajuste.r2 !== null ? formatarPreditivo(r.ajuste.r2, 4) : "",
            r.ajuste ? formatarPreditivo(r.ajuste.mae, 4) : "", formatarPreditivo(r.margem, 2), modelo.limite,
            r.horasLimite !== null ? formatarPreditivo(r.horasLimite, 1) : "Sem cruzamento em até 72 h", r.situacao.nome]);
    }
    var csv = "\uFEFF" + linhas.map(function (linha) {
        return linha.map(function (valor) { return '"' + String(valor).replaceAll('"', '""') + '"'; }).join(";");
    }).join("\r\n");
    var url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    var link = document.createElement("a");
    link.href = url;
    link.download = "biotrace-analise-demonstrativa-" + document.getElementById("filtroModelo").value + ".csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}

function inicializarAnalisePreditiva() {
    var parametros = new URLSearchParams(window.location.search);
    var filtros = ["Modelo", "Lote", "Periodo"];
    for (var i = 0; i < filtros.length; i++) {
        var campo = document.getElementById("filtro" + filtros[i]);
        var valor = parametros.get(filtros[i].toLowerCase());
        for (var o = 0; o < campo.options.length; o++) {
            if (campo.options[o].value === valor) campo.value = valor;
        }
        campo.onchange = atualizarAnalise;
    }
    document.getElementById("limparFiltros").onclick = function () {
        document.getElementById("filtroModelo").value = "i5";
        document.getElementById("filtroLote").value = "todos";
        document.getElementById("filtroPeriodo").value = "30";
        document.getElementById("buscarUnidade").value = "";
        atualizarAnalise();
    };
    document.getElementById("investigarModelo").onclick = function () { mostrarInvestigacao(true); };
    document.getElementById("voltarAnalise").onclick = function () { mostrarInvestigacao(false); };
    document.getElementById("buscarUnidade").oninput = filtrarUnidades;
    document.getElementById("exportarAnalise").onclick = exportarAnalisePreditiva;
    mostrarInvestigacao(parametros.get("visao") === "investigacao", false);
}

document.addEventListener("DOMContentLoaded", inicializarAnalisePreditiva);
