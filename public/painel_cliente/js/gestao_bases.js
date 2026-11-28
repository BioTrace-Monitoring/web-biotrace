const cadastro = document.getElementById("cadastrar-base");
const realocacao = document.getElementById("realocar-funcionarios");
const formulario = cadastro || realocacao;
const botaoSalvar = formulario.querySelector("button[type=submit]");
const statusFormulario = document.getElementById("form-status");
const statusMapa = document.getElementById("mapa-status");
const empresa = Number(localStorage.getItem("FK_EMPRESA"));
const usuario = Number(localStorage.getItem("ID_USUARIO"));
const token = localStorage.getItem("token");

let bases = [];
let funcionarios = [];
let mapa;
let marcadores;
let salvando = false;

async function requisitar(url, metodo = "GET", dados) {
    const headers = { Accept: "application/json", Authorization: `Bearer ${token}` };
    if (dados) headers["Content-Type"] = "application/json";
    const resposta = await fetch(url, { method: metodo, headers, body: JSON.stringify(dados) });
    const resultado = await resposta.json().catch(() => null);
    if (!resposta.ok || resultado === null) {
        throw new Error(resultado?.mensagem || resultado?.erro || "Não foi possível concluir a operação.");
    }
    return resultado;
}

function mostrarStatus(elemento, mensagem, erro = false) {
    elemento.textContent = mensagem;
    elemento.classList.toggle("base-erro", erro);
}

function inicializarMapa() {
    if (!window.L) return;
    mapa = L.map("mapa-bases", { scrollWheelZoom: false }).setView([-23.568, -46.672], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap"
    }).addTo(mapa);
    marcadores = L.featureGroup().addTo(mapa);
}

function renderizarMapa() {
    if (!mapa) {
        mostrarStatus(statusMapa, "Não foi possível carregar o mapa.", true);
        return;
    }
    marcadores.clearLayers();
    const selecionada = realocacao?.elements.baseId.value;
    for (const base of bases) {
        if (!Number.isFinite(base.latitude) || Math.abs(base.latitude) > 90 ||
            !Number.isFinite(base.longitude) || Math.abs(base.longitude) > 180) continue;

        const posicao = [base.latitude, base.longitude];
        const popup = document.createElement("span");
        popup.textContent = base.nome;
        const marcador = L.marker(posicao).bindPopup(popup).addTo(marcadores);
        if (String(base.id) === selecionada) marcador.openPopup();
    }

    const quantidade = marcadores.getLayers().length;
    if (quantidade) mapa.fitBounds(marcadores.getBounds(), { padding: [24, 24], maxZoom: 15 });
    const semCoordenadas = bases.length - quantidade;
    mostrarStatus(statusMapa, bases.length
        ? `${quantidade} de ${bases.length} bases no mapa.${semCoordenadas ? " Alguns endereços estão sem coordenadas." : ""}`
        : "Nenhuma base cadastrada para esta empresa.");
}

function renderizarBasesCadastradas() {
    const lista = document.getElementById("lista-bases");
    const itens = bases.map(base => {
        const item = document.createElement("li");
        const nome = document.createElement("strong");
        const endereco = document.createElement("span");
        nome.textContent = base.nome;
        endereco.textContent = `CEP ${base.cep} · Nº ${base.numero}`;
        item.append(nome, endereco);
        return item;
    });
    lista.replaceChildren(...itens);
    if (!itens.length) lista.textContent = "Nenhuma base cadastrada.";
}

function funcionarioSelecionado() {
    return funcionarios.find(funcionario => String(funcionario.id) === realocacao.elements.funcionario.value);
}

function atualizarRealocacao() {
    const funcionario = funcionarioSelecionado();
    const destino = realocacao.elements.baseId;
    const valorAnterior = destino.value;
    document.getElementById("base-atual").textContent = funcionario
        ? `Base atual: ${funcionario.baseNome ?? "Sem base"}` : "";

    const destinos = bases.filter(base => String(base.id) !== String(funcionario?.baseId));
    destino.replaceChildren(new Option("Selecione uma base", ""), ...destinos.map(base => new Option(base.nome, base.id)));
    destino.value = destinos.some(base => String(base.id) === valorAnterior) ? valorAnterior : "";
    destino.disabled = salvando || !funcionario || !destinos.length;
    realocacao.elements.funcionario.disabled = salvando || !funcionarios.length;
    botaoSalvar.disabled = salvando || !funcionario || !destino.value;
}

async function carregarBases() {
    mostrarStatus(statusMapa, "Carregando bases da empresa…");
    try {
        const resultado = await requisitar(`/mapa/locais/${usuario}?tipo=base`);
        if (resultado.empresaId !== empresa || !Array.isArray(resultado.bases)) {
            throw new Error("Resposta de bases incompatível com a empresa da sessão.");
        }
        bases = resultado.bases;
        if (cadastro) renderizarBasesCadastradas();
        else atualizarRealocacao();
        renderizarMapa();
    } catch (erro) {
        mostrarStatus(statusMapa, erro.message, true);
    }
}

async function carregarFuncionarios() {
    try {
        funcionarios = await requisitar(`/bases/${empresa}/funcionarios`);
        const seletor = realocacao.elements.funcionario;
        seletor.replaceChildren(new Option(funcionarios.length ? "Selecione um funcionário" : "Nenhum funcionário encontrado", ""),
            ...funcionarios.map(funcionario => new Option(`${funcionario.nome} · ${funcionario.cargo}`, funcionario.id)));
        atualizarRealocacao();
    } catch (erro) {
        mostrarStatus(statusFormulario, erro.message, true);
    }
}

async function salvarCadastro() {
    const dados = Object.fromEntries(new FormData(cadastro));
    const base = await requisitar(`/bases/${empresa}`, "POST", dados);
    cadastro.reset();
    bases.push(base);
    renderizarBasesCadastradas();
    mostrarStatus(statusFormulario, `${base.nome} cadastrada com sucesso.`);
    await carregarBases();
}

async function salvarRealocacao() {
    const funcionario = funcionarioSelecionado();
    const base = bases.find(item => String(item.id) === realocacao.elements.baseId.value);
    await requisitar(`/bases/${empresa}/funcionarios/${funcionario.id}`, "PATCH", { baseId: base.id });
    funcionario.baseId = base.id;
    funcionario.baseNome = base.nome;
    mostrarStatus(statusFormulario, `${funcionario.nome} foi realocado para ${base.nome}.`);
}

inicializarMapa();

if ([empresa, usuario].every(id => Number.isSafeInteger(id) && id > 0) && token) {
    formulario.addEventListener("submit", async evento => {
        evento.preventDefault();
        if (salvando || botaoSalvar.disabled) return;
        salvando = true;
        botaoSalvar.disabled = true;
        if (realocacao) atualizarRealocacao();
        mostrarStatus(statusFormulario, "Salvando…");
        try {
            if (cadastro) await salvarCadastro();
            else await salvarRealocacao();
        } catch (erro) {
            mostrarStatus(statusFormulario, erro.message, true);
        } finally {
            salvando = false;
            if (cadastro) botaoSalvar.disabled = false;
            else atualizarRealocacao();
        }
    });

    const consultaBases = carregarBases();
    if (cadastro) consultaBases.then(() => { botaoSalvar.disabled = false; });
    else {
        realocacao.addEventListener("change", () => {
            atualizarRealocacao();
            if (mapa) renderizarMapa();
        });
        carregarFuncionarios();
    }
} else {
    mostrarStatus(statusFormulario, "Faça login para gerenciar as bases da empresa.", true);
    if (mapa) mostrarStatus(statusMapa, "Entre na sua conta para ver as bases no mapa.");
    else mostrarStatus(statusMapa, "Não foi possível carregar o mapa.", true);
}
