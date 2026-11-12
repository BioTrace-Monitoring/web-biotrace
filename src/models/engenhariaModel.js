var database = require("../database/config");

function erroEngenharia(status, mensagem) {
    var erro = new Error(mensagem);
    erro.status = status;
    return erro;
}
function acessoUsuario(id, empresa) {
    return database.executar(
        `SELECT u.id_usuario, c.nome AS cargo FROM usuario u
        JOIN cargo c ON c.id_cargo = u.fk_cargo
        WHERE u.id_usuario = ? AND u.fk_empresa = ?`,
        [id, empresa],
    );
}
async function conferirResponsavel(conexao, id, empresa) {
    var usuarios = await database.executar(
        `SELECT u.id_usuario FROM usuario u
        JOIN cargo c ON c.id_cargo = u.fk_cargo
        WHERE u.id_usuario = ? AND u.fk_empresa = ? AND LOWER(c.nome) IN ('administrador', 'gestor')
        FOR UPDATE`,
        [id, empresa],
        conexao,
    );
    if (!usuarios.length)
        throw erroEngenharia(
            400,
            "Selecione um administrador ou gestor da sua empresa como responsável.",
        );
}
function listarProtocolos(empresa) {
    return database.executar(
        `SELECT p.*, DATE_FORMAT(p.criado_em, '%Y-%m-%dT%H:%i:%sZ') AS criado_em, m.nome_modelo AS equipamento, u.nome_usuario AS responsavel
        FROM protocolo_ensaio p JOIN modelo_equipamento m ON m.id_modelo_equipamento = p.fk_modelo_equipamento
        JOIN usuario u ON u.id_usuario = p.fk_responsavel
        WHERE m.fk_empresa = ? ORDER BY p.nome, p.versao DESC, p.id_protocolo DESC`,
        [empresa],
    );
}
async function buscarProtocolo(empresa, id, conexao, bloquear) {
    var protocolos = await database.executar(
        `SELECT p.*, DATE_FORMAT(p.criado_em, '%Y-%m-%dT%H:%i:%sZ') AS criado_em FROM protocolo_ensaio p
        JOIN modelo_equipamento m ON m.id_modelo_equipamento = p.fk_modelo_equipamento
        WHERE m.fk_empresa = ? AND p.id_protocolo = ? ${bloquear ? "FOR UPDATE" : ""}`,
        [empresa, id],
        conexao,
    );
    if (!protocolos.length)
        throw erroEngenharia(404, "Protocolo não encontrado.");
    return protocolos[0];
}
async function cadastrarProtocolo(empresa, dados, origem) {
    var conexao = database.conectar();
    try {
        await conexao.query("SET time_zone = '+00:00'");
        await conexao.query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED");
        await conexao.beginTransaction();
        var anterior = origem
            ? await buscarProtocolo(empresa, origem, conexao, false)
            : null;
        if (
            anterior &&
            (anterior.nome !== dados.nome ||
                anterior.fk_modelo_equipamento !== dados.fk_modelo_equipamento)
        )
            throw erroEngenharia(
                400,
                "Uma nova versão deve manter o nome e o equipamento do protocolo original.",
            );
        var modelos = await database.executar(
            `SELECT id_modelo_equipamento FROM modelo_equipamento
            WHERE id_modelo_equipamento = ? AND fk_empresa = ? FOR UPDATE`,
            [dados.fk_modelo_equipamento, empresa],
            conexao,
        );
        if (!modelos.length)
            throw erroEngenharia(404, "Equipamento não encontrado.");
        await conferirResponsavel(conexao, dados.fk_responsavel, empresa);
        var versoes = await database.executar(
            `SELECT MAX(versao) AS ultima FROM protocolo_ensaio
            WHERE fk_modelo_equipamento = ? AND nome = ?`,
            [dados.fk_modelo_equipamento, dados.nome],
            conexao,
        );
        if (!origem && versoes[0].ultima !== null)
            throw erroEngenharia(
                409,
                "Este protocolo já existe. Cadastre uma nova versão.",
            );
        var versao = Number(versoes[0].ultima || 0) + 1;
        var resultado = await database.executar(
            `INSERT INTO protocolo_ensaio
            (nome, versao, procedimento, duracao_minutos, intervalo_coleta_segundos,
             cobertura_minima_percentual, tolerancia_envio_minutos, limite_temperatura,
             limite_cpu, limite_ram, minimo_disco_livre, checklist_layout,
             checklist_compatibilidade, checklist_funcionamento, fk_modelo_equipamento, fk_responsavel)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                dados.nome,
                versao,
                dados.procedimento,
                dados.duracao_minutos,
                dados.intervalo_coleta_segundos,
                dados.cobertura_minima_percentual,
                dados.tolerancia_envio_minutos,
                dados.limite_temperatura,
                dados.limite_cpu,
                dados.limite_ram,
                dados.minimo_disco_livre,
                dados.checklist_layout,
                dados.checklist_compatibilidade,
                dados.checklist_funcionamento,
                dados.fk_modelo_equipamento,
                dados.fk_responsavel,
            ],
            conexao,
        );
        var protocoloCriado = await buscarProtocolo(
            empresa,
            resultado.insertId,
            conexao,
            false,
        );
        await conexao.commit();
        return protocoloCriado;
    } catch (erro) {
        await conexao.rollback();
        throw erro;
    } finally {
        await conexao.end();
    }
}
function listarEnsaios(empresa) {
    return database.executar(
        `SELECT e.*, DATE_FORMAT(e.criado_em, '%Y-%m-%dT%H:%i:%sZ') AS criado_em,
        DATE_FORMAT(e.inicio, '%Y-%m-%dT%H:%i:%sZ') AS inicio,
        DATE_FORMAT(e.termino_previsto, '%Y-%m-%dT%H:%i:%sZ') AS termino_previsto,
        DATE_FORMAT(e.encerrado_em, '%Y-%m-%dT%H:%i:%sZ') AS encerrado_em, p.nome AS protocolo, p.versao, m.nome_modelo AS equipamento,
        u.nome_usuario AS responsavel, (SELECT COUNT(*) FROM ensaio_equipamento ee WHERE ee.fk_ensaio = e.id_ensaio) AS total_equipamentos
        FROM ensaio e JOIN protocolo_ensaio p ON p.id_protocolo = e.fk_protocolo
        JOIN modelo_equipamento m ON m.id_modelo_equipamento = p.fk_modelo_equipamento
        JOIN usuario u ON u.id_usuario = e.fk_responsavel
        WHERE m.fk_empresa = ? ORDER BY e.id_ensaio DESC`,
        [empresa],
    );
}
async function buscarEnsaio(empresa, id, conexao, bloquear) {
    var ensaios = await database.executar(
        `SELECT e.*, DATE_FORMAT(e.criado_em, '%Y-%m-%dT%H:%i:%sZ') AS criado_em,
        DATE_FORMAT(e.inicio, '%Y-%m-%dT%H:%i:%sZ') AS inicio,
        DATE_FORMAT(e.termino_previsto, '%Y-%m-%dT%H:%i:%sZ') AS termino_previsto,
        DATE_FORMAT(e.encerrado_em, '%Y-%m-%dT%H:%i:%sZ') AS encerrado_em, p.duracao_minutos, p.fk_modelo_equipamento,
        p.nome AS protocolo, p.versao FROM ensaio e
        JOIN protocolo_ensaio p ON p.id_protocolo = e.fk_protocolo
        JOIN modelo_equipamento m ON m.id_modelo_equipamento = p.fk_modelo_equipamento
        WHERE e.id_ensaio = ? AND m.fk_empresa = ? ${bloquear ? "FOR UPDATE" : ""}`,
        [id, empresa],
        conexao,
    );
    if (!ensaios.length) throw erroEngenharia(404, "Ensaio não encontrado.");
    var ensaio = ensaios[0];
    ensaio.equipamentos = await database.executar(
        `SELECT ee.fk_equipamento AS id_equipamento,
        eq.numero_serie, ee.fk_lote AS lote_registrado, eq.fk_lote AS lote_atual, eq.fk_hospital
        FROM ensaio_equipamento ee JOIN equipamento eq ON eq.id_equipamento = ee.fk_equipamento
        WHERE ee.fk_ensaio = ? ORDER BY ee.fk_equipamento ${bloquear ? "FOR UPDATE" : ""}`,
        [id],
        conexao,
    );
    return ensaio;
}
async function conferirEquipamentos(conexao, ids, modelo, empresa, ambiente) {
    var equipamentos = await database.executar(
        `SELECT eq.id_equipamento, eq.fk_lote, eq.fk_hospital
        FROM equipamento eq JOIN lote_equipamento l ON l.id_lote_equipamento = eq.fk_lote
        LEFT JOIN hospital h ON h.id_hospital = eq.fk_hospital
        WHERE eq.id_equipamento IN (?) AND l.fk_modelo_equipamento = ? AND l.fk_empresa = ?
        AND (eq.fk_hospital IS NULL OR h.fk_empresa = ?) ORDER BY eq.id_equipamento FOR UPDATE`,
        [ids, modelo, empresa, empresa],
        conexao,
    );
    if (equipamentos.length !== ids.length)
        throw erroEngenharia(
            400,
            "Todos os participantes devem pertencer à sua empresa e ao equipamento do protocolo.",
        );
    if (
        ambiente === "campo" &&
        equipamentos.some(function (e) {
            return !e.fk_hospital;
        })
    )
        throw erroEngenharia(
            400,
            "Ensaios de campo exigem equipamentos alocados em hospitais.",
        );
    return equipamentos;
}
async function cadastrarEnsaio(empresa, dados) {
    var conexao = database.conectar();
    try {
        await conexao.query("SET time_zone = '+00:00'");
        await conexao.query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED");
        await conexao.beginTransaction();
        var protocolo = await buscarProtocolo(
            empresa,
            dados.fk_protocolo,
            conexao,
            true,
        );
        if (!protocolo.ativo)
            throw erroEngenharia(409, "O protocolo está inativo.");
        await conferirResponsavel(conexao, dados.fk_responsavel, empresa);
        var equipamentos = await conferirEquipamentos(
            conexao,
            dados.equipamentos,
            protocolo.fk_modelo_equipamento,
            empresa,
            dados.ambiente,
        );
        var resultado = await database.executar(
            `INSERT INTO ensaio
            (ambiente, observacoes, reinicios_programados, fk_protocolo, fk_responsavel) VALUES (?, ?, ?, ?, ?)`,
            [
                dados.ambiente,
                dados.observacoes,
                dados.reinicios_programados,
                dados.fk_protocolo,
                dados.fk_responsavel,
            ],
            conexao,
        );
        for (var equipamento of equipamentos) {
            await database.executar(
                `INSERT INTO ensaio_equipamento (fk_ensaio, fk_equipamento, fk_lote)
                VALUES (?, ?, ?)`,
                [
                    resultado.insertId,
                    equipamento.id_equipamento,
                    equipamento.fk_lote,
                ],
                conexao,
            );
        }
        var ensaioCriado = await buscarEnsaio(
            empresa,
            resultado.insertId,
            conexao,
            false,
        );
        await conexao.commit();
        return ensaioCriado;
    } catch (erro) {
        await conexao.rollback();
        throw erro;
    } finally {
        await conexao.end();
    }
}
async function iniciarEnsaio(empresa, id) {
    var conexao = database.conectar();
    try {
        await conexao.query("SET time_zone = '+00:00'");
        await conexao.query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED");
        await conexao.beginTransaction();
        var ensaio = await buscarEnsaio(empresa, id, conexao, true);
        if (ensaio.situacao === "em_execucao") {
            await conexao.commit();
            return ensaio;
        }
        if (ensaio.situacao !== "planejado")
            throw erroEngenharia(
                409,
                "Somente ensaios planejados podem ser iniciados.",
            );
        var ids = ensaio.equipamentos.map(function (e) {
            return e.id_equipamento;
        });
        if (!ids.length)
            throw erroEngenharia(
                409,
                "Selecione participantes antes de iniciar.",
            );
        var equipamentos = await conferirEquipamentos(
            conexao,
            ids,
            ensaio.fk_modelo_equipamento,
            empresa,
            ensaio.ambiente,
        );
        for (var equipamento of equipamentos) {
            await database.executar(
                `UPDATE ensaio_equipamento SET fk_lote = ? WHERE fk_ensaio = ? AND fk_equipamento = ?`,
                [equipamento.fk_lote, id, equipamento.id_equipamento],
                conexao,
            );
        }
        await database.executar(
            `UPDATE ensaio SET inicio = UTC_TIMESTAMP(),
            termino_previsto = DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? MINUTE), situacao = 'em_execucao'
            WHERE id_ensaio = ?`,
            [ensaio.duracao_minutos, id],
            conexao,
        );
        var ensaioAtualizado = await buscarEnsaio(empresa, id, conexao, false);
        await conexao.commit();
        return ensaioAtualizado;
    } catch (erro) {
        await conexao.rollback();
        throw erro;
    } finally {
        await conexao.end();
    }
}
async function cancelarEnsaio(empresa, id) {
    var conexao = database.conectar();
    try {
        await conexao.query("SET time_zone = '+00:00'");
        await conexao.query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED");
        await conexao.beginTransaction();
        var ensaio = await buscarEnsaio(empresa, id, conexao, true);
        if (ensaio.situacao === "cancelado") {
            await conexao.commit();
            return ensaio;
        }
        if (!["planejado", "em_execucao"].includes(ensaio.situacao))
            throw erroEngenharia(409, "Este ensaio não permite cancelamento.");
        await database.executar(
            `UPDATE ensaio SET situacao = 'cancelado',
            encerrado_em = CASE WHEN inicio IS NULL THEN NULL ELSE UTC_TIMESTAMP() END WHERE id_ensaio = ?`,
            [id],
            conexao,
        );
        var ensaioAtualizado = await buscarEnsaio(empresa, id, conexao, false);
        await conexao.commit();
        return ensaioAtualizado;
    } catch (erro) {
        await conexao.rollback();
        throw erro;
    } finally {
        await conexao.end();
    }
}
module.exports = {
    erroEngenharia,
    acessoUsuario,
    listarProtocolos,
    buscarProtocolo,
    cadastrarProtocolo,
    listarEnsaios,
    buscarEnsaio,
    cadastrarEnsaio,
    iniciarEnsaio,
    cancelarEnsaio,
};
