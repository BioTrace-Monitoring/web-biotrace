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


// Exportando as funções do model
// Outros arquivos podem usar essas funções
module.exports =
{
    cadastrarEmpresa,
    listarEmpresas,
    excluirEmpresa
};