// Consulta somente um objeto conhecido, sem criar ou excluir recursos.
const path = require('node:path');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.dev') });

async function main() {
    const chave = process.argv[2];
    if (!process.env.S3_BUCKET || !process.env.AWS_REGION || !chave) {
        console.error('Configure S3_BUCKET e AWS_REGION em .env.dev.');
        console.error('Uso: npm run s3:check -- "gold/caminho/exato/leituras.json"');
        process.exitCode = 1;
        return;
    }
    if (process.env.GOLD_LOCAL_DIR) {
        console.log('Aviso: a aplicação ainda usa GOLD_LOCAL_DIR. Este teste consulta o S3 diretamente.');
    }
    const client = new S3Client({ region: process.env.AWS_REGION });
    try {
        const resposta = await client.send(new GetObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: chave,
        }));
        const documento = JSON.parse(await resposta.Body.transformToString());
        console.log('Leitura e interpretação do JSON no S3 concluídas.');
        console.log('schema_version:', documento.schema_version ?? '(ausente)');
        console.log('Quantidade de leituras:', Array.isArray(documento.leituras) ? documento.leituras.length : '(formato diferente do esperado pelo BioTrace)');
    } catch (erro) {
        const dicas = {
            CredentialsProviderError: 'Configure as credenciais locais do seu usuário AWS ou perfil SSO.',
            AccessDenied: 'Confira a permissão s3:GetObject para esse objeto e, se aplicável, kms:Decrypt.',
            NoSuchKey: 'Confira o caminho exato do arquivo dentro do bucket.',
            NoSuchBucket: 'Confira o nome do bucket.',
            InvalidAccessKeyId: 'Confira se as credenciais pertencem a um acesso AWS ativo.',
            ExpiredToken: 'Renove a sessão ou as credenciais temporárias.',
            PermanentRedirect: 'Confira a região do bucket.',
            SyntaxError: 'O objeto foi lido, mas não contém JSON válido.',
        };
        console.error('Falha na consulta:', erro.name || 'Erro');
        console.error(dicas[erro.name] || 'Confira região, credenciais, rede e permissões do objeto.');
        process.exitCode = 1;
    } finally {
        client.destroy();
    }
}
main().catch(() => { console.error('Não foi possível executar a verificação.'); process.exitCode = 1; });
