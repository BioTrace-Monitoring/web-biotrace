var equipamentoModel = require("../models/equipamentoModel");

function idValido(valor) {
    if (valor == null) return false;
    if (valor.constructor !== String && valor.constructor !== Number) return false;
    return Number.isSafeInteger(Number(valor)) && Number(valor) > 0;
}

function textoValido(valor) {
    if (valor == null || valor.constructor !== String) return false;
    return valor.trim().length > 0 && valor.trim().length <= 60;
}

function tratarErro(res, erro, mensagemDuplicado) {
    if (erro.status) {
        return res.status(erro.status).json({ sucesso: false, mensagem: erro.message });
    }

    console.error("Erro no cadastro de equipamentos:", erro);

    if (erro.code === "ER_DUP_ENTRY") {
        return res
            .status(409)
            .json({ sucesso: false, mensagem: mensagemDuplicado || "Este registro já está cadastrado." });
    }

    if (erro.code === "ER_ROW_IS_REFERENCED_2") {
        return res.status(409).json({
            sucesso: false,
            mensagem: "Este cadastro possui registros vinculados. Remova os lotes do modelo ou os equipamentos do lote antes de excluir."
        });
    }

    if (erro.code === "ER_NO_REFERENCED_ROW_2") {
        return res.status(400).json({
            sucesso: false,
            mensagem: "Empresa, modelo, lote ou hospital não encontrado. Atualize a página e tente novamente."
        });
    }

    return res
        .status(500)
        .json({ sucesso: false, mensagem: "Não foi possível concluir a operação. Tente novamente." });
}

function hospitalValido(idHospital) {
    return idHospital == null || idHospital === "" || idValido(idHospital);
}

function obterIdHospital(idHospital) {
    if (idHospital == null || idHospital === "") return null;
    return Number(idHospital);
}

async function listarModelos(req, res) {
    if (!idValido(req.params.idEmpresa)) {
        return res.status(400).json({ sucesso: false, mensagem: "ID da empresa inválido." });
    }

    try {
        var modelos = await equipamentoModel.listarModelos(Number(req.params.idEmpresa));
        return res.json({ sucesso: true, modelos: modelos });
    } catch (erro) {
        return tratarErro(res, erro);
    }
}

async function cadastrarModelo(req, res) {
    var nome = req.body.nomeServer;

    if (!idValido(req.params.idEmpresa)) {
        return res.status(400).json({ sucesso: false, mensagem: "ID da empresa inválido." });
    }

    if (!textoValido(nome)) {
        return res
            .status(400)
            .json({ sucesso: false, mensagem: "Informe o nome do modelo com até 60 caracteres." });
    }

    try {
        var resultado = await equipamentoModel.cadastrarModelo(nome.trim(), Number(req.params.idEmpresa));

        if (!resultado.affectedRows) {
            return res.status(404).json({ sucesso: false, mensagem: "Empresa não encontrada ou inativa." });
        }

        return res.status(201).json({
            sucesso: true,
            idInserido: resultado.insertId,
            mensagem: "Modelo cadastrado com sucesso! Agora você pode cadastrar um lote."
        });
    } catch (erro) {
        return tratarErro(res, erro, "Sua empresa já cadastrou um modelo com esse nome.");
    }
}

async function listarLotes(req, res) {
    if (!idValido(req.params.idEmpresa)) {
        return res.status(400).json({ sucesso: false, mensagem: "ID da empresa inválido." });
    }

    try {
        var lotes = await equipamentoModel.listarLotes(Number(req.params.idEmpresa));
        return res.json({ sucesso: true, lotes: lotes });
    } catch (erro) {
        return tratarErro(res, erro);
    }
}

async function cadastrarLote(req, res) {
    var numero = req.body.numeroServer;
    var idModelo = req.body.idModeloServer;

    if (!idValido(req.params.idEmpresa)) {
        return res.status(400).json({ sucesso: false, mensagem: "ID da empresa inválido." });
    }

    if (!textoValido(numero)) {
        return res
            .status(400)
            .json({ sucesso: false, mensagem: "Informe o número do lote com até 60 caracteres." });
    }

    if (!idValido(idModelo)) {
        return res.status(400).json({ sucesso: false, mensagem: "Selecione um modelo para o lote." });
    }

    try {
        var resultado = await equipamentoModel.cadastrarLote(
            numero.trim(),
            Number(idModelo),
            Number(req.params.idEmpresa)
        );

        if (!resultado.affectedRows) {
            return res
                .status(404)
                .json({ sucesso: false, mensagem: "Modelo não encontrado para esta empresa." });
        }

        return res.status(201).json({
            sucesso: true,
            idInserido: resultado.insertId,
            mensagem: "Lote cadastrado com sucesso! Agora você pode cadastrar seus equipamentos."
        });
    } catch (erro) {
        return tratarErro(res, erro, "Sua empresa já cadastrou um lote com esse número.");
    }
}

async function listarEquipamentos(req, res) {
    if (!idValido(req.params.idEmpresa)) {
        return res.status(400).json({ sucesso: false, mensagem: "ID da empresa inválido." });
    }

    try {
        var equipamentos = await equipamentoModel.listarEquipamentos(Number(req.params.idEmpresa));
        return res.json({ sucesso: true, equipamentos: equipamentos });
    } catch (erro) {
        return tratarErro(res, erro);
    }
}

async function cadastrarEquipamento(req, res) {
    var numeroSerie = req.body.numeroSerieServer;
    var idLote = req.body.idLoteServer;
    var idHospital = req.body.idHospitalServer;

    if (!idValido(req.params.idEmpresa)) {
        return res.status(400).json({ sucesso: false, mensagem: "ID da empresa inválido." });
    }

    if (!textoValido(numeroSerie)) {
        return res
            .status(400)
            .json({ sucesso: false, mensagem: "Informe o número de série com até 60 caracteres." });
    }

    if (!idValido(idLote)) {
        return res.status(400).json({ sucesso: false, mensagem: "Selecione o lote do equipamento." });
    }

    if (!hospitalValido(idHospital)) {
        return res.status(400).json({ sucesso: false, mensagem: "Hospital inválido." });
    }

    try {
        var resultado = await equipamentoModel.cadastrarEquipamento(
            numeroSerie.trim(),
            Number(idLote),
            obterIdHospital(idHospital),
            Number(req.params.idEmpresa)
        );

        if (!resultado.affectedRows) {
            return res
                .status(404)
                .json({ sucesso: false, mensagem: "Lote ou hospital não encontrado para esta empresa." });
        }

        return res.status(201).json({
            sucesso: true,
            idInserido: resultado.insertId,
            mensagem: "Equipamento cadastrado com sucesso!"
        });
    } catch (erro) {
        return tratarErro(res, erro, "Já existe um equipamento com esse número de série.");
    }
}

async function atualizarHospital(req, res) {
    var idHospital = req.body.idHospitalServer;

    if (!idValido(req.params.idEmpresa) || !idValido(req.params.idEquipamento)) {
        return res.status(400).json({ sucesso: false, mensagem: "Empresa ou equipamento inválido." });
    }

    if (idHospital === undefined || !hospitalValido(idHospital)) {
        return res
            .status(400)
            .json({ sucesso: false, mensagem: "Selecione um hospital ou a opção sem hospital." });
    }

    try {
        var resultado = await equipamentoModel.atualizarHospital(
            Number(req.params.idEquipamento),
            obterIdHospital(idHospital),
            Number(req.params.idEmpresa)
        );

        if (!resultado.affectedRows) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Equipamento ou hospital não encontrado para esta empresa."
            });
        }

        return res.json({ sucesso: true, mensagem: "Vínculo com hospital atualizado!" });
    } catch (erro) {
        return tratarErro(res, erro);
    }
}

function validarIntervalo(prefixo, inicio, fim) {
    if (prefixo == null || prefixo.constructor !== String || prefixo.trim().length > 50) {
        return "Informe um prefixo de até 50 caracteres.";
    }

    if (
        inicio == null ||
        inicio.constructor !== String ||
        fim == null ||
        fim.constructor !== String ||
        !/^\d{1,9}$/.test(inicio) ||
        !/^\d{1,9}$/.test(fim)
    ) {
        return "Informe o início e o fim com até 9 dígitos. Exemplo: 001 até 040.";
    }

    var quantidade = Number(fim) - Number(inicio) + 1;

    if (quantidade < 1 || quantidade > 500) {
        return "O intervalo deve conter de 1 a 500 equipamentos, com o fim maior ou igual ao início.";
    }

    return "";
}

async function cadastrarIntervalo(req, res) {
    var prefixo = req.body.prefixoServer;
    var inicio = req.body.inicioServer;
    var fim = req.body.fimServer;
    var idLote = req.body.idLoteServer;
    var idHospital = req.body.idHospitalServer;

    if (!idValido(req.params.idEmpresa)) {
        return res.status(400).json({ sucesso: false, mensagem: "ID da empresa inválido." });
    }

    var erroValidacao = validarIntervalo(prefixo, inicio, fim);

    if (erroValidacao) {
        return res.status(400).json({ sucesso: false, mensagem: erroValidacao });
    }

    if (!idValido(idLote)) {
        return res.status(400).json({ sucesso: false, mensagem: "Selecione o lote dos equipamentos." });
    }

    if (!hospitalValido(idHospital)) {
        return res.status(400).json({ sucesso: false, mensagem: "Hospital inválido." });
    }

    var largura = Math.max(inicio.length, fim.length);
    var quantidade = 0;

    try {
        for (var numero = Number(inicio); numero <= Number(fim); numero++) {
            var numeroSerie = prefixo.trim() + String(numero).padStart(largura, "0");
            var resultado = await equipamentoModel.cadastrarEquipamento(
                numeroSerie,
                Number(idLote),
                obterIdHospital(idHospital),
                Number(req.params.idEmpresa)
            );

            if (!resultado.affectedRows) {
                return res
                    .status(404)
                    .json({ sucesso: false, mensagem: "Lote ou hospital não encontrado para esta empresa." });
            }

            quantidade++;
        }

        return res.status(201).json({
            sucesso: true,
            quantidade: quantidade,
            mensagem: quantidade + " equipamentos cadastrados com sucesso!"
        });
    } catch (erro) {
        return tratarErro(
            res,
            erro,
            "Uma das séries do intervalo já está cadastrada. O cadastro foi interrompido e os registros já inseridos foram mantidos."
        );
    }
}

async function buscarModelo(req, res) {
    if (!idValido(req.params.idModelo)) {
        return res.status(400).json({ sucesso: false, mensagem: "Registro inválido." });
    }
    try {
        var registros = await equipamentoModel.buscarModelo(Number(req.params.idEmpresa), Number(req.params.idModelo));
        if (!registros.length) return res.status(404).json({ sucesso: false, mensagem: "Registro não encontrado para esta empresa." });
        res.json({ sucesso: true, modelo: registros[0] });
    } catch (erro) { return tratarErro(res, erro); }
}

async function alterarModelo(req, res) {
    if (!idValido(req.params.idModelo) || !textoValido(req.body.nomeServer)) {
        return res.status(400).json({ sucesso: false, mensagem: "Confira os campos e os vínculos do cadastro." });
    }
    try {
        var resultado = await equipamentoModel.alterarModelo(Number(req.params.idEmpresa), Number(req.params.idModelo), req.body.nomeServer.trim());
        if (!resultado.affectedRows) return res.status(404).json({ sucesso: false, mensagem: "Registro ou vínculo não encontrado para esta empresa." });
        res.json({ sucesso: true, mensagem: "Alterações salvas com sucesso." });
    } catch (erro) { return tratarErro(res, erro); }
}

async function excluirModelo(req, res) {
    if (!idValido(req.params.idModelo)) {
        return res.status(400).json({ sucesso: false, mensagem: "Registro inválido." });
    }
    try {
        var resultado = await equipamentoModel.excluirModelo(Number(req.params.idEmpresa), Number(req.params.idModelo));
        if (!resultado.affectedRows) return res.status(404).json({ sucesso: false, mensagem: "Registro não encontrado para esta empresa." });
        res.json({ sucesso: true, mensagem: "Cadastro excluído com sucesso." });
    } catch (erro) { return tratarErro(res, erro); }
}

async function buscarLote(req, res) {
    if (!idValido(req.params.idLote)) {
        return res.status(400).json({ sucesso: false, mensagem: "Registro inválido." });
    }
    try {
        var registros = await equipamentoModel.buscarLote(Number(req.params.idEmpresa), Number(req.params.idLote));
        if (!registros.length) return res.status(404).json({ sucesso: false, mensagem: "Registro não encontrado para esta empresa." });
        res.json({ sucesso: true, lote: registros[0] });
    } catch (erro) { return tratarErro(res, erro); }
}

async function alterarLote(req, res) {
    if (!idValido(req.params.idLote) || !textoValido(req.body.numeroServer) || !idValido(req.body.idModeloServer)) {
        return res.status(400).json({ sucesso: false, mensagem: "Confira os campos e os vínculos do cadastro." });
    }
    try {
        var resultado = await equipamentoModel.alterarLote(Number(req.params.idEmpresa), Number(req.params.idLote), req.body.numeroServer.trim(), Number(req.body.idModeloServer));
        if (!resultado.affectedRows) return res.status(404).json({ sucesso: false, mensagem: "Registro ou vínculo não encontrado para esta empresa." });
        res.json({ sucesso: true, mensagem: "Alterações salvas com sucesso." });
    } catch (erro) { return tratarErro(res, erro); }
}

async function excluirLote(req, res) {
    if (!idValido(req.params.idLote)) {
        return res.status(400).json({ sucesso: false, mensagem: "Registro inválido." });
    }
    try {
        var resultado = await equipamentoModel.excluirLote(Number(req.params.idEmpresa), Number(req.params.idLote));
        if (!resultado.affectedRows) return res.status(404).json({ sucesso: false, mensagem: "Registro não encontrado para esta empresa." });
        res.json({ sucesso: true, mensagem: "Cadastro excluído com sucesso." });
    } catch (erro) { return tratarErro(res, erro); }
}

async function buscarEquipamento(req, res) {
    if (!idValido(req.params.idEquipamento)) {
        return res.status(400).json({ sucesso: false, mensagem: "Registro inválido." });
    }
    try {
        var registros = await equipamentoModel.buscarEquipamento(Number(req.params.idEmpresa), Number(req.params.idEquipamento));
        if (!registros.length) return res.status(404).json({ sucesso: false, mensagem: "Registro não encontrado para esta empresa." });
        res.json({ sucesso: true, equipamento: registros[0] });
    } catch (erro) { return tratarErro(res, erro); }
}

async function alterarEquipamento(req, res) {
    if (!idValido(req.params.idEquipamento) || !textoValido(req.body.numeroSerieServer) || !idValido(req.body.idLoteServer) ||
        req.body.idHospitalServer === undefined || !hospitalValido(req.body.idHospitalServer)) {
        return res.status(400).json({ sucesso: false, mensagem: "Confira os campos e os vínculos do cadastro." });
    }
    try {
        var resultado = await equipamentoModel.alterarEquipamento(Number(req.params.idEmpresa), Number(req.params.idEquipamento), req.body.numeroSerieServer.trim(), Number(req.body.idLoteServer), obterIdHospital(req.body.idHospitalServer));
        if (!resultado.affectedRows) return res.status(404).json({ sucesso: false, mensagem: "Registro ou vínculo não encontrado para esta empresa." });
        res.json({ sucesso: true, mensagem: "Alterações salvas com sucesso." });
    } catch (erro) { return tratarErro(res, erro); }
}

async function excluirEquipamento(req, res) {
    if (!idValido(req.params.idEquipamento)) {
        return res.status(400).json({ sucesso: false, mensagem: "Registro inválido." });
    }
    try {
        var resultado = await equipamentoModel.excluirEquipamento(Number(req.params.idEmpresa), Number(req.params.idEquipamento));
        if (!resultado.affectedRows) return res.status(404).json({ sucesso: false, mensagem: "Registro não encontrado para esta empresa." });
        res.json({ sucesso: true, mensagem: "Cadastro excluído com sucesso." });
    } catch (erro) { return tratarErro(res, erro); }
}


module.exports = {
    buscarModelo,
    alterarModelo,
    excluirModelo,
    buscarLote,
    alterarLote,
    excluirLote,
    buscarEquipamento,
    alterarEquipamento,
    excluirEquipamento,
    listarModelos,
    cadastrarModelo,
    listarLotes,
    cadastrarLote,
    listarEquipamentos,
    cadastrarEquipamento,
    cadastrarIntervalo,
    atualizarHospital
};
