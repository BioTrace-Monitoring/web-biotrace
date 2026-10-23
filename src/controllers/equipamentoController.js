var equipamentoModel = require("../models/equipamentoModel");

function idValido(valor) {
    if (typeof valor !== "string" && typeof valor !== "number") return false;
    return Number.isSafeInteger(Number(valor)) && Number(valor) > 0;
}

function textoValido(valor) {
    return typeof valor === "string" && valor.trim().length > 0 && valor.trim().length <= 60;
}

function tratarErro(res, erro, mensagemDuplicado) {
    console.error("Erro no cadastro de equipamentos:", erro);
    if (erro.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ sucesso: false, mensagem: mensagemDuplicado || "Este registro já está cadastrado." });
    }
    if (erro.code === "ER_NO_REFERENCED_ROW_2") {
        return res.status(400).json({ sucesso: false, mensagem: "Empresa, modelo, lote ou hospital não encontrado. Atualize a página e tente novamente." });
    }
    return res.status(500).json({ sucesso: false, mensagem: "Não foi possível concluir a operação. Tente novamente." });
}

function listarModelos(req, res) {
    if (!idValido(req.params.idEmpresa)) return res.status(400).json({ sucesso: false, mensagem: "ID da empresa inválido." });
    return equipamentoModel.listarModelos(Number(req.params.idEmpresa))
        .then(function (modelos) { res.json({ sucesso: true, modelos: modelos }); })
        .catch(function (erro) { tratarErro(res, erro); });
}

function cadastrarModelo(req, res) {
    var nome = req.body.nomeServer;
    if (!idValido(req.params.idEmpresa)) return res.status(400).json({ sucesso: false, mensagem: "ID da empresa inválido." });
    if (!textoValido(nome)) return res.status(400).json({ sucesso: false, mensagem: "Informe o nome do modelo com até 60 caracteres." });

    return equipamentoModel.cadastrarModelo(nome.trim(), Number(req.params.idEmpresa))
        .then(function (resultado) {
            if (!resultado.affectedRows) return res.status(404).json({ sucesso: false, mensagem: "Empresa não encontrada ou inativa." });
            res.status(201).json({ sucesso: true, idInserido: resultado.insertId, mensagem: "Modelo cadastrado com sucesso! Agora você pode cadastrar um lote." });
        })
        .catch(function (erro) { tratarErro(res, erro, "Sua empresa já cadastrou um modelo com esse nome."); });
}

function listarLotes(req, res) {
    if (!idValido(req.params.idEmpresa)) return res.status(400).json({ sucesso: false, mensagem: "ID da empresa inválido." });
    return equipamentoModel.listarLotes(Number(req.params.idEmpresa))
        .then(function (lotes) { res.json({ sucesso: true, lotes: lotes }); })
        .catch(function (erro) { tratarErro(res, erro); });
}

function cadastrarLote(req, res) {
    var numero = req.body.numeroServer;
    var idModelo = req.body.idModeloServer;
    if (!idValido(req.params.idEmpresa)) return res.status(400).json({ sucesso: false, mensagem: "ID da empresa inválido." });
    if (!textoValido(numero)) return res.status(400).json({ sucesso: false, mensagem: "Informe o número do lote com até 60 caracteres." });
    if (!idValido(idModelo)) return res.status(400).json({ sucesso: false, mensagem: "Selecione um modelo para o lote." });

    return equipamentoModel.cadastrarLote(numero.trim(), Number(idModelo), Number(req.params.idEmpresa))
        .then(function (resultado) {
            if (!resultado.affectedRows) return res.status(404).json({ sucesso: false, mensagem: "Modelo não encontrado para esta empresa." });
            res.status(201).json({ sucesso: true, idInserido: resultado.insertId, mensagem: "Lote cadastrado com sucesso! Agora você pode cadastrar seus equipamentos." });
        })
        .catch(function (erro) { tratarErro(res, erro, "Sua empresa já cadastrou um lote com esse número."); });
}

function listarEquipamentos(req, res) {
    if (!idValido(req.params.idEmpresa)) return res.status(400).json({ sucesso: false, mensagem: "ID da empresa inválido." });
    return equipamentoModel.listarEquipamentos(Number(req.params.idEmpresa))
        .then(function (equipamentos) { res.json({ sucesso: true, equipamentos: equipamentos }); })
        .catch(function (erro) { tratarErro(res, erro); });
}

function cadastrarEquipamento(req, res) {
    var numeroSerie = req.body.numeroSerieServer;
    var idLote = req.body.idLoteServer;
    var idHospital = req.body.idHospitalServer;
    if (!idValido(req.params.idEmpresa)) return res.status(400).json({ sucesso: false, mensagem: "ID da empresa inválido." });
    if (!textoValido(numeroSerie)) return res.status(400).json({ sucesso: false, mensagem: "Informe o número de série com até 60 caracteres." });
    if (!idValido(idLote)) return res.status(400).json({ sucesso: false, mensagem: "Selecione o lote do equipamento." });
    if (idHospital != null && idHospital !== "" && !idValido(idHospital)) return res.status(400).json({ sucesso: false, mensagem: "Hospital inválido." });
    idHospital = idHospital == null || idHospital === "" ? null : Number(idHospital);

    return equipamentoModel.cadastrarEquipamento(numeroSerie.trim(), Number(idLote), idHospital, Number(req.params.idEmpresa))
        .then(function (resultado) {
            if (!resultado.affectedRows) return res.status(404).json({ sucesso: false, mensagem: "Lote ou hospital não encontrado para esta empresa." });
            res.status(201).json({ sucesso: true, idInserido: resultado.insertId, mensagem: "Equipamento cadastrado com sucesso!" });
        })
        .catch(function (erro) { tratarErro(res, erro, "Já existe um equipamento com esse número de série."); });
}

function atualizarHospital(req, res) {
    var idHospital = req.body.idHospitalServer;
    if (!idValido(req.params.idEmpresa) || !idValido(req.params.idEquipamento)) return res.status(400).json({ sucesso: false, mensagem: "Empresa ou equipamento inválido." });
    if (idHospital === undefined || (idHospital !== null && idHospital !== "" && !idValido(idHospital))) return res.status(400).json({ sucesso: false, mensagem: "Selecione um hospital ou a opção sem hospital." });
    idHospital = idHospital === null || idHospital === "" ? null : Number(idHospital);

    return equipamentoModel.atualizarHospital(Number(req.params.idEquipamento), idHospital, Number(req.params.idEmpresa))
        .then(function (resultado) {
            if (!resultado.affectedRows) return res.status(404).json({ sucesso: false, mensagem: "Equipamento ou hospital não encontrado para esta empresa." });
            res.json({ sucesso: true, mensagem: "Vínculo com hospital atualizado!" });
        })
        .catch(function (erro) { tratarErro(res, erro); });
}

function cadastrarIntervalo(req, res) {
    var prefixo = req.body.prefixoServer;
    var inicio = req.body.inicioServer;
    var fim = req.body.fimServer;
    var idLote = req.body.idLoteServer;
    var idHospital = req.body.idHospitalServer;

    if (!idValido(req.params.idEmpresa)) return res.status(400).json({ sucesso: false, mensagem: "ID da empresa inválido." });
    if (typeof prefixo !== "string" || prefixo.trim().length > 50) return res.status(400).json({ sucesso: false, mensagem: "Informe um prefixo de até 50 caracteres." });
    if (typeof inicio !== "string" || typeof fim !== "string" || !/^\d{1,9}$/.test(inicio) || !/^\d{1,9}$/.test(fim)) {
        return res.status(400).json({ sucesso: false, mensagem: "Informe o início e o fim com até 9 dígitos. Exemplo: 001 até 040." });
    }
    var quantidade = Number(fim) - Number(inicio) + 1;
    if (quantidade < 1 || quantidade > 500) return res.status(400).json({ sucesso: false, mensagem: "O intervalo deve conter de 1 a 500 equipamentos, com o fim maior ou igual ao início." });
    if (!idValido(idLote)) return res.status(400).json({ sucesso: false, mensagem: "Selecione o lote dos equipamentos." });
    if (idHospital != null && idHospital !== "" && !idValido(idHospital)) return res.status(400).json({ sucesso: false, mensagem: "Hospital inválido." });
    idHospital = idHospital == null || idHospital === "" ? null : Number(idHospital);
    prefixo = prefixo.trim();

    var largura = Math.max(inicio.length, fim.length);
    var numerosSerie = [];
    for (var numero = Number(inicio); numero <= Number(fim); numero++) {
        numerosSerie.push(prefixo + String(numero).padStart(largura, "0"));
    }

    return equipamentoModel.cadastrarEquipamentos(numerosSerie, Number(idLote), idHospital, Number(req.params.idEmpresa))
        .then(function (resultado) {
            if (!resultado.affectedRows) return res.status(404).json({ sucesso: false, mensagem: "Lote ou hospital não encontrado para esta empresa." });
            res.status(201).json({ sucesso: true, quantidade: resultado.affectedRows, mensagem: resultado.affectedRows + " equipamentos cadastrados com sucesso!" });
        })
        .catch(function (erro) { tratarErro(res, erro, "Uma das séries do intervalo já está cadastrada. Nenhum equipamento deste envio foi adicionado."); });
}

module.exports = {
    listarModelos, cadastrarModelo, listarLotes, cadastrarLote,
    listarEquipamentos, cadastrarEquipamento, cadastrarIntervalo, atualizarHospital
};
