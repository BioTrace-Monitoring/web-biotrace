let graficoOciosidadeInstance = null;
let graficoPerfisInstance = null;
let loteAtualId = null;

document.addEventListener("DOMContentLoaded", function () {
    const selectLote = document.getElementById("selectLote");
    const sliderLimite = document.getElementById("sliderLimite");
    const btnSalvarConfig = document.getElementById("btnSalvarConfig");

    sliderLimite.addEventListener("input", function () {
        const valor = Number(sliderLimite.value);
        document.getElementById("valorLimiteTexto").textContent = valor + "%";
        document.getElementById("valorHisterese").textContent = Math.min(100, valor + 3) + "%";
    });

    selectLote.addEventListener("change", function () {
        loteAtualId = Number(selectLote.value);
        if (loteAtualId) {
            carregarPainelLote(loteAtualId);
        }
    });

    btnSalvarConfig.addEventListener("click", function () {
        if (loteAtualId) {
            salvarRegraAlerta(loteAtualId);
        }
    });

    carregarListaLotes();
});

function obterIdEmpresaSessao() {
    const fkLocal = localStorage.getItem("FK_EMPRESA");
    if (fkLocal) {
        return fkLocal;
    }
    const fkSession = sessionStorage.getItem("FK_EMPRESA");
    if (fkSession) {
        return fkSession;
    }
    return sessionStorage.getItem("ID_EMPRESA") || "";
}

function mostrarErroTela(texto) {
    const box = document.getElementById("feedbackLote");
    box.textContent = texto;
    box.hidden = false;
}

function limparErroTela() {
    const box = document.getElementById("feedbackLote");
    box.textContent = "";
    box.hidden = true;
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
    if (!lote) {
        return;
    }

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
    const ociosos = resumo ? Number(resumo.equipamentos_ociosos) : 0;
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

    const listaTopicos = document.getElementById("listaResumoTopicos");
    listaTopicos.innerHTML = "";

    const topicos = [
        "Integridade consolidada em " + integridade + "% com " + emFuncionamento + " equipamentos em funcionamento.",
        totalAlertas + " ocorrências de alerta identificadas na última leitura da camada Gold.",
        ociosos + " equipamentos classificados como subutilizados e disponíveis para realocação."
    ];

    for (let i = 0; i < topicos.length; i++) {
        const li = document.createElement("li");
        li.textContent = topicos[i];
        listaTopicos.appendChild(li);
    }
}

function atualizarConfiguracao(config) {
    const limite = Number(config.limite_integridade || 72);
    const slider = document.getElementById("sliderLimite");
    slider.value = limite;

    document.getElementById("valorLimiteTexto").textContent = limite + "%";
    document.getElementById("valorHisterese").textContent = Math.min(100, limite + 3) + "%";
    document.getElementById("checkEmail").checked = Boolean(config.email_ativo);
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
    const payload = {
        limite_integridade: Number(document.getElementById("sliderLimite").value),
        email_ativo: document.getElementById("checkEmail").checked ? 1 : 0,
        slack_ativo: document.getElementById("checkSlack").checked ? 1 : 0
    };

    fetch("/analise-lotes/" + idLote + "/configuracao", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    }).then(function (resposta) {
        if (resposta.ok) {
            const btn = document.getElementById("btnSalvarConfig");
            btn.textContent = "Salvo!";
            setTimeout(function () {
                btn.textContent = "Salvar regra";
            }, 1500);
        }
    });
}

function formatarDataNotificacao(item) {
    const bruto = item.dt_notificacao || item.criado_em || item.data_hora || item.dt_envio || item.processado_em;
    if (!bruto) {
        return "";
    }
    const data = new Date(bruto);
    if (isNaN(data.getTime())) {
        return String(bruto);
    }
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
                { label: "Uso constante", data: pontosConstante, backgroundColor: "#08b98a", pointRadius: 7 },
                { label: "Uso em picos", data: pontosPicos, backgroundColor: "#f59e0b", pointRadius: 7 },
                { label: "Quase sem uso", data: pontosSemUso, backgroundColor: "#9035e8", pointRadius: 7 }
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