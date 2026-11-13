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
        if (!process.env.S3_BUCKET) {
            var configuracao = new Error(
                "Configure S3_BUCKET ou GOLD_LOCAL_DIR para consultar a Gold.",
            );
            configuracao.status = 503;
            throw configuracao;
        }
        if (!clienteS3)
            clienteS3 = new s3.S3Client({
                region: process.env.AWS_REGION || "us-east-1",
            });
        var resposta = await clienteS3.send(
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
async function carregarLeiturasGold(empresa, serie, inicio, fim) {
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
    var prefixo = (process.env.S3_GOLD_PREFIX || "gold/").replace(/\/$/, "");
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
module.exports = { carregarLeiturasGold, avaliarGold };
