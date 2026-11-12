var model = require("../models/engenhariaModel");

function idPositivo(valor) {
    return (
        (typeof valor === "number" || typeof valor === "string") &&
        Number.isSafeInteger(Number(valor)) &&
        Number(valor) > 0
    );
}
function identificador(valor) {
    if (!idPositivo(valor))
        throw model.erroEngenharia(400, "Identificador inválido.");
    return Number(valor);
}
function textoOpcional(valor) {
    if (valor === undefined || valor === null) return null;
    if (typeof valor !== "string" || valor.length > 10000)
        throw model.erroEngenharia(
            400,
            "As observações devem ter até 10.000 caracteres.",
        );
    return valor.trim();
}
function validarProtocolo(dados, usuario) {
    var textos = [
        "nome",
        "procedimento",
        "checklist_layout",
        "checklist_compatibilidade",
        "checklist_funcionamento",
    ];
    for (var campo of textos) {
        if (
            typeof dados[campo] !== "string" ||
            !dados[campo].trim() ||
            dados[campo].length > 10000
        )
            throw model.erroEngenharia(
                400,
                "Preencha o nome, procedimento e os três checklists.",
            );
        dados[campo] = dados[campo].trim();
    }
    if (dados.nome.length > 100)
        throw model.erroEngenharia(400, "O nome deve ter até 100 caracteres.");
    var numeros = [
        "duracao_minutos",
        "intervalo_coleta_segundos",
        "cobertura_minima_percentual",
        "tolerancia_envio_minutos",
        "limite_temperatura",
        "limite_cpu",
        "limite_ram",
        "minimo_disco_livre",
    ];
    for (var campo of numeros) {
        if (
            (typeof dados[campo] !== "number" &&
                typeof dados[campo] !== "string") ||
            String(dados[campo]).trim() === "" ||
            !Number.isFinite(Number(dados[campo]))
        )
            throw model.erroEngenharia(
                400,
                "Preencha os limites e a duração com números válidos.",
            );
        dados[campo] = Number(dados[campo]);
    }
    if (
        !Number.isInteger(dados.duracao_minutos) ||
        dados.duracao_minutos < 1 ||
        dados.duracao_minutos > 525600 ||
        !Number.isInteger(dados.intervalo_coleta_segundos) ||
        dados.intervalo_coleta_segundos < 1 ||
        dados.intervalo_coleta_segundos > 86400 ||
        !Number.isInteger(dados.tolerancia_envio_minutos) ||
        dados.tolerancia_envio_minutos < 0 ||
        dados.tolerancia_envio_minutos > 10080 ||
        dados.cobertura_minima_percentual <= 0 ||
        dados.cobertura_minima_percentual > 100 ||
        dados.limite_temperatura < 0 ||
        dados.limite_temperatura > 200 ||
        dados.limite_cpu < 0 ||
        dados.limite_cpu > 100 ||
        dados.limite_ram < 0 ||
        dados.limite_ram > 100 ||
        dados.minimo_disco_livre < 0 ||
        dados.minimo_disco_livre > 100
    )
        throw model.erroEngenharia(
            400,
            "Confira a duração, o intervalo e os limites do protocolo. Percentuais vão de 0 a 100.",
        );
    dados.fk_modelo_equipamento = identificador(dados.fk_modelo_equipamento);
    dados.fk_responsavel = identificador(
        dados.fk_responsavel === undefined ? usuario.id : dados.fk_responsavel,
    );
    return dados;
}
function responderErro(res, erro) {
    if (erro.status)
        return res
            .status(erro.status)
            .json({ sucesso: false, mensagem: erro.message });
    if (
        ["ER_LOCK_DEADLOCK", "ER_LOCK_WAIT_TIMEOUT", "ER_DUP_ENTRY"].includes(
            erro.code,
        )
    )
        return res.status(409).json({
            sucesso: false,
            mensagem:
                "Os dados foram alterados simultaneamente. Consulte o registro e tente novamente.",
        });
    console.error("Erro no módulo de engenharia:", erro.code || erro.name);
    return res.status(500).json({
        sucesso: false,
        mensagem: "Não foi possível concluir a operação de engenharia.",
    });
}
async function validarAcesso(req, res, next) {
    try {
        if (
            !idPositivo(req.usuario.id) ||
            !idPositivo(req.usuario.fk_empresa) ||
            req.usuario.tipo
        )
            return res.status(403).json({
                sucesso: false,
                mensagem: "Sessão de acesso inválida. Entre novamente.",
            });
        var usuarios = await model.acessoUsuario(
            Number(req.usuario.id),
            Number(req.usuario.fk_empresa),
        );
        if (
            !usuarios.length ||
            !["administrador", "gestor"].includes(
                usuarios[0].cargo.trim().toLowerCase(),
            )
        )
            return res.status(403).json({
                sucesso: false,
                mensagem: "Acesso permitido somente a administrador e gestor.",
            });
        next();
    } catch (erro) {
        responderErro(res, erro);
    }
}
async function listarProtocolos(req, res) {
    try {
        res.json({
            sucesso: true,
            protocolos: await model.listarProtocolos(req.usuario.fk_empresa),
        });
    } catch (erro) {
        responderErro(res, erro);
    }
}
async function buscarProtocolo(req, res) {
    try {
        res.json({
            sucesso: true,
            protocolo: await model.buscarProtocolo(
                req.usuario.fk_empresa,
                identificador(req.params.id),
            ),
        });
    } catch (erro) {
        responderErro(res, erro);
    }
}
async function cadastrarProtocolo(req, res) {
    try {
        var dados = validarProtocolo(req.body, req.usuario);
        var origem = req.params.id ? identificador(req.params.id) : null;
        res.status(201).json({
            sucesso: true,
            protocolo: await model.cadastrarProtocolo(
                req.usuario.fk_empresa,
                dados,
                origem,
            ),
        });
    } catch (erro) {
        responderErro(res, erro);
    }
}
async function listarEnsaios(req, res) {
    try {
        res.json({
            sucesso: true,
            ensaios: await model.listarEnsaios(req.usuario.fk_empresa),
        });
    } catch (erro) {
        responderErro(res, erro);
    }
}
async function buscarEnsaio(req, res) {
    try {
        res.json({
            sucesso: true,
            ensaio: await model.buscarEnsaio(
                req.usuario.fk_empresa,
                identificador(req.params.id),
            ),
        });
    } catch (erro) {
        responderErro(res, erro);
    }
}
async function cadastrarEnsaio(req, res) {
    try {
        var body = req.body;
        if (!["bancada", "campo"].includes(body.ambiente))
            throw model.erroEngenharia(400, "Selecione bancada ou campo.");
        if (
            !Array.isArray(body.equipamentos) ||
            !body.equipamentos.length ||
            body.equipamentos.length > 500 ||
            !body.equipamentos.every(idPositivo) ||
            new Set(body.equipamentos.map(Number)).size !==
                body.equipamentos.length
        )
            throw model.erroEngenharia(
                400,
                "Selecione de 1 a 500 equipamentos, sem repetições.",
            );
        var dados = {
            ambiente: body.ambiente,
            equipamentos: body.equipamentos.map(Number),
            fk_protocolo: identificador(body.fk_protocolo),
            fk_responsavel: identificador(
                body.fk_responsavel === undefined
                    ? req.usuario.id
                    : body.fk_responsavel,
            ),
            observacoes: textoOpcional(body.observacoes),
            reinicios_programados: textoOpcional(body.reinicios_programados),
        };
        res.status(201).json({
            sucesso: true,
            ensaio: await model.cadastrarEnsaio(req.usuario.fk_empresa, dados),
        });
    } catch (erro) {
        responderErro(res, erro);
    }
}
async function iniciarEnsaio(req, res) {
    try {
        res.json({
            sucesso: true,
            ensaio: await model.iniciarEnsaio(
                req.usuario.fk_empresa,
                identificador(req.params.id),
            ),
        });
    } catch (erro) {
        responderErro(res, erro);
    }
}
async function cancelarEnsaio(req, res) {
    try {
        res.json({
            sucesso: true,
            ensaio: await model.cancelarEnsaio(
                req.usuario.fk_empresa,
                identificador(req.params.id),
            ),
        });
    } catch (erro) {
        responderErro(res, erro);
    }
}
module.exports = {
    validarAcesso,
    listarProtocolos,
    buscarProtocolo,
    cadastrarProtocolo,
    listarEnsaios,
    buscarEnsaio,
    cadastrarEnsaio,
    iniciarEnsaio,
    cancelarEnsaio,
};
