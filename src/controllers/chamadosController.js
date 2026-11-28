function normalizarDados(dados, idEmpresa) {
    if (dados?.empresaId !== idEmpresa || !Array.isArray(dados.funcionarios)) {
        throw new Error("Resposta incompatível com o contrato da API Java.");
    }

    return {
        empresaId: idEmpresa,
        funcionarios: dados.funcionarios.map(funcionario => {
            if (!funcionario?.id || typeof funcionario.nome !== "string" ||
                !funcionario.nome.trim() || !Array.isArray(funcionario.chamados)) {
                throw new Error("Funcionário inválido na resposta da API Java.");
            }

            return {
                id: String(funcionario.id),
                nome: funcionario.nome.trim(),
                cargo: funcionario.cargo ?? null,
                baseId: funcionario.baseId ?? null,
                chamados: funcionario.chamados.map(normalizarChamado)
            };
        })
    };
}

function normalizarChamado(chamado) {
    var resolvido = Date.parse(chamado?.resolvidoEm);
    if (!chamado?.id || !Number.isFinite(resolvido)) {
        throw new Error("Chamado inválido na resposta da API Java.");
    }

    var inicio = Date.parse(chamado.inicioAtendimento);
    var duracao = Number.isFinite(inicio) && resolvido >= inicio
        ? (resolvido - inicio) / 60000 : null;
    var deslocamento = chamado.deslocamentoEstimadoMinutos;
    if (!Number.isFinite(deslocamento) || deslocamento < 0) deslocamento = null;

    return {
        id: String(chamado.id),
        equipamento: chamado.equipamento ?? null,
        hospitalId: chamado.hospitalId ?? null,
        baseId: chamado.baseId ?? null,
        inicioAtendimento: Number.isFinite(inicio) ? new Date(inicio).toISOString() : null,
        resolvidoEm: new Date(resolvido).toISOString(),
        tempoAtendimento: duracao === null ? null : Math.round(duracao),
        deslocamento,
        tempoAjustado: duracao !== null && deslocamento !== null && duracao >= deslocamento
            ? Math.round(duracao - deslocamento) : null
    };
}

async function listarChamados(req, res) {
    var idEmpresa = Number(req.params.idEmpresa);
    if (!Number.isSafeInteger(idEmpresa) || idEmpresa <= 0) {
        return res.status(400).json({ mensagem: "ID da empresa inválido." });
    }
    if (Number(req.usuario.fk_empresa) !== idEmpresa) {
        return res.status(403).json({ mensagem: "A empresa não corresponde à sua sessão." });
    }

    var endereco = process.env.JAVA_CHAMADOS_URL;
    var url;
    try {
        if (!endereco?.includes("{idEmpresa}")) {
            throw new Error("Endereço da API Java incompleto.");
        }
        url = new URL(endereco.replaceAll("{idEmpresa}", String(idEmpresa)));
        if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
            throw new Error("Protocolo inválido.");
        }
    } catch {
        return res.status(503).json({ mensagem: "A API Java de chamados não está configurada." });
    }

    try {
        var resposta = await fetch(url, {
            headers: { Accept: "application/json" },
            redirect: "error",
            signal: AbortSignal.timeout(15000)
        });
        if (!resposta.ok) {
            console.error("A API Java de chamados retornou HTTP", resposta.status);
            return res.status(502).json({ mensagem: "A API Java não conseguiu retornar os chamados." });
        }

        return res.json(normalizarDados(await resposta.json(), idEmpresa));
    } catch (erro) {
        console.error("Erro ao consultar a API Java de chamados:", erro.name);
        if (erro.name === "TimeoutError") {
            return res.status(504).json({ mensagem: "A API Java demorou para responder." });
        }
        return res.status(502).json({ mensagem: "Não foi possível obter os chamados da API Java." });
    }
}

module.exports = { listarChamados };
