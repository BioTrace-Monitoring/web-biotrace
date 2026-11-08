var dadosClima = {};
var assinaturaHospitaisClima = "";
var estadoClima = "carregando";
var mensagemClima = "Consultando o histórico meteorológico…";
var cacheClima = {};
var requisicaoClima = null;
var consultaClima = 0;
var graficosContexto = {};
var principalContexto = null;

function mediaContexto(valores) {
  var validos = valores.filter(function (valor) {
    return Number.isFinite(valor);
  });
  return validos.length
    ? validos.reduce(function (soma, valor) {
        return soma + valor;
      }, 0) / validos.length
    : null;
}

function formatarDataContexto(instante, hora) {
  return new Date(instante).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: hora ? "2-digit" : undefined,
    minute: hora ? "2-digit" : undefined,
  });
}

function atualizarAnalisesComplementares(principal) {
  principalContexto = principal;
  if (!principal) {
    consultaClima++;
    if (requisicaoClima) requisicaoClima.abort();
    dadosClima = {};
    assinaturaHospitaisClima = "";
    return;
  }
  document.getElementById("escopoComplementar").textContent =
    "Lotes selecionados · relações exploratórias para orientar a inspeção.";
  atualizarProcessosCpu(principal);
  var hospitais = obterHospitaisContexto();
  document.getElementById("hospitaisClima").textContent =
    "Locais de instalação (demonstrativos) · " +
    hospitais
      .map(function (id) {
        var hospital = hospitaisPreditivos[id];
        return hospital.nome + " — " + hospital.cidade;
      })
      .join(" · ");
  var assinatura = hospitais.join(",");
  if (assinatura !== assinaturaHospitaisClima) carregarClimaContexto(false);
  else atualizarClimaContexto();
}

function obterHospitaisContexto() {
  return Array.from(
    new Set(
      unidadesPreditivas.map(function (u) {
        return u.fk_hospital;
      }),
    ),
  ).sort();
}

function mensagemGraficoContexto(id, vazioId, mensagem) {
  if (graficosContexto[id]) {
    graficosContexto[id].destroy();
    delete graficosContexto[id];
  }
  document.getElementById(id).hidden = Boolean(mensagem);
  document.getElementById(vazioId).hidden = !mensagem;
  document.getElementById(vazioId).textContent = mensagem || "";
}

function criarGraficoContexto(id, vazioId, configuracao, mensagem) {
  if (typeof Chart === "undefined")
    mensagem =
      "Não foi possível carregar os gráficos. Os indicadores e resumos continuam disponíveis.";
  mensagemGraficoContexto(id, vazioId, mensagem);
  if (!mensagem)
    graficosContexto[id] = new Chart(document.getElementById(id), configuracao);
}

function opcoesContexto(tituloX, tituloY, unidadeX, unidadeY) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        filter: function (item) {
          return !item.dataset.semTooltip;
        },
        callbacks: {
          label: function (item) {
            return (
              item.dataset.label +
              " · " +
              formatarPreditivo(item.parsed.x, 1) +
              " " +
              unidadeX +
              " · " +
              formatarPreditivo(item.parsed.y, 1) +
              " " +
              unidadeY
            );
          },
        },
      },
    },
    scales: {
      x: {
        type: "linear",
        title: { display: true, text: tituloX, font: { size: 10 } },
        grid: { color: "#eeebf3" },
        ticks: { maxTicksLimit: 6, font: { size: 10 } },
      },
      y: {
        title: { display: true, text: tituloY, font: { size: 10 } },
        grid: { color: "#eeebf3" },
        ticks: { maxTicksLimit: 6, font: { size: 10 } },
      },
    },
  };
}

function criarPontosPorLote(pontos) {
  var datasets = [];
  for (var l = 0; l < lotesPreditivos.length; l++) {
    var pontosLote = pontos.filter(function (ponto) {
      return ponto.lote === l;
    });
    if (!pontosLote.length) continue;
    datasets.push({
      label: lotesPreditivos[l].numero,
      data: pontosLote,
      backgroundColor: lotesPreditivos[l].cor,
      borderColor: lotesPreditivos[l].cor,
      pointRadius: 3,
      pointHoverRadius: 5,
    });
  }
  return datasets;
}

function atualizarLegendaLotes(id, pontos, regressao) {
  var legenda = document.getElementById(id + "Legenda");
  if (!legenda) {
    legenda = document.createElement("div");
    legenda.id = id + "Legenda";
    legenda.className = "legenda-regressao";
    document.getElementById(id).parentElement.after(legenda);
  }
  var html = "";
  for (var l = 0; l < lotesPreditivos.length; l++) {
    if (
      !pontos.some(function (ponto) {
        return ponto.lote === l;
      })
    )
      continue;
    html +=
      '<span class="item-legenda"><span class="ponto-legenda cor-lote-' +
      l +
      '"></span>' +
      lotesPreditivos[l].numero +
      "</span>";
  }
  if (regressao)
    html +=
      '<span class="item-legenda"><span class="linha-legenda"></span>Ajuste do recorte</span>';
  legenda.innerHTML = html;
}

function atualizarResumoAjuste(id, ajuste, quantidade, unidade) {
  var resumo = document.getElementById(id + "Resumo");
  if (!resumo) {
    resumo = document.createElement("p");
    resumo.id = id + "Resumo";
    resumo.className = "estatisticas-regressao";
    document.getElementById(id + "Legenda").after(resumo);
  }
  resumo.textContent =
    "R² " +
    (ajuste && ajuste.r2 !== null ? formatarPreditivo(ajuste.r2, 2) : "—") +
    " · MAE " +
    (ajuste ? formatarPreditivo(ajuste.mae, 2) + " " + unidade : "—") +
    " · n = " +
    quantidade;
}

function graficoDispersaoContexto(
  id,
  vazioId,
  pontos,
  tituloX,
  tituloY,
  unidadeX,
  unidadeY,
  cor,
) {
  pontos = pontos.filter(function (ponto) {
    return Number.isFinite(ponto.x) && Number.isFinite(ponto.y);
  });
  var ajuste = calcularRegressao(pontos);
  var datasets = criarPontosPorLote(pontos);
  atualizarLegendaLotes(id, pontos, Boolean(ajuste));
  atualizarResumoAjuste(id, ajuste, pontos.length, unidadeY);
  if (ajuste) {
    var inicio = Math.min.apply(
      null,
      pontos.map(function (ponto) {
        return ponto.x;
      }),
    );
    var fim = Math.max.apply(
      null,
      pontos.map(function (ponto) {
        return ponto.x;
      }),
    );
    datasets.push({
      label: "Regressão",
      data: criarReta(ajuste, inicio, fim),
      borderColor: "#686171",
      borderWidth: 1.8,
      borderDash: [4, 4],
      showLine: true,
      pointRadius: 0,
      semTooltip: true,
    });
  }
  var opcoes = opcoesContexto(tituloX, tituloY, unidadeX, unidadeY);
  if (unidadeY === "%") {
    opcoes.scales.y.min = 0;
    opcoes.scales.y.max = 100;
  }
  if (unidadeY === "GB") opcoes.scales.y.min = 0;
  criarGraficoContexto(
    id,
    vazioId,
    { type: "scatter", data: { datasets: datasets }, options: opcoes },
    pontos.length < 3
      ? "São necessários pelo menos três horários válidos para comparar este recorte."
      : "",
  );
  return ajuste;
}

function calcularTaxasRede(leituras, campos) {
  campos = campos || ["rede_erros_entrada", "rede_erros_saida"];
  var anteriores = {};
  var horarios = {};
  var ordenadas = leituras.slice().sort(function (a, b) {
    return new Date(a.data_hora_br) - new Date(b.data_hora_br);
  });
  for (var i = 0; i < ordenadas.length; i++) {
    var atual = ordenadas[i];
    var anterior = anteriores[atual.numero_serie];
    anteriores[atual.numero_serie] = atual;
    if (!anterior) continue;
    var horas =
      (new Date(atual.data_hora_br) - new Date(anterior.data_hora_br)) /
      3600000;
    var entrada = atual[campos[0]] - anterior[campos[0]];
    var saida = atual[campos[1]] - anterior[campos[1]];
    var contadores = [
      atual[campos[0]],
      anterior[campos[0]],
      atual[campos[1]],
      anterior[campos[1]],
    ];
    if (
      !contadores.every(Number.isFinite) ||
      !Number.isFinite(atual.uptime_horas) ||
      !Number.isFinite(anterior.uptime_horas) ||
      horas <= 0 ||
      entrada < 0 ||
      saida < 0 ||
      atual.uptime_horas <= anterior.uptime_horas ||
      Math.abs(atual.uptime_horas - anterior.uptime_horas - horas) > 0.05
    )
      continue;
    var instante = new Date(atual.data_hora_br).getTime();
    if (!horarios[instante]) horarios[instante] = [];
    horarios[instante].push((entrada + saida) / horas);
  }
  return Object.keys(horarios)
    .map(function (instante) {
      return { x: Number(instante), y: mediaContexto(horarios[instante]) };
    })
    .sort(function (a, b) {
      return a.x - b.x;
    });
}

function atualizarProcessosCpu(principal) {
  var leituras = obterLeiturasSelecionadas();
  var pontos = leituras.map(function (leitura) {
    return {
      x: leitura.processos_ativos,
      y: leitura.cpu_percent,
      lote: leitura.lote,
    };
  });
  var ajuste = graficoDispersaoContexto(
    "graficoProcessosCpu",
    "vazioProcessosCpu",
    pontos,
    "Processos ativos",
    "Uso da CPU (%)",
    "processos",
    "%",
    "#bc7a2e",
  );
  document.getElementById("insightProcessos").textContent =
    "Leituras individuais dos lotes selecionados. Compare cargas semelhantes antes de atribuir diferenças ao hardware.";
}

function normalizarClima(resposta) {
  var hourly = resposta && resposta.hourly;
  if (
    !hourly ||
    !Array.isArray(hourly.time) ||
    !Array.isArray(hourly.temperature_2m) ||
    !Array.isArray(hourly.relative_humidity_2m)
  )
    throw new Error("Formato meteorológico inválido.");
  var horas = [];
  for (var i = 0; i < hourly.time.length; i++) {
    if (
      !Number.isFinite(hourly.time[i]) ||
      !Number.isFinite(hourly.temperature_2m[i])
    )
      continue;
    horas.push({
      instante: hourly.time[i] * 1000,
      temperatura: hourly.temperature_2m[i],
      umidade: Number.isFinite(hourly.relative_humidity_2m[i])
        ? hourly.relative_humidity_2m[i]
        : null,
    });
  }
  if (!horas.length)
    throw new Error(
      "O período ainda não tem dados meteorológicos disponíveis.",
    );
  return horas.sort(function (a, b) {
    return a.instante - b.instante;
  });
}

function parearClima(leituras, climaPorHospital) {
  var porHora = {};
  var grupos = {};
  Object.keys(climaPorHospital).forEach(function (id) {
    climaPorHospital[id].forEach(function (clima) {
      porHora[id + ":" + Math.floor(clima.instante / 3600000)] = clima;
    });
  });
  leituras.forEach(function (leitura) {
    if (
      !hospitaisPreditivos[leitura.fk_hospital] ||
      !Number.isFinite(leitura.temperatura_cpu)
    )
      return;
    var chave =
      leitura.fk_hospital +
      ":" +
      Math.floor(new Date(leitura.data_hora_br).getTime() / 3600000);
    if (!porHora[chave]) return;
    var grupo = chave + ":" + leitura.lote;
    if (!grupos[grupo])
      grupos[grupo] = {
        valores: [],
        clima: porHora[chave],
        lote: leitura.lote,
      };
    grupos[grupo].valores.push(leitura.temperatura_cpu);
  });
  return Object.keys(grupos)
    .map(function (chave) {
      var externo = grupos[chave].clima;
      return {
        x: externo.temperatura,
        y: mediaContexto(grupos[chave].valores),
        lote: grupos[chave].lote,
        instante: externo.instante,
        umidade: externo.umidade,
      };
    })
    .sort(function (a, b) {
      return a.instante - b.instante;
    });
}

async function carregarClimaContexto(forcar) {
  if (!principalContexto) return;
  var hospitais = obterHospitaisContexto();
  assinaturaHospitaisClima = hospitais.join(",");
  var consulta = ++consultaClima;
  if (requisicaoClima) requisicaoClima.abort();
  dadosClima = {};
  estadoClima = "carregando";
  mensagemClima = "Consultando o clima dos locais de instalação dos hospitais…";
  document.getElementById("atualizarClima").disabled = true;
  atualizarClimaContexto();
  var inicio = new Date(referenciaPreditiva - 30 * 86400000)
    .toISOString()
    .slice(0, 10);
  var fim = new Date(referenciaPreditiva - 86400000).toISOString().slice(0, 10);
  var controller = new AbortController();
  requisicaoClima = controller;
  var timeout = setTimeout(function () {
    controller.abort();
  }, 12000);
  try {
    var respostas = await Promise.allSettled(
      hospitais.map(async function (id) {
        var hospital = hospitaisPreditivos[id];
        if (
          !Number.isFinite(hospital.latitude) ||
          !Number.isFinite(hospital.longitude)
        )
          throw new Error("Localização indisponível");
        var chave =
          hospital.latitude +
          "," +
          hospital.longitude +
          ":" +
          inicio +
          ":" +
          fim;
        if (!forcar && cacheClima[chave]) return cacheClima[chave];
        var url = new URL(
          "https://historical-forecast-api.open-meteo.com/v1/forecast",
        );
        url.search = new URLSearchParams({
          latitude: hospital.latitude,
          longitude: hospital.longitude,
          start_date: inicio,
          end_date: fim,
          hourly: "temperature_2m,relative_humidity_2m",
          timezone: "UTC",
          timeformat: "unixtime",
          temperature_unit: "celsius",
        }).toString();
        var resposta = await fetch(url.toString(), {
          signal: controller.signal,
        });
        if (!resposta.ok) throw new Error("Clima indisponível");
        var normalizados = normalizarClima(await resposta.json());
        cacheClima[chave] = normalizados;
        return normalizados;
      }),
    );
    if (consulta !== consultaClima) return;
    var indisponiveis = [];
    respostas.forEach(function (resposta, indice) {
      var id = hospitais[indice];
      if (resposta.status === "fulfilled") dadosClima[id] = resposta.value;
      else indisponiveis.push(hospitaisPreditivos[id].nome);
    });
    estadoClima = Object.keys(dadosClima).length ? "pronto" : "erro";
    mensagemClima =
      "Open-Meteo · clima disponível para " +
      Object.keys(dadosClima).length +
      " de " +
      hospitais.length +
      " hospitais · consulta " +
      formatarDataContexto(Date.now(), true) +
      " (Brasília).";
    if (indisponiveis.length)
      mensagemClima +=
        " Sem clima para " +
        indisponiveis.join(", ") +
        ". Leituras desses locais são excluídas dos gráficos climáticos. Tente atualizar.";
  } finally {
    clearTimeout(timeout);
    if (consulta === consultaClima) {
      requisicaoClima = null;
      document.getElementById("atualizarClima").disabled = false;
      atualizarClimaContexto();
    }
  }
}

function calcularMargensClima(resultados, clima, limite, corte) {
  return resultados.map(function (resultado) {
    var pares = parearClima(resultado.leituras, clima);
    var amenos = pares.filter(function (p) {
      return p.x < corte;
    });
    var quentes = pares.filter(function (p) {
      return p.x >= corte;
    });
    return {
      lote: lotesPreditivos[resultado.indice].numero,
      indice: resultado.indice,
      amena: mediaContexto(
        amenos.map(function (p) {
          return limite - p.y;
        }),
      ),
      quente: mediaContexto(
        quentes.map(function (p) {
          return limite - p.y;
        }),
      ),
      horariosAmenos: amenos.length,
      horariosQuentes: quentes.length,
    };
  });
}

function atualizarClimaContexto() {
  if (!principalContexto) return;
  document.getElementById("statusClima").textContent = mensagemClima;
  var periodo = Number(document.getElementById("filtroPeriodo").value);
  var inicio = referenciaPreditiva - periodo * 86400000;
  var clima = {};
  Object.keys(dadosClima).forEach(function (id) {
    clima[id] = dadosClima[id].filter(function (hora) {
      return hora.instante >= inicio && hora.instante <= referenciaPreditiva;
    });
  });
  var pares = parearClima(obterLeiturasSelecionadas(), clima);
  var ajuste = pares.length >= 3 ? calcularRegressao(pares) : null;
  var temperatura = mediaContexto(
    pares.map(function (p) {
      return p.x;
    }),
  );
  var umidade = mediaContexto(
    pares.map(function (p) {
      return p.umidade;
    }),
  );
  document.getElementById("climaTemperatura").textContent =
    temperatura === null ? "—" : formatarPreditivo(temperatura, 1) + " °C";
  document.getElementById("climaUmidade").textContent =
    umidade === null ? "—" : formatarPreditivo(umidade, 0) + "%";
  document.getElementById("climaR2").textContent =
    ajuste && ajuste.r2 !== null ? formatarPreditivo(ajuste.r2, 2) : "—";
  document.getElementById("climaPares").textContent =
    estadoClima === "pronto" ? pares.length : "—";
  document.getElementById("climaCobertura").textContent =
    pares.length + " pares lote/hospital/hora com clima do local de instalação";
  document.getElementById("insightClima").textContent =
    ajuste && ajuste.pearson !== null
      ? "Pearson r = " +
        formatarPreditivo(ajuste.pearson, 2) +
        " · " +
        pares.length +
        " pares lote/hospital/hora, com média entre unidades do mesmo lote e hospital. Hardware demonstrativo."
      : "Ainda não há horários ou variação suficientes para calcular uma associação. Nenhum dado climático é inventado para preencher lacunas.";
  document.getElementById("subtituloMargemClima").textContent =
    "Clima do hospital de cada equipamento · últimos " + periodo + " dias";
  var limite =
    modelosPreditivos[document.getElementById("filtroModelo").value].limite;
  var margens = calcularMargensClima(resultadosPreditivos, clima, limite, 28);
  var comCalor = margens
    .filter(function (m) {
      return m.quente !== null;
    })
    .sort(function (a, b) {
      return a.quente - b.quente;
    });
  document.getElementById("resumoMargemClima").textContent = comCalor.length
    ? "Menor folga média com clima ≥ 28 °C: " +
      comCalor[0].lote +
      " · " +
      formatarPreditivo(comCalor[0].quente, 1) +
      " °C de margem em " +
      comCalor[0].horariosQuentes +
      " horário(s) pareado(s). Compare as condições de operação entre os lotes."
    : "Sem horários pareados com clima ≥ 28 °C neste recorte. As barras disponíveis mostram a margem média em horários abaixo desse corte.";
  if (document.getElementById("painelAmbiente").hidden) return;
  var vazio =
    estadoClima === "carregando"
      ? "Consultando histórico dos hospitais…"
      : estadoClima === "erro"
        ? "Histórico indisponível. Use Atualizar clima para tentar novamente."
        : "";
  if (vazio) {
    mensagemGraficoContexto("graficoClimaCpu", "vazioClimaCpu", vazio);
    atualizarLegendaLotes("graficoClimaCpu", [], false);
    atualizarResumoAjuste("graficoClimaCpu", null, 0, "°C");
  } else
    graficoDispersaoContexto(
      "graficoClimaCpu",
      "vazioClimaCpu",
      pares,
      "Temperatura externa (°C)",
      "Temperatura média da CPU (°C)",
      "°C",
      "°C",
      "#6d3fc0",
    );
  atualizarLegendaLotes(
    "graficoMargemClima",
    margens.map(function (m) {
      return { lote: m.indice };
    }),
    false,
  );
  var opcoes = opcoesContexto(
    "Lote de equipamentos",
    "Margem térmica média (°C)",
    "",
    "°C",
  );
  opcoes.scales.x.type = "category";
  opcoes.scales.y.beginAtZero = true;
  opcoes.plugins.legend = {
    display: true,
    position: "bottom",
    labels: { boxWidth: 10, font: { size: 10 } },
  };
  opcoes.plugins.tooltip.callbacks.label = function (item) {
    return (
      item.dataset.label +
      ": " +
      formatarPreditivo(item.parsed.y, 1) +
      " °C de margem média"
    );
  };
  opcoes.plugins.tooltip.callbacks.afterLabel = function (item) {
    var lote = margens[item.dataIndex];
    return (
      (item.datasetIndex === 0 ? lote.horariosAmenos : lote.horariosQuentes) +
      " horário(s) pareado(s)"
    );
  };
  criarGraficoContexto(
    "graficoMargemClima",
    "vazioMargemClima",
    {
      type: "bar",
      data: {
        labels: margens.map(function (m) {
          return m.lote;
        }),
        datasets: [
          {
            label: "Barra clara: externo < 28 °C",
            data: margens.map(function (m) {
              return m.amena;
            }),
            backgroundColor: margens.map(function (m) {
              return lotesPreditivos[m.indice].cor + "55";
            }),
            borderColor: margens.map(function (m) {
              return lotesPreditivos[m.indice].cor;
            }),
            borderWidth: 1,
            borderRadius: 4,
            maxBarThickness: 38,
          },
          {
            label: "Barra sólida: externo ≥ 28 °C",
            data: margens.map(function (m) {
              return m.quente;
            }),
            backgroundColor: margens.map(function (m) {
              return lotesPreditivos[m.indice].cor;
            }),
            borderRadius: 4,
            maxBarThickness: 38,
          },
        ],
      },
      options: opcoes,
    },
    vazio ||
      (margens.some(function (m) {
        return m.horariosAmenos + m.horariosQuentes > 0;
      })
        ? ""
        : "Sem horários pareados entre clima e coleta no período selecionado."),
  );
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("atualizarClima").onclick = function () {
    carregarClimaContexto(true);
  };
});
