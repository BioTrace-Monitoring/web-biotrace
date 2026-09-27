var database = require("../database/config");

async function cadastrarEmpresa(razao_social, cnpj, telefone, cep, cidade, logradouro, bairro, numero)
{
    var instrucaoSqlEndereco = `
        INSERT INTO endereco(cep, cidade, logradouro, bairro, numero) VALUES
        ('${cep}', '${cidade}', '${logradouro}', '${bairro}', '${numero}');
    `;

    var resultadoEndereco = await database.executar(instrucaoSqlEndereco);
    var idEndereco = resultadoEndereco.insertId;

    var instrucaoSqlEmpresa = `
        INSERT INTO empresa(razao_social, cnpj, telefone_comercial, fk_endereco) VALUES
        ('${razao_social}', '${cnpj}', '${telefone}', ${idEndereco});
    `;

    return database.executar(instrucaoSqlEmpresa);
}

function visualizarEmpresa()
{
    var instrucaoSql = `
        SELECT
        e.id_empresa,
        e.razao_social,
        e.cnpj,
        e.telefone_comercial,
        end.cep,
        end.cidade,
        end.logradouro,
        end.bairro,
        end.numero,

        CASE
            WHEN
                u.id_usuario IS NOT NULL
            THEN true
            ELSE false
        END AS temGestor,
        u.nome_usuario AS nomeGestor
        FROM empresa e

        LEFT JOIN endereco end ON end.id_endereco = e.fk_endereco
        LEFT JOIN usuario u ON u.fk_empresa = e.id_empresa AND u.fk_nivel_acesso = 1
        ORDER BY e.id_empresa DESC;
    `;

    return database.executar(instrucaoSql);
}

module.exports =
{
    cadastrarEmpresa,
    visualizarEmpresa
};