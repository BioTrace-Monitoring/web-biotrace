var cache = new Map();
var filaConsultas = Promise.resolve();
var ultimaConsulta = 0;
var TEMPO_CACHE_MS = 24 * 60 * 60 * 1000;
var INTERVALO_NOMINATIM_MS = 1100;

function esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function buscarEnderecoCep(cep) {
    var resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
        signal: AbortSignal.timeout(10000)
    });

    if (!resposta.ok) {
        throw new Error(`ViaCEP respondeu com HTTP ${resposta.status}.`);
    }

    var endereco = await resposta.json();
    if (endereco.erro) {
        throw new Error("O CEP não foi encontrado no ViaCEP.");
    }

    return endereco;
}

function consultarNominatim(parametros) {
    var consulta = filaConsultas.then(async function () {
        var tempoAguardar = INTERVALO_NOMINATIM_MS - (Date.now() - ultimaConsulta);
        if (tempoAguardar > 0) await esperar(tempoAguardar);

        ultimaConsulta = Date.now();
        var url = new URL("https://nominatim.openstreetmap.org/search");
        url.search = new URLSearchParams({
            ...parametros,
            format: "jsonv2",
            limit: "1"
        });

        var resposta = await fetch(url, {
            headers: { "User-Agent": "BioTraceMap/1.0" },
            signal: AbortSignal.timeout(10000)
        });

        if (!resposta.ok) {
            throw new Error(`Nominatim respondeu com HTTP ${resposta.status}.`);
        }

        return resposta.json();
    });

    filaConsultas = consulta.catch(function () {});
    return consulta;
}

async function consultarPhoton(consulta) {
    var url = new URL("https://photon.komoot.io/api/");
    url.search = new URLSearchParams({ q: consulta, limit: "1" });

    var resposta = await fetch(url, {
        signal: AbortSignal.timeout(10000)
    });

    if (!resposta.ok) {
        throw new Error(`Photon respondeu com HTTP ${resposta.status}.`);
    }

    var dados = await resposta.json();
    return dados.features || [];
}

async function geocodificarLocal(local) {
    var cep = String(local.cep || "").replace(/\D/g, "");
    if (!/^\d{8}$/.test(cep)) {
        throw new Error("O registro não contém um CEP válido.");
    }

    var chaveCache = `${cep}:${String(local.numero || "").trim()}`;
    var registroCache = cache.get(chaveCache);
    if (registroCache && registroCache.expiraEm > Date.now()) {
        return registroCache.localizacao;
    }

    var endereco = await buscarEnderecoCep(cep);
    var rua = [endereco.logradouro, local.numero].filter(Boolean).join(", ");
    var parametros = {
        street: rua,
        city: endereco.localidade || "",
        state: endereco.uf || "",
        country: "Brasil"
    };

    if (!endereco.logradouro) {
        delete parametros.street;
        parametros.postalcode = cep;
    }

    var resultados = await consultarNominatim(parametros);
    var latitude;
    var longitude;
    var precisao;

    if (!resultados.length && endereco.logradouro) {
        resultados = await consultarNominatim({
            postalcode: cep,
            country: "Brasil"
        });
    }

    if (resultados.length) {
        latitude = Number(resultados[0].lat);
        longitude = Number(resultados[0].lon);
        precisao = resultados[0].addresstype === "house"
            ? "endereco"
            : resultados[0].addresstype === "postcode" ? "cep" : "logradouro";
    } else {
        var consultaPhoton = [
            rua,
            endereco.bairro,
            endereco.localidade,
            endereco.uf,
            "Brasil"
        ].filter(Boolean).join(", ");
        var resultadosPhoton = await consultarPhoton(consultaPhoton);
        if (!resultadosPhoton.length) {
            throw new Error("O endereço não foi localizado nos serviços de geocodificação.");
        }

        var coordenadas = resultadosPhoton[0].geometry.coordinates;
        longitude = Number(coordenadas[0]);
        latitude = Number(coordenadas[1]);
        precisao = resultadosPhoton[0].properties.type === "house"
            ? "endereco"
            : "logradouro";
    }

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new Error("O serviço de geocodificação retornou coordenadas inválidas.");
    }

    var localizacao = {
        latitude,
        longitude,
        precisao,
        logradouro: endereco.logradouro || null,
        bairro: endereco.bairro || null,
        cidade: endereco.localidade || null,
        uf: endereco.uf || null
    };

    cache.set(chaveCache, {
        localizacao,
        expiraEm: Date.now() + TEMPO_CACHE_MS
    });

    return localizacao;
}

module.exports = { geocodificarLocal };
