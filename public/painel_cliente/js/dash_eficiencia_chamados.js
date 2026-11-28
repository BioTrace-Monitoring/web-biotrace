let funcionarios = [];
let funcionarioSelecionadoId = null;
let chamadoSelecionadoId = null;
let mapa = null;
let marcadores = [];
let limites = { eficiente: 180, intermediario: 360 };
let locaisEmpresa = null;

function mediana(valores) {
    valores = valores.filter(Number.isFinite);
    if (!valores.length) return null;
    const ordenados = [...valores].sort((a, b) => a - b);
    const meio = Math.floor(ordenados.length / 2);
    return ordenados.length % 2
        ? ordenados[meio]
        : Math.round((ordenados[meio - 1] + ordenados[meio]) / 2);
}

function classificacao(tempo) {
    if (tempo === null) return "unavailable";
    if (tempo <= limites.eficiente) return "efficient";
    if (tempo <= limites.intermediario) return "intermediate";
    return "inefficient";
}

function rotuloClassificacao(tempo) {
    if (tempo === null) return "Sem dados";
    if (classificacao(tempo) === "efficient") return "Eficiente";
    if (classificacao(tempo) === "intermediate") return "Intermediário";
    return "Ineficiente";
}

function iniciais(nome) {
    return nome.split(/\s+/).map(parte => parte[0]).slice(0, 2).join("").toUpperCase();
}

function formatarData(dataIso) {
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
        .format(new Date(dataIso));
}

function obterFuncionario() {
    return funcionarios.find(funcionario => funcionario.id === funcionarioSelecionadoId);
}

function obterLocal(tipo, id) {
    return locaisEmpresa?.[tipo].find(local => String(local.id) === String(id));
}

function obterChamadosFuncionario(funcionario, meses) {
    const hoje = new Date();
    const limite = new Date(hoje);
    const dia = limite.getDate();
    limite.setDate(1);
    limite.setMonth(limite.getMonth() - Number(meses));
    const fimDoMes = new Date(limite.getFullYear(), limite.getMonth() + 1, 0);
    limite.setDate(Math.min(dia, fimDoMes.getDate()));

    return (funcionario?.chamados ?? [])
        .filter(chamado => {
            const data = Date.parse(chamado.resolvidoEm);
            return data >= limite.getTime() && data <= hoje.getTime();
        })
        .sort((a, b) => Date.parse(b.resolvidoEm) - Date.parse(a.resolvidoEm));
}

function formatarMinutos(tempo) {
    return tempo === null ? "—" : `${Math.round(tempo)} min`;
}

function criarOpcao(tipo, titulo, descricao, tempo, selecionado, selecionar) {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.classList.add(tipo, classificacao(tempo));
    botao.classList.toggle("selected", selecionado);
    botao.setAttribute("aria-pressed", selecionado);
    const nome = document.createElement("strong");
    nome.textContent = titulo;
    const detalhe = document.createElement("span");
    detalhe.textContent = descricao;
    botao.append(nome, detalhe);
    botao.addEventListener("click", selecionar);
    return botao;
}

function renderizarFuncionarios() {
    const meses = document.getElementById("period-select").value;
    const ordem = document.getElementById("employee-sort").value;
    const funcionarioMedianas = funcionarios.map(funcionario => {
        const chamados = obterChamadosFuncionario(funcionario, meses);
        return { funcionario, tempo: mediana(chamados.map(chamado => chamado.tempoAjustado)) };
    }).sort((a, b) => {
        if (a.tempo === null || b.tempo === null) return Number(a.tempo === null) - Number(b.tempo === null);
        return ordem === "asc" ? a.tempo - b.tempo : b.tempo - a.tempo;
    });

    document.getElementById("employee-list").replaceChildren(...funcionarioMedianas.map(({ funcionario, tempo }) =>
        criarOpcao("employee-option", `${funcionario.nome} · ${formatarMinutos(tempo)}`,
            funcionario.cargo || "Cargo indisponível", tempo, funcionario.id === funcionarioSelecionadoId, () => {
                funcionarioSelecionadoId = funcionario.id;
                chamadoSelecionadoId = null;
                renderizarPainel();
            })
    ));
}

function renderizarMetrica(id, tempo) {
    const metrica = document.getElementById(id);
    const cores = { efficient: "green-text", intermediate: "orange-text", inefficient: "red-text" };
    metrica.textContent = formatarMinutos(tempo);
    metrica.className = `metric-value ${cores[classificacao(tempo)] || ""}`;
    document.getElementById(`${id}-note`).textContent = rotuloClassificacao(tempo);
}

function renderizarPainel() {
    const funcionario = obterFuncionario();
    const base = obterLocal("bases", funcionario?.baseId);
    const meses = document.getElementById("period-select").value;
    const chamados = obterChamadosFuncionario(funcionario, meses);
    const chamadoAtual = chamados.find(chamado => chamado.id === chamadoSelecionadoId) || chamados[0];
    chamadoSelecionadoId = chamadoAtual?.id ?? null;

    const tempoMediano = mediana(chamados.map(chamado => chamado.tempoAjustado));
    const deslocamentoMediano = mediana(chamados.map(chamado => chamado.deslocamento));
    const equipe = mediana(funcionarios.flatMap(item =>
        obterChamadosFuncionario(item, meses).map(chamado => chamado.tempoAjustado)
    ));

    document.getElementById("page-title").textContent = funcionario?.nome ?? "Eficiência de chamados";
    document.getElementById("profile-initials").textContent = funcionario ? iniciais(funcionario.nome) : "—";
    document.getElementById("profile-name").textContent = funcionario?.nome ?? "Nenhum funcionário selecionado";
    document.getElementById("profile-role").textContent = [funcionario?.cargo, base?.nome].filter(Boolean).join(" · ");
    document.getElementById("profile-status").textContent = rotuloClassificacao(tempoMediano);
    document.getElementById("profile-status").className = `status-pill ${classificacao(tempoMediano)}`;

    renderizarMetrica("metric-time", tempoMediano);
    renderizarMetrica("metric-team", equipe);
    document.getElementById("metric-distance").textContent = formatarMinutos(deslocamentoMediano);
    document.getElementById("metric-calls").textContent = String(chamados.length);
    document.getElementById("history-count").textContent = String(chamados.length);

    renderizarChamados(chamados);
    renderizarCriterios();
    renderizarFuncionarios();
    if (locaisEmpresa) renderizarMapa(chamadoAtual, funcionario);
}

function renderizarChamados(chamados) {
    const lista = document.getElementById("call-list");
    lista.replaceChildren(...chamados.map(chamado => {
        const hospital = obterLocal("hospitais", chamado.hospitalId);
        const titulo = [chamado.id, chamado.equipamento].filter(Boolean).join(" · ");
        const descricao = [hospital?.nome, formatarData(chamado.resolvidoEm),
            `Atendimento: ${formatarMinutos(chamado.tempoAtendimento)}`,
            `Ajustado: ${formatarMinutos(chamado.tempoAjustado)}`].filter(Boolean).join(" · ");
        return criarOpcao("call-option", titulo, descricao, chamado.tempoAjustado,
            chamado.id === chamadoSelecionadoId, () => {
                chamadoSelecionadoId = chamado.id;
                renderizarPainel();
            });
    }));
    if (!chamados.length && obterFuncionario()) lista.textContent = "Nenhum chamado concluído no período.";
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
    try {
        const idUsuario = Number(localStorage.getItem("ID_USUARIO"));
        const token = localStorage.getItem("token");
        if (!Number.isSafeInteger(idUsuario) || idUsuario <= 0 || !token) {
            throw new Error("Faça login novamente para carregar os locais da sua empresa.");
        }

        const resposta = await fetch(`/mapa/locais/${idUsuario}`, {
            headers: { Accept: "application/json", Authorization: `Bearer ${token}` }
        });
        const dados = await resposta.json();
        if (!resposta.ok) {
            throw new Error(dados?.mensagem || dados?.erro || "Não foi possível carregar os locais da empresa.");
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
        renderizarPainel();
    } catch (erro) {
        document.getElementById("route-summary").textContent = "Bases e hospitais indisponíveis.";
        document.getElementById("route-estimate-title").textContent = "Falha ao carregar locais";
        document.getElementById("route-status").textContent = erro.message;
    }
}

function renderizarMapa(chamado, funcionario) {
    inicializarMapa();
    if (!mapa) {
        document.getElementById("route-status").textContent = "Não foi possível carregar o mapa.";
        return;
    }

    marcadores.forEach(marcador => marcador.remove());
    marcadores = [];

    const base = obterLocal("bases", chamado?.baseId ?? funcionario?.baseId);
    const hospital = obterLocal("hospitais", chamado?.hospitalId);
    const locaisDoChamado = [base, hospital].filter(Boolean);
    const locais = chamado && locaisDoChamado.length
        ? locaisDoChamado : [...locaisEmpresa.bases, ...locaisEmpresa.hospitais];
    const localizacoesValidas = locais.filter(local =>
        Number.isFinite(local.latitude) && Math.abs(local.latitude) <= 90 &&
        Number.isFinite(local.longitude) && Math.abs(local.longitude) <= 180
    );

    for (const local of localizacoesValidas) {
        criarMarcador(local.latitude, local.longitude, local.tipo,
            local.tipo === "base" ? "B" : "H", local.nome);
    }
    if (marcadores.length) {
        mapa.fitBounds(L.featureGroup(marcadores).getBounds(), { padding: [24, 24], maxZoom: 15 });
    } else {
        mapa.setView([-23.568, -46.672], 12);
    }

    document.getElementById("route-summary").textContent = chamado
        ? `${base?.nome ?? "Base indisponível"} → ${hospital?.nome ?? "Hospital indisponível"}`
        : `Bases e hospitais da empresa ${locaisEmpresa.empresaId}`;
    document.getElementById("route-estimate-title").textContent = chamado
        ? `Deslocamento estimado: ${formatarMinutos(chamado.deslocamento)}`
        : `${localizacoesValidas.length} locais com coordenadas`;
    document.getElementById("route-status").textContent = locais.length > localizacoesValidas.length
        ? "Alguns locais estão sem coordenadas." : "";
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

async function consultarChamadosEmpresa() {
    const status = document.getElementById("chamados-api-status");
    const idEmpresa = Number(localStorage.getItem("FK_EMPRESA"));
    const token = localStorage.getItem("token");
    if (!Number.isSafeInteger(idEmpresa) || idEmpresa <= 0 || !token) {
        status.textContent = "Faça login para consultar os chamados da empresa.";
        return;
    }

    status.textContent = "Consultando chamados da empresa...";
    try {
        const resposta = await fetch(`/chamados/${idEmpresa}`, {
            headers: { Accept: "application/json", Authorization: `Bearer ${token}` }
        });
        const dados = await resposta.json();
        if (!resposta.ok) {
            throw new Error(dados?.mensagem || dados?.erro || "Não foi possível consultar os chamados.");
        }
        funcionarios = dados.funcionarios;
        funcionarioSelecionadoId = funcionarios[0]?.id ?? null;
        renderizarPainel();
        status.textContent = funcionarios.length ? "" : "Nenhum funcionário recebido para esta empresa.";
    } catch (erro) {
        status.textContent = erro.message;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    configurarConta();
    configurarCriterios();
    document.getElementById("period-select").addEventListener("change", renderizarPainel);
    document.getElementById("employee-sort").addEventListener("change", renderizarFuncionarios);
    renderizarPainel();
    carregarLocaisEmpresa();
    consultarChamadosEmpresa();
});
