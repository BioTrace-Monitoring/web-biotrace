const HORA_MS = 3600000;
const CORES = ['#ba4055', '#147c74', '#7654ab', '#986307', '#27689c'];
const dataBR = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit'
});
const graficos = {};
let catalogo, analise, consultaLotes;

function el(id) {
    return document.getElementById(id);
}

function numero(valor, casas = 1) {
    if (!Number.isFinite(valor)) return '—';
    return valor.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

function dataCurta(instante) {
    return instante ? dataBR.format(new Date(instante)) : '—';
}

async function consultar(caminho, signal) {
    const resposta = await fetch('/engenharia/' + caminho, {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') },
        signal
    });
    const dados = await resposta.json();
    if (!resposta.ok) throw new Error(dados.mensagem || dados.erro || 'Falha ao consultar a API.');
    return dados;
}

function preencherLotes() {
    const modelo = el('filtroProjeto').value;
    el('filtroLote').replaceChildren(new Option('Todos os lotes', ''));
    catalogo.lotes.filter(lote => !modelo || String(lote.fk_modelo_equipamento) === modelo)
        .forEach(lote => el('filtroLote').add(new Option(lote.numero_lote, lote.id_lote_equipamento)));
}

async function atualizar() {
    consultaLotes?.abort();
    const consulta = new AbortController();
    consultaLotes = consulta;
    el('resultadosAnalise').hidden = true;
    el('exportarResumo').hidden = true;
    el('tentarNovamente').hidden = true;
    el('escopo').textContent = 'Carregando a análise térmica…';
    try {
        if (!catalogo) {
            catalogo = await consultar('catalogos', consulta.signal);
            catalogo.modelos.forEach(modelo => {
                el('filtroProjeto').add(new Option(modelo.nome_modelo, modelo.id_modelo_equipamento));
            });
            preencherLotes();
        }
        const modelo = el('filtroProjeto').value;
        const lote = el('filtroLote').value;
        const query = new URLSearchParams({ dias: el('filtroJanela').value });
        if (lote) query.set('lote', lote);
        const resposta = await consultar('analise-termica?' + query, consulta.signal);
        if (consulta.signal.aborted) return;
        analise = resposta;
        analise.lotes = resposta.lotes.filter(item => !modelo || String(item.fk_modelo_equipamento) === modelo);
        mostrarAnalise();
    } catch (erro) {
        if (consulta.signal.aborted) return;
        el('escopo').textContent = 'Não foi possível carregar a análise. ' + erro.message;
        el('tentarNovamente').hidden = false;
    }
}

function textoProjecao(projecao) {
    const mensagens = {
        sem_dados: 'Sem dados térmicos',
        sem_limite: 'Nenhum limite térmico ativo',
        limites_diferentes: 'Limites diferentes entre as unidades',
        series_divergentes: 'Histórico inclui séries fora da análise atual',
        cobertura_insuficiente: 'Coleta térmica recente insuficiente',
        ajuste_insuficiente: 'Ajuste insuficiente para projetar',
        no_limite: 'Média ajustada no limite ou acima',
        sem_cruzamento: 'Sem cruzamento estimado em 24 h',
        cruzamento: 'Cruzamento estimado em ' + dataCurta(projecao.cruzamento_em)
    };
    return mensagens[projecao.estado];
}

function acao(lote) {
    const { unidades_no_limite, unidades_avaliadas_no_periodo, unidades_com_coleta_recente, unidades_cadastradas } = lote.cobertura;
    if (unidades_no_limite) return `Limite atingido em ${unidades_no_limite} de ${unidades_avaliadas_no_periodo} unidades avaliadas`;
    if (lote.projecao.estado === 'cruzamento' || lote.projecao.estado === 'no_limite') return 'Verificar a dissipação térmica';
    if (unidades_com_coleta_recente < unidades_cadastradas) return `Coleta recente em ${unidades_com_coleta_recente} de ${unidades_cadastradas} unidades`;
    if (lote.estatisticas.series_fora_da_analise.length) return 'Revisar a composição do lote no histórico';
    if (!lote.horas.length) return 'Aguardar leituras de temperatura';
    return 'Acompanhar a tendência térmica';
}

function mostrarAnalise() {
    const { lotes, periodo, referencia_em } = analise;
    const comHistorico = lotes.filter(lote => lote.horas.length);
    const projetados = lotes.filter(lote => lote.projecao.a_partir_de);
    const cruzamentos = projetados.filter(lote => lote.projecao.estado === 'cruzamento');
    const soma = campo => lotes.reduce((total, lote) => total + lote.cobertura[campo], 0);
    const cadastradas = soma('unidades_cadastradas');
    const recentes = soma('unidades_com_coleta_recente');
    const avaliadas = soma('unidades_avaliadas_no_periodo');
    const ultima = Math.max(...comHistorico.map(lote => Date.parse(lote.estatisticas.ultima_leitura_termica_em)));
    const intervalo = dataCurta(periodo.inicio) + ' a ' + dataCurta(periodo.fim_exclusivo) + ' (Brasília)';
    el('escopo').textContent = !comHistorico.length
        ? 'Sem leituras térmicas para os filtros selecionados · ' + intervalo
        : intervalo + ' · ' + lotes.length + ' lote(s) · Última leitura térmica: ' + dataCurta(ultima);
    el('kpiRisco').textContent = projetados.length ? cruzamentos.length + ' / ' + projetados.length : '—';
    el('detalheRisco').textContent = projetados.length ? 'Entre os lotes com projeção disponível.' : 'Nenhum lote apto para projeção no período.';
    el('kpiLimite').textContent = avaliadas ? soma('unidades_no_limite') + ' / ' + avaliadas : '—';
    el('kpiAjuste').textContent = comHistorico.length
        ? comHistorico.filter(lote => lote.regressao?.r2 >= 0.7).length + ' / ' + comHistorico.length
        : '—';
    el('kpiCobertura').textContent = cadastradas ? numero(100 * recentes / cadastradas, 0) + '%' : '—';
    el('detalheCobertura').textContent = cadastradas
        ? recentes + ' de ' + cadastradas + ' unidades nas 24 h anteriores a ' + dataCurta(referencia_em) + '.'
        : 'Nenhuma unidade cadastrada nos lotes selecionados.';

    const prioridade = lotes.find(lote => lote.cobertura.unidades_no_limite) || cruzamentos[0] || comHistorico[0] || lotes[0];
    el('tituloPrioridade').textContent = prioridade ? prioridade.numero_lote + ' · ' + acao(prioridade) : 'Nenhum lote nos filtros selecionados';
    el('acaoPrioridade').textContent = prioridade ? textoProjecao(prioridade.projecao) + '.' : '';
    el('exportarResumo').disabled = !lotes.length;
    el('exportarResumo').hidden = false;
    el('resultadosAnalise').hidden = false;
    atualizarGraficos(lotes);
}

function desenhar(id, erroId, config) {
    if (graficos[id]) {
        graficos[id].destroy();
        delete graficos[id];
    }
    const temDados = Boolean(config);
    const disponivel = temDados && typeof Chart !== 'undefined';
    el(id).hidden = !disponivel;
    el(erroId).hidden = disponivel;
    el(erroId).textContent = temDados ? 'Gráfico indisponível. Exporte o resumo CSV para consultar as estatísticas por lote.' : 'Sem temperaturas neste período.';
    if (disponivel) graficos[id] = new Chart(el(id), config);
}

function graficoTemperatura(series) {
    return { type: 'scatter', data: { datasets: series }, options: {
        responsive: true, maintainAspectRatio: false, animation: false,
        plugins: {
            legend: { labels: { boxWidth: 10 } },
            tooltip: { callbacks: { title: itens => dataCurta(itens[0].parsed.x) } }
        },
        scales: {
            x: { type: 'linear', title: { display: true, text: 'Horário de Brasília' }, ticks: { callback: dataCurta, maxTicksLimit: 7 } },
            y: { title: { display: true, text: 'Temperatura da CPU (°C)' } }
        }
    }};
}

function linha(label, cor, dados, tracejado = []) {
    return { label, data: dados, borderColor: cor, backgroundColor: cor, pointRadius: 0, showLine: true, borderDash: tracejado };
}

function reta(ajuste, inicio, fim) {
    const origem = Date.parse(ajuste.origem_em);
    return [inicio, fim].map(x => ({
        x, y: ajuste.temperatura_na_origem_c + ajuste.tendencia_c_por_hora * (x - origem) / HORA_MS
    }));
}

function atualizarGraficos(lotes) {
    const series = [];
    let inicio = Infinity, fim = -Infinity;
    lotes.forEach((lote, i) => {
        const pontos = lote.horas.map(hora => ({ x: Date.parse(hora.periodo_inicio), y: hora.media }));
        if (!pontos.length) return;
        const cor = CORES[i % CORES.length];
        const primeiro = pontos[0].x;
        const ultimo = pontos.at(-1).x;
        inicio = Math.min(inicio, primeiro);
        fim = Math.max(fim, ultimo);
        series.push({ label: lote.numero_lote + ' · médias', data: pontos, backgroundColor: cor, pointRadius: 2 });
        if (!lote.regressao) return;
        series.push(linha(lote.numero_lote + ' · ajuste', cor, reta(lote.regressao, primeiro, ultimo)));
        if (lote.projecao.a_partir_de) {
            const base = Date.parse(lote.projecao.a_partir_de);
            const horizonte = base + lote.projecao.horizonte_horas * HORA_MS;
            fim = Math.max(fim, horizonte);
            series.push(linha(lote.numero_lote + ' · projeção', cor, reta(lote.regressao, base, horizonte), [6, 5]));
        }
    });
    const limites = new Set(lotes.filter(lote => lote.horas.length).map(lote => lote.projecao.limite_c));
    const limite = limites.values().next().value;
    if (series.length && limites.size === 1 && Number.isFinite(limite)) {
        series.push(linha('Limite comum · ' + numero(limite) + ' °C', '#666', [{ x: inicio, y: limite }, { x: fim, y: limite }], [3, 3]));
    }
    desenhar('graficoTendencia', 'erroTendencia', series.length ? graficoTemperatura(series) : null);
    desenhar('graficoDispersao', 'erroDispersao', series.length ? {
        type: 'bar',
        data: { labels: lotes.map(lote => lote.numero_lote), datasets: [{
            label: 'Desvio padrão (°C)', data: lotes.map(lote => lote.estatisticas.desvio_padrao_c),
            backgroundColor: lotes.map((_, i) => CORES[i % CORES.length])
        }] },
        options: { responsive: true, maintainAspectRatio: false, animation: false, scales: { y: { beginAtZero: true } } }
    } : null);
}

function exportar() {
    const { lotes, periodo } = analise;
    const linhas = [[
        'Lote', 'Modelo', 'Início UTC', 'Fim exclusivo UTC', 'Última leitura térmica UTC',
        'Leituras válidas', 'Média (°C)', 'Pico (°C)', 'Desvio (°C)', 'Tendência (°C/h)', 'R²',
        'Unidades cadastradas', 'Unidades com coleta recente', 'Unidades avaliadas', 'Unidades no limite',
        'Quantidade de séries fora da análise', 'Projeção', 'Cruzamento estimado UTC'
    ]];
    for (const lote of lotes) {
        const e = lote.estatisticas;
        const c = lote.cobertura;
        linhas.push([lote.numero_lote, lote.nome_modelo, periodo.inicio, periodo.fim_exclusivo,
            e.ultima_leitura_termica_em, e.leituras_validas, e.media_c, e.maximo_c, e.desvio_padrao_c,
            lote.regressao?.tendencia_c_por_hora, lote.regressao?.r2, c.unidades_cadastradas,
            c.unidades_com_coleta_recente, c.unidades_avaliadas_no_periodo, c.unidades_no_limite,
            e.series_fora_da_analise.length, textoProjecao(lote.projecao), lote.projecao.cruzamento_em]);
    }
    const csv = linhas.map(linhaCsv => linhaCsv.map(valor => {
        if (typeof valor === 'number') valor = String(valor).replace('.', ',');
        else if (/^[\s]*[=+@-]/.test(valor ?? '') || /^[\t\r\n]/.test(valor ?? '')) valor = "'" + valor;
        return '"' + String(valor ?? '').replaceAll('"', '""') + '"';
    }).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'biotrace-analise-termica.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

document.addEventListener('DOMContentLoaded', () => {
    if (!exigirCargo(['Administrador', 'Gestor'])) return;
    el('filtroProjeto').onchange = () => { if (catalogo) preencherLotes(); atualizar(); };
    el('filtroLote').onchange = atualizar;
    el('filtroJanela').onchange = atualizar;
    el('tentarNovamente').onclick = atualizar;
    el('limparFiltros').onclick = () => {
        el('filtroProjeto').value = '';
        el('filtroJanela').value = '30';
        if (catalogo) preencherLotes();
        atualizar();
    };
    el('exportarResumo').onclick = exportar;
    atualizar();
});
