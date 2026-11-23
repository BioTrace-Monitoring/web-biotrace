var fs = require("fs/promises");
var path = require("path");
var s3 = require("@aws-sdk/client-s3");
var clienteS3 = null;

async function lerArquivoGold(chave) {
    try {
        if (process.env.GOLD_LOCAL_DIR) {
            var pasta = path.resolve(process.env.GOLD_LOCAL_DIR);
            var arquivo = path.resolve(pasta, chave);
            if (!arquivo.startsWith(pasta + path.sep))
                throw new Error("Caminho inválido da Gold.");
            return JSON.parse(await fs.readFile(arquivo, "utf8"));
        }
        var resposta = await obterClienteS3().send(
            new s3.GetObjectCommand({
                Bucket: process.env.S3_BUCKET,
                Key: chave,
            }),
        );
        return JSON.parse(await resposta.Body.transformToString());
    } catch (erro) {
        if (erro.code === "ENOENT" || erro.name === "NoSuchKey") return null;
        if (erro.status) throw erro;
        var falha = new Error(
            "Não foi possível ler os arquivos da Gold. Confira a configuração e as permissões de acesso.",
        );
        falha.status = 502;
        throw falha;
    }
}
function validarSerieGold(serie) {
    if (
        !serie ||
        serie.includes("/") ||
        serie.includes("\\") ||
        serie === "." ||
        serie === ".."
    ) {
        var erro = new Error(
            "O número de série contém caracteres inválidos para consultar a Gold.",
        );
        erro.status = 400;
        throw erro;
    }
}
async function carregarLeiturasGold(empresa, serie, inicio, fim) {
    validarSerieGold(serie);
    var prefixo = prefixoGold();
    var dia = new Date(inicio);
    dia.setUTCHours(0, 0, 0, 0);
    var leituras = [];
    var instantes = new Set();
    while (dia.getTime() < Date.parse(fim)) {
        var chave =
            prefixo +
            "/historico/empresa_id=" +
            empresa +
            "/numero_serie=" +
            serie +
            "/data=" +
            dia.toISOString().slice(0, 10) +
            "/leituras.json";
        var documento = await lerArquivoGold(chave);
        if (documento) {
            if (
                documento.schema_version !== 2 ||
                String(documento.empresa_id) !== String(empresa) ||
                documento.numero_serie !== serie ||
                !Array.isArray(documento.leituras)
            ) {
                var erro = new Error(
                    "O histórico Gold possui formato ou identificação incompatível com o ensaio.",
                );
                erro.status = 502;
                throw erro;
            }
            for (var leitura of documento.leituras) {
                var instante = Date.parse(leitura.timestamp);
                if (
                    String(leitura.empresa_id) !== String(empresa) ||
                    leitura.numero_serie !== serie ||
                    !Number.isFinite(instante) ||
                    !leitura.metricas
                ) {
                    var erro = new Error(
                        "Há uma leitura inválida no histórico Gold. Revise o processamento da ETL.",
                    );
                    erro.status = 502;
                    throw erro;
                }
                if (
                    instante >= Date.parse(inicio) &&
                    instante < Date.parse(fim) &&
                    !instantes.has(instante)
                ) {
                    leituras.push(leitura);
                    instantes.add(instante);
                }
            }
        }
        dia.setUTCDate(dia.getUTCDate() + 1);
    }
    return leituras.sort(function (a, b) {
        return Date.parse(a.timestamp) - Date.parse(b.timestamp);
    });
}
function numeroValido(valor) {
    return typeof valor === "number" && Number.isFinite(valor);
}
function avaliarGold(protocolo, participantes, inicio, fim) {
    var esperadas = Math.ceil(
        (Date.parse(fim) - Date.parse(inicio)) /
            1000 /
            protocolo.intervalo_coleta_segundos,
    );
    var cobertura = 100;
    var termico = "aprovado",
        recursos = "aprovado",
        estabilidade = "aprovado";
    var temperaturas = [],
        cpu = [],
        ram = [],
        discos = [];
    var observacoes = [];
    for (var participante of participantes) {
        var faixasTemperatura = new Set(),
            faixasRecursos = new Set(),
            faixasEstabilidade = new Set(),
            faixasCompletas = new Set();
        var anterior = null;
        var comparacoes = 0;
        var instabilidade = false;
        var indeterminado = false;
        for (var leitura of participante.leituras) {
            var m = leitura.metricas;
            var faixa = Math.floor(
                (Date.parse(leitura.timestamp) - Date.parse(inicio)) /
                    1000 /
                    protocolo.intervalo_coleta_segundos,
            );
            var temperaturaValida = numeroValido(m.temperatura_cpu);
            var recursosValidos =
                numeroValido(m.cpu_percent) &&
                numeroValido(m.memoria_percent) &&
                numeroValido(m.disco_percent);
            var estabilidadeValida =
                numeroValido(m.uptime_horas) &&
                numeroValido(m.rede_erros_entrada) &&
                numeroValido(m.rede_erros_saida);
            if (temperaturaValida) {
                faixasTemperatura.add(faixa);
                temperaturas.push(m.temperatura_cpu);
                if (m.temperatura_cpu >= Number(protocolo.limite_temperatura))
                    termico = "reprovado";
            }
            if (recursosValidos) {
                faixasRecursos.add(faixa);
                cpu.push(m.cpu_percent);
                ram.push(m.memoria_percent);
                discos.push(100 - m.disco_percent);
                if (
                    m.cpu_percent >= Number(protocolo.limite_cpu) ||
                    m.memoria_percent >= Number(protocolo.limite_ram) ||
                    100 - m.disco_percent < Number(protocolo.minimo_disco_livre)
                )
                    recursos = "reprovado";
            }
            if (estabilidadeValida) {
                faixasEstabilidade.add(faixa);
                if (anterior) {
                    var a = anterior.metricas;
                    if (
                        m.uptime_horas < a.uptime_horas ||
                        m.rede_erros_entrada < a.rede_erros_entrada ||
                        m.rede_erros_saida < a.rede_erros_saida
                    )
                        indeterminado = true;
                    else {
                        comparacoes++;
                        if (
                            m.rede_erros_entrada > a.rede_erros_entrada ||
                            m.rede_erros_saida > a.rede_erros_saida
                        )
                            instabilidade = true;
                    }
                }
                anterior = leitura;
            } else anterior = null;
            if (temperaturaValida && recursosValidos && estabilidadeValida)
                faixasCompletas.add(faixa);
        }
        var percentual = Math.min(
            100,
            (faixasCompletas.size / esperadas) * 100,
        );
        cobertura = Math.min(cobertura, percentual);
        if (
            termico !== "reprovado" &&
            (faixasTemperatura.size / esperadas) * 100 <
                Number(protocolo.cobertura_minima_percentual)
        )
            termico = "inconclusivo";
        if (
            recursos !== "reprovado" &&
            (faixasRecursos.size / esperadas) * 100 <
                Number(protocolo.cobertura_minima_percentual)
        )
            recursos = "inconclusivo";
        if (instabilidade) estabilidade = "reprovado";
        else if (
            estabilidade !== "reprovado" &&
            (indeterminado ||
                !comparacoes ||
                (faixasEstabilidade.size / esperadas) * 100 <
                    Number(protocolo.cobertura_minima_percentual))
        )
            estabilidade = "inconclusivo";
        observacoes.push(
            participante.serie +
                ": " +
                faixasCompletas.size +
                " de " +
                esperadas +
                " intervalos completos (" +
                percentual.toFixed(1) +
                "%)." +
                (indeterminado
                    ? " Indício de reinício ou reset de contador; conferir o planejamento do ensaio."
                    : ""),
        );
    }
    if (!participantes.length) {
        cobertura = 0;
        termico = recursos = estabilidade = "inconclusivo";
    }
    return {
        resultado_temperatura: termico,
        resultado_recursos: recursos,
        resultado_estabilidade: estabilidade,
        cobertura_percentual: Math.round(cobertura * 100) / 100,
        pico_temperatura: temperaturas.length
            ? temperaturas.reduce(function (a, b) {
                  return Math.max(a, b);
              })
            : null,
        maior_uso_cpu: cpu.length
            ? cpu.reduce(function (a, b) {
                  return Math.max(a, b);
              })
            : null,
        maior_uso_ram: ram.length
            ? ram.reduce(function (a, b) {
                  return Math.max(a, b);
              })
            : null,
        menor_disco_livre: discos.length
            ? discos.reduce(function (a, b) {
                  return Math.min(a, b);
              })
            : null,
        observacoes_automaticas: observacoes.join("\n").slice(0, 15000),
    };
}
function prefixoGold() {
    return (process.env.S3_GOLD_PREFIX || "gold/").replace(/\/$/, "");
}

function obterClienteS3() {
    if (!process.env.S3_BUCKET) {
        var erro = new Error("Configure S3_BUCKET ou GOLD_LOCAL_DIR para consultar a Gold.");
        erro.status = 503;
        throw erro;
    }
    if (!clienteS3) {
        clienteS3 = new s3.S3Client({ region: process.env.AWS_REGION || "us-east-1" });
    }
    return clienteS3;
}

function erroContrato(mensagem) {
    var erro = new Error(mensagem);
    erro.status = 502;
    return erro;
}

function datasUTC({ inicio, fim }) {
    var dia = new Date(inicio);
    dia.setUTCHours(0, 0, 0, 0);
    var datas = [];
    while (dia.getTime() < fim) {
        datas.push(dia.toISOString().slice(0, 10));
        dia.setUTCDate(dia.getUTCDate() + 1);
    }
    return datas;
}

async function lerEmLotes(chaves) {
    var documentos = [];
    for (var i = 0; i < chaves.length; i += 12) {
        documentos.push(...await Promise.all(chaves.slice(i, i + 12).map(lerArquivoGold)));
    }
    return documentos;
}

async function carregarHorasTermicasGold(empresa, lote, periodo) {
    var datas = datasUTC(periodo);
    var prefixo = prefixoGold() + "/analise_termica/empresa_id=" + empresa + "/lote_id=" + lote + "/";
    var documentos = await lerEmLotes(datas.map(data => prefixo + "data=" + data + "/metricas.json"));
    var horas = new Map();
    documentos.forEach(function (doc, i) {
        if (doc === null) return;
        if (doc.schema_version !== 2 || doc.empresa_id !== empresa || doc.lote_id !== lote ||
            doc.data !== datas[i] || doc.unidade !== "°C" || !Array.isArray(doc.horas)) {
            throw erroContrato("Identificação ou formato inválido no resumo térmico da Gold.");
        }
        for (var hora of doc.horas) {
            var inicio = Date.parse(hora?.periodo_inicio);
            if (!Number.isFinite(inicio) || inicio % 3600000 !== 0 ||
                new Date(inicio).toISOString().slice(0, 10) !== doc.data ||
                !Number.isSafeInteger(hora.leituras_validas) || hora.leituras_validas < 0) {
                throw erroContrato("Hora ou contagem inválida no resumo térmico da Gold.");
            }
            if (hora.leituras_validas === 0 || inicio < periodo.inicio || inicio >= periodo.fim) continue;
            var ultima = Date.parse(hora.ultima_leitura);
            var maximos = hora.maximo_por_equipamento;
            if (![hora.media, hora.minimo, hora.maximo, hora.soma_desvios_quadraticos, ultima].every(Number.isFinite) ||
                hora.minimo > hora.media || hora.media > hora.maximo ||
                hora.soma_desvios_quadraticos < 0 || ultima < inicio || ultima >= inicio + 3600000 ||
                !maximos || typeof maximos !== "object" || Array.isArray(maximos) || !Object.keys(maximos).length ||
                !Object.values(maximos).every(Number.isFinite) || horas.has(inicio)) {
                throw erroContrato("Estatísticas inválidas no resumo térmico da Gold.");
            }
            horas.set(inicio, hora);
        }
    });
    return [...horas.entries()].sort(([a], [b]) => a - b).map(([, hora]) => hora);
}

async function carregarUltimasLeiturasGold(empresa, series) {
    var prefixo = prefixoGold() + "/atual/empresa_id=" + empresa + "/numero_serie=";
    var documentos = await lerEmLotes(series.map(function (serie) {
        validarSerieGold(serie);
        return prefixo + serie + "/ultima_leitura.json";
    }));
    documentos.forEach(function (doc, i) {
        if (doc !== null && (doc.schema_version !== 2 || doc.empresa_id !== empresa ||
            doc.numero_serie !== series[i] || !doc.metricas || !Number.isFinite(Date.parse(doc.timestamp)))) {
            throw erroContrato("Última leitura incompatível com o equipamento da Gold.");
        }
    });
    return documentos;
}

async function lerDiretorioGold(prefixo) {
    try {
        return await fs.readdir(path.join(process.env.GOLD_LOCAL_DIR, prefixo), { withFileTypes: true });
    } catch (erro) {
        if (erro.code === "ENOENT") return [];
        throw erro;
    }
}

async function listarHistoricoGold(prefixo, datas) {
    var padrao = /^data=\d{4}-\d{2}-\d{2}(\/hora=(?:[01]\d|2[0-3]))?\/leituras\.json$/;
    var chaves = [];
    try {
        if (process.env.GOLD_LOCAL_DIR) {
            for (var data of datas) {
                var particao = prefixo + "data=" + data + "/";
                var itens = await lerDiretorioGold(particao);
                for (var item of itens) {
                    if (item.isFile() && item.name === "leituras.json") chaves.push(particao + item.name);
                    if (item.isDirectory() && /^hora=(?:[01]\d|2[0-3])$/.test(item.name)) {
                        var hora = particao + item.name + "/";
                        if ((await lerDiretorioGold(hora)).some(a => a.isFile() && a.name === "leituras.json")) {
                            chaves.push(hora + "leituras.json");
                        }
                    }
                }
            }
        } else {
            var paginas = s3.paginateListObjectsV2({ client: obterClienteS3() }, {
                Bucket: process.env.S3_BUCKET, Prefix: prefixo, StartAfter: prefixo + "data=" + datas[0] + "/",
            });
            var ultimaData = datas[datas.length - 1];
            for await (var pagina of paginas) {
                for (var { Key } of pagina.Contents || []) {
                    var caminho = Key.slice(prefixo.length);
                    if (!padrao.test(caminho)) continue;
                    if (caminho.slice(5, 15) > ultimaData) return chaves;
                    chaves.push(Key);
                }
            }
        }
    } catch (erro) {
        if (erro.status) throw erro;
        throw erroContrato("Não foi possível listar o histórico na Gold. Confira a configuração e as permissões de acesso.");
    }
    return chaves;
}

async function carregarHistoricoOperacaoGold(empresa, serie, periodo) {
    validarSerieGold(serie);
    var prefixo = prefixoGold() + "/historico/empresa_id=" + empresa + "/numero_serie=" + serie + "/";
    var datas = datasUTC(periodo);
    if (!datas.length) return [];
    var chaves = await listarHistoricoGold(prefixo, datas);
    var documentos = await lerEmLotes(chaves);
    var leituras = new Map();
    // Quando as versões coexistirem, o arquivo horário é a fonte dessa hora.
    var horasPublicadas = new Set(chaves.filter((chave, i) => documentos[i] !== null && chave.includes("/hora="))
        .map(chave => chave.slice(prefixo.length).slice(0, 23)));

    documentos.forEach(function (doc, i) {
        if (doc === null) return;
        var caminho = chaves[i].slice(prefixo.length);
        var data = caminho.slice(5, 15);
        var hora = caminho.includes("/hora=") ? caminho.slice(21, 23) : null;
        if (doc.schema_version !== 2 || doc.empresa_id !== empresa || doc.numero_serie !== serie ||
            !Array.isArray(doc.leituras)) {
            throw erroContrato("Identificação ou formato inválido no histórico da Gold.");
        }
        for (var leitura of doc.leituras) {
            var instante = Date.parse(leitura?.timestamp);
            if (!Number.isFinite(instante) || leitura.empresa_id !== empresa ||
                leitura.numero_serie !== serie || !leitura.metricas) {
                throw erroContrato("Leitura inválida no histórico da Gold.");
            }
            var utc = new Date(instante).toISOString();
            var particao = "data=" + utc.slice(0, 10) + "/hora=" + utc.slice(11, 13);
            if (utc.slice(0, 10) !== data || (hora !== null && hora !== utc.slice(11, 13))) {
                throw erroContrato("Leitura fora da partição UTC no histórico da Gold.");
            }
            if (instante < periodo.inicio || instante >= periodo.fim ||
                (hora === null && horasPublicadas.has(particao))) continue;
            leituras.set(instante, leitura);
        }
    });
    return [...leituras.entries()].sort(([a], [b]) => a - b).map(([, leitura]) => leitura);
}

module.exports = {
    carregarLeiturasGold, avaliarGold, carregarHorasTermicasGold,
    carregarUltimasLeiturasGold, carregarHistoricoOperacaoGold,
};
