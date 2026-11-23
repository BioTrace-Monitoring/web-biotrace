var gold = require("./goldService");
var engenharia = require("../models/engenhariaModel");

const HORA_MS = 3600000;
const MINIMO_PONTOS = 4;
const R2_MINIMO = 0.7;

function periodoDeAnalise(dias, agora) {
    // O agregado Gold só pode ser recortado em horas inteiras.
    var fim = Math.floor(agora / HORA_MS) * HORA_MS;
    return { inicio: fim - dias * 24 * HORA_MS, fim };
}

function dataISO(milisegundos) {
    return new Date(milisegundos).toISOString();
}

function ajusteLinear(pontos, origem) {
    if (pontos.length < MINIMO_PONTOS) return null;
    var horas = pontos.map(p => (Date.parse(p.periodo_inicio) - origem) / HORA_MS);
    var mediaX = horas.reduce((soma, hora) => soma + hora, 0) / pontos.length;
    var mediaY = pontos.reduce((soma, ponto) => soma + ponto.media, 0) / pontos.length;
    var xx = 0, yy = 0, xy = 0;
    pontos.forEach(function (ponto, i) {
        var x = horas[i] - mediaX;
        var y = ponto.media - mediaY;
        xx += x * x;
        yy += y * y;
        xy += x * y;
    });
    if (xx === 0 || yy === 0) return null;
    var inclinacao = xy / xx;
    return {
        origem_em: dataISO(origem),
        temperatura_na_origem_c: mediaY - inclinacao * mediaX,
        tendencia_c_por_hora: inclinacao,
        r2: Math.min(1, xy * xy / (xx * yy)),
    };
}

function calcularProjecao(horas, ajuste, unidades, seriesForaDaAnalise, agora) {
    var ativas = unidades.filter(u => u.limite_temperatura_c !== null);
    var limites = new Set(ativas.map(u => u.limite_temperatura_c));
    var limite = limites.size === 1 ? ativas[0].limite_temperatura_c : null;
    var ultimoPonto = horas[horas.length - 1];
    var projecao = {
        estado: "sem_dados",
        limite_c: limite,
        a_partir_de: null,
        horizonte_horas: 24,
        cruzamento_em: null,
        horas_ate_limite: null,
    };
    if (!ultimoPonto) return projecao;
    if (limite === null) {
        projecao.estado = limites.size ? "limites_diferentes" : "sem_limite";
        return projecao;
    }
    if (seriesForaDaAnalise.size) {
        projecao.estado = "series_divergentes";
        return projecao;
    }
    var horasRecentes = horas.filter(h => Date.parse(h.periodo_inicio) >= agora - 24 * HORA_MS);
    if (horasRecentes.length < MINIMO_PONTOS || !ativas.every(u => u.temperatura_recente)) {
        projecao.estado = "cobertura_insuficiente";
        return projecao;
    }
    if (!ajuste || ajuste.r2 < R2_MINIMO) {
        projecao.estado = "ajuste_insuficiente";
        return projecao;
    }
    projecao.a_partir_de = ultimoPonto.periodo_inicio;
    // O ajuste tem origem no último ponto horário, mesmo que existam lacunas.
    var temperatura = ajuste.temperatura_na_origem_c;
    if (temperatura >= limite) {
        projecao.estado = "no_limite";
        return projecao;
    }
    var tempo = (limite - temperatura) / ajuste.tendencia_c_por_hora;
    if (tempo > 0 && tempo <= projecao.horizonte_horas) {
        projecao.estado = "cruzamento";
        projecao.horas_ate_limite = tempo;
        projecao.cruzamento_em = dataISO(Date.parse(projecao.a_partir_de) + tempo * HORA_MS);
    } else {
        projecao.estado = "sem_cruzamento";
    }
    return projecao;
}

function resumirLote(lote, cadastro, atuais, horas, agora) {
    var maximos = new Map();
    var seriesAnalisaveis = new Set(cadastro.filter(u => u.limite_temperatura_c !== null).map(u => u.numero_serie));
    var seriesForaDaAnalise = new Set();
    var total = 0, soma = 0;
    var minimo = null, maximo = null, ultimaLeitura = null;
    for (var hora of horas) {
        total += hora.leituras_validas;
        soma += hora.media * hora.leituras_validas;
        minimo = minimo === null ? hora.minimo : Math.min(minimo, hora.minimo);
        maximo = maximo === null ? hora.maximo : Math.max(maximo, hora.maximo);
        if (!ultimaLeitura || Date.parse(hora.ultima_leitura) > Date.parse(ultimaLeitura)) {
            ultimaLeitura = hora.ultima_leitura;
        }
        for (var [serie, temperatura] of Object.entries(hora.maximo_por_equipamento)) {
            maximos.set(serie, Math.max(maximos.get(serie) ?? temperatura, temperatura));
            if (!seriesAnalisaveis.has(serie)) seriesForaDaAnalise.add(serie);
        }
    }

    var media = total ? soma / total : null;
    var desvios = horas.reduce(function (soma, hora) {
        return soma + hora.soma_desvios_quadraticos + hora.leituras_validas * (hora.media - media) ** 2;
    }, 0);
    var unidades = cadastro.map(function (unidade, i) {
        var ultima = atuais[i];
        var coleta = ultima && ultima.lote_id === lote.id_lote_equipamento ? ultima : null;
        var instante = coleta ? Date.parse(coleta.timestamp) : NaN;
        var recente = instante >= agora - 24 * HORA_MS && instante <= agora;
        var pico = maximos.get(unidade.numero_serie) ?? null;
        var limite = unidade.limite_temperatura_c;
        return {
            ...unidade,
            ultima_coleta_em: coleta?.timestamp ?? null,
            coleta_recente: recente,
            temperatura_recente: recente && Number.isFinite(coleta.metricas.temperatura_cpu),
            maximo_c: pico,
            atingiu_limite: pico === null || limite === null ? null : pico >= limite,
        };
    });

    var ultimaHora = horas[horas.length - 1];
    var ajuste = ultimaHora ? ajusteLinear(horas, Date.parse(ultimaHora.periodo_inicio)) : null;
    return {
        ...lote,
        horas: horas.map(({ periodo_inicio, leituras_validas, media, minimo, maximo }) => ({
            periodo_inicio, leituras_validas, media, minimo, maximo,
        })),
        estatisticas: {
            leituras_validas: total,
            media_c: media,
            minimo_c: minimo,
            maximo_c: maximo,
            desvio_padrao_c: total ? Math.sqrt(desvios / total) : null,
            ultima_leitura_termica_em: ultimaLeitura,
            series_observadas: maximos.size,
            series_fora_da_analise: [...seriesForaDaAnalise].sort(),
        },
        cobertura: {
            unidades_cadastradas: unidades.length,
            unidades_com_coleta_recente: unidades.filter(u => u.coleta_recente).length,
            unidades_avaliadas_no_periodo: unidades.filter(u => u.atingiu_limite !== null).length,
            unidades_no_limite: unidades.filter(u => u.atingiu_limite === true).length,
        },
        unidades,
        regressao: ajuste,
        projecao: calcularProjecao(horas, ajuste, unidades, seriesForaDaAnalise, agora),
    };
}

async function consultarLotes(empresa, dias, loteId, agora = Date.now()) {
    var periodo = periodoDeAnalise(dias, agora);
    var catalogo = await engenharia.listarCatalogos(empresa);
    var lotes = catalogo.lotes.filter(l => loteId === null || l.id_lote_equipamento === loteId);
    if (loteId !== null && !lotes.length) throw engenharia.erroEngenharia(404, "Lote não encontrado.");

    var resultado = [];
    for (var lote of lotes) {
        var unidades = catalogo.unidades.filter(u => u.fk_lote === lote.id_lote_equipamento);
        var horas = await gold.carregarHorasTermicasGold(empresa, lote.id_lote_equipamento, periodo);
        var atuais = await gold.carregarUltimasLeiturasGold(empresa, unidades.map(u => u.numero_serie));
        var modelo = catalogo.modelos.find(m => m.id_modelo_equipamento === lote.fk_modelo_equipamento);
        resultado.push(resumirLote({ ...lote, nome_modelo: modelo?.nome_modelo ?? null }, unidades, atuais, horas, agora));
    }
    return {
        periodo: { dias, inicio: dataISO(periodo.inicio), fim_exclusivo: dataISO(periodo.fim) },
        referencia_em: dataISO(agora),
        lotes: resultado,
    };
}

function novosErros(atual, anterior, campo) {
    if (!anterior || atual.lote_id !== anterior.lote_id) return null;
    var leitura = atual.metricas;
    var antes = anterior.metricas;
    if (Number.isFinite(leitura.uptime_horas) && Number.isFinite(antes.uptime_horas) &&
        leitura.uptime_horas < antes.uptime_horas) return null;
    if (!Number.isFinite(leitura[campo]) || !Number.isFinite(antes[campo]) || leitura[campo] < antes[campo]) return null;
    return leitura[campo] - antes[campo];
}

async function consultarEquipamento(empresa, dias, equipamentoId, agora = Date.now()) {
    var periodo = periodoDeAnalise(dias, agora);
    var catalogo = await engenharia.listarCatalogos(empresa);
    var unidade = catalogo.unidades.find(u => u.id_equipamento === equipamentoId);
    if (!unidade) throw engenharia.erroEngenharia(404, "Equipamento não encontrado.");

    var historico = await gold.carregarHistoricoOperacaoGold(empresa, unidade.numero_serie, periodo);
    var leituras = [];
    for (var i = 0; i < historico.length; i++) {
        var atual = historico[i];
        if (atual.lote_id !== unidade.fk_lote) continue;
        var metricas = atual.metricas;
        leituras.push({
            timestamp: atual.timestamp,
            temperatura_cpu: metricas.temperatura_cpu ?? null,
            cpu_percent: metricas.cpu_percent ?? null,
            memoria_percent: metricas.memoria_percent ?? null,
            disco_livre_percent: Number.isFinite(metricas.disco_percent) ? 100 - metricas.disco_percent : null,
            novos_erros_entrada: novosErros(atual, historico[i - 1], "rede_erros_entrada"),
            novos_erros_saida: novosErros(atual, historico[i - 1], "rede_erros_saida"),
        });
    }
    var pontos = leituras.filter(l => Number.isFinite(l.temperatura_cpu))
        .map(l => ({ periodo_inicio: l.timestamp, media: l.temperatura_cpu }));
    var ultima = pontos[pontos.length - 1];
    return {
        periodo: { dias, inicio: dataISO(periodo.inicio), fim_exclusivo: dataISO(periodo.fim) },
        equipamento: unidade,
        leituras,
        regressao: ultima ? ajusteLinear(pontos, Date.parse(ultima.periodo_inicio)) : null,
    };
}

module.exports = { consultarLotes, consultarEquipamento };
