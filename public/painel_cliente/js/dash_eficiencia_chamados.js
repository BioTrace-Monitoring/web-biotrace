const dadosMock = window.BioTraceMockData;

let funcionarioSelecionadoId = "ana";
let chamadoSelecionadoId = null;
let mapa = null;
let marcadores = [];
let limites = { ...dadosMock.criterios };
let locaisEmpresa = null;
let requisicaoLocais = null;

function mediana(valores) {
    if (!valores.length) return 0;
    const ordenados = [...valores].sort((a, b) => a - b);
    const meio = Math.floor(ordenados.length / 2);
    return ordenados.length % 2
        ? ordenados[meio]
        : Math.round((ordenados[meio - 1] + ordenados[meio]) / 2);
}

function classificacao(tempo) {
    if (tempo <= limites.eficiente) return "efficient";
    if (tempo <= limites.intermediario) return "intermediate";
    return "inefficient";
}

function rotuloClassificacao(tempo) {
    if (classificacao(tempo) === "efficient") return "Eficiente";
    if (classificacao(tempo) === "intermediate") return "Intermediário";
    return "Ineficiente";
}

function iniciais(nome) {
    return nome.split(" ").map(parte => parte[0]).slice(0, 2).join("").toUpperCase();
}

function formatarData(dataIso) {
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
        .format(new Date(dataIso));
}

function obterFuncionario() {
    return dadosMock.funcionarios.find(funcionario => funcionario.id === funcionarioSelecionadoId);
}

function obterBase(funcionario) {
    return dadosMock.bases.find(base => base.id === funcionario.baseId);
}

function obterChamadosFuncionario(funcionario, meses) {
    const limite = new Date();
    limite.setMonth(limite.getMonth() - Number(meses));
    return funcionario.chamados
        .filter(chamado => new Date(chamado.data) >= limite)
        .sort((a, b) => new Date(b.data) - new Date(a.data));
}

function obterHospital(chamado) {
    return dadosMock.hospitais.find(hospital => hospital.id === chamado.hospitalId);
}

function renderizarFuncionarios() {
    const meses = document.getElementById("period-select").value;
    const ordem = document.getElementById("employee-sort").value;
    const funcionarioMedianas = dadosMock.funcionarios.map(funcionario => {
        const chamados = obterChamadosFuncionario(funcionario, meses);
        return { funcionario, mediana: mediana(chamados.map(chamado => chamado.tempoLocal)) };
    }).sort((a, b) => ordem === "asc" ? a.mediana - b.mediana : b.mediana - a.mediana);

    const lista = document.getElementById("employee-list");
    lista.innerHTML = funcionarioMedianas.map(({ funcionario, mediana: tempo }) => {
        const classe = classificacao(tempo);
        return `
            <button class="employee-option ${classe === "inefficient" ? "inefficient" : classe === "intermediate" ? "intermediate" : ""} ${funcionario.id === funcionarioSelecionadoId ? "selected" : ""}"
                type="button" data-employee-id="${funcionario.id}">
                <strong>${funcionario.nome} · ${tempo} min</strong>
                <span>${funcionario.cargo}</span>
            </button>
        `;
    }).join("");

    lista.querySelectorAll("[data-employee-id]").forEach(botao => {
        botao.addEventListener("click", () => {
            funcionarioSelecionadoId = botao.dataset.employeeId;
            chamadoSelecionadoId = null;
            renderizarPainel();
        });
    });
}

function renderizarPainel() {
    const funcionario = obterFuncionario();
    const base = obterBase(funcionario);
    const meses = document.getElementById("period-select").value;
    const chamados = obterChamadosFuncionario(funcionario, meses);

    if (!chamados.length) chamadoSelecionadoId = null;
    if (!chamadoSelecionadoId || !chamados.some(chamado => chamado.id === chamadoSelecionadoId)) {
        chamadoSelecionadoId = chamados[0]?.id || null;
    }

    const chamadoAtual = chamados.find(chamado => chamado.id === chamadoSelecionadoId) || chamados[0];
    const tempos = chamados.map(chamado => chamado.tempoLocal);
    const deslocamentos = chamados.map(chamado => chamado.deslocamento);
    const tempoMediano = mediana(tempos);
    const deslocamentoMediano = mediana(deslocamentos);
    const equipe = mediana(dadosMock.funcionarios.flatMap(item =>
        obterChamadosFuncionario(item, meses).map(chamado => chamado.tempoLocal)
    ));
    const classe = classificacao(tempoMediano);
    const classeEquipe = classificacao(equipe);

    document.getElementById("page-title").textContent = funcionario.nome;
    document.getElementById("profile-initials").textContent = iniciais(funcionario.nome);
    document.getElementById("profile-name").textContent = funcionario.nome;
    document.getElementById("profile-role").textContent = `${funcionario.cargo} · ${base.nome}`;
    document.getElementById("profile-status").textContent = rotuloClassificacao(tempoMediano);
    document.getElementById("profile-status").className = `status-pill ${classe === "inefficient" ? "inefficient" : classe === "intermediate" ? "intermediate" : ""}`;

    document.getElementById("metric-time").textContent = `${tempoMediano} min`;
    document.getElementById("metric-time").className = `metric-value ${classe === "inefficient" ? "red-text" : classe === "intermediate" ? "orange-text" : "green-text"}`;
    document.getElementById("metric-time-note").textContent = `Mediana no local · ${rotuloClassificacao(tempoMediano)}`;
    document.getElementById("metric-team").textContent = `${equipe} min`;
    document.getElementById("metric-team").className = `metric-value ${classeEquipe === "inefficient" ? "red-text" : classeEquipe === "intermediate" ? "orange-text" : "green-text"}`;
    document.getElementById("metric-team-note").textContent = `Mediana geral da equipe · ${rotuloClassificacao(equipe)}`;
    document.getElementById("metric-distance").textContent = `${deslocamentoMediano} min`;
    document.getElementById("metric-calls").textContent = String(chamados.length);
    document.getElementById("history-count").textContent = String(chamados.length);

    renderizarChamados(chamados);
    renderizarCriterios();
    renderizarFuncionarios();

    if (chamadoAtual) renderizarMapa(chamadoAtual);
}

function renderizarChamados(chamados) {
    const lista = document.getElementById("call-list");
    lista.innerHTML = chamados.map(chamado => {
        const hospital = obterHospital(chamado);
        const classe = classificacao(chamado.tempoLocal);
        return `
            <button class="call-option ${classe === "inefficient" ? "inefficient" : classe === "intermediate" ? "intermediate" : ""} ${chamado.id === chamadoSelecionadoId ? "selected" : ""}"
                type="button" data-call-id="${chamado.id}">
                <strong>${chamado.equipamento} · ${chamado.tempoLocal} min</strong>
                <span>${hospital.nome} · ${formatarData(chamado.data)}</span>
            </button>
        `;
    }).join("");

    lista.querySelectorAll("[data-call-id]").forEach(botao => {
        botao.addEventListener("click", () => {
            chamadoSelecionadoId = botao.dataset.callId;
            renderizarPainel();
        });
    });
}

function renderizarCriterios(valores = limites) {
    const efficientStop = `${(valores.eficiente / 720) * 100}%`;
    const attentionStop = `${(valores.intermediario / 720) * 100}%`;
    const rangeWrap = document.querySelector(".range-wrap");

    document.getElementById("criteria-summary").innerHTML =
        `<strong>Até ${valores.eficiente} min eficiente</strong>` +
        `<span>Entre ${valores.eficiente + 1} e ${valores.intermediario} min intermediário</span>` +
        `<span>Acima de ${valores.intermediario} min ineficiente</span>`;
    document.getElementById("efficient-limit").value = valores.eficiente;
    document.getElementById("attention-limit").value = valores.intermediario;
    rangeWrap.style.setProperty("--efficient-stop", efficientStop);
    rangeWrap.style.setProperty("--attention-stop", attentionStop);

    const efficientLabel = document.getElementById("efficient-range-label");
    efficientLabel.textContent = `${valores.eficiente} min`;
    efficientLabel.style.left = efficientStop;
    efficientLabel.style.transform = "translateX(-50%)";

    const attentionLabel = document.getElementById("attention-range-label");
    attentionLabel.textContent = `${valores.intermediario} min`;
    attentionLabel.style.left = attentionStop;
    attentionLabel.style.transform = "translateX(-50%)";
}

function inicializarMapa() {
    if (!window.L || mapa) return;
    mapa = L.map("map", { scrollWheelZoom: false }).setView([-23.568, -46.672], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap"
    }).addTo(mapa);
}

function criarMarcador(lat, lng, tipo, texto, titulo) {
    const marcador = L.marker([lat, lng], {
        icon: L.divIcon({
            className: "",
            html: `<div class="leaflet-location-marker ${tipo}-marker"><span>${texto}</span></div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 28]
        })
    }).addTo(mapa);
    const conteudoPopup = document.createElement("strong");
    conteudoPopup.textContent = titulo;
    marcador.bindPopup(conteudoPopup);
    marcadores.push(marcador);
}

async function carregarLocaisEmpresa() {
    if (locaisEmpresa) return locaisEmpresa;
    if (requisicaoLocais) return requisicaoLocais;

    requisicaoLocais = (async () => {
        const idUsuario = Number(localStorage.getItem("ID_USUARIO"));
        if (!Number.isSafeInteger(idUsuario) || idUsuario <= 0) {
            throw new Error("Faça login novamente para carregar os locais da sua empresa.");
        }

        const resposta = await fetch(`/mapa/locais/${idUsuario}`, {
            headers: { Accept: "application/json" }
        });
        const dados = await resposta.json();
        if (!resposta.ok) {
            throw new Error(dados.mensagem || "Não foi possível carregar os locais da empresa.");
        }
        if (
            !Number.isSafeInteger(dados.empresaId) ||
            !Array.isArray(dados.bases) ||
            !Array.isArray(dados.hospitais)
        ) {
            throw new Error("A resposta do endpoint de locais está inválida.");
        }

        const empresaDaSessao = Number(localStorage.getItem("FK_EMPRESA"));
        if (empresaDaSessao && empresaDaSessao !== dados.empresaId) {
            throw new Error("O usuário conectado não corresponde à empresa retornada pelo banco.");
        }

        locaisEmpresa = dados;
        return dados;
    })();

    return requisicaoLocais;
}

async function renderizarMapa() {
    inicializarMapa();
    if (!mapa) {
        document.getElementById("route-status").textContent = "Não foi possível carregar o mapa.";
        return;
    }

    marcadores.forEach(marcador => marcador.remove());
    marcadores = [];

    document.getElementById("route-summary").textContent = "Carregando bases e hospitais da empresa...";
    document.getElementById("route-estimate-title").textContent = "Carregando locais...";
    document.getElementById("route-status").textContent = "Buscando os endereços associados ao usuário conectado.";

    try {
        const dados = await carregarLocaisEmpresa();
        const todosLocais = [
            ...dados.bases.map(local => ({ ...local, tipo: "base" })),
            ...dados.hospitais.map(local => ({ ...local, tipo: "hospital" }))
        ];
        const localizacoesValidas = todosLocais.filter(local =>
            Number.isFinite(local.latitude) &&
            Number.isFinite(local.longitude) &&
            Math.abs(local.latitude) <= 90 &&
            Math.abs(local.longitude) <= 180
        );

        localizacoesValidas.forEach(local => {
            criarMarcador(
                local.latitude,
                local.longitude,
                local.tipo,
                local.tipo === "base" ? "B" : "H",
                local.nome
            );
        });

        document.getElementById("route-summary").textContent =
            `Bases e hospitais da empresa ${dados.empresaId}`;

        if (marcadores.length) {
            mapa.fitBounds(L.featureGroup(marcadores).getBounds(), { padding: [24, 24] });
        }

        const semCoordenadas = todosLocais.length - localizacoesValidas.length;
        document.getElementById("route-estimate-title").textContent =
            `${localizacoesValidas.length} locais encontrados`;
        document.getElementById("route-status").textContent = semCoordenadas
            ? `${semCoordenadas} locais não puderam ser geocodificados. Os chamados desta tela ainda são demonstrativos e não possuem rota real.`
            : "Locais carregados do banco. Os chamados desta tela ainda são demonstrativos e não possuem rota real.";
    } catch (erro) {
        document.getElementById("route-summary").textContent = "Não foi possível carregar os locais da empresa.";
        document.getElementById("route-estimate-title").textContent = "Falha ao carregar locais";
        document.getElementById("route-status").textContent =
            erro.message;
    }
}

function configurarCriterios() {
    const editButton = document.getElementById("edit-criteria");
    const saveButton = document.getElementById("save-criteria");
    const eficiente = document.getElementById("efficient-limit");
    const intermediario = document.getElementById("attention-limit");

    const atualizarRascunho = (limiteAlterado) => {
        let eficienteRascunho = Number(eficiente.value);
        let intermediarioRascunho = Number(intermediario.value);

        if (limiteAlterado === "efficient") {
            eficienteRascunho = Math.max(60, Math.min(719, eficienteRascunho));
            if (eficienteRascunho >= intermediarioRascunho) {
                intermediarioRascunho = eficienteRascunho + 1;
            }
        } else {
            intermediarioRascunho = Math.max(61, Math.min(720, intermediarioRascunho));
            if (intermediarioRascunho <= eficienteRascunho) {
                eficienteRascunho = intermediarioRascunho - 1;
            }
        }

        eficiente.value = String(eficienteRascunho);
        intermediario.value = String(intermediarioRascunho);
        renderizarCriterios({
            eficiente: eficienteRascunho,
            intermediario: intermediarioRascunho
        });
    };

    editButton.addEventListener("click", () => {
        eficiente.disabled = false;
        intermediario.disabled = false;
        editButton.hidden = true;
        saveButton.hidden = false;
    });

    eficiente.addEventListener("input", () => atualizarRascunho("efficient"));
    intermediario.addEventListener("input", () => atualizarRascunho("intermediate"));

    saveButton.addEventListener("click", () => {
        limites.eficiente = Number(eficiente.value);
        limites.intermediario = Number(intermediario.value);
        eficiente.disabled = true;
        intermediario.disabled = true;
        editButton.hidden = false;
        saveButton.hidden = true;
        document.getElementById("save-message").textContent = "Critérios atualizados.";
        renderizarPainel();
    });
}

function configurarConta() {
    const nome = (localStorage.getItem("NOME_USUARIO") || "").trim() || "Usuário BioTrace";
    const email = localStorage.getItem("EMAIL_USUARIO") || "usuario@biotrace.com";
    const partes = nome.split(/\s+/).filter(Boolean);
    const iniciaisConta = partes.length > 1
        ? partes[0][0] + partes[partes.length - 1][0]
        : (partes[0] || "BT").slice(0, 2);

    document.querySelector(".account-copy strong").textContent = nome;
    document.querySelector(".account-copy span").textContent = email;
    document.querySelector(".avatar-small").textContent = iniciaisConta.toUpperCase();
    document.querySelector(".logout-button").addEventListener("click", () => {
        sessionStorage.clear();
        localStorage.clear();
        window.location.href = "../login.html";
    });
}

document.addEventListener("DOMContentLoaded", () => {
    configurarConta();
    configurarCriterios();
    document.getElementById("period-select").addEventListener("change", renderizarPainel);
    document.getElementById("employee-sort").addEventListener("change", renderizarFuncionarios);
    renderizarPainel();
});
