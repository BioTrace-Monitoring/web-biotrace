// Dados fictícios. Esta tela não consulta o backend nem o S3.
var referencia = new Date('2026-11-11T12:00:00-03:00').getTime();
var horaEmMs = 3600000;
var formatoData = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
});
var lotes = [
    { id: 'LT-001', modelo: 'ECG-12', unidades: 4, semColeta: 0, temperaturaAtual: 83.7, tendencia: 0.04, oscilacao: 0.25, cor: '#ba4055' },
    { id: 'LT-002', modelo: 'ECG-12', unidades: 4, semColeta: 0, temperaturaAtual: 57, tendencia: 0.006, oscilacao: 0.5, cor: '#147c74' },
    { id: 'LT-003', modelo: 'BPAP', unidades: 4, semColeta: 1, temperaturaAtual: 65, tendencia: 0, oscilacao: 4, cor: '#7654ab' }
];
var leituras = criarLeituras();
var resultados = [];
var graficos = {};

function criarLeituras() {
    var dados = [];
    var oscilacoes = [0, 1, -1, 2, -2, 1, 0];
    lotes.forEach(function (lote) {
        for (var horasAtras = 30 * 24; horasAtras >= 0; horasAtras -= 4) {
            var ponto = (horasAtras / 4) % oscilacoes.length;
            for (var unidade = 0; unidade < lote.unidades; unidade++) {
                if (horasAtras <= 24 && unidade >= lote.unidades - lote.semColeta) continue;
                var picoLocal = lote.id === 'LT-001' && horasAtras === 0 && unidade === 3 ? 3 : 0;
                dados.push({
                    lote: lote.id,
                    serie: lote.id + '-' + (unidade + 1),
                    instante: referencia - horasAtras * horaEmMs,
                    temperatura: lote.temperaturaAtual - lote.tendencia * horasAtras +
                        oscilacoes[ponto] * lote.oscilacao + unidade * 0.2 + picoLocal,
                    cpu: 40 + ponto * 5 + unidade,
                    ram: 48 + ponto * (lote.id === 'LT-001' ? 7 : 3) + unidade,
                    discoLivre: 42 - ponto - unidade,
                    novosErrosRede: lote.id === 'LT-001' && ponto === 4 && unidade === 3 ? 2 : 0
                });
            }
        }
    });
    return dados;
}
// O eixo usa horas relativas para manter a inclinação da regressão em °C/h.
function dataNoEixo(horas) {
    return formatoData.format(referencia + horas * horaEmMs);
}
function eixoColetas() {
    return {
        type: 'linear',
        title: { display: true, text: 'Data e hora da coleta (Brasília)' },
        ticks: { callback: dataNoEixo, maxTicksLimit: 7 }
    };
}
function numero(valor, casas) {
    return valor.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
}
function media(valores) {
    return valores.reduce(function (soma, valor) { return soma + valor; }, 0) / valores.length;
}
function desvioPadrao(valores) {
    var centro = media(valores);
    return Math.sqrt(media(valores.map(function (v) { return Math.pow(v - centro, 2); })));
}
function regressao(pontos) {
    if (pontos.length < 4) return null;
    var mx = media(pontos.map(function (p) { return p.x; }));
    var my = media(pontos.map(function (p) { return p.y; }));
    var xx = 0, yy = 0, xy = 0;
    pontos.forEach(function (p) {
        xx += Math.pow(p.x - mx, 2);
        yy += Math.pow(p.y - my, 2);
        xy += (p.x - mx) * (p.y - my);
    });
    if (xx === 0 || yy === 0) return null;
    var a = xy / xx;
    return { a: a, b: my - a * mx, r2: Math.min(1, xy * xy / (xx * yy)) };
}
function analisar(lote, dias) {
    var dados = leituras.filter(function (l) {
        return l.lote === lote.id && l.instante >= referencia - dias * 86400000 && l.instante <= referencia;
    });
    var seriesRecentes = new Set(dados.filter(function (l) {
        return l.instante >= referencia - 24 * 3600000;
    }).map(function (l) { return l.serie; }));
    var unidades = [];
    for (var i = 1; i <= lote.unidades; i++) {
        var serie = lote.id + '-' + i;
        var dadosUnidade = dados.filter(function (l) { return l.serie === serie; });
        unidades.push({
            serie: serie,
            dados: dadosUnidade,
            recente: seriesRecentes.has(serie),
            acimaLimite: dadosUnidade.some(function (l) { return l.temperatura >= 85; })
        });
    }
    // Limite atingido primeiro, depois unidades sem coleta recente.
    unidades.sort(function (a, b) {
        return Number(b.acimaLimite) - Number(a.acimaLimite) || Number(a.recente) - Number(b.recente);
    });
    var temperaturasPorHora = new Map();
    dados.forEach(function (leitura) {
        var hora = Math.floor(leitura.instante / horaEmMs) * horaEmMs;
        if (!temperaturasPorHora.has(hora)) temperaturasPorHora.set(hora, []);
        temperaturasPorHora.get(hora).push(leitura.temperatura);
    });
    var pontos = Array.from(temperaturasPorHora, function (entrada) {
        var temperaturas = entrada[1];
        return {
            x: (entrada[0] - referencia) / horaEmMs,
            y: media(temperaturas),
            minimo: Math.min.apply(null, temperaturas),
            maximo: Math.max.apply(null, temperaturas)
        };
    }).sort(function (a, b) { return a.x - b.x; });
    var valores = dados.map(function (l) { return l.temperatura; });
    var ajuste = regressao(pontos);
    var elegivel = ajuste !== null && ajuste.r2 >= 0.7 && seriesRecentes.size === lote.unidades;
    var fim = pontos.length ? pontos[pontos.length - 1].x : 0;
    var horasAteLimite = null;
    if (elegivel && ajuste.a > 0) {
        var horas = (85 - ajuste.b) / ajuste.a - fim;
        if (horas > 0 && horas <= 24) horasAteLimite = horas;
    }
    return { lote: lote, dados: dados, unidades: unidades, pontos: pontos, ajuste: ajuste, elegivel: elegivel,
        recentes: seriesRecentes.size, media: valores.length ? media(valores) : null,
        pico: valores.length ? Math.max.apply(null, valores) : null,
        desvio: valores.length ? desvioPadrao(valores) : null, fim: fim, horas: horasAteLimite };
}
function textoProjecao(r) {
    if (!r.elegivel) return 'Indisponível: coleta ou ajuste insuficiente';
    if (r.ajuste.b + r.ajuste.a * r.fim >= 85) return 'Média ajustada já no limite';
    if (r.horas !== null) return '≈ ' + numero(r.horas, 1) + ' h após o último ponto observado · ' + dataNoEixo(r.fim + r.horas);
    return 'Sem cruzamento estimado nas 24 h após o último ponto';
}
function acao(r) {
    if (r.pico >= 85) return 'Investigar unidade acima do limite';
    if (r.recentes < r.lote.unidades) return 'Restabelecer coleta das unidades ausentes';
    if (!r.elegivel) return 'Investigar a variação das leituras';
    if (r.horas !== null) return 'Verificar a dissipação térmica';
    return 'Acompanhar a tendência térmica';
}
function atualizarLotes() {
    var modelo = document.getElementById('filtroProjeto').value;
    document.getElementById('filtroLote').innerHTML = '<option value="todos">Todos os lotes</option>';
    lotes.forEach(function (lote) {
        if (modelo === 'todos' || lote.modelo === modelo) {
            document.getElementById('filtroLote').add(new Option(lote.id, lote.id));
        }
    });
}
function atualizar() {
    var modelo = document.getElementById('filtroProjeto').value;
    var loteId = document.getElementById('filtroLote').value;
    var dias = Number(document.getElementById('filtroJanela').value);
    resultados = lotes.filter(function (lote) {
        return (modelo === 'todos' || lote.modelo === modelo) && (loteId === 'todos' || lote.id === loteId);
    }).map(function (lote) { return analisar(lote, dias); });
    var inicio = new Date(referencia - dias * 86400000).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    document.getElementById('escopo').textContent = 'Histórico de operação simulado · ' + inicio + ' a 11/11/2026, 12h (Brasília) · ' + resultados.length + ' lote(s).';
    var riscos = resultados.filter(function (r) { return r.horas !== null; });
    document.getElementById('kpiRisco').textContent = riscos.length + ' / ' + resultados.length;
    document.getElementById('detalheRisco').textContent = 'Lotes com cruzamento futuro elegível. Horizonte de 24 h a partir do último ponto observado de cada lote.';
    var unidadesFiltradas = resultados.flatMap(function (r) { return r.unidades; });
    var comDados = unidadesFiltradas.filter(function (u) { return u.dados.length > 0; });
    var acimaLimite = comDados.filter(function (u) { return u.acimaLimite; });
    document.getElementById('kpiLimite').textContent = comDados.length ? acimaLimite.length + ' / ' + comDados.length : '—';
    document.getElementById('kpiAjuste').textContent = resultados.filter(function (r) { return r.elegivel; }).length + ' / ' + resultados.length;
    var recentes = 0, unidades = 0;
    resultados.forEach(function (r) { recentes += r.recentes; unidades += r.lote.unidades; });
    document.getElementById('kpiCobertura').textContent = unidades ? numero(recentes / unidades * 100, 0) + '%' : '—';
    document.getElementById('detalheCobertura').textContent = recentes + ' de ' + unidades + ' unidades com leitura nas últimas 24 h; referência fixa da demonstração.';
    var prioridade = resultados.find(function (r) { return r.pico >= 85; }) || riscos[0] || resultados.find(function (r) { return !r.elegivel; }) || resultados[0];
    document.getElementById('tituloPrioridade').textContent = prioridade ? prioridade.lote.id + ' · ' + acao(prioridade) : 'Nenhum lote no filtro';
    document.getElementById('acaoPrioridade').textContent = prioridade ? 'Pico de ' + numero(prioridade.pico, 1) + ' °C frente ao limite de 85 °C. ' + textoProjecao(prioridade) + '. Consulte as evidências técnicas antes de decidir.' : 'Selecione outro modelo ou lote.';
    atualizarTabela();
    atualizarGraficos();
}
function atualizarTabela() {
    document.getElementById('tabelaResultados').innerHTML = resultados.map(function (r) {
        return '<tr><td><strong>' + r.lote.modelo + '</strong><small>' + r.lote.id + ' · ' + r.dados.length + ' leituras</small></td>' +
            '<td>' + (r.media === null ? '—' : numero(r.media, 1) + ' / ' + numero(r.pico, 1)) + '</td>' +
            '<td>' + (r.desvio === null ? '—' : numero(r.desvio, 2)) + '</td>' +
            '<td>' + (r.ajuste ? numero(r.ajuste.a, 2) : '—') + '</td>' +
            '<td>' + (r.ajuste ? numero(r.ajuste.r2, 2) : '—') + '</td>' +
            '<td>' + r.recentes + ' / ' + r.lote.unidades + '</td><td>' + textoProjecao(r) + '</td>' +
            '<td><span class="estado ' + (r.pico >= 85 || r.horas !== null ? 'falha' : r.elegivel ? 'ok' : 'pendente') + '">' + acao(r) + '</span>' +
            '<button class="botao secundario detalhes" data-lote="' + r.lote.id + '" type="button">Investigar equipamentos</button></td></tr>';
    }).join('') || '<tr><td colspan="8">Nenhuma leitura para os filtros selecionados.</td></tr>';
    document.querySelectorAll('[data-lote]').forEach(function (botao) {
        botao.onclick = function () { abrirDetalhes(botao.dataset.lote); };
    });
}
function desenhar(id, erro, configuracao) {
    if (graficos[id]) graficos[id].destroy();
    var disponivel = typeof Chart !== 'undefined' && resultados.some(function (r) { return r.dados.length; });
    document.getElementById(id).hidden = !disponivel;
    document.getElementById(erro).hidden = disponivel;
    document.getElementById(erro).textContent = 'Gráfico indisponível. Consulte os mesmos resultados na tabela.';
    if (disponivel) graficos[id] = new Chart(document.getElementById(id), configuracao);
}
function atualizarGraficos() {
    var series = [];
    var inicio = 0;
    var fim = -Infinity;
    resultados.forEach(function (r) {
        if (!r.pontos.length) return;
        var primeiro = r.pontos[0].x;
        inicio = Math.min(inicio, primeiro);
        fim = Math.max(fim, r.fim + (r.elegivel ? 24 : 0));
        series.push({ label: r.lote.id + ' · médias', data: r.pontos, backgroundColor: r.lote.cor, borderColor: r.lote.cor, pointRadius: 2 });
        if (document.getElementById('filtroLote').value !== 'todos') {
            ['minimo', 'maximo'].forEach(function (campo) {
                series.push({
                    label: campo === 'minimo' ? 'Mínimo observado' : 'Máximo observado',
                    data: r.pontos.map(function (p) { return { x: p.x, y: p[campo] }; }),
                    borderColor: '#746787',
                    backgroundColor: '#746787',
                    borderDash: [3, 3],
                    showLine: true,
                    pointRadius: 2
                });
            });
        }
        if (!r.ajuste) return;
        series.push({ label: r.lote.id + ' · ajuste', data: [{ x: primeiro, y: r.ajuste.b + r.ajuste.a * primeiro }, { x: r.fim, y: r.ajuste.b + r.ajuste.a * r.fim }], borderColor: r.lote.cor, showLine: true, pointRadius: 0 });
        if (r.elegivel) series.push({ label: r.lote.id + ' · projeção', data: [{ x: r.fim, y: r.ajuste.b + r.ajuste.a * r.fim }, { x: r.fim + 24, y: r.ajuste.b + r.ajuste.a * (r.fim + 24) }], borderColor: r.lote.cor, borderDash: [6, 5], showLine: true, pointRadius: 0 });
    });
    if (series.length) series.push({ label: 'Limite térmico · 85 °C', data: [{ x: inicio, y: 85 }, { x: fim, y: 85 }], borderColor: '#666666', borderDash: [2, 4], showLine: true, pointRadius: 0 });
    desenhar('graficoTendencia', 'erroTendencia', { type: 'scatter', data: { datasets: series }, options: {
        responsive: true, maintainAspectRatio: false, animation: false,
        plugins: {
            legend: { labels: { boxWidth: 9, font: { size: 10 } } },
            tooltip: { callbacks: { title: function (itens) { return dataNoEixo(itens[0].parsed.x); } } }
        },
        scales: { x: eixoColetas(), y: { title: { display: true, text: 'Temperatura média da CPU (°C)' } } }
    } });
    desenhar('graficoDispersao', 'erroDispersao', { type: 'bar', data: {
        labels: resultados.map(function (r) { return r.lote.id; }),
        datasets: [{ label: 'Desvio padrão (°C)', data: resultados.map(function (r) { return r.desvio; }), backgroundColor: resultados.map(function (r) { return r.lote.cor; }) }]
    }, options: { responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { display: false } }, scales: { x: { title: { display: true, text: 'Lote' } }, y: { beginAtZero: true, title: { display: true, text: 'Desvio padrão (°C)' } } } } });
}
function abrirDetalhes(id) {
    var r = resultados.find(function (item) { return item.lote.id === id; });
    var recursos = r.dados.filter(function (l) { return l.cpu >= 95 || l.ram >= 90 || l.discoLivre < 20; }).length;
    var rede = r.dados.reduce(function (total, l) { return total + l.novosErrosRede; }, 0);
    document.getElementById('tituloDetalhes').textContent = r.lote.id + ' · Evidências simuladas';
    document.getElementById('conteudoDetalhes').innerHTML = '<p>' + r.dados.length + ' leituras no período selecionado. ' + r.recentes + ' de ' + r.lote.unidades + ' unidades com coleta nas últimas 24 h.</p>' +
        '<h3>Comportamento térmico</h3><p>Média ' + numero(r.media, 1) + ' °C · pico ' + numero(r.pico, 1) + ' °C · limite 85 °C. ' + textoProjecao(r) + '.</p>' +
        '<h3>Recursos e estabilidade</h3><p>' + recursos + ' leituras ultrapassam os critérios de CPU ≥ 95%, RAM ≥ 90% ou disco livre &lt; 20%. ' + rede + ' novos erros de rede simulados no período.</p>' +
        '<h3>Próxima verificação</h3><p>' + acao(r) + '. Confira as unidades individualmente e compare períodos com condições de operação semelhantes. A tendência do lote pode ocultar diferenças entre unidades.</p>';
    var seletor = document.getElementById('filtroUnidade');
    seletor.replaceChildren();
    r.unidades.forEach(function (unidade) {
        var texto = unidade.serie;
        if (unidade.acimaLimite) texto += ' · limite atingido';
        if (!unidade.recente) texto += ' · sem coleta recente';
        seletor.add(new Option(texto, unidade.serie));
    });
    seletor.onchange = function () {
        mostrarUnidade(r.unidades.find(function (u) { return u.serie === seletor.value; }));
    };
    document.getElementById('detalhesLote').showModal();
    seletor.onchange();
}
function mostrarUnidade(unidade) {
    var resumo = document.getElementById('resumoUnidade');
    var areaGrafico = document.getElementById('areaGraficoUnidade');
    var erro = document.getElementById('erroUnidade');
    if (graficos.graficoUnidade) {
        graficos.graficoUnidade.destroy();
        delete graficos.graficoUnidade;
    }
    areaGrafico.hidden = true;
    erro.hidden = true;
    if (!unidade.dados.length) {
        resumo.textContent = 'Sem leituras para este equipamento no período selecionado.';
        return;
    }

    var pontos = unidade.dados.map(function (l) {
        return { x: (l.instante - referencia) / horaEmMs, y: l.temperatura };
    }).sort(function (a, b) { return a.x - b.x; });
    var primeiro = pontos[0].x;
    var ultimo = pontos[pontos.length - 1].x;
    var ajuste = regressao(pontos);
    var pico = Math.max.apply(null, pontos.map(function (p) { return p.y; }));
    resumo.textContent = pontos.length + ' leituras de ' + dataNoEixo(primeiro) + ' a ' + dataNoEixo(ultimo) + ' (Brasília) · ' +
        'Pico de ' + numero(pico, 1) + ' °C · limite de 85 °C. ' +
        (ajuste ? 'Tendência de ' + numero(ajuste.a, 2) + ' °C/h · R² ' + numero(ajuste.r2, 2) + '.' : 'Dados insuficientes para ajustar uma reta.') +
        (unidade.recente ? '' : ' Sem coleta nas últimas 24 h.');
    if (typeof Chart === 'undefined') {
        erro.hidden = false;
        erro.textContent = 'Gráfico indisponível. O resumo das leituras está acima.';
        return;
    }

    var series = [
        { label: 'Temperatura simulada', data: pontos, borderColor: '#7654ab', backgroundColor: '#7654ab', pointRadius: 2 },
        { label: 'Limite de 85 °C', data: [{ x: primeiro, y: 85 }, { x: ultimo, y: 85 }], borderColor: '#61616a', borderDash: [3, 4], pointRadius: 0, showLine: true }
    ];
    if (ajuste) {
        series.push({
            label: 'Regressão linear',
            data: [{ x: primeiro, y: ajuste.b + ajuste.a * primeiro }, { x: ultimo, y: ajuste.b + ajuste.a * ultimo }],
            borderColor: '#147c74',
            borderDash: [6, 4],
            pointRadius: 0,
            showLine: true
        });
    }
    areaGrafico.hidden = false;
    graficos.graficoUnidade = new Chart(document.getElementById('graficoUnidade'), {
        type: 'scatter',
        data: { datasets: series },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: { tooltip: { callbacks: { title: function (itens) { return dataNoEixo(itens[0].parsed.x); } } } },
            scales: {
                x: eixoColetas(),
                y: { title: { display: true, text: 'Temperatura da CPU (°C)' } }
            }
        }
    });
}
function exportar() {
    var linhas = [['Dados simulados', 'Media_C', 'Pico_C', 'Desvio_C', 'Tendencia_C_h', 'R2', 'Unidades_recentes', 'Unidades_total', 'Projecao', 'Periodo_dias', 'Referencia']];
    resultados.forEach(function (r) { linhas.push([r.lote.id, r.media, r.pico, r.desvio, r.ajuste ? r.ajuste.a : '', r.ajuste ? r.ajuste.r2 : '', r.recentes, r.lote.unidades, textoProjecao(r), document.getElementById('filtroJanela').value, '2026-11-11T12:00:00-03:00']); });
    var csv = '\uFEFF' + linhas.map(function (linha) { return linha.map(function (v) { return '"' + String(v).replaceAll('"', '""') + '"'; }).join(';'); }).join('\r\n');
    var url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    var link = document.createElement('a'); link.href = url; link.download = 'biotrace-estatistica-simulada.csv'; link.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}
document.addEventListener('DOMContentLoaded', function () {
    if (!exigirCargo(['Administrador', 'Gestor'])) return;
    atualizarLotes();
    document.getElementById('filtroProjeto').onchange = function () { atualizarLotes(); atualizar(); };
    document.getElementById('filtroLote').onchange = atualizar;
    document.getElementById('filtroJanela').onchange = atualizar;
    document.getElementById('limparFiltros').onclick = function () {
        document.getElementById('filtroProjeto').value = 'todos';
        document.getElementById('filtroJanela').value = '30'; atualizarLotes(); atualizar();
    };
    document.getElementById('fecharDetalhes').onclick = function () { document.getElementById('detalhesLote').close(); };
    document.getElementById('exportarResumo').onclick = exportar;
    atualizar();
});
