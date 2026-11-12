var protocolosEnsaios = [];
var ensaiosCadastrados = [];
var modelosEnsaios = [];
var unidadesEnsaios = [];
var abaEnsaios = "protocolos";
var versaoOrigem = null;
var cadastroEmAndamento = false;
var registrosCarregados = false;

function escaparEnsaio(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, function (c) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
        }[c];
    });
}
async function consultarEngenharia(caminho, metodo, dados) {
    var token = localStorage.getItem("token");
    if (!token)
        throw new Error(
            "Entre com uma conta de administrador ou gestor para acessar esta página.",
        );
    var opcoes = {
        method: metodo || "GET",
        headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json",
        },
    };
    if (dados !== undefined) opcoes.body = JSON.stringify(dados);
    var resposta = await fetch("/engenharia" + caminho, opcoes);
    var resultado = await resposta.json();
    if (!resposta.ok)
        throw new Error(
            resultado.mensagem ||
                resultado.erro ||
                "Não foi possível carregar os dados.",
        );
    return resultado;
}
function mostrarErroEnsaios(erro) {
    document.getElementById("feedbackEnsaios").textContent =
        erro.message || "Não foi possível concluir a operação.";
}
function situacaoEnsaio(ensaio) {
    if (
        ensaio.situacao === "em_execucao" &&
        Date.parse(ensaio.termino_previsto) <= Date.now()
    )
        return "Período encerrado · aguardando processamento";
    return (
        {
            planejado: "Planejado",
            em_execucao: "Em execução",
            aguardando_processamento: "Aguardando processamento",
            finalizado: "Finalizado",
            cancelado: "Cancelado",
        }[ensaio.situacao] || ensaio.situacao
    );
}
function dataEnsaio(data) {
    return data
        ? new Date(data).toLocaleString("pt-BR", {
              timeZone: "America/Sao_Paulo",
          })
        : "Ainda não iniciado";
}
async function carregarRegistrosEnsaios() {
    document.getElementById("atualizarRegistros").disabled = true;
    document.getElementById("novoRegistro").disabled = true;
    document.getElementById("resumoRegistros").textContent =
        "Carregando registros…";
    try {
        var respostas = await Promise.all([
            consultarEngenharia("/protocolos"),
            consultarEngenharia("/ensaios"),
            consultarEngenharia("/catalogos"),
        ]);
        protocolosEnsaios = respostas[0].protocolos;
        ensaiosCadastrados = respostas[1].ensaios;
        modelosEnsaios = respostas[2].modelos;
        unidadesEnsaios = respostas[2].unidades;
        var filtro = document.getElementById("projetoRegistros");
        var escolhido = filtro.value;
        filtro.replaceChildren(new Option("Todos os equipamentos", "todos"));
        modelosEnsaios.forEach(function (modelo) {
            filtro.add(
                new Option(modelo.nome_modelo, modelo.id_modelo_equipamento),
            );
        });
        filtro.value = escolhido;
        if (!filtro.value) filtro.value = "todos";
        document.getElementById("feedbackEnsaios").textContent = "";
        registrosCarregados = true;
        atualizarRegistrosEnsaios();
        document.getElementById("novoRegistro").disabled = false;
    } catch (erro) {
        registrosCarregados = false;
        protocolosEnsaios = [];
        ensaiosCadastrados = [];
        modelosEnsaios = [];
        unidadesEnsaios = [];
        atualizarRegistrosEnsaios();
        document.getElementById("resumoRegistros").textContent =
            "Não foi possível consultar os registros. Verifique a sessão e a conexão e tente atualizar.";
        mostrarErroEnsaios(erro);
    } finally {
        document.getElementById("atualizarRegistros").disabled = false;
    }
}
function atualizarRegistrosEnsaios() {
    document.getElementById("totalProtocolos").textContent =
        protocolosEnsaios.length;
    document.getElementById("totalPlanejados").textContent =
        ensaiosCadastrados.filter(function (e) {
            return e.situacao === "planejado";
        }).length;
    document.getElementById("totalExecucao").textContent =
        ensaiosCadastrados.filter(function (e) {
            return (
                e.situacao === "em_execucao" &&
                Date.parse(e.termino_previsto) > Date.now()
            );
        }).length;
    document.getElementById("totalAguardando").textContent =
        ensaiosCadastrados.filter(function (e) {
            return (
                e.situacao === "aguardando_processamento" ||
                (e.situacao === "em_execucao" &&
                    Date.parse(e.termino_previsto) <= Date.now())
            );
        }).length;
    var busca = document
        .getElementById("buscaRegistros")
        .value.trim()
        .toLocaleLowerCase("pt-BR");
    var modelo = document.getElementById("projetoRegistros").value;
    var dados =
        abaEnsaios === "protocolos" ? protocolosEnsaios : ensaiosCadastrados;
    dados = dados.filter(function (r) {
        var protocolo =
            abaEnsaios === "protocolos"
                ? r
                : protocolosEnsaios.find(function (p) {
                      return p.id_protocolo === r.fk_protocolo;
                  });
        return (
            (modelo === "todos" ||
                String(protocolo?.fk_modelo_equipamento) === modelo) &&
            Object.values(r)
                .join(" ")
                .toLocaleLowerCase("pt-BR")
                .includes(busca)
        );
    });
    document.querySelectorAll("[data-aba]").forEach(function (b) {
        var ativo = b.dataset.aba === abaEnsaios;
        b.setAttribute("aria-pressed", String(ativo));
        b.classList.toggle("secundario", !ativo);
    });
    document.getElementById("novoRegistro").textContent =
        abaEnsaios === "protocolos"
            ? "+ Cadastrar protocolo"
            : "+ Criar ensaio";
    document.getElementById("resumoRegistros").textContent =
        dados.length + " registros neste recorte";
    document.getElementById("listaRegistros").innerHTML =
        dados
            .map(function (r) {
                var protocolo = abaEnsaios === "protocolos";
                var id = protocolo ? r.id_protocolo : r.id_ensaio;
                return (
                    '<article class="registro-ensaio"><div><h3>' +
                    escaparEnsaio(
                        protocolo
                            ? r.nome
                            : "Ensaio " + id + " · " + r.protocolo,
                    ) +
                    "</h3><p>" +
                    escaparEnsaio(
                        r.equipamento +
                            " · versão " +
                            r.versao +
                            " · " +
                            r.responsavel,
                    ) +
                    "</p><p>" +
                    escaparEnsaio(
                        protocolo
                            ? r.duracao_minutos +
                                  " minutos · " +
                                  (r.ativo ? "Disponível" : "Inativo")
                            : situacaoEnsaio(r) +
                                  " · " +
                                  r.total_equipamentos +
                                  " participantes",
                    ) +
                    '</p></div><button class="botao secundario" type="button" data-ver="' +
                    id +
                    '">Ver detalhes →</button></article>'
                );
            })
            .join("") ||
        "<p>Nenhum registro encontrado. Cadastre um protocolo ou ajuste os filtros.</p>";
    document.querySelectorAll("[data-ver]").forEach(function (b) {
        b.onclick = function () {
            abrirRegistroEnsaio(Number(this.dataset.ver));
        };
    });
}
function campoEnsaio(nome, rotulo, tipo, valor) {
    return (
        "<label>" +
        rotulo +
        '<input name="' +
        nome +
        '" type="' +
        tipo +
        '" value="' +
        escaparEnsaio(valor) +
        '" required ' +
        (tipo === "number" ? 'min="0" step="0.01"' : 'maxlength="100"') +
        "></label>"
    );
}
function textoEnsaio(nome, rotulo, valor) {
    return (
        '<label class="linha-inteira">' +
        rotulo +
        '<textarea name="' +
        nome +
        '" rows="3" maxlength="10000" required>' +
        escaparEnsaio(valor || "") +
        "</textarea></label>"
    );
}
function abrirCadastroEnsaio(origem) {
    versaoOrigem = origem || null;
    document.getElementById("erroCadastro").textContent = "";
    var campos = "";
    if (abaEnsaios === "protocolos") {
        if (!modelosEnsaios.length)
            return mostrarErroEnsaios(
                new Error(
                    "Cadastre um modelo de equipamento antes de criar o protocolo.",
                ),
            );
        var anterior =
            protocolosEnsaios.find(function (p) {
                return p.id_protocolo === origem;
            }) || {};
        document.getElementById("tituloCadastro").textContent = origem
            ? "Nova versão do protocolo"
            : "Cadastrar protocolo";
        campos =
            '<label>Equipamento<select name="fk_modelo_equipamento" required>' +
            modelosEnsaios
                .map(function (m) {
                    return (
                        '<option value="' +
                        m.id_modelo_equipamento +
                        '"' +
                        (m.id_modelo_equipamento ===
                        anterior.fk_modelo_equipamento
                            ? " selected"
                            : "") +
                        ">" +
                        escaparEnsaio(m.nome_modelo) +
                        "</option>"
                    );
                })
                .join("") +
            "</select></label>" +
            campoEnsaio(
                "nome",
                "Nome do protocolo",
                "text",
                anterior.nome || "",
            ) +
            textoEnsaio(
                "procedimento",
                "Procedimento e condições do teste",
                anterior.procedimento,
            );
        var numeros = [
            ["duracao_minutos", "Duração (minutos)", 1440],
            [
                "intervalo_coleta_segundos",
                "Intervalo de coleta (segundos)",
                180,
            ],
            ["cobertura_minima_percentual", "Cobertura mínima (%)", 95],
            ["tolerancia_envio_minutos", "Tolerância de envio (minutos)", 60],
            ["limite_temperatura", "Limite da CPU (°C)", 85],
            ["limite_cpu", "Uso máximo de CPU (%)", 95],
            ["limite_ram", "Uso máximo de RAM (%)", 90],
            ["minimo_disco_livre", "Espaço livre mínimo (%)", 20],
        ];
        numeros.forEach(function (c) {
            campos += campoEnsaio(c[0], c[1], "number", anterior[c[0]] ?? c[2]);
        });
        ["layout", "compatibilidade", "funcionamento"].forEach(function (c) {
            campos += textoEnsaio(
                "checklist_" + c,
                "Checklist de " + c,
                anterior["checklist_" + c],
            );
        });
    } else {
        var disponiveis = protocolosEnsaios.filter(function (p) {
            return p.ativo;
        });
        if (!disponiveis.length)
            return mostrarErroEnsaios(
                new Error("Cadastre um protocolo antes de criar o ensaio."),
            );
        document.getElementById("tituloCadastro").textContent = "Criar ensaio";
        campos =
            '<label>Protocolo<select id="protocoloParticipantes" name="fk_protocolo" required>' +
            disponiveis
                .map(function (p) {
                    return (
                        '<option value="' +
                        p.id_protocolo +
                        '">' +
                        escaparEnsaio(
                            p.nome + " · v" + p.versao + " · " + p.equipamento,
                        ) +
                        "</option>"
                    );
                })
                .join("") +
            '</select></label><label>Ambiente<select id="ambienteEnsaio" name="ambiente"><option value="bancada">Bancada</option><option value="campo">Campo / hospital</option></select></label><fieldset id="participantesEnsaio"><legend>Equipamentos participantes</legend></fieldset>' +
            textoEnsaio("observacoes", "Observações do ensaio", "") +
            textoEnsaio(
                "reinicios_programados",
                "Reinícios programados",
                "Nenhum reinício programado.",
            ) +
            '<p class="texto-apoio linha-inteira">O ensaio será salvo como planejado. Inicie a captura Python nos participantes e depois use Iniciar ensaio.</p>';
    }
    document.getElementById("camposCadastro").innerHTML = campos;
    if (abaEnsaios === "ensaios") {
        document.getElementById("protocoloParticipantes").onchange =
            preencherParticipantesEnsaio;
        document.getElementById("ambienteEnsaio").onchange =
            preencherParticipantesEnsaio;
        preencherParticipantesEnsaio();
    }
    document.getElementById("dialogCadastro").showModal();
}
function preencherParticipantesEnsaio() {
    var id = Number(document.getElementById("protocoloParticipantes").value);
    var protocolo = protocolosEnsaios.find(function (p) {
        return p.id_protocolo === id;
    });
    var campo = document.getElementById("ambienteEnsaio").value === "campo";
    var unidades = unidadesEnsaios.filter(function (e) {
        return (
            e.fk_modelo_equipamento === protocolo.fk_modelo_equipamento &&
            (!campo || e.fk_hospital)
        );
    });
    document.getElementById("participantesEnsaio").innerHTML =
        "<legend>Equipamentos participantes</legend>" +
        unidades
            .map(function (e) {
                return (
                    '<label class="participante-opcao"><input type="checkbox" name="equipamentos" value="' +
                    e.id_equipamento +
                    '">' +
                    escaparEnsaio(e.numero_serie + " · " + e.numero_lote) +
                    "</label>"
                );
            })
            .join("") +
        (!unidades.length
            ? "<p>Nenhuma unidade disponível para este equipamento e ambiente.</p>"
            : "");
}
async function salvarCadastroEnsaio(evento) {
    evento.preventDefault();
    if (cadastroEmAndamento) return;
    var form = evento.currentTarget;
    var campos = new FormData(form);
    var dados = Object.fromEntries(campos);
    var rota = "/protocolos";
    if (abaEnsaios === "ensaios") {
        rota = "/ensaios";
        dados.equipamentos = campos.getAll("equipamentos").map(Number);
    } else if (versaoOrigem) rota += "/" + versaoOrigem + "/versoes";
    var botao = form.querySelector('[type="submit"]');
    cadastroEmAndamento = true;
    botao.disabled = true;
    try {
        await consultarEngenharia(rota, "POST", dados);
        document.getElementById("dialogCadastro").close();
        await carregarRegistrosEnsaios();
        document.getElementById("feedbackEnsaios").textContent =
            "Cadastro salvo no banco.";
    } catch (erro) {
        document.getElementById("erroCadastro").textContent = erro.message;
    } finally {
        cadastroEmAndamento = false;
        botao.disabled = false;
    }
}
async function abrirRegistroEnsaio(id) {
    try {
        var protocolo = abaEnsaios === "protocolos";
        var resposta = await consultarEngenharia(
            (protocolo ? "/protocolos/" : "/ensaios/") + id,
        );
        var r = protocolo ? resposta.protocolo : resposta.ensaio;
        document.getElementById("tituloRegistro").textContent = protocolo
            ? r.nome + " · versão " + r.versao
            : "Ensaio " + id + " · " + r.protocolo;
        var campos = protocolo
            ? {
                  Procedimento: r.procedimento,
                  Duração: r.duracao_minutos + " minutos",
                  "Intervalo de coleta":
                      r.intervalo_coleta_segundos + " segundos",
                  "Cobertura mínima": r.cobertura_minima_percentual + "%",
                  "Tolerância de envio":
                      r.tolerancia_envio_minutos + " minutos",
                  "Temperatura máxima": r.limite_temperatura + " °C",
                  "Uso máximo de CPU": r.limite_cpu + "%",
                  "Uso máximo de RAM": r.limite_ram + "%",
                  "Espaço livre mínimo": r.minimo_disco_livre + "%",
                  Layout: r.checklist_layout,
                  Compatibilidade: r.checklist_compatibilidade,
                  Funcionamento: r.checklist_funcionamento,
              }
            : {
                  Situação: situacaoEnsaio(r),
                  Ambiente: r.ambiente,
                  Início: dataEnsaio(r.inicio),
                  "Término previsto": dataEnsaio(r.termino_previsto),
                  Observações: r.observacoes || "Sem observações",
                  "Reinícios programados":
                      r.reinicios_programados || "Não informados",
              };
        document.getElementById("detalheRegistro").innerHTML =
            '<dl class="detalhes-lista">' +
            Object.entries(campos)
                .map(function (c) {
                    return (
                        "<div><dt>" +
                        escaparEnsaio(c[0]) +
                        "</dt><dd>" +
                        escaparEnsaio(c[1]) +
                        "</dd></div>"
                    );
                })
                .join("") +
            "</dl>" +
            (!protocolo
                ? "<h3>Participantes</h3><p>" +
                  r.equipamentos
                      .map(function (e) {
                          return escaparEnsaio(
                              e.numero_serie +
                                  " · lote registrado " +
                                  e.lote_registrado,
                          );
                      })
                      .join("<br>") +
                  '</p><p class="texto-apoio">Os horários são apresentados em Brasília. A captura Python deve permanecer rodando nos notebooks. O relatório automático depende da próxima etapa de integração com a ETL.</p>'
                : "");
        document.getElementById("acoesRegistro").innerHTML = protocolo
            ? '<button class="botao" id="novaVersao">Criar nova versão</button>'
            : (r.situacao === "planejado"
                  ? '<button class="botao" data-situacao="iniciar">Iniciar ensaio</button>'
                  : "") +
              (["planejado", "em_execucao"].includes(r.situacao)
                  ? '<button class="botao secundario" data-situacao="cancelar">Cancelar ensaio</button>'
                  : "");
        if (protocolo)
            document.getElementById("novaVersao").onclick = function () {
                document.getElementById("dialogRegistro").close();
                abrirCadastroEnsaio(id);
            };
        document.querySelectorAll("[data-situacao]").forEach(function (b) {
            b.onclick = async function () {
                var botao = this;
                botao.disabled = true;
                try {
                    await consultarEngenharia(
                        "/ensaios/" + id + "/" + botao.dataset.situacao,
                        "POST",
                        {},
                    );
                    await carregarRegistrosEnsaios();
                    await abrirRegistroEnsaio(id);
                } catch (erro) {
                    document.getElementById("detalheRegistro").textContent =
                        erro.message;
                } finally {
                    botao.disabled = false;
                }
            };
        });
        var dialog = document.getElementById("dialogRegistro");
        if (!dialog.open) dialog.showModal();
    } catch (erro) {
        mostrarErroEnsaios(erro);
    }
}
document.addEventListener("DOMContentLoaded", function () {
    if (!exigirCargo(["Administrador", "Gestor"])) return;
    document.querySelectorAll("[data-aba]").forEach(function (b) {
        b.onclick = function () {
            abaEnsaios = this.dataset.aba;
            atualizarRegistrosEnsaios();
        };
    });
    document.querySelectorAll("[data-fechar]").forEach(function (b) {
        b.onclick = function () {
            if (!cadastroEmAndamento)
                document.getElementById(this.dataset.fechar).close();
        };
    });
    document.getElementById("buscaRegistros").oninput =
        atualizarRegistrosEnsaios;
    document.getElementById("projetoRegistros").onchange =
        atualizarRegistrosEnsaios;
    document.getElementById("novoRegistro").onclick = function () {
        abrirCadastroEnsaio();
    };
    document.getElementById("formCadastro").onsubmit = salvarCadastroEnsaio;
    document.getElementById("atualizarRegistros").onclick =
        carregarRegistrosEnsaios;
    carregarRegistrosEnsaios();
    setInterval(function () {
        if (
            registrosCarregados &&
            !cadastroEmAndamento &&
            !document.getElementById("dialogCadastro").open &&
            !document.getElementById("dialogRegistro").open
        )
            carregarRegistrosEnsaios();
    }, 60000);
});
