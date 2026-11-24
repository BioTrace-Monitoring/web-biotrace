var dashboardAlertasModel = require('../models/dashboardAlertasModel');

function obterFiltros(req, res) {
    var idEmpresa = Number(req.params.idEmpresa);
    var dias = Number(req.query.dias ?? 30);
    var componente = req.query.componente ?? "all";

    if (!Number.isSafeInteger(idEmpresa) || idEmpresa <= 0) {
        res.status(400).json({
            mensagem: "ID da empresa inválido."
        });
        return null;
    }

    if (![7, 30, 90].includes(dias)) {
        res.status(400).json({
            mensagem: "O período deve ser 7, 30 ou 90 dias."
        });
        return null;
    }

    if (!["all", "cpu", "memoria", "disco"].includes(componente)) {
        res.status(400).json({
            mensagem: "Componente inválido."
        });
        return null;
    }

    return { idEmpresa, dias, componente };
}

async function buscarKpis(req, res) {
    var filtros = obterFiltros(req, res);
    if (!filtros) return;
    var { idEmpresa, dias, componente } = filtros;

    var milissegundosPorDia = 24 * 60 * 60 * 1000;
    var duracaoPeriodo = dias * milissegundosPorDia;

    var fimAtual = new Date();
    var inicioAtual = new Date(fimAtual.getTime() - duracaoPeriodo);
    var inicioAnterior = new Date(inicioAtual.getTime() - duracaoPeriodo);
    
    try {
        var [resultadoAtual, resultadoAnterior] = await Promise.all([
            dashboardAlertasModel.buscarKpis(idEmpresa, formatarDataMysql(inicioAtual), formatarDataMysql(fimAtual), componente),
            dashboardAlertasModel.buscarKpis(idEmpresa, formatarDataMysql(inicioAnterior), formatarDataMysql(inicioAtual), componente)
        ]);

        var atual = resultadoAtual[0];
        var anterior = resultadoAnterior[0];


        return res.json({
            novos_episodios: montarKpi(
                atual.novos_episodios,
                anterior.novos_episodios
            ),

            episodios_normalizados: montarKpi(
                atual.episodios_normalizados,
                anterior.episodios_normalizados
            ),

            episodios_em_andamento: { atual: Number(atual.episodios_em_andamento) },

            equipamentos_afetados: montarKpi(
                atual.equipamentos_afetados,
                anterior.equipamentos_afetados
            )
        });
    }
    catch (error) {
        return res.status(500).json({
            mensagem: "Erro ao buscar KPIs."
        });
    }
}

async function buscarDistribuicao(req, res) {
    var filtros = obterFiltros(req, res);
    if (!filtros) return;
    var { idEmpresa, dias, componente } = filtros;
    var fim = new Date();
    var inicio = new Date(fim.getTime() - dias * 24 * 60 * 60 * 1000);

    var nomes = {
        CPU: "CPU",
        "Memória RAM": "Memória RAM",
        Disco: "Disco",
        cpu_percent: "Uso da CPU",
        temperatura_cpu: "Temperatura da CPU",
        memoria_percent: "Uso da memória",
        memoria_disponivel_gb: "Memória disponível",
        disco_percent: "Uso do disco",
        disco_livre_gb: "Espaço livre"
    };

    try {
        var resultado = await dashboardAlertasModel.buscarDistribuicao(
            idEmpresa, formatarDataMysql(inicio), formatarDataMysql(fim), componente
        );
        var total = resultado.reduce((soma, item) => soma + Number(item.quantidade), 0);
        var itens = resultado.map((item) => ({
            categoria: item.categoria,
            nome: nomes[item.categoria] ?? item.categoria,
            quantidade: Number(item.quantidade),
            percentual: total === 0 ? 0 : Number((Number(item.quantidade) / total * 100).toFixed(2))
        }));

        return res.json({ total, itens });
    } catch (error) {
        console.error('[DASHBOARD] Erro ao buscar distribuição:', {
            codigo: error.code,
            mensagem: error.sqlMessage || error.message
        });
        return res.status(500).json({ mensagem: "Erro ao buscar distribuição de alertas." });
    }
}

async function buscarMapaCalor(req, res) {
    var filtros = obterFiltros(req, res);
    if (!filtros) return;
    var { idEmpresa, dias, componente } = filtros;
    var fim = new Date();
    var inicio = new Date(fim.getTime() - dias * 24 * 60 * 60 * 1000);

    try {
        var resultado = await dashboardAlertasModel.buscarMapaCalor(
            idEmpresa, formatarDataMysql(inicio), formatarDataMysql(fim), componente
        );
        var faixas = ['00–04', '04–08', '08–12', '12–16', '16–20', '20–24'];
        var total = 0;
        var maximo = 0;
        var diasSemana = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((nome) => ({
            nome,
            celulas: faixas.map(() => ({ quantidade: 0, nivel: 0 }))
        }));

        for (var item of resultado) {
            var quantidade = Number(item.quantidade);
            diasSemana[Number(item.dia_semana)].celulas[Number(item.faixa_horaria)].quantidade = quantidade;
            total += quantidade;
            maximo = Math.max(maximo, quantidade);
        }

        var picos = [];
        for (var dia of diasSemana) {
            dia.celulas.forEach((celula, indice) => {
                celula.nivel = celula.quantidade === 0 ? 0 : Math.ceil(celula.quantidade / maximo * 4);
                if (maximo > 0 && celula.quantidade === maximo) {
                    picos.push({ dia: dia.nome, faixa: faixas[indice], quantidade: celula.quantidade });
                }
            });
        }

        return res.json({ total, maximo, fuso_horario: 'UTC-03:00', faixas, dias: diasSemana, picos });
    } catch (error) {
        console.error('[DASHBOARD] Erro ao buscar mapa de calor:', {
            codigo: error.code,
            mensagem: error.sqlMessage || error.message
        });
        return res.status(500).json({ mensagem: 'Erro ao buscar mapa de calor.' });
    }
}

async function buscarLocalizacoes(req, res) {
    var filtros = obterFiltros(req, res);
    if (!filtros) return;
    var { idEmpresa, dias, componente } = filtros;
    var fim = new Date();
    var inicio = new Date(fim.getTime() - dias * 24 * 60 * 60 * 1000);

    try {
        var resultado = await dashboardAlertasModel.buscarLocalizacoes(
            idEmpresa, formatarDataMysql(inicio), formatarDataMysql(fim), componente
        );
        var locais = resultado.map((item) => {
            var totalEquipamentos = Number(item.total_equipamentos);
            var afetados = Number(item.equipamentos_afetados);
            return {
                id_hospital: item.id_hospital,
                nome_hospital: item.nome_hospital,
                total_equipamentos: totalEquipamentos,
                equipamentos_afetados: afetados,
                total_episodios: Number(item.total_episodios),
                percentual_afetados: totalEquipamentos === 0 ? 0 : Number((afetados / totalEquipamentos * 100).toFixed(2))
            };
        });

        return res.json({
            total_episodios: locais.reduce((soma, local) => soma + local.total_episodios, 0),
            locais
        });
    } catch (error) {
        console.error('[DASHBOARD] Erro ao buscar localizações:', {
            codigo: error.code,
            mensagem: error.sqlMessage || error.message
        });
        return res.status(500).json({ mensagem: 'Erro ao buscar localizações.' });
    }
}

async function buscarEvolucao(req, res) {
    var filtros = obterFiltros(req, res);
    if (!filtros) return;
    var { idEmpresa, dias, componente } = filtros;
    var fim = new Date();
    var inicio = new Date(fim.getTime() - dias * 24 * 60 * 60 * 1000);

    try {
        var resultado = await dashboardAlertasModel.buscarEvolucao(
            idEmpresa, formatarDataMysql(inicio), formatarDataMysql(fim), componente
        );
        var quantidades = new Map(resultado.map((item) => [item.dia, Number(item.quantidade)]));
        // As datas abaixo representam dias do calendário de Brasília, sem conversão pelo navegador.
        var deslocamentoBrasilia = 3 * 60 * 60 * 1000;
        var primeiroDia = new Date(inicio.getTime() - deslocamentoBrasilia).toISOString().slice(0, 10);
        var ultimoDia = new Date(fim.getTime() - 1 - deslocamentoBrasilia).toISOString().slice(0, 10);
        var cursor = new Date(`${primeiroDia}T00:00:00Z`);
        var pontos = [];

        while (cursor.toISOString().slice(0, 10) <= ultimoDia) {
            var data = cursor.toISOString().slice(0, 10);
            pontos.push({
                data,
                rotulo: `${data.slice(8, 10)}/${data.slice(5, 7)}`,
                quantidade: quantidades.get(data) ?? 0
            });
            cursor.setUTCDate(cursor.getUTCDate() + 1);
        }

        return res.json({
            total: pontos.reduce((soma, ponto) => soma + ponto.quantidade, 0),
            fuso_horario: 'UTC-03:00',
            pontos
        });
    } catch (error) {
        console.error('[DASHBOARD] Erro ao buscar evolução:', {
            codigo: error.code,
            mensagem: error.sqlMessage || error.message
        });
        return res.status(500).json({ mensagem: 'Erro ao buscar evolução dos episódios.' });
    }
}

function montarKpi(atual, anterior) {
    atual = Number(atual);
    anterior = Number(anterior);

    var variacao = null;

    if (anterior !== 0) {
        variacao = Number(
            (((atual - anterior) / anterior) * 100).toFixed(2)
        );
    }

    return {
        atual: atual,
        anterior: anterior,
        variacao_percentual: variacao
    }
}

function formatarDataMysql(data) {
    return data.toISOString().slice(0, 23).replace("T", " ");
}

module.exports = {
    buscarKpis,
    buscarDistribuicao,
    buscarMapaCalor,
    buscarLocalizacoes,
    buscarEvolucao
}
