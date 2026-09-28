// Define o ambiente atual: 'producao' ou 'desenvolvimento'
// Para alternar, troque o valor desta variável
var ambiente_processo = 'desenvolvimento';

// Seleciona o arquivo .env correspondente ao ambiente definido acima
// producao -> le as variáveis de .env
// desenvolvimento ->le as variáveis de .env.dev
var caminho_env = ambiente_processo === 'producao' ? '.env' : '.env.dev';

// Carrega as variáveis de ambiente do arquivo selecionado
require("dotenv").config({ path: caminho_env });

var express = require("express"); // Framework principal do servidor
var cors = require("cors"); // Libera requisições de origens externas
var path = require("path"); // Manipulação de caminhos de arquivos

// Porta e host são lidos do arquivo .env para facilitar configuração por ambiente
var PORTA_APP = process.env.APP_PORT;
var HOST_APP = process.env.APP_HOST;

var app = express();

// Cada router agrupa os endpoints de um módulo específico da aplicação
var usuarioRouter = require("./src/routes/usuario");
var empresaRouter = require("./src/routes/empresa");

// Interpreta requisições com corpo em JSON
app.use(express.json());

// Interpreta requisições com corpo em formato de formulário HTML
app.use(express.urlencoded({ extended: false }));

// Serve arquivos estáticos (HTML, CSS, JS, imagens) da pasta /public
app.use(express.static(path.join(__dirname, "public")));

// Habilita CORS para permitir requisições de outros domínios/portas
app.use(cors());

// Cada rota é montada em um prefixo de URL correspondente ao seu módulo
app.use("/usuario", usuarioRouter);
app.use("/empresa", empresaRouter);

// Coloca o servidor para escutar na porta definida nas variáveis de ambiente
app.listen(PORTA_APP, function ()
{
    console.log(`
    ##   ##  ######   #####             ####       ##     ######     ##              ##  ##    ####    ######  
    ##   ##  ##       ##  ##            ## ##     ####      ##      ####             ##  ##     ##         ##  
    ##   ##  ##       ##  ##            ##  ##   ##  ##     ##     ##  ##            ##  ##     ##        ##   
    ## # ##  ####     #####    ######   ##  ##   ######     ##     ######   ######   ##  ##     ##       ##    
    #######  ##       ##  ##            ##  ##   ##  ##     ##     ##  ##            ##  ##     ##      ##     
    ### ###  ##       ##  ##            ## ##    ##  ##     ##     ##  ##             ####      ##     ##      
    ##   ##  ######   #####             ####     ##  ##     ##     ##  ##              ##      ####    ######  
    \n\n\n                                                                                                 
    Servidor do seu site já está rodando! Acesse o caminho a seguir para visualizar .: http://${HOST_APP}:${PORTA_APP} :. \n\n
    Você está rodando sua aplicação em ambiente de .:${process.env.AMBIENTE_PROCESSO}:. \n\n
    \tSe .:desenvolvimento:. você está se conectando ao banco local. \n
    \tSe .:producao:. você está se conectando ao banco remoto. \n\n
    \t\tPara alterar o ambiente, comente ou descomente as linhas 1 ou 2 no arquivo 'app.js'\n\n`);
});
