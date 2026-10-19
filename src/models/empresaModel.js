// Importando o arquivo de configuração do banco de dados
// Esse arquivo contém a função responsável por executar comandos SQL
var database = require("../database/config");


// Função que cadastra um novo usuário
function cadastrarEmpresa(razao_social, cnpj, telefone, cep, cidade, logradouro, bairro, numero) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function cadastrarUsuario():", razao_social, cnpj, telefone, cep, cidade, logradouro, bairro, numero);

    // Insert que insere uma nova empresa na tabela empresa
    var instrucaoSql = `
    INSERT INTO empresa (razao_social, cnpj, telefone_comercial, cep, numero) VALUES
    ('${razao_social}', '${cnpj}', '${telefone}', '${cep}', '${numero}');
    `;

    // Exibe a query montada no terminal
    console.log("Executando a instrução SQL: \n" + instrucaoSql);

    // Executa a query no banco e retorna o resultado
    return database.executar(instrucaoSql);
}

function listarEmpresas() {
    var instrucaoSql = `
    SELECT e.id_empresa, e.razao_social, e.cnpj, e.telefone_comercial, e.cep, e.numero,
           u.nome_usuario AS nome_administrador
    FROM empresa e
    LEFT JOIN usuario u
        ON u.fk_empresa = e.id_empresa
        AND u.fk_cargo = (SELECT id_cargo FROM cargo WHERE nome = 'Administrador')
    WHERE e.ativo = TRUE
`;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);

    return database.executar(instrucaoSql);
}

function excluirEmpresa(idEmpresa) {
    var instrucaoSql = `
        UPDATE empresa
        SET ativo = FALSE
        WHERE id_empresa = ${Number(idEmpresa)}
        AND ativo = TRUE;
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);

    return database.executar(instrucaoSql);
}

var componentesPadrao = [
    {
        nome: "CPU",
        metricas: [
            { nome: "cpu_percent", unidade: "%", limiteUso: 80, limiteOciosidade: 20 },
            { nome: "cpu_percent_por_nucleo", unidade: "%/nucleo", limiteUso: null, limiteOciosidade: null },
            { nome: "nucleos_fisicos", unidade: "nucleos", limiteUso: null, limiteOciosidade: null },
            { nome: "nucleos_logicos", unidade: "nucleos", limiteUso: null, limiteOciosidade: null }
        ]
    },
    {
        nome: "RAM",
        metricas: [
            { nome: "ram_total_bytes", unidade: "bytes", limiteUso: null, limiteOciosidade: null },
            { nome: "ram_utilizada_bytes", unidade: "bytes", limiteUso: null, limiteOciosidade: null },
            { nome: "ram_disponivel_bytes", unidade: "bytes", limiteUso: null, limiteOciosidade: null },
            { nome: "ram_percent", unidade: "%", limiteUso: 80, limiteOciosidade: 20 }
        ]
    },
    {
        nome: "SWAP",
        metricas: [
            { nome: "swap_total_bytes", unidade: "bytes", limiteUso: null, limiteOciosidade: null },
            { nome: "swap_utilizada_bytes", unidade: "bytes", limiteUso: null, limiteOciosidade: null },
            { nome: "swap_percent", unidade: "%", limiteUso: 80, limiteOciosidade: 20 }
        ]
    },
    {
        nome: "DISCO",
        metricas: [
            { nome: "armazenamento_total_bytes", unidade: "bytes", limiteUso: null, limiteOciosidade: null },
            { nome: "armazenamento_utilizado_bytes", unidade: "bytes", limiteUso: null, limiteOciosidade: null },
            { nome: "armazenamento_disponivel_bytes", unidade: "bytes", limiteUso: null, limiteOciosidade: null },
            { nome: "armazenamento_percent", unidade: "%", limiteUso: 90, limiteOciosidade: 10 }
        ]
    },
    {
        nome: "REDE",
        metricas: [
            { nome: "rede_bytes_enviados", unidade: "bytes", limiteUso: null, limiteOciosidade: null },
            { nome: "rede_bytes_recebidos", unidade: "bytes", limiteUso: null, limiteOciosidade: null }
        ]
    },
    {
        nome: "PROCESSOS",
        metricas: [
            { nome: "processos_em_execucao", unidade: "processos", limiteUso: null, limiteOciosidade: null }
        ]
    }
];

function cadastrarEquipamentoComConfiguracao(numeroSerie, idEmpresa, tokenHash) {
    return database.executar(
        "INSERT INTO equipamento (numero_serie, fk_empresa) VALUES (?, ?)",
        [numeroSerie, idEmpresa]
    ).then(async function (equipamento) {
        var idEquipamento = equipamento.insertId;

        await database.executar(
            "INSERT INTO credencial_equipamento (fk_equipamento, token_hash) VALUES (?, ?)",
            [idEquipamento, tokenHash]
        );

        for (var componentePadrao of componentesPadrao) {
            var tipoComponente = await database.executar(
                `INSERT INTO tipo_componente (nome_componente) VALUES (?)
                 ON DUPLICATE KEY UPDATE id_tipo_componente = LAST_INSERT_ID(id_tipo_componente)`,
                [componentePadrao.nome]
            );

            var componente = await database.executar(
                `INSERT INTO componente (fk_equipamento, fk_tipo_componente) VALUES (?, ?)
                 ON DUPLICATE KEY UPDATE id_componente = LAST_INSERT_ID(id_componente)`,
                [idEquipamento, tipoComponente.insertId]
            );

            for (var metricaPadrao of componentePadrao.metricas) {
                var tipoMetrica = await database.executar(
                    `INSERT INTO tipo_metrica (tipo_metrica, unidade) VALUES (?, ?)
                     ON DUPLICATE KEY UPDATE id_tipo_metrica = LAST_INSERT_ID(id_tipo_metrica)`,
                    [metricaPadrao.nome, metricaPadrao.unidade]
                );

                var metrica = await database.executar(
                    `INSERT INTO metrica (fk_tipo_metrica, fk_componente) VALUES (?, ?)
                     ON DUPLICATE KEY UPDATE id_metrica = LAST_INSERT_ID(id_metrica)`,
                    [tipoMetrica.insertId, componente.insertId]
                );

                await database.executar(
                    `INSERT INTO parametro_metrica
                        (limite_uso, limite_ociosidade, habilitado, fk_metrica)
                     VALUES (?, ?, TRUE, ?)
                     ON DUPLICATE KEY UPDATE
                        id_parametro_metrica = LAST_INSERT_ID(id_parametro_metrica)`,
                    [metricaPadrao.limiteUso, metricaPadrao.limiteOciosidade, metrica.insertId]
                );
            }
        }

        return idEquipamento;
    });
}

function buscarCredencialEquipamento(tokenHash) {
    var instrucaoSql = `
        SELECT e.id_equipamento AS idEquipamento,
               e.fk_empresa AS idEmpresa
        FROM credencial_equipamento ce
        INNER JOIN equipamento e
            ON e.id_equipamento = ce.fk_equipamento
        WHERE ce.token_hash = ?
          AND ce.revogada = FALSE
          AND (ce.dt_expiracao IS NULL OR ce.dt_expiracao > CURRENT_TIMESTAMP)
        LIMIT 1;
    `;

    return database.executar(instrucaoSql, [tokenHash])
        .then(function (resultado) {
            return resultado[0] || null;
        });
}

// Exportando as funções do model
// Outros arquivos podem usar essas funções
module.exports =
{
    cadastrarEmpresa,
    listarEmpresas,
    excluirEmpresa,
    cadastrarEquipamentoComConfiguracao,
    buscarCredencialEquipamento
};