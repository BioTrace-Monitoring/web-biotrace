const filtroPeriodo = document.getElementById('period');
const filtroComponente = document.getElementById('metric');
const statusKpis = document.getElementById('kpi-status');
let ultimaBuscaKpis = 0;
let ultimaBuscaDistribuicao = 0;
let ultimaBuscaMapaCalor = 0;
let ultimaBuscaLocalizacoes = 0;
let ultimaBuscaEvolucao = 0;
let graficoEvolucao = null;

function atualizarReferenciaDasVariacoes() {
    const dias = filtroPeriodo.value;

    document.querySelectorAll('.trend-reference').forEach((referencia) => {
        referencia.textContent = `vs. ${dias} dias anteriores`;
    });
}

function limparKpis() {
    document.querySelectorAll('.kpi strong').forEach((valor) => {
        valor.textContent = '—';
    });

    document.querySelectorAll('.kpi .trend').forEach((tag) => {
        tag.textContent = '—';
        tag.classList.remove('trend--favorable', 'trend--unfavorable');
    });

}

async function carregarKpis() {
    const busca = ++ultimaBuscaKpis;
    const idEmpresa = localStorage.getItem('FK_EMPRESA');

    limparKpis();
    atualizarReferenciaDasVariacoes();
    statusKpis.textContent = 'Carregando KPIs...';
    statusKpis.classList.remove('kpi-status--error');
    statusKpis.hidden = false;

    const parametros = new URLSearchParams({
        dias: filtroPeriodo.value,
        componente: filtroComponente.value
    });

    try {
        if (!idEmpresa) {
            throw new Error('Empresa não encontrada. Faça login novamente.');
        }

        const resposta = await fetch(
            `/dashboard-alertas/${encodeURIComponent(idEmpresa)}/kpis?${parametros}`
        );

        if (!resposta.ok) {
            throw new Error(`Erro ao buscar KPIs.`);
        }

        const dados = await resposta.json();

        // Uma busca antiga não deve substituir o resultado do filtro mais recente.
        if (busca !== ultimaBuscaKpis) return;

        document.getElementById("episodes").textContent =
            dados.novos_episodios.atual;

        document.getElementById("normalized").textContent =
            dados.episodios_normalizados.atual;

        document.getElementById("in-progress").textContent =
            dados.episodios_em_andamento.atual;

        document.getElementById("affected-equipment").textContent =
            dados.equipamentos_afetados.atual;

        atualizarTrend(
            "episodes",
            dados.novos_episodios.variacao_percentual
        );

        atualizarTrend(
            "normalized",
            dados.episodios_normalizados.variacao_percentual,
            null
        );

        atualizarTrend(
            "affected-equipment",
            dados.equipamentos_afetados.variacao_percentual
        );

        statusKpis.hidden = true;
    } catch (error) {
        if (busca !== ultimaBuscaKpis) return;

        limparKpis();
        statusKpis.textContent = idEmpresa
            ? 'Não foi possível carregar as KPIs. Tente novamente alterando os filtros.'
            : 'Empresa não encontrada. Faça login novamente.';
        statusKpis.classList.add('kpi-status--error');
        statusKpis.hidden = false;
        console.error("Erro ao carregar KPIs:", error);
    }
}

async function carregarDistribuicao() {
    const busca = ++ultimaBuscaDistribuicao;
    const idEmpresa = localStorage.getItem('FK_EMPRESA');
    const componente = filtroComponente.value;
    const donut = document.getElementById('donut');
    const legenda = document.getElementById('legend');
    const nomesComponentes = { cpu: 'CPU', memoria: 'Memória RAM', disco: 'Disco' };

    document.getElementById('distribution-title').textContent = componente === 'all'
        ? 'Alertas por componente'
        : `Alertas de ${nomesComponentes[componente]} por métrica`;
    document.getElementById('countPill').textContent = '— episódios';
    document.getElementById('donutTotal').textContent = '—';
    document.getElementById('donut-caption').textContent = 'episódios';
    donut.style.background = '#ece9ef';
    legenda.textContent = 'Carregando distribuição...';

    const parametros = new URLSearchParams({
        dias: filtroPeriodo.value,
        componente
    });

    try {
        if (!idEmpresa) throw new Error('Empresa não encontrada. Faça login novamente.');

        const resposta = await fetch(
            `/dashboard-alertas/${encodeURIComponent(idEmpresa)}/distribuicao?${parametros}`
        );
        if (!resposta.ok) {
            if (resposta.status === 404) {
                throw new Error('Rota da distribuição não encontrada (HTTP 404). Reinicie o servidor web.');
            }
            throw new Error(`Erro ao buscar distribuição (HTTP ${resposta.status}). Confira o terminal do servidor web.`);
        }

        const dados = await resposta.json();
        if (busca !== ultimaBuscaDistribuicao) return;

        renderizarDistribuicao(dados);
    } catch (error) {
        if (busca !== ultimaBuscaDistribuicao) return;
        legenda.textContent = idEmpresa
            ? error.message
            : 'Empresa não encontrada. Faça login novamente.';
        console.error('Erro ao carregar distribuição:', error);
    }
}

function renderizarDistribuicao(dados) {
    const donut = document.getElementById('donut');
    const legenda = document.getElementById('legend');
    const cores = {
        CPU: '#7046b5',
        'Memória RAM': '#298a83',
        Disco: '#487bb7',
        cpu_percent: '#7046b5',
        temperatura_cpu: '#b49ad8',
        memoria_percent: '#298a83',
        memoria_disponivel_gb: '#85c5bd',
        disco_percent: '#487bb7',
        disco_livre_gb: '#9abbe1'
    };

    document.getElementById('countPill').textContent = `${dados.total} episódios`;
    document.getElementById('donutTotal').textContent = dados.total;
    legenda.replaceChildren();

    if (dados.total === 0) {
        donut.style.background = '#ece9ef';
        legenda.textContent = 'Sem episódios no período selecionado.';
        return;
    }

    let acumulado = 0;
    const fatias = dados.itens.map((item, indice) => {
        const cor = cores[item.categoria] ?? '#85808b';
        const inicio = acumulado;
        acumulado += item.quantidade / dados.total * 100;
        const fim = indice === dados.itens.length - 1 ? 100 : acumulado;

        const linha = document.createElement('div');
        linha.className = 'legend-row';
        const ponto = document.createElement('span');
        ponto.className = 'legend-dot';
        ponto.style.background = cor;
        const descricao = document.createElement('div');
        descricao.className = 'legend-details';
        const nome = document.createElement('span');
        nome.className = 'legend-name';
        nome.textContent = item.nome;
        const valor = document.createElement('strong');
        const unidade = item.quantidade === 1 ? 'episódio' : 'episódios';
        valor.textContent = `${item.quantidade} ${unidade} · ${item.percentual.toLocaleString('pt-BR')}% do total`;
        descricao.append(nome, valor);
        linha.append(ponto, descricao);
        legenda.append(linha);

        return `${cor} ${inicio}% ${fim}%`;
    });

    donut.style.background = `conic-gradient(${fatias.join(', ')})`;
}

async function carregarMapaCalor() {
    const busca = ++ultimaBuscaMapaCalor;
    const idEmpresa = localStorage.getItem('FK_EMPRESA');
    const mapa = document.getElementById('heatmap');
    const status = document.getElementById('heatmap-status');
    const pico = document.getElementById('heatmap-peak');

    mapa.replaceChildren();
    pico.textContent = 'Pico: —';
    pico.title = '';
    status.textContent = 'Carregando mapa de calor...';
    status.hidden = false;
    status.classList.remove('heatmap-status--error');

    const parametros = new URLSearchParams({
        dias: filtroPeriodo.value,
        componente: filtroComponente.value
    });

    try {
        if (!idEmpresa) throw new Error('Empresa não encontrada. Faça login novamente.');

        const resposta = await fetch(
            `/dashboard-alertas/${encodeURIComponent(idEmpresa)}/mapa-calor?${parametros}`
        );
        if (!resposta.ok) {
            if (resposta.status === 404) {
                throw new Error('Rota do mapa de calor não encontrada (HTTP 404). Reinicie o servidor web.');
            }
            throw new Error(`Erro ao buscar mapa de calor (HTTP ${resposta.status}). Confira o terminal do servidor web.`);
        }

        const dados = await resposta.json();
        if (busca !== ultimaBuscaMapaCalor) return;

        renderizarMapaCalor(dados);
        status.textContent = dados.total === 0 ? 'Sem episódios no período selecionado.' : '';
        status.hidden = dados.total !== 0;
    } catch (error) {
        if (busca !== ultimaBuscaMapaCalor) return;
        mapa.replaceChildren();
        status.textContent = error.message;
        status.classList.add('heatmap-status--error');
        status.hidden = false;
        console.error('Erro ao carregar mapa de calor:', error);
    }
}

function renderizarMapaCalor(dados) {
    const mapa = document.getElementById('heatmap');
    const pico = document.getElementById('heatmap-peak');
    mapa.replaceChildren();
    mapa.append(document.createElement('span'));

    dados.faixas.forEach((faixa) => {
        const horario = document.createElement('span');
        horario.className = 'heat-time';
        horario.textContent = faixa;
        mapa.append(horario);
    });

    dados.dias.forEach((dia) => {
        const nome = document.createElement('span');
        nome.className = 'heat-day';
        nome.textContent = dia.nome;
        mapa.append(nome);

        dia.celulas.forEach((celula, indice) => {
            const bloco = document.createElement('span');
            bloco.className = `heat-cell h${celula.nivel}`;
            bloco.textContent = celula.quantidade;
            const descricao = celula.quantidade === 1 ? 'episódio confirmado' : 'episódios confirmados';
            bloco.title = `${dia.nome}, ${dados.faixas[indice]}h: ${celula.quantidade} ${descricao} (Brasília, UTC−3)`;
            mapa.append(bloco);
        });
    });

    if (dados.picos.length === 0) {
        pico.textContent = 'Pico: sem episódios';
        return;
    }

    const primeiro = dados.picos[0];
    const unidade = primeiro.quantidade === 1 ? 'episódio' : 'episódios';
    pico.textContent = dados.picos.length === 1
        ? `Pico: ${primeiro.dia}, ${primeiro.faixa}h · ${primeiro.quantidade} ${unidade}`
        : `Pico: ${dados.picos.length} faixas empatadas · ${primeiro.quantidade} ${unidade} cada`;
    pico.title = dados.picos.map((item) => `${item.dia}, ${item.faixa}h: ${item.quantidade} ${unidade}`).join('; ');
}

async function carregarLocalizacoes() {
    const busca = ++ultimaBuscaLocalizacoes;
    const idEmpresa = localStorage.getItem('FK_EMPRESA');
    const container = document.getElementById('locations');
    container.classList.remove('locations--error');
    container.textContent = 'Carregando localizações...';

    const parametros = new URLSearchParams({
        dias: filtroPeriodo.value,
        componente: filtroComponente.value
    });

    try {
        if (!idEmpresa) throw new Error('Empresa não encontrada. Faça login novamente.');

        const resposta = await fetch(
            `/dashboard-alertas/${encodeURIComponent(idEmpresa)}/localizacoes?${parametros}`
        );
        if (!resposta.ok) {
            if (resposta.status === 404) {
                throw new Error('Rota das localizações não encontrada (HTTP 404). Reinicie o servidor web.');
            }
            throw new Error(`Erro ao buscar localizações (HTTP ${resposta.status}). Confira o terminal do servidor web.`);
        }

        const dados = await resposta.json();
        if (busca !== ultimaBuscaLocalizacoes) return;
        renderizarLocalizacoes(dados);
    } catch (error) {
        if (busca !== ultimaBuscaLocalizacoes) return;
        container.textContent = error.message;
        container.classList.add('locations--error');
        console.error('Erro ao carregar localizações:', error);
    }
}

function renderizarLocalizacoes(dados) {
    const container = document.getElementById('locations');
    container.replaceChildren();

    if (dados.locais.length === 0) {
        container.textContent = 'Nenhum local com novos episódios no período selecionado.';
        return;
    }

    dados.locais.forEach((local) => {
        const linha = document.createElement('div');
        linha.className = 'location-row';
        if (local.id_hospital === null) linha.classList.add('location-row--unassigned');

        const cabecalho = document.createElement('div');
        cabecalho.className = 'location-heading';
        const nome = document.createElement('strong');
        nome.textContent = local.nome_hospital;
        const proporcao = document.createElement('span');
        proporcao.className = 'location-ratio';
        proporcao.textContent = `${local.percentual_afetados.toLocaleString('pt-BR')}% afetados`;
        cabecalho.append(nome, proporcao);

        const indicadores = document.createElement('div');
        indicadores.className = 'location-stats';
        const equipamentos = document.createElement('div');
        equipamentos.className = 'location-stat location-stat--affected';
        const quantidadeEquipamentos = document.createElement('strong');
        quantidadeEquipamentos.textContent = `${local.equipamentos_afetados} de ${local.total_equipamentos}`;
        const rotuloEquipamentos = document.createElement('span');
        rotuloEquipamentos.textContent = 'equipamentos afetados';
        equipamentos.append(quantidadeEquipamentos, rotuloEquipamentos);

        const episodios = document.createElement('div');
        episodios.className = 'location-stat location-stat--episodes';
        const quantidadeEpisodios = document.createElement('strong');
        quantidadeEpisodios.textContent = local.total_episodios;
        const rotuloEpisodios = document.createElement('span');
        rotuloEpisodios.textContent = 'episódios no período';
        episodios.append(quantidadeEpisodios, rotuloEpisodios);
        indicadores.append(equipamentos, episodios);

        const barra = document.createElement('div');
        barra.className = 'location-bar';
        const preenchimento = document.createElement('span');
        preenchimento.style.width = `${local.percentual_afetados}%`;
        barra.append(preenchimento);
        linha.append(cabecalho, indicadores, barra);

        if (local.id_hospital === null) {
            const observacao = document.createElement('small');
            observacao.className = 'location-note';
            observacao.textContent = 'Hospital não informado no cadastro dos equipamentos.';
            linha.append(observacao);
        }

        container.append(linha);
    });
}

async function carregarEvolucao() {
    const busca = ++ultimaBuscaEvolucao;
    const idEmpresa = localStorage.getItem('FK_EMPRESA');
    const canvas = document.getElementById('evolution-chart');
    const status = document.getElementById('evolution-status');

    if (graficoEvolucao) {
        graficoEvolucao.destroy();
        graficoEvolucao = null;
    }
    canvas.hidden = true;
    document.getElementById('evolution-total').textContent = '— episódios';
    status.textContent = 'Carregando evolução...';
    status.hidden = false;
    status.classList.remove('chart-status--error');

    const parametros = new URLSearchParams({
        dias: filtroPeriodo.value,
        componente: filtroComponente.value
    });

    try {
        if (!idEmpresa) throw new Error('Empresa não encontrada. Faça login novamente.');
        const resposta = await fetch(
            `/dashboard-alertas/${encodeURIComponent(idEmpresa)}/evolucao?${parametros}`
        );
        if (!resposta.ok) {
            if (resposta.status === 404) {
                throw new Error('Rota da evolução não encontrada (HTTP 404). Reinicie o servidor web.');
            }
            throw new Error(`Erro ao buscar evolução (HTTP ${resposta.status}). Confira o terminal do servidor web.`);
        }

        const dados = await resposta.json();
        if (busca !== ultimaBuscaEvolucao) return;
        if (typeof Chart === 'undefined') throw new Error('Não foi possível carregar o gráfico. Atualize a página.');

        canvas.hidden = false;
        graficoEvolucao = new Chart(canvas, {
            type: 'line',
            data: {
                labels: dados.pontos.map((ponto) => ponto.rotulo),
                datasets: [{
                    label: 'Novos episódios',
                    data: dados.pontos.map((ponto) => ponto.quantidade),
                    borderColor: '#7046b5',
                    backgroundColor: '#7046b514',
                    borderWidth: 2,
                    fill: true,
                    tension: 0,
                    pointRadius: dados.pontos.length <= 14 ? 3 : 0,
                    pointHoverRadius: 5,
                    pointHitRadius: 12
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: (itens) => dados.pontos[itens[0].dataIndex].data.split('-').reverse().join('/'),
                            label: (item) => `${item.parsed.y} ${item.parsed.y === 1 ? 'episódio' : 'episódios'}`
                        }
                    }
                },
                scales: {
                    x: { grid: { display: false }, ticks: { maxTicksLimit: 10, maxRotation: 0, color: '#6f6877' } },
                    y: {
                        beginAtZero: true,
                        suggestedMax: 1,
                        title: { display: true, text: 'Novos episódios' },
                        ticks: { precision: 0, color: '#6f6877' },
                        grid: { color: '#ece9ef' }
                    }
                }
            }
        });
        document.getElementById('evolution-total').textContent = `${dados.total} episódios`;
        status.textContent = dados.total === 0 ? 'Sem novos episódios no período selecionado.' : '';
        status.hidden = dados.total !== 0;
    } catch (error) {
        if (busca !== ultimaBuscaEvolucao) return;
        canvas.hidden = true;
        status.textContent = error.message;
        status.classList.add('chart-status--error');
        status.hidden = false;
        console.error('Erro ao carregar evolução:', error);
    }
}

function atualizarTrend(id, variacao, aumentoFavoravel = false) {
    const card = document.getElementById(id).closest(".kpi");
    const tag = card.querySelector(".trend");

    tag.classList.remove("trend--favorable", "trend--unfavorable");

    if (variacao === null) {
        tag.textContent = "Sem base";
        return;
    }

    if (variacao === 0) {
        tag.textContent = "→ 0%";
        return;
    }

    const aumentou = variacao > 0;
    const favoravel = aumentou === aumentoFavoravel;
    const seta = aumentou ? "↗" : "↘";

    tag.textContent =
        `${seta} ${Math.abs(variacao).toLocaleString("pt-BR")}%`;

    // Sem indicar melhora ou piora para indicadores de interpretação neutra.
    if (aumentoFavoravel === null) return;

    tag.classList.add(
        favoravel ? "trend--favorable" : "trend--unfavorable"
    );
}

function carregarDashboard() {
    carregarKpis();
    carregarDistribuicao();
    carregarMapaCalor();
    carregarLocalizacoes();
    carregarEvolucao();
}

filtroPeriodo.addEventListener('change', carregarDashboard);
filtroComponente.addEventListener('change', carregarDashboard);
carregarDashboard();
