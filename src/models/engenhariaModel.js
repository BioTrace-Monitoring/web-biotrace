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
async function listarCatalogos(empresa) {
    var modelos = await database.executar(
        `SELECT id_modelo_equipamento, nome_modelo
        FROM modelo_equipamento WHERE fk_empresa = ? ORDER BY nome_modelo`,
        [empresa],
    );
    var lotes = await database.executar(
        `SELECT id_lote_equipamento, numero_lote, fk_modelo_equipamento
        FROM lote_equipamento WHERE fk_empresa = ? ORDER BY numero_lote`,
        [empresa],
    );
    var unidades = await database.executar(
        `SELECT e.id_equipamento, e.numero_serie, e.fk_hospital,
        e.fk_lote, l.numero_lote, l.fk_modelo_equipamento,
        p.limite_uso, p.habilitado
        FROM equipamento e
        JOIN lote_equipamento l ON l.id_lote_equipamento = e.fk_lote
        LEFT JOIN parametro_metrica p ON p.id_parametro_metrica = (
            SELECT MAX(pm.id_parametro_metrica)
            FROM parametro_metrica pm
            JOIN metrica m ON m.id_metrica = pm.fk_metrica
            JOIN tipo_metrica tm ON tm.id_tipo_metrica = m.fk_tipo_metrica
            JOIN componente c ON c.id_componente = m.fk_componente
            WHERE c.fk_equipamento = e.id_equipamento AND tm.tipo_metrica = 'temperatura_cpu'
        )
        WHERE l.fk_empresa = ? ORDER BY e.numero_serie`,
        [empresa],
    );
    unidades = unidades.map(function ({ limite_uso, habilitado, ...unidade }) {
        if (habilitado === 0) {
            return { ...unidade, limite_temperatura_c: null, origem_limite_temperatura: "desabilitado" };
        }
        if (limite_uso != null) {
            return { ...unidade, limite_temperatura_c: Number(limite_uso), origem_limite_temperatura: "cadastro" };
        }
        return { ...unidade, limite_temperatura_c: 85, origem_limite_temperatura: "referencia" };
    });
    return { modelos: modelos, lotes: lotes, unidades: unidades };
}

module.exports = { erroEngenharia, acessoUsuario, listarCatalogos };
