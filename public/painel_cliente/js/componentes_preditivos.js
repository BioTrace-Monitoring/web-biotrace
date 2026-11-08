var componentesPreditivos = {
  ram: {
    nome: "Memória RAM",
    campoModelo: "modelo_ram",
    unidade: "%",
    limite: 90,
    origem:
      "Catálogo demonstrativo. O uso de RAM representa o equipamento inteiro, inclusive quando há mais de um módulo.",
    modelos: [
      "Kingston Fury Impact DDR5",
      "Samsung DDR4 SODIMM",
      "Modelo não identificado",
    ],
    regra:
      "Atenção a partir de 90% de uso de RAM. Limite demonstrativo. O uso representa a memória total do equipamento.",
    rotulo: "Maior uso atual de RAM",
    coluna: "Uso de RAM",
    auxiliar: "Memória disponível",
  },
  disco: {
    nome: "Disco",
    campoModelo: "modelo_disco",
    unidade: "%",
    limite: 20,
    origem:
      "Catálogo demonstrativo. Espaço disponível no volume monitorado; não indica desgaste ou vida útil do disco.",
    modelos: ["Samsung SSD 980", "Kingston NV2", "Modelo não identificado"],
    regra:
      "Atenção abaixo de 20% de espaço livre. Limite demonstrativo. Histórico de capacidade por data da coleta.",
    rotulo: "Menor percentual livre",
    coluna: "Espaço livre",
    auxiliar: "Disponível em GB",
  },
  rede: {
    nome: "Rede",
    campoModelo: "modelo_rede",
    unidade: "erros/h",
    limite: 0.25,
    origem:
      "Catálogo demonstrativo. O tráfego e os erros representam a soma das interfaces do equipamento.",
    modelos: [
      "Intel Wi-Fi 6 AX201",
      "Realtek RTL8111",
      "Modelo não identificado",
    ],
    regra:
      "Atenção acima de 0,25 erros/h por unidade. Limite demonstrativo. Taxas calculadas entre coletas, descartando reinícios e resets de contador.",
    rotulo: "Média atual de erros de rede",
    coluna: "Erros por hora",
    auxiliar: "Tráfego total (Mbps)",
  },
};
var unidadesComponente = [];

function preencherModelosComponente() {
  var tipo = document.getElementById("filtroComponente").value;
  var select = document.getElementById("filtroModelo");
  select.replaceChildren();
  var modelos =
    tipo === "cpu"
      ? Object.keys(modelosPreditivos)
      : componentesPreditivos[tipo].modelos.map(function (_, indice) {
          return tipo + "_" + indice;
        });
  modelos.forEach(function (id, indice) {
    var option = document.createElement("option");
    option.value = id;
    option.textContent =
      tipo === "cpu"
        ? modelosPreditivos[id].nome
        : componentesPreditivos[tipo].modelos[indice];
    select.appendChild(option);
  });
  select.value = modelos[0];
}

function obterObservacoesComponente(tipo, leituras) {
  if (tipo !== "rede") {
    return leituras
      .map(function (leitura) {
        return {
          leitura: leitura,
          valor:
            tipo === "ram"
              ? leitura.memoria_percent
              : 100 - leitura.disco_percent,
          auxiliar:
            tipo === "ram"
              ? leitura.memoria_disponivel_gb
              : leitura.disco_livre_gb,
        };
      })
      .filter(function (observacao) {
        return Number.isFinite(observacao.valor);
      });
  }
  var porUnidade = {};
  leituras.forEach(function (leitura) {
    if (!porUnidade[leitura.numero_serie])
      porUnidade[leitura.numero_serie] = [];
    porUnidade[leitura.numero_serie].push(leitura);
  });
  var observacoes = [];
  Object.values(porUnidade).forEach(function (registros) {
    var taxasErros = calcularTaxasRede(registros);
    var taxasTrafego = calcularTaxasRede(registros, [
      "rede_bytes_enviados",
      "rede_bytes_recebidos",
    ]);
    var trafegoPorHora = {};
    var leituraPorHora = {};
    taxasTrafego.forEach(function (taxa) {
      trafegoPorHora[taxa.x] = (taxa.y * 8) / 3600 / 1000000;
    });
    registros.forEach(function (leitura) {
      leituraPorHora[new Date(leitura.data_hora_br).getTime()] = leitura;
    });
    taxasErros.forEach(function (taxa) {
      if (Number.isFinite(trafegoPorHora[taxa.x]))
        observacoes.push({
          leitura: leituraPorHora[taxa.x],
          valor: taxa.y,
          auxiliar: trafegoPorHora[taxa.x],
        });
    });
  });
  return observacoes;
}

function situacaoComponente(tipo, valor) {
  var limite = componentesPreditivos[tipo].limite;
  var alerta =
    tipo === "disco"
      ? valor < limite
      : tipo === "ram"
        ? valor >= limite
        : valor > limite;
  return {
    nome: alerta ? "Em atenção" : "Sem alertas",
    classe: alerta ? "atencao" : "",
  };
}

function mediaObservacoesComponente(observacoes, eixo, campo) {
  var grupos = {};
  observacoes.forEach(function (observacao) {
    var leitura = observacao.leitura;
    var x =
      eixo === "uptime"
        ? leitura.uptime_horas
        : new Date(leitura.data_hora_br).getTime();
    if (!Number.isFinite(observacao[campo]) || !Number.isFinite(x)) return;
    var faixa = eixo === "uptime" ? Math.floor(x / 24) * 24 : x;
    var chave = leitura.lote + ":" + faixa;
    if (!grupos[chave])
      grupos[chave] = { x: [], valores: [], lote: leitura.lote };
    grupos[chave].x.push(x);
    grupos[chave].valores.push(observacao[campo]);
  });
  return Object.values(grupos)
    .map(function (grupo) {
      return {
        x: mediaContexto(grupo.x),
        y: mediaContexto(grupo.valores),
        lote: grupo.lote,
      };
    })
    .sort(function (a, b) {
      return a.x - b.x;
    });
}

function atualizarAnaliseComponente(tipo) {
  var configuracao = componentesPreditivos[tipo];
  var modeloId = document.getElementById("filtroModelo").value;
  var indiceModelo = Number(modeloId.split("_")[1]);
  var nomeModelo = configuracao.modelos[indiceModelo];
  var lote = document.getElementById("filtroLote").value;
  var dias = Number(document.getElementById("filtroPeriodo").value);
  var inicio = referenciaPreditiva - dias * 86400000;
  var leituras = leiturasPreditivas.filter(function (leitura) {
    return (
      Boolean(hospitaisPreditivos[leitura.fk_hospital]) &&
      leitura[configuracao.campoModelo] === modeloId &&
      (lote === "todos" || leitura.lote === Number(lote)) &&
      new Date(leitura.data_hora_br).getTime() >= inicio &&
      new Date(leitura.data_hora_br).getTime() <= referenciaPreditiva
    );
  });
  investigandoModelo = false;
  document.getElementById("voltarAnalise").hidden = true;
  atualizarAnalisesComplementares(null);
  var observacoes = obterObservacoesComponente(tipo, leituras);
  var ultimas = {};
  observacoes.forEach(function (observacao) {
    var numero = observacao.leitura.numero_serie;
    if (
      !ultimas[numero] ||
      observacao.leitura.data_hora_br > ultimas[numero].leitura.data_hora_br
    )
      ultimas[numero] = observacao;
  });
  unidadesComponente = Object.values(ultimas);
  unidadesComponente.sort(function (a, b) {
    return tipo === "disco" ? a.valor - b.valor : b.valor - a.valor;
  });
  var total = unidadesComponente.length;
  document.getElementById("semEquipamentosAlocados").hidden = total > 0;
  document.getElementById("analiseOutrosComponentes").hidden = !total;
  document.getElementById("exportarComponente").disabled = !total;
  document.getElementById("tituloAnalise").textContent =
    "Análise de " + configuracao.nome;
  document.getElementById("descricaoAnalise").textContent =
    "Compare o comportamento das unidades alocadas por modelo de componente e lote.";
  document.title = configuracao.nome + " | BioTrace";
  document.getElementById("escopoAnalise").textContent =
    total +
    " unidades alocadas em hospitais · " +
    nomeModelo +
    " · " +
    leituras.length +
    " leituras · últimos " +
    dias +
    " dias";
  atualizarEnderecoAnalise();
  if (!total) return;
  document.getElementById("tituloModeloComponente").textContent = nomeModelo;
  document.getElementById("origemModeloComponente").textContent =
    configuracao.origem;
  document.getElementById("regraComponente").textContent = configuracao.regra;
  document.getElementById("totalUnidadesComponente").textContent = total;
  document.getElementById("rotuloValorComponente").textContent =
    configuracao.rotulo;
  var valor =
    tipo === "rede"
      ? mediaContexto(
          unidadesComponente.map(function (u) {
            return u.valor;
          }),
        )
      : unidadesComponente[0].valor;
  document.getElementById("valorAtualComponente").textContent =
    formatarPreditivo(valor, tipo === "rede" ? 2 : 1) +
    " " +
    configuracao.unidade;
  document.getElementById("detalheValorComponente").textContent =
    tipo === "rede"
      ? "Último intervalo válido por unidade"
      : unidadesComponente[0].leitura.numero_serie + " · última leitura";
  document.getElementById("alertasComponente").textContent =
    unidadesComponente.filter(function (u) {
      return situacaoComponente(tipo, u.valor).classe;
    }).length;
  document.getElementById("limiarComponente").textContent =
    configuracao.regra.split(". ")[0];
  document.getElementById("colunaValorComponente").textContent =
    configuracao.coluna;
  document.getElementById("colunaAuxiliarComponente").textContent =
    configuracao.auxiliar;
  document.getElementById("tabelaComponente").innerHTML = unidadesComponente
    .map(function (observacao) {
      var leitura = observacao.leitura;
      var situacao = situacaoComponente(tipo, observacao.valor);
      return (
        "<tr><td><strong>" +
        leitura.numero_serie +
        "</strong></td><td>" +
        leitura.hospital +
        "</td><td>" +
        lotesPreditivos[leitura.lote].numero +
        "</td><td>" +
        nomeModelo +
        "</td><td>" +
        formatarPreditivo(observacao.valor, 2) +
        " " +
        configuracao.unidade +
        "</td><td>" +
        (Number.isFinite(observacao.auxiliar)
          ? formatarPreditivo(observacao.auxiliar, 2) +
            (tipo === "rede" ? " Mbps" : " GB")
          : "—") +
        '</td><td><span class="situacao-preditiva ' +
        situacao.classe +
        '">' +
        situacao.nome +
        "</span></td></tr>"
      );
    })
    .join("");
  atualizarGraficosComponente(tipo, observacoes);
}

function atualizarGraficosComponente(tipo, observacoes) {
  var ajuste = null;
  if (tipo === "disco") {
    document.getElementById("tituloGraficoComponente1").textContent =
      "Espaço livre por equipamento";
    document.getElementById("descricaoGraficoComponente1").textContent =
      "Percentual disponível considerando a capacidade de cada disco";
    var opcoes = opcoesContexto("Equipamento", "Espaço livre (%)", "", "%");
    opcoes.scales.x.type = "category";
    opcoes.scales.y.min = 0;
    opcoes.scales.y.max = 100;
    opcoes.plugins.tooltip.callbacks.label = function (item) {
      return formatarPreditivo(item.parsed.y, 1) + "% livre";
    };
    criarGraficoContexto(
      "graficoComponente1",
      "vazioComponente1",
      {
        type: "bar",
        data: {
          labels: unidadesComponente.map(function (u) {
            return u.leitura.numero_serie;
          }),
          datasets: [
            {
              data: unidadesComponente.map(function (u) {
                return u.valor;
              }),
              backgroundColor: unidadesComponente.map(function (u) {
                return lotesPreditivos[u.leitura.lote].cor;
              }),
              borderRadius: 4,
            },
          ],
        },
        options: opcoes,
      },
      "",
    );
    atualizarLegendaLotes(
      "graficoComponente1",
      unidadesComponente.map(function (u) {
        return { lote: u.leitura.lote };
      }),
      false,
    );
    var resumoAnterior = document.getElementById("graficoComponente1Resumo");
    if (resumoAnterior) resumoAnterior.remove();
    document.getElementById("resumoGraficoComponente1").textContent =
      "Atenção quando há menos de 20% livre. Unidades ordenadas pela menor folga.";
  } else {
    var ram = tipo === "ram";
    var pontos = ram
      ? mediaObservacoesComponente(observacoes, "uptime", "valor")
      : observacoes.map(function (o) {
          return { x: o.auxiliar, y: o.valor, lote: o.leitura.lote };
        });
    document.getElementById("tituloGraficoComponente1").textContent = ram
      ? "Uso de RAM × uptime"
      : "Erros de rede × tráfego";
    document.getElementById("descricaoGraficoComponente1").textContent = ram
      ? "Médias por lote e faixa de 24 h de uptime · ajuste único"
      : "Taxas individuais por intervalo de coleta";
    ajuste = graficoDispersaoContexto(
      "graficoComponente1",
      "vazioComponente1",
      pontos,
      ram ? "Uptime (h)" : "Tráfego total (Mbps)",
      ram ? "Uso de RAM (%)" : "Erros por hora",
      ram ? "h" : "Mbps",
      ram ? "%" : "erros/h",
      "#6d3fc0",
    );
    document.getElementById("resumoGraficoComponente1").textContent = ram
      ? "A tendência mistura carga e tempo desde a inicialização. Não representa desgaste da memória."
      : "Taxas médias do intervalo entre coletas. Picos curtos podem não aparecer nessa média.";
  }
  document.getElementById("rotuloAjusteComponente").textContent =
    tipo === "disco" ? "Leituras de armazenamento" : "Ajuste da regressão (R²)";
  document.getElementById("ajusteComponente").textContent =
    tipo === "disco"
      ? observacoes.length
      : ajuste && ajuste.r2 !== null
        ? formatarPreditivo(ajuste.r2, 2)
        : "—";
  document.getElementById("detalheAjusteComponente").textContent =
    tipo === "disco"
      ? "Registros válidos no período selecionado"
      : "Ajuste sobre os pontos observados";
  if (tipo === "ram") {
    document.getElementById("tituloGraficoComponente2").textContent =
      "Uso de RAM × processos ativos";
    document.getElementById("descricaoGraficoComponente2").textContent =
      "Consumo de memória e quantidade de processos na mesma coleta";
    graficoDispersaoContexto(
      "graficoComponente2",
      "vazioComponente2",
      observacoes.map(function (o) {
        return {
          x: o.leitura.processos_ativos,
          y: o.valor,
          lote: o.leitura.lote,
        };
      }),
      "Processos ativos",
      "Uso de RAM (%)",
      "processos",
      "%",
      "#169b80",
    );
    document.getElementById("resumoGraficoComponente2").textContent =
      "A quantidade de processos contextualiza o consumo; não identifica qual processo ocupa a memória.";
  } else {
    document.getElementById("tituloGraficoComponente2").textContent =
      tipo === "disco" ? "Histórico de espaço livre" : "Histórico de tráfego";
    document.getElementById("descricaoGraficoComponente2").textContent =
      "Média por lote e horário de coleta · Brasília";
    var serie = mediaObservacoesComponente(
      observacoes,
      "horario",
      tipo === "disco" ? "valor" : "auxiliar",
    );
    var unidade = tipo === "disco" ? "%" : "Mbps";
    var opcoesHistorico = opcoesContexto(
      "Data da coleta",
      tipo === "disco" ? "Espaço livre (%)" : "Tráfego total (Mbps)",
      "",
      unidade,
    );
    opcoesHistorico.scales.x.ticks.callback = function (valor) {
      return formatarDataContexto(valor, false);
    };
    opcoesHistorico.scales.y.min = 0;
    if (tipo === "disco") opcoesHistorico.scales.y.max = 100;
    opcoesHistorico.plugins.tooltip.callbacks.label = function (item) {
      return (
        item.dataset.label +
        " · " +
        formatarDataContexto(item.parsed.x, true) +
        " · " +
        formatarPreditivo(item.parsed.y, 2) +
        " " +
        unidade
      );
    };
    var seriesLotes = criarPontosPorLote(serie);
    for (var i = 0; i < seriesLotes.length; i++) {
      seriesLotes[i].borderWidth = 2;
      seriesLotes[i].showLine = true;
    }
    atualizarLegendaLotes("graficoComponente2", serie, false);
    var resumoAnterior = document.getElementById("graficoComponente2Resumo");
    if (resumoAnterior) resumoAnterior.remove();
    criarGraficoContexto(
      "graficoComponente2",
      "vazioComponente2",
      {
        type: "line",
        data: {
          datasets: seriesLotes,
        },
        options: opcoesHistorico,
      },
      serie.length ? "" : "Sem intervalos válidos no recorte.",
    );
    document.getElementById("resumoGraficoComponente2").textContent =
      tipo === "disco"
        ? "Evolução por data, incluindo gravações e limpezas de arquivos."
        : "Tráfego calculado pela diferença dos bytes enviados e recebidos entre leituras.";
  }
}

function exportarComponente() {
  var tipo = document.getElementById("filtroComponente").value;
  var configuracao = componentesPreditivos[tipo];
  var nomeModelo = document.getElementById(
    "tituloModeloComponente",
  ).textContent;
  var linhas = [
    [
      "Dados simulados",
      "Componente",
      "Modelo",
      "Equipamento",
      "Hospital",
      "Lote",
      "Data da leitura",
      configuracao.coluna + " (" + configuracao.unidade + ")",
      configuracao.auxiliar,
      "Situação",
    ],
  ];
  unidadesComponente.forEach(function (observacao) {
    var leitura = observacao.leitura;
    linhas.push([
      "Sim",
      configuracao.nome,
      nomeModelo,
      leitura.numero_serie,
      leitura.hospital,
      lotesPreditivos[leitura.lote].numero,
      leitura.data_hora_br,
      formatarPreditivo(observacao.valor, 2),
      Number.isFinite(observacao.auxiliar)
        ? formatarPreditivo(observacao.auxiliar, 2)
        : "",
      situacaoComponente(tipo, observacao.valor).nome,
    ]);
  });
  baixarCsvAnalise(linhas);
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("exportarComponente").onclick =
    exportarAnalisePreditiva;
});
