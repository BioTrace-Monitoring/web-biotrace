const baseModel = require("../models/baseModel");
const localizacaoModel = require("../models/localizacaoModel");

function idValido(id) {
    return Number.isSafeInteger(id) && id > 0;
}

function falhaBanco(res, erro) {
    console.error("Erro na gestão de bases:", erro.code || erro.name);
    return res.status(500).json({ mensagem: "Não foi possível concluir a operação com as bases." });
}

async function verificarEmpresa(req, res, next) {
    const idEmpresa = Number(req.params.idEmpresa);
    if (!idValido(idEmpresa)) {
        return res.status(400).json({ mensagem: "ID da empresa inválido." });
    }

    const idUsuario = Number(req.usuario.id);
    if (!idValido(idUsuario) || Number(req.usuario.fk_empresa) !== idEmpresa) {
        return res.status(403).json({ mensagem: "Sua sessão não tem acesso a esta empresa." });
    }

    try {
        if (await localizacaoModel.buscarEmpresaDoUsuario(idUsuario) !== idEmpresa) {
            return res.status(403).json({ mensagem: "O usuário não pertence mais a esta empresa." });
        }
        req.idEmpresa = idEmpresa;
        next();
    } catch (erro) {
        return falhaBanco(res, erro);
    }
}

async function cadastrar(req, res) {
    const nome = typeof req.body?.nome === "string" ? req.body.nome.trim() : "";
    const cep = typeof req.body?.cep === "string" ? req.body.cep.trim() : "";
    const numero = typeof req.body?.numero === "string" ? req.body.numero.trim() : "";
    if (!nome || nome.length > 100 || !/^\d{5}-?\d{3}$/.test(cep) || !numero || numero.length > 10) {
        return res.status(400).json({ mensagem: "Informe nome, CEP com 8 dígitos e número do endereço." });
    }

    try {
        const resultado = await baseModel.cadastrar(req.idEmpresa, nome, cep.replace("-", ""), numero);
        return res.status(201).json({
            id: resultado.insertId, nome, cep: cep.replace("-", ""), numero
        });
    } catch (erro) {
        return falhaBanco(res, erro);
    }
}

async function listarFuncionarios(req, res) {
    try {
        return res.json(await baseModel.listarFuncionarios(req.idEmpresa));
    } catch (erro) {
        return falhaBanco(res, erro);
    }
}

async function realocarFuncionario(req, res) {
    const idFuncionario = Number(req.params.idFuncionario);
    const idBase = req.body?.baseId;
    if (!idValido(idFuncionario) || !idValido(idBase)) {
        return res.status(400).json({ mensagem: "Selecione um funcionário e uma base válidos." });
    }

    try {
        const resultado = await baseModel.realocarFuncionario(req.idEmpresa, idFuncionario, idBase);
        if (!resultado.affectedRows) {
            return res.status(404).json({ mensagem: "Funcionário ou base não encontrados nesta empresa." });
        }
        return res.json({ id: idFuncionario, baseId: idBase });
    } catch (erro) {
        return falhaBanco(res, erro);
    }
}

module.exports = { verificarEmpresa, cadastrar, listarFuncionarios, realocarFuncionario };
