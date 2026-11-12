// Executar somente contra um banco descartável com init.sql e a migração aplicados.
var test = require("node:test");
var assert = require("node:assert/strict");
var express = require("express");
var jwt = require("jsonwebtoken");
var database = require("../src/database/config");

test(
    "Protocolos e ensaios com MySQL isolado",
    { skip: process.env.ENGENHARIA_TESTE_BANCO !== "isolado" },
    async function (t) {
        var sql = database.executar;
        await sql(
            `INSERT INTO empresa (id_empresa, razao_social, cnpj) VALUES (5001,'Teste externo','50010000000001')`,
        );
        await sql(`INSERT INTO usuario (id_usuario,nome_usuario,cpf_usuario,email_usuario,senha_usuario,fk_empresa,fk_cargo) VALUES
        (5001,'Admin teste','50010000001','admin@teste.local','hash',1,2),
        (5002,'Gestor externo','50010000002','gestor@teste.local','hash',5001,3),
        (5003,'Analista teste','50010000003','analista@teste.local','hash',1,4)`);
        await sql(
            `INSERT INTO modelo_equipamento (id_modelo_equipamento,nome_modelo,fk_empresa) VALUES (5001,'ECG teste',1),(5002,'Externo',5001)`,
        );
        await sql(
            `INSERT INTO lote_equipamento (id_lote_equipamento,numero_lote,fk_empresa,fk_modelo_equipamento) VALUES (5001,'LT-TESTE',1,5001),(5002,'LT-EXTERNO',5001,5002)`,
        );
        await sql(
            `INSERT INTO equipamento (id_equipamento,numero_serie,fk_lote) VALUES (5001,'TESTE-1',5001),(5002,'EXTERNO-1',5002)`,
        );
        var app = express();
        app.use(express.json());
        app.use("/engenharia", require("../src/routes/engenharia"));
        var server = app.listen(0, "127.0.0.1");
        await new Promise(function (resolve) {
            server.on("listening", resolve);
        });
        t.after(function () {
            return new Promise(function (resolve) {
                server.close(resolve);
            });
        });
        var admin = jwt.sign(
            { id: 5001, fk_empresa: 1, cargo: "Administrador" },
            process.env.JWT_SECRET,
        );
        var externo = jwt.sign(
            { id: 5002, fk_empresa: 5001, cargo: "Gestor" },
            process.env.JWT_SECRET,
        );
        var analista = jwt.sign(
            { id: 5003, fk_empresa: 1, cargo: "Analista" },
            process.env.JWT_SECRET,
        );
        async function request(path, method, body, token) {
            var response = await fetch(
                "http://127.0.0.1:" +
                    server.address().port +
                    "/engenharia" +
                    path,
                {
                    method: method || "GET",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token === null
                            ? {}
                            : { Authorization: "Bearer " + (token || admin) }),
                    },
                    body: body === undefined ? undefined : JSON.stringify(body),
                },
            );
            return { status: response.status, body: await response.json() };
        }
        assert.equal(
            (await request("/protocolos", "GET", undefined, null)).status,
            401,
        );
        assert.equal(
            (await request("/protocolos", "GET", undefined, analista)).status,
            403,
        );
        var protocolo = {
            nome: "Validação ECG",
            procedimento: "Operar com carga padronizada",
            duracao_minutos: 1440,
            intervalo_coleta_segundos: 180,
            cobertura_minima_percentual: 95,
            tolerancia_envio_minutos: 60,
            limite_temperatura: 85,
            limite_cpu: 95,
            limite_ram: 90,
            minimo_disco_livre: 20,
            checklist_layout: "Revisar dissipador",
            checklist_compatibilidade: "Testar periféricos",
            checklist_funcionamento: "Executar cenários",
            fk_modelo_equipamento: 5001,
        };
        assert.equal(
            (
                await request("/protocolos", "POST", {
                    ...protocolo,
                    limite_ram: 101,
                })
            ).status,
            400,
        );
        assert.equal(
            (
                await request("/protocolos", "POST", {
                    ...protocolo,
                    fk_modelo_equipamento: 5002,
                })
            ).status,
            404,
        );
        assert.equal(
            (
                await request("/protocolos", "POST", {
                    ...protocolo,
                    fk_responsavel: 5002,
                })
            ).status,
            400,
        );
        var criado = await request("/protocolos", "POST", protocolo);
        assert.equal(criado.status, 201);
        var id = criado.body.protocolo.id_protocolo;
        assert.equal(
            (await request("/protocolos", "POST", protocolo)).status,
            409,
        );
        assert.equal(
            (await request("/protocolos/" + id, "GET", undefined, externo))
                .status,
            404,
        );
        var versoes = await Promise.all([
            request("/protocolos/" + id + "/versoes", "POST", protocolo),
            request("/protocolos/" + id + "/versoes", "POST", protocolo),
        ]);
        assert(
            versoes.every(function (r) {
                return r.status === 201;
            }),
        );
        assert.deepEqual(
            versoes
                .map(function (r) {
                    return r.body.protocolo.versao;
                })
                .sort(),
            [2, 3],
        );
        var dados = {
            ambiente: "bancada",
            fk_protocolo: id,
            equipamentos: [5001],
        };
        assert.equal(
            (
                await request("/ensaios", "POST", {
                    ...dados,
                    equipamentos: [5001, 5001],
                })
            ).status,
            400,
        );
        assert.equal(
            (
                await request("/ensaios", "POST", {
                    ...dados,
                    equipamentos: [5001, 5002],
                })
            ).status,
            400,
        );
        assert.equal((await request("/ensaios")).body.ensaios.length, 0);
        assert.equal(
            (await request("/ensaios", "POST", { ...dados, ambiente: "campo" }))
                .status,
            400,
        );
        var ensaio = await request("/ensaios", "POST", dados);
        assert.equal(ensaio.status, 201);
        var ensaioId = ensaio.body.ensaio.id_ensaio;
        assert.equal(ensaio.body.ensaio.equipamentos.length, 1);
        assert.equal(
            (await request("/ensaios/" + ensaioId, "GET", undefined, externo))
                .status,
            404,
        );
        assert.equal(
            (await request("/ensaios", "GET", undefined, externo)).body.ensaios
                .length,
            0,
        );
        var inicio = await request(
            "/ensaios/" + ensaioId + "/iniciar",
            "POST",
            {},
        );
        assert.equal(inicio.status, 200);
        assert.equal(inicio.body.ensaio.situacao, "em_execucao");
        assert.equal(
            Date.parse(inicio.body.ensaio.termino_previsto) -
                Date.parse(inicio.body.ensaio.inicio),
            86400000,
        );
        var repetido = await request(
            "/ensaios/" + ensaioId + "/iniciar",
            "POST",
            {},
        );
        assert.equal(repetido.body.ensaio.inicio, inicio.body.ensaio.inicio);
        assert.equal(
            (await request("/ensaios/" + ensaioId + "/cancelar", "POST", {}))
                .body.ensaio.situacao,
            "cancelado",
        );
        assert.equal(
            (await request("/ensaios/" + ensaioId + "/iniciar", "POST", {}))
                .status,
            409,
        );
        assert.equal(
            (await sql("SELECT COUNT(*) AS total FROM relatorio_ensaio"))[0]
                .total,
            0,
        );
    },
);
