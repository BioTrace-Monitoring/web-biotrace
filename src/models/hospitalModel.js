var database = require("../database/config");

function cadastrarHospital(nome, cnpj, cep, numero) {
    console.log("ACESSEI O HOSPITAL MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function cadastrarHospital():", nome, cnpj, cep, numero);

    var instrucaoSql = `
    INSERT INTO hospital (nome_hospital, cnpj, cep, numero) VALUES
    ('${nome}', '${cnpj}', '${cep}', '${numero}');
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);

    return database.executar(instrucaoSql);
}

module.exports =
{
    cadastrarHospital
};