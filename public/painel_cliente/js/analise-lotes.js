let graficoOciosidadeInstance = null;
let graficoPerfisInstance = null;
let loteAtualId = null;

document.addEventListener("DOMContentLoaded", function () {
    const selectLote = document.getElementById("selectLote");
    const sliderLimite = document.getElementById("sliderLimite");
    const checkEmail = document.getElementById("checkEmail");
    const inputEmail = document.getElementById("inputDestinatarioEmail");
    const btnSalvarConfig = document.getElementById("btnSalvarConfig");

    sliderLimite.addEventListener("input", function () {
        const valor = Number(sliderLimite.value);
        document.getElementById("valorLimiteTexto").textContent = valor + "%";
        document.getElementById("valorHisterese").textContent = Math.min(100, valor + 3) + "%";
    });

    if (checkEmail && inputEmail) {
        checkEmail.addEventListener("change", function () {
            inputEmail.disabled = !checkEmail.checked;
        });
    }

    selectLote.addEventListener("change", function () {
        loteAtualId = Number(selectLote.value);
        if (loteAtualId) {
            carregarPainelLote(loteAtualId);
        }
    });

    btnSalvarConfig.addEventListener("click", function () {
        if (loteAtualId) {
            salvarRegraAlerta(loteAtualId);
        } else {
            mostrarErroTela("Nenhum lote selecionado para salvar.");
        }
    });

    carregarListaLotes();
});

function obterIdEmpresaSessao() {
    return (
        localStorage.getItem("FK_EMPRESA") ||
        sessionStorage.getItem("FK_EMPRESA") ||
        sessionStorage.getItem("ID_EMPRESA") ||
        ""
    );
}

function obterEmailSessao() {
    return (
        localStorage.getItem("EMAIL_USUARIO") ||
        sessionStorage.getItem("EMAIL_USUARIO") ||
        ""
    );
}

function mostrarErroTela(texto) {
    const box = document.getElementById("feedbackLote");
    if (box) {
        box.textContent = texto;
        box.hidden = false;
    }
}

function limparErroTela() {
    const box = document.getElementById("feedbackLote");
    if (box) {
        box.textContent = "";
        box.hidden = true;
    }
}

function carregarListaLotes() {
    const idEmpresa = obterIdEmpresaSessao();
    const url = idEmpresa ? "/analise-lotes?idEmpresa=" + encodeURIComponent(idEmpresa) : "/analise-lotes";

    fetch(url)
        .then(function (resposta) {
            if (!resposta.ok) {
                throw new Error("Falha ao listar lotes (HTTP " + resposta.status + ")");
            }
            return resposta.json();
        })
        .then(function (lotes) {
            const selectLote = document.getElementById("selectLote");
            selectLote.innerHTML = "";

            if (!Array.isArray(lotes) || lotes.length === 0) {
                const option = document.createElement("option");
                option.value = "";
                option.textContent = "Nenhum lote cadastrado";
                selectLote.appendChild(option);
                document.getElementById("subtituloModelo").textContent = "Nenhum lote vinculado à empresa";
                return;
            }

            for (let i = 0; i < lotes.length; i++) {
                const lote = lotes[i];
                const option = document.createElement("option");
                option.value = lote.id_lote_equipamento;
                option.textContent = lote.numero_lote + " (" + lote.nome_modelo + ")";
                selectLote.appendChild(option);
            }

            loteAtualId = Number(lotes[0].id_lote_equipamento);
            if (loteAtualId) {
                carregarPainelLote(loteAtualId);
            }
        })
        .catch(function (erro) {
            console.error(erro);
            mostrarErroTela(erro.message);
        });
}

function carregarPainelLote(idLote) {
    limparErroTela();

    fetch("/analise-lotes/" + idLote + "/painel")
        .then(function (resposta) {
            if (!resposta.ok) {
                return resposta.json().then(function (corpoErro) {
                    throw new Error(corpoErro.erro || "Erro HTTP " + resposta.status);
                });
            }
            return resposta.json();
        })
        .then(function (dados) {
            if (!dados || !dados.lote) {
                throw new Error("Resposta da API sem dados do lote.");
            }
            const equipamentos = Array.isArray(dados.equipamentos) ? dados.equipamentos : [];
            const configuracao = dados.configuracao || {};
            const historico = Array.isArray(dados.historico) ? dados.historico : [];

            atualizarCabecalho(dados.lote, dados.resumo);
            atualizarKpisEResumo(dados.resumo, equipamentos);
            atualizarConfiguracao(configuracao);
            atualizarHistorico(historico);
            renderizarGraficoOciosidade(equipamentos);
            renderizarGraficoPerfis(equipamentos);
        })
        .catch(function (erro) {
            console.error(erro);
            mostrarErroTela("Não foi possível carregar o lote: " + erro.message);
        });
}

function atualizarCabecalho(lote, resumo) {
    if (!lote) return;

    document.getElementById("subtituloModelo").textContent = "Modelo: " + (lote.nome_modelo || "Não informado");
    const badge = document.getElementById("badgeProcessado");

    if (resumo && resumo.processado_em) {
        const dataFormatada = new Date(resumo.processado_em).toLocaleString("pt-BR");
        badge.textContent = "Gold processada em " + dataFormatada;
    } else {
        badge.textContent = "Sem processamento Gold";
    }
}

function atualizarKpisEResumo(resumo, equipamentos) {
    const totalEquipamentos = resumo ? Number(resumo.total_equipamentos) : equipamentos.length;
    const integridade = resumo ? Number(resumo.integridade_geral).toFixed(1) : "100.0";

    const listaSubutilizados = [];
    for (let i = 0; i < equipamentos.length; i++) {
        const eq = equipamentos[i];
        if (Number(eq.percentual_ociosidade) > 70 || eq.status_operacional === "Subutilizado") {
            listaSubutilizados.push(eq.numero_serie);
        }
    }

    const ociosos = listaSubutilizados.length > 0
        ? listaSubutilizados.length
        : (resumo ? Number(resumo.equipamentos_ociosos) : 0);
    const emFuncionamento = Math.max(0, totalEquipamentos - ociosos);

    const emAtencao = resumo ? Number(resumo.qtd_em_atencao) : 0;
    const limiteExcedido = resumo ? Number(resumo.qtd_limite_excedido) : 0;
    const falhaLeitura = resumo ? Number(resumo.qtd_falha_leitura) : 0;
    const totalAlertas = emAtencao + limiteExcedido + falhaLeitura;

    document.getElementById("kpiIntegridade").textContent = integridade + "%";
    document.getElementById("kpiIntegridadeDetalhe").textContent =
        (resumo ? resumo.qtd_sem_alerta : totalEquipamentos) + " de " + totalEquipamentos + " sem alertas";

    document.getElementById("kpiFuncionamento").textContent = emFuncionamento + " / " + totalEquipamentos;
    document.getElementById("kpiSubutilizados").textContent = ociosos + " subutilizados (> 70% ociosos)";

    document.getElementById("kpiTotalAlertas").textContent = totalAlertas;
    document.getElementById("kpiDetalheAlertas").textContent =
        emAtencao + " atenção · " + limiteExcedido + " limite · " + falhaLeitura + " falha";

    const seloResumo = document.getElementById("seloStatusResumo");
    if (totalAlertas > 0 || ociosos > 0) {
        seloResumo.textContent = "Atenção";
        seloResumo.classList.add("alerta");
    } else {
        seloResumo.textContent = "Estável";
        seloResumo.classList.remove("alerta");
    }

    const textoSubutilizados = listaSubutilizados.length > 0
        ? "Subutilizados (&gt; 70%): <strong>" + listaSubutilizados.join(", ") + "</strong> disponíveis para realocação."
        : (ociosos > 0
            ? "<strong>" + ociosos + " equipamento(s)</strong> subutilizado(s) disponível(is) para realocação."
            : "<strong>Nenhum equipamento</strong> subutilizado neste lote.");

    const listaTopicos = document.getElementById("listaResumoTopicos");
    listaTopicos.innerHTML = "";

    const itensHtml = [
        "Integridade em <strong>" + integridade + "%</strong> com <strong>" + emFuncionamento + " de " + totalEquipamentos + "</strong> em utilização normal.",
        "<strong>" + totalAlertas + " ocorrências</strong> de alerta registradas na leitura Gold.",
        textoSubutilizados
    ];

    for (let i = 0; i < itensHtml.length; i++) {
        const li = document.createElement("li");
        li.innerHTML = itensHtml[i];
        listaTopicos.appendChild(li);
    }
}

function atualizarConfiguracao(config) {
    const limite = Number(config.limite_integridade || 80);
    const slider = document.getElementById("sliderLimite");
    const checkEmail = document.getElementById("checkEmail");
    const inputEmail = document.getElementById("inputDestinatarioEmail");

    slider.value = limite;
    document.getElementById("valorLimiteTexto").textContent = limite + "%";
    document.getElementById("valorHisterese").textContent = Math.min(100, limite + 3) + "%";

    const emailAtivo = Boolean(config.email_ativo);
    checkEmail.checked = emailAtivo;
    inputEmail.value = config.destinatario_email || obterEmailSessao();
    inputEmail.disabled = !emailAtivo;

    document.getElementById("checkSlack").checked = Boolean(config.slack_ativo);

    const badgeEstado = document.getElementById("badgeEstadoAlerta");
    if (config.estado_atual === "alerta") {
        badgeEstado.textContent = "Em alerta";
        badgeEstado.classList.add("alerta");
    } else {
        badgeEstado.textContent = "Normal";
        badgeEstado.classList.remove("alerta");
    }
}

function salvarRegraAlerta(idLote) {
    limparErroTela();
    const emailAtivo = document.getElementById("checkEmail").checked ? 1 : 0;
    const destinatarioEmail = document.getElementById("inputDestinatarioEmail").value.trim();

    if (emailAtivo && !destinatarioEmail) {
        mostrarErroTela("Informe o e-mail de destino antes de salvar a regra.");
        document.getElementById("inputDestinatarioEmail").focus();
        return;
    }

    const payload = {
        limite_integridade: Number(document.getElementById("sliderLimite").value),
        email_ativo: emailAtivo,
        destinatario_email: destinatarioEmail,
        slack_ativo: document.getElementById("checkSlack").checked ? 1 : 0
    };

    fetch("/analise-lotes/" + idLote + "/configuracao", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
        .then(function (resposta) {
            if (!resposta.ok) {
                return resposta.json().then(function (erroJson) {
                    throw new Error(erroJson.erro || "Falha ao salvar configuração.");
                });
            }
            const btn = document.getElementById("btnSalvarConfig");
            btn.textContent = "Salvo!";
            setTimeout(function () {
                btn.textContent = "Salvar regra";
            }, 1500);
        })
        .catch(function (erro) {
            console.error(erro);
            mostrarErroTela(erro.message);
        });
}

function formatarDataNotificacao(item) {
    const bruto = item.criado_em || item.dt_notificacao || item.data_hora || item.dt_envio || item.processado_em;
    if (!bruto) return "";
    const data = new Date(bruto);
    if (isNaN(data.getTime())) return String(bruto);
    return data.toLocaleString("pt-BR");
}

function atualizarHistorico(historico) {
    const lista = document.getElementById("listaHistorico");
    lista.innerHTML = "";

    if (!Array.isArray(historico) || historico.length === 0) {
        const li = document.createElement("li");
        li.textContent = "Nenhuma notificação disparada para este lote.";
        lista.appendChild(li);
        return;
    }

    for (let i = 0; i < historico.length; i++) {
        const item = historico[i];
        const horario = formatarDataNotificacao(item);
        const prefixoData = horario ? "[" + horario + "] " : "";
        const li = document.createElement("li");
        li.textContent = prefixoData + item.tipo_evento + " (" + item.canal + "): " + item.mensagem;
        lista.appendChild(li);
    }
}

function renderizarGraficoOciosidade(equipamentos) {
    const ctx = document.getElementById("graficoOciosidade").getContext("2d");
    const labels = [];
    const valores = [];
    const cores = [];

    for (let i = 0; i < equipamentos.length; i++) {
        const eq = equipamentos[i];
        const pct = Number(eq.percentual_ociosidade);
        labels.push(eq.numero_serie);
        valores.push(pct);
        cores.push(pct > 70 ? "#ef4444" : "#9035e8");
    }

    if (graficoOciosidadeInstance) {
        graficoOciosidadeInstance.destroy();
    }

    graficoOciosidadeInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Ociosidade (%)",
                data: valores,
                backgroundColor: cores,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, max: 100 }
            }
        }
    });
}

function renderizarGraficoPerfis(equipamentos) {
    const ctx = document.getElementById("graficoPerfis").getContext("2d");
    const pontosConstante = [];
    const pontosPicos = [];
    const pontosSemUso = [];

    for (let i = 0; i < equipamentos.length; i++) {
        const eq = equipamentos[i];
        const ponto = {
            x: Number(eq.percentual_ociosidade),
            y: Number(eq.variacao_picos),
            serie: eq.numero_serie
        };

        if (eq.perfil_uso === "Quase sem uso") {
            pontosSemUso.push(ponto);
        } else if (eq.perfil_uso === "Uso em picos") {
            pontosPicos.push(ponto);
        } else {
            pontosConstante.push(ponto);
        }
    }

    if (graficoPerfisInstance) {
        graficoPerfisInstance.destroy();
    }

    graficoPerfisInstance = new Chart(ctx, {
        type: "scatter",
        data: {
            datasets: [
                { label: "Uso constante", data: pontosConstante, backgroundColor: "#08b98a", pointRadius: 6 },
                { label: "Uso em picos", data: pontosPicos, backgroundColor: "#f59e0b", pointRadius: 6 },
                { label: "Quase sem uso", data: pontosSemUso, backgroundColor: "#9035e8", pointRadius: 6 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const raw = context.raw;
                            return raw.serie + ": " + raw.x + "% ocioso | variação " + raw.y;
                        }
                    }
                }
            },
            scales: {
                x: { title: { display: true, text: "Ociosidade (%)" }, min: 0, max: 100 },
                y: { title: { display: true, text: "Variação de Picos (Desvio Padrão)" }, beginAtZero: true }
            }
        }
    });
}