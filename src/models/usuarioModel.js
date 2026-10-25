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

function buscarEmail(email) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function buscarEmail():", email);

    var instrucaoSql = `
        SELECT id_usuario, nome_usuario FROM usuario WHERE email_usuario = ?;
    `;

    console.log("Exeutando a instrução SQL: \n" + instrucaoSql);

    return database.executar(instrucaoSql, [email]);
}

function atualizarSenha(id, novaSenha) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function atualizarSenha():", id, novaSenha);

    var instrucaoSql = `
        UPDATE usuario SET senha_usuario = SHA2(?, 256) WHERE id_usuario = ?;
    `;

    console.log("Exeutando a instrução SQL: \n" + instrucaoSql);

    return database.executar(instrucaoSql, [novaSenha, id]);
}

// Exportando as funções do model
// Outros arquivos podem usar essas funções
function listarUsuarios(idEmpresa) {
    var instrucaoSql = `
        SELECT u.id_usuario, u.nome_usuario, u.email_usuario, u.fk_cargo, c.nome AS cargo
        FROM usuario u JOIN cargo c ON c.id_cargo = u.fk_cargo
        WHERE u.fk_empresa = ? ORDER BY u.nome_usuario, u.id_usuario;
    `;
    return database.executar(instrucaoSql, [idEmpresa]);
}

function buscarUsuario(idEmpresa, idUsuario) {
    var instrucaoSql = `
        SELECT id_usuario, nome_usuario, DATE_FORMAT(dt_nasc_usuario, '%Y-%m-%d') AS dt_nasc_usuario,
               telefone_usuario, cpf_usuario, email_usuario, fk_cargo
        FROM usuario WHERE fk_empresa = ? AND id_usuario = ?;
    `;
    return database.executar(instrucaoSql, [idEmpresa, idUsuario]);
}

function alterarUsuario(idEmpresa, idUsuario, nome, dataNascimento, telefone, cpf, email, cargo, senha) {
    var instrucaoSql = `
        UPDATE usuario SET nome_usuario = ?, dt_nasc_usuario = ?, telefone_usuario = ?,
            cpf_usuario = ?, email_usuario = ?, fk_cargo = ?,
            senha_usuario = IF(? = '', senha_usuario, SHA2(?, 256))
        WHERE fk_empresa = ? AND id_usuario = ?;
    `;
    return database.executar(instrucaoSql, [nome, dataNascimento, telefone, cpf, email, cargo, senha, senha, idEmpresa, idUsuario]);
}

function excluirUsuario(idEmpresa, idUsuario) {
    var instrucaoSql = `DELETE FROM usuario WHERE fk_empresa = ? AND id_usuario = ?;`;
    return database.executar(instrucaoSql, [idEmpresa, idUsuario]);
}

module.exports = {
    listarUsuarios,
    buscarUsuario,
    alterarUsuario,
    excluirUsuario,
    autenticarUsuario,
    cadastrarUsuario,
    listarCargos,
    buscarEmail,
    atualizarSenha
}