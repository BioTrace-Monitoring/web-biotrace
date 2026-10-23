var database = require("../database/config");

function cadastrarHospital(nome, cnpj, cep, numero, idEmpresa) {
    var instrucaoSql = `
        INSERT INTO hospital (nome_hospital, cnpj, cep, numero, fk_empresa)
        VALUES (?, ?, ?, ?, ?);
    `;

    return database.executar(instrucaoSql, [nome, cnpj, cep, numero, idEmpresa]);
}

function listarHospitais(idEmpresa) {
    var instrucaoSql = `
        SELECT id_hospital, nome_hospital, cnpj, cep, numero
        FROM hospital
        WHERE fk_empresa = ?
        ORDER BY nome_hospital, id_hospital;
    `;

    return database.executar(instrucaoSql, [idEmpresa]);
}

module.exports =
{
    cadastrarHospital,
    listarHospitais
};
