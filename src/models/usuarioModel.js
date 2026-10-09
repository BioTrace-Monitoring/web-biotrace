// Importando o arquivo de configuração do banco de dados
// Esse arquivo contém a função responsável por executar comandos SQL
const database = require("../database/config");


// Função que verifica se existe um usuário cadastrado com o email e senha informados
function autenticarUsuario(email, senha) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function autenticarUsuario(): ", email, senha)
    
    // Select que busca o usuário que possui o email e senha informados no login
    // A senha é comparada usando SHA2, já que é assim que ela é salva no banco (ver seed)
    // É usado ? no lugar da interpolação para proteger de SQL Injection

    var instrucaoSql = `
        SELECT u.id_usuario AS id_usuario, u.nome_usuario AS nome, u.email_usuario AS email, u.fk_empresa AS fk_empresa, e.razao_social AS empresa, c.nome as cargo
        FROM usuario u
        JOIN empresa e ON u.fk_empresa = e.id_empresa
        JOIN cargo c ON u.fk_cargo = c.id_cargo
        WHERE u.email_usuario = ? AND u.senha_usuario = SHA2(?, 256)
    `;

    // Exibe a query montada no terminal
    console.log("Executando a instrução SQL: \n" + instrucaoSql);

    // Executa a query no banco passando os valores aqui e retorna o resultado
    return database.executar(instrucaoSql, [email, senha]);
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
function cadastrarUsuario(idEmpresa, nomeUsuario, dt_nascimento, telefone, cpf, email, senha, fkCargo) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function cadastrarUsuario():", idEmpresa, nomeUsuario, email, senha, fkCargo);

    // Insert que insere um novo usuário na tabela usuario
    // É usado ? no lugar da interpolação para proteger de SQL Injection
    var instrucaoSql = `
    INSERT INTO usuario (nome_usuario, dt_nasc_usuario, telefone_usuario, cpf_usuario, email_usuario, senha_usuario, fk_cargo, fk_empresa) VALUES
    (?, ?, ?, ?, ?, SHA2(?, 256), ?, ?);
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);

    // Executa a query no banco e retorna o resultado
    return database.executar(instrucaoSql, [nomeUsuario, dt_nascimento, telefone, cpf, email, senha, fkCargo, idEmpresa]);
}


// Exportando as funções do model
// Outros arquivos podem usar essas funções
module.exports = {
    autenticarUsuario,
    cadastrarUsuario,
    listarCargos
}