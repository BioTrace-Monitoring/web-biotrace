// Importando o arquivo de configuração do banco de dados
// Esse arquivo contém a função responsável por executar comandos SQL
var database = require("../database/config");


// Função que verifica se existe um usuário cadastrado com o email e senha informados
function autenticarUsuario(email, senha)
{
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function autenticarUsuario(): ", email, senha)
    
    // Select que busca o usuário que possui o email e senha informados no login
    var instrucaoSql = `
        SELECT
        id_usuario AS id,
        u.nome_usuario AS nome,
        u.email_usuario AS email,
        fk_empresa,
        na.nome_nivel_acesso AS nivel_acesso
        FROM usuario u
        JOIN nivel_acesso na ON fk_nivel_acesso = na.id_nivel_acesso
        WHERE u.email_usuario = '${email}' AND u.senha_usuario = '${senha}';
    `;

    // Exibe a query montada no terminal
    console.log("Executando a instrução SQL: \n" + instrucaoSql);

    // Executa a query no banco e retorna o resultado
    return database.executar(instrucaoSql);
}


function listarCargos(){
   console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function listarCargos(): ")
    
    var instrucaoSql = `
        SELECT
         id_cargo AS id,
         nome
         FROM cargo;
    `;

    // Exibe a query montada no terminal
    console.log("Executando a instrução SQL: \n" + instrucaoSql);

    // Executa a query no banco e retorna o resultado
    return database.executar(instrucaoSql); 
}




// Função que cadastra um novo usuário
function cadastrarUsuario(nome, dt_nasc, telefone, cpf, email, senha, idEmpresa, cargo)
{
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function cadastrarUsuario():", nome, dt_nasc, telefone, cpf, email, senha);
    
    // Insert que insere um novo usuário na tabela usuario
    var instrucaoSql = `
        INSERT INTO usuario(nome_usuario, dt_nasc_usuario, telefone_usuario, cpf_usuario, email_usuario, senha_usuario, fk_empresa, fk_nivel_acesso, fk_cargo) VALUES
        ('${nome}', '${dt_nasc}', '${telefone}', '${cpf}', '${email}', '${senha}', '${idEmpresa}', 1, '${cargo}');
    `;

    // Exibe a query montada no terminal
    console.log("Executando a instrução SQL: \n" + instrucaoSql);

    // Executa a query no banco e retorna o resultado
    return database.executar(instrucaoSql);
}



// Exportando as funções do model
// Outros arquivos podem usar essas funções
module.exports = {
    autenticarUsuario,
    cadastrarUsuario,
    listarCargos
};