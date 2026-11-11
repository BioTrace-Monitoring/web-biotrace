// Cenários de apresentação. Relatórios técnicos e custos são fontes planejadas.
var referenciaEngenharia = new Date("2026-11-11T12:00:00-03:00").getTime();
var criteriosEngenharia = [
  {
    id: "termico",
    nome: "Temperatura",
    origem: "Python · sensor interno da CPU",
    regra:
      "Nenhuma leitura do ensaio acima do limite térmico configurado para o equipamento.",
  },
  {
    id: "recursos",
    nome: "Recursos",
    origem: "Python · CPU, RAM e disco",
    regra:
      "CPU abaixo de 95%, RAM abaixo de 90% e pelo menos 20% de espaço livre durante o protocolo.",
  },
  {
    id: "estabilidade",
    nome: "Estabilidade",
    origem: "Python · uptime e contadores de rede",
    regra:
      "Sem reinício inesperado registrado no ensaio e sem aumento de erros de rede entre coletas.",
  },
  {
    id: "layout",
    nome: "Layout",
    origem: "Relatório de revisão técnica da placa",
    regra:
      "Checklist de revisão da placa concluído, com evidência e responsável.",
  },
  {
    id: "compatibilidade",
    nome: "Compatibilidade",
    origem: "Relatório de teste de integração",
    regra:
      "Combinações previstas de hardware, firmware e periféricos aprovadas no protocolo.",
  },
  {
    id: "funcionamento",
    nome: "Funcionamento",
    origem: "Relatório de ensaio funcional",
    regra: "Cenários funcionais previstos no protocolo executados e aprovados.",
  },
];
var lotesEngenharia = [
  {
    id: "LT-001",
    projeto: "ECG-12",
    revisao: "A",
    protocolo: "VAL-ECG-01",
    cor: "#dc535e",
    limite: 85,
    base: 61,
    inclinacao: 0.72,
    unidades: 6,
    semColeta: 0,
    relatorios: {
      layout: {
        estado: "falha",
        evidencia:
          "REV-014 · espaçamento e posicionamento do dissipador precisam de revisão.",
        acao: "Revisar o posicionamento do dissipador e anexar o novo checklist de layout.",
        responsavel: "Engenharia de hardware",
        prazo: "14/11/2026",
        custo: 12000,
        dias: 5,
      },
      compatibilidade: {
        estado: "falha",
        evidencia:
          "INT-021 · falha de reconhecimento do periférico no firmware de teste.",
        acao: "Reexecutar a integração após ajuste do firmware e registrar o resultado.",
        responsavel: "Equipe de integração",
        prazo: "13/11/2026",
        custo: 3000,
        dias: 2,
      },
      funcionamento: {
        estado: "ok",
        evidencia: "FUN-011 · cenários funcionais executados sem reprovação.",
      },
    },
  },
  {
    id: "LT-002",
    projeto: "ECG-12",
    revisao: "B",
    protocolo: "VAL-ECG-01",
    cor: "#169b80",
    limite: 85,
    base: 53,
    inclinacao: 0.15,
    unidades: 6,
    semColeta: 0,
    relatorios: {
      layout: {
        estado: "ok",
        evidencia:
          "REV-019 · checklist da placa com dissipador reposicionado concluído.",
      },
      compatibilidade: {
        estado: "ok",
        evidencia:
          "INT-026 · combinações de firmware e periféricos previstas no protocolo aprovadas.",
      },
      funcionamento: {
        estado: "ok",
        evidencia: "FUN-018 · cenários funcionais executados e aprovados.",
      },
    },
  },
  {
    id: "LT-003",
    projeto: "BPAP",
    revisao: "A",
    protocolo: "VAL-BPAP-02",
    cor: "#6d3fc0",
    limite: 80,
    base: 48,
    inclinacao: 0.21,
    unidades: 6,
    semColeta: 2,
    relatorios: {
      layout: {
        estado: "ok",
        evidencia: "REV-022 · checklist da revisão da placa concluído.",
      },
      compatibilidade: {
        estado: "pendente",
        evidencia: "INT-029 · teste com periféricos ainda sem conclusão.",
        acao: "Concluir o protocolo de integração e anexar o parecer.",
        responsavel: "Equipe de integração",
        prazo: "16/11/2026",
        custo: null,
        dias: null,
      },
      funcionamento: {
        estado: "pendente",
        evidencia: "FUN-020 · cenários de operação contínua aguardam registro.",
        acao: "Executar os cenários funcionais pendentes e registrar o resultado.",
        responsavel: "Equipe de validação",
        prazo: "17/11/2026",
        custo: null,
        dias: null,
      },
    },
  },
];
var leiturasEngenharia = criarTelemetriaEngenharia();
var resultadosEngenharia = [];
var graficosEngenharia = {};

function criarTelemetriaEngenharia() {
  var dados = [];
  var oscilacoes = [0, 3, -2, 4, -3, 2, -1];
  lotesEngenharia.forEach(function (lote, indice) {
    [28, 21, 14, 7, 0].forEach(function (dias) {
      for (var unidade = 0; unidade < lote.unidades; unidade++) {
        if (dias === 0 && unidade >= lote.unidades - lote.semColeta) continue;
        for (var ponto = 0; ponto <= 6; ponto++) {
          var uptime = ponto * 4;
          var temperatura =
            lote.base +
            lote.inclinacao * uptime +
            oscilacoes[(ponto + indice) % 7] * (1 + indice * 0.6) +
            unidade * 0.3;
          dados.push({
            ambiente: "ensaio",
            lote: lote.id,
            serie: lote.id + "-" + (unidade + 1),
            instante:
              referenciaEngenharia - dias * 86400000 - (24 - uptime) * 3600000,
            uptime: uptime,
            temperatura: temperatura,
            cpu: 40 + ponto * 5 + unidade,
            ram: 48 + ponto * (indice === 0 ? 7 : 3) + unidade,
            discoLivre: 42 - ponto - unidade,
            erros: indice === 0 && ponto > 3 ? 2 : 0,
            reinicio: indice === 0 && unidade === 0 && ponto === 3,
            hospital:
              unidade < 3
                ? ["São Lucas", "Vida", "Santa Clara"][unidade]
                : null,
          });
        }
      }
    });
  });
  var campo = dados
    .filter(function (l) {
      return l.hospital;
    })
    .map(function (l) {
      return Object.assign({}, l, {
        ambiente: "campo",
        temperatura: l.temperatura + (l.lote === "LT-001" ? 3 : 1),
        ram: l.ram + 2,
      });
    });
  return dados.concat(campo);
}
function numeroEngenharia(valor, casas) {
  return Number(valor).toLocaleString("pt-BR", {
    minimumFractionDigits: casas || 0,
    maximumFractionDigits: casas || 0,
  });
}
function regressaoEngenharia(pontos) {
  if (pontos.length < 4) return null;
  var x =
    pontos.reduce(function (s, p) {
      return s + p.x;
    }, 0) / pontos.length;
  var y =
    pontos.reduce(function (s, p) {
      return s + p.y;
    }, 0) / pontos.length;
  var xx = 0,
    yy = 0,
    xy = 0;
  pontos.forEach(function (p) {
    xx += Math.pow(p.x - x, 2);
    yy += Math.pow(p.y - y, 2);
    xy += (p.x - x) * (p.y - y);
  });
  if (!xx || !yy) return null;
  var a = xy / xx;
  return { a: a, b: y - a * x, r2: Math.min(1, (xy * xy) / (xx * yy)) };
}
function analisarEngenharia(lote, dias) {
  var leituras = leiturasEngenharia.filter(function (leitura) {
    return (
      leitura.ambiente === "ensaio" &&
      leitura.lote === lote.id &&
      leitura.instante >= referenciaEngenharia - dias * 86400000 &&
      leitura.instante <= referenciaEngenharia
    );
  });
  var ultimas = {};
  leituras.forEach(function (leitura) {
    if (
      !ultimas[leitura.serie] ||
      ultimas[leitura.serie].instante < leitura.instante
    )
      ultimas[leitura.serie] = leitura;
  });
  var recentes = Object.values(ultimas).filter(function (l) {
    return l.instante >= referenciaEngenharia - 24 * 3600000;
  });
  var completa = recentes.length === lote.unidades;
  var estados = {};
  estados.termico = leituras.some(function (l) {
    return l.temperatura >= lote.limite;
  })
    ? "falha"
    : completa
      ? "ok"
      : "sem-dados";
  estados.recursos = leituras.some(function (l) {
    return l.cpu >= 95 || l.ram >= 90 || l.discoLivre < 20;
  })
    ? "falha"
    : completa
      ? "ok"
      : "sem-dados";
  estados.estabilidade = leituras.some(function (l) {
    return l.reinicio || l.erros > 0;
  })
    ? "falha"
    : completa
      ? "ok"
      : "sem-dados";
  Object.keys(lote.relatorios).forEach(function (id) {
    estados[id] = lote.relatorios[id].estado;
  });
  var porUptime = {};
  leituras.forEach(function (l) {
    if (!porUptime[l.uptime]) porUptime[l.uptime] = [];
    porUptime[l.uptime].push(l.temperatura);
  });
  var pontos = Object.keys(porUptime)
    .map(function (uptime) {
      var valores = porUptime[uptime];
      return {
        x: Number(uptime),
        y:
          valores.reduce(function (a, b) {
            return a + b;
          }, 0) / valores.length,
      };
    })
    .sort(function (a, b) {
      return a.x - b.x;
    });
  var ajuste = regressaoEngenharia(pontos);
  var fim = pontos.length ? pontos[pontos.length - 1].x : 0;
  var projecao = null;
  if (completa && ajuste && ajuste.a > 0 && ajuste.r2 >= 0.5) {
    var horas = (lote.limite - ajuste.b) / ajuste.a - fim;
    if (horas >= 0 && horas <= 24) projecao = horas;
  }
  var falhas = Object.values(estados).filter(function (e) {
    return e === "falha";
  }).length;
  var pendentes = Object.values(estados).filter(function (e) {
    return e === "pendente" || e === "sem-dados";
  }).length;
  var campo = {};
  leiturasEngenharia
    .filter(function (l) {
      return (
        l.ambiente === "campo" &&
        l.lote === lote.id &&
        Boolean(l.hospital) &&
        l.instante >= referenciaEngenharia - dias * 86400000 &&
        l.instante <= referenciaEngenharia
      );
    })
    .forEach(function (l) {
      if (!campo[l.serie]) campo[l.serie] = { primeira: l, ultima: l };
      if (l.instante < campo[l.serie].primeira.instante)
        campo[l.serie].primeira = l;
      if (l.instante > campo[l.serie].ultima.instante)
        campo[l.serie].ultima = l;
    });
  return {
    lote: lote,
    leituras: leituras,
    recentes: recentes,
    estados: estados,
    falhas: falhas,
    pendentes: pendentes,
    pontos: pontos,
    ajuste: ajuste,
    fim: fim,
    projecao: projecao,
    campo: Object.values(campo),
  };
}
function seloEngenharia(estado) {
  var textos = {
    ok: "✓ Atendido",
    falha: "! Corrigir",
    pendente: "◷ Pendente",
    "sem-dados": "— Sem coleta",
  };
  return '<span class="estado ' + estado + '">' + textos[estado] + "</span>";
}
function decisaoEngenharia(r) {
  if (r.falhas) return "Corrigir antes de avançar";
  if (r.pendentes) return "Concluir evidências";
  if (r.projecao !== null) return "Investigar tendência térmica";
  return "Pronto para revisão técnica";
}
function preencherLotesEngenharia() {
  var projeto = document.getElementById("filtroProjeto").value;
  var select = document.getElementById("filtroLoteEngenharia");
  select.replaceChildren(new Option("Todos os lotes", "todos"));
  lotesEngenharia
    .filter(function (l) {
      return projeto === "todos" || l.projeto === projeto;
    })
    .forEach(function (l) {
      select.add(new Option(l.id + " · revisão " + l.revisao, l.id));
    });
}
function atualizarEngenharia() {
  var projeto = document.getElementById("filtroProjeto").value;
  var lote = document.getElementById("filtroLoteEngenharia").value;
  var dias = Number(document.getElementById("filtroJanela").value);
  resultadosEngenharia = lotesEngenharia
    .filter(function (l) {
      return (
        (projeto === "todos" || l.projeto === projeto) &&
        (lote === "todos" || l.id === lote)
      );
    })
    .map(function (l) {
      return analisarEngenharia(l, dias);
    })
    .sort(function (a, b) {
      return b.falhas - a.falhas || b.pendentes - a.pendentes;
    });
  var total = resultadosEngenharia.reduce(function (s, r) {
    return s + r.lote.unidades;
  }, 0);
  var recentes = resultadosEngenharia.reduce(function (s, r) {
    return s + r.recentes.length;
  }, 0);
  document.getElementById("escopoEngenharia").textContent =
    resultadosEngenharia.length +
    " lotes · " +
    total +
    " equipamentos de ensaio · histórico de " +
    dias +
    " dias. Relatórios técnicos mostram a situação registrada de cada revisão.";
  document.getElementById("kpiValidados").textContent =
    resultadosEngenharia.filter(function (r) {
      return !r.falhas && !r.pendentes && r.projecao === null;
    }).length +
    " de " +
    resultadosEngenharia.length;
  document.getElementById("kpiCorrecoes").textContent =
    resultadosEngenharia.reduce(function (s, r) {
      return s + r.falhas;
    }, 0);
  document.getElementById("detalheCorrecoes").textContent =
    "Critérios reprovados em " +
    resultadosEngenharia.filter(function (r) {
      return r.falhas;
    }).length +
    " lotes";
  document.getElementById("kpiPendentes").textContent =
    resultadosEngenharia.reduce(function (s, r) {
      return s + r.pendentes;
    }, 0);
  document.getElementById("kpiCobertura").textContent =
    recentes + " de " + total;
  document.getElementById("detalheCobertura").textContent =
    "Coleta nas últimas 24 h · " +
    (total ? numeroEngenharia((recentes / total) * 100) : "0") +
    "% de cobertura";
  var principal = resultadosEngenharia[0];
  document.getElementById("tituloPrioridade").textContent = principal
    ? principal.lote.projeto +
      " · " +
      principal.lote.id +
      " · revisão " +
      principal.lote.revisao
    : "Nenhum lote neste recorte";
  document.getElementById("acaoPrioridade").textContent = principal
    ? decisaoEngenharia(principal) +
      ". " +
      (principal.falhas
        ? "Confira as reprovações e seus responsáveis antes de fabricar o próximo lote."
        : principal.pendentes
          ? "Conclua os relatórios pendentes e recupere as coletas ausentes."
          : "Revise as evidências e confirme os critérios antes de decidir sobre a próxima etapa.")
    : "Ajuste os filtros para acompanhar os equipamentos.";
  document.getElementById("abrirPrioridade").disabled = !principal;
  document.getElementById("abrirPrioridade").onclick = function () {
    if (principal) abrirEvidenciasEngenharia(principal.lote.id);
  };
  document.getElementById("matrizValidacao").innerHTML =
    resultadosEngenharia
      .map(function (r) {
        return (
          "<tr><td><strong>" +
          r.lote.projeto +
          "</strong><small>" +
          r.lote.id +
          " · revisão " +
          r.lote.revisao +
          "</small></td>" +
          criteriosEngenharia
            .map(function (c) {
              return "<td>" + seloEngenharia(r.estados[c.id]) + "</td>";
            })
            .join("") +
          "<td>" +
          decisaoEngenharia(r) +
          '</td><td><button class="botao secundario" data-evidencia="' +
          r.lote.id +
          '" type="button">Ver lote</button></td></tr>'
        );
      })
      .join("") || '<tr><td colspan="9">Nenhum lote encontrado.</td></tr>';
  document.querySelectorAll("[data-evidencia]").forEach(function (botao) {
    botao.onclick = function () {
      abrirEvidenciasEngenharia(this.dataset.evidencia);
    };
  });
  atualizarGraficosEngenharia();
  atualizarImpactoEngenharia();
}
function emAtencaoCampo(l, limite) {
  return (
    l.temperatura >= limite - 5 ||
    l.cpu >= 95 ||
    l.ram >= 90 ||
    l.discoLivre < 20 ||
    l.erros > 0
  );
}
function criarGraficoEngenharia(id, configuracao, erroId) {
  if (graficosEngenharia[id]) graficosEngenharia[id].destroy();
  var disponivel =
    typeof Chart !== "undefined" &&
    resultadosEngenharia.some(function (r) {
      return r.leituras.length;
    });
  document.getElementById(id).hidden = !disponivel;
  document.getElementById(erroId).hidden = disponivel;
  document.getElementById(erroId).textContent =
    "Gráfico indisponível. Consulte os resultados nos resumos e nas evidências de cada lote.";
  if (disponivel)
    graficosEngenharia[id] = new Chart(
      document.getElementById(id),
      configuracao,
    );
}
function atualizarGraficosEngenharia() {
  var series = [];
  resultadosEngenharia.forEach(function (r) {
    var nome = r.lote.id + " · " + r.lote.projeto + " rev. " + r.lote.revisao;
    series.push({
      label: nome,
      data: r.pontos,
      backgroundColor: r.lote.cor,
      borderColor: r.lote.cor,
      pointRadius: 3,
    });
    if (!r.ajuste || !r.pontos.length) return;
    var inicio = r.pontos[0].x;
    series.push({
      label: "Ajuste · " + nome,
      data: [
        { x: inicio, y: r.ajuste.b + r.ajuste.a * inicio },
        { x: r.fim, y: r.ajuste.b + r.ajuste.a * r.fim },
      ],
      borderColor: r.lote.cor,
      pointRadius: 0,
      showLine: true,
      auxiliar: true,
    });
    if (r.projecao !== null)
      series.push({
        label: "Projeção · " + nome,
        data: [
          { x: r.fim, y: r.ajuste.b + r.ajuste.a * r.fim },
          { x: r.fim + 24, y: r.ajuste.b + r.ajuste.a * (r.fim + 24) },
        ],
        borderColor: r.lote.cor,
        pointRadius: 0,
        showLine: true,
        borderDash: [5, 5],
        auxiliar: true,
      });
  });
  Array.from(
    new Set(
      resultadosEngenharia.map(function (r) {
        return r.lote.limite;
      }),
    ),
  ).forEach(function (limite) {
    series.push({
      label: "Limite " + limite + " °C",
      data: [
        { x: 0, y: limite },
        { x: 48, y: limite },
      ],
      borderColor: "#9d919f",
      borderWidth: 1,
      borderDash: [2, 4],
      pointRadius: 0,
      showLine: true,
      auxiliar: true,
    });
  });
  criarGraficoEngenharia(
    "graficoEngenhariaTermico",
    {
      type: "scatter",
      data: { datasets: series },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: {
            labels: {
              boxWidth: 8,
              font: { size: 10 },
              filter: function (item, dados) {
                return !dados.datasets[item.datasetIndex].auxiliar;
              },
            },
          },
          tooltip: {
            callbacks: {
              label: function (item) {
                return (
                  item.dataset.label +
                  " · " +
                  numeroEngenharia(item.parsed.x, 1) +
                  " h · " +
                  numeroEngenharia(item.parsed.y, 1) +
                  " °C"
                );
              },
            },
          },
        },
        scales: {
          x: {
            type: "linear",
            min: 0,
            title: { display: true, text: "Operação contínua (h)" },
          },
          y: { title: { display: true, text: "Temperatura da CPU (°C)" } },
        },
      },
    },
    "erroTermico",
  );
  document.getElementById("resumoProjecoes").innerHTML = resultadosEngenharia
    .map(function (r) {
      var estado =
        r.projecao !== null
          ? "Limite estimado em ≈ " +
            numeroEngenharia(r.projecao, 1) +
            " h adicionais"
          : "Projeção sem cruzamento elegível nesta janela";
      if (
        !r.ajuste ||
        !r.recentes.length ||
        r.recentes.length < r.lote.unidades ||
        (r.ajuste && r.ajuste.r2 < 0.5)
      )
        estado = "Projeção indisponível · confira cobertura e ajuste";
      return (
        '<div class="projecao"><strong>' +
        r.lote.id +
        " · " +
        estado +
        "</strong><p>Limite " +
        r.lote.limite +
        " °C · R² " +
        (r.ajuste ? numeroEngenharia(r.ajuste.r2, 2) : "—") +
        " · " +
        r.pontos.length +
        " faixas observadas · " +
        r.leituras.length +
        " leituras</p></div>"
      );
    })
    .join("");
  var campo = resultadosEngenharia.map(function (r) {
    var total = r.campo.length;
    return {
      nome: r.lote.id,
      total: total,
      inicio: total
        ? (r.campo.filter(function (u) {
            return emAtencaoCampo(u.primeira, r.lote.limite);
          }).length /
            total) *
          100
        : null,
      fim: total
        ? (r.campo.filter(function (u) {
            return emAtencaoCampo(u.ultima, r.lote.limite);
          }).length /
            total) *
          100
        : null,
    };
  });
  criarGraficoEngenharia(
    "graficoEngenhariaCampo",
    {
      type: "bar",
      data: {
        labels: campo.map(function (c) {
          return c.nome;
        }),
        datasets: [
          {
            label: "Início do período",
            data: campo.map(function (c) {
              return c.inicio;
            }),
            backgroundColor: "#bba5df",
            borderRadius: 3,
          },
          {
            label: "Final do período",
            data: campo.map(function (c) {
              return c.fim;
            }),
            backgroundColor: "#6d3fc0",
            borderRadius: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: { legend: { labels: { boxWidth: 8, font: { size: 10 } } } },
        scales: {
          y: {
            min: 0,
            max: 100,
            title: { display: true, text: "Equipamentos em atenção (%)" },
          },
        },
      },
    },
    "erroCampo",
  );
  document.getElementById("resumoCampo").textContent = campo
    .map(function (c) {
      return (
        c.nome +
        " · " +
        (c.total
          ? numeroEngenharia(c.inicio) +
            "% no início e " +
            numeroEngenharia(c.fim) +
            "% no final (" +
            c.total +
            " equipamentos)"
          : "sem unidades alocadas com dados")
      );
    })
    .join(". ");
}
function atualizarImpactoEngenharia() {
  var pendencias = [];
  resultadosEngenharia.forEach(function (r) {
    criteriosEngenharia.forEach(function (c) {
      var estado = r.estados[c.id];
      if (estado === "ok") return;
      var relatorio = r.lote.relatorios[c.id];
      pendencias.push({
        lote: r.lote.id,
        criterio: c.nome,
        acao: relatorio
          ? relatorio.acao
          : estado === "sem-dados"
            ? "Recuperar as coletas e repetir a avaliação do protocolo."
            : "Investigar o desvio e repetir o ensaio após a correção.",
        responsavel: relatorio ? relatorio.responsavel : "Equipe de validação",
        prazo: relatorio ? relatorio.prazo : "A definir",
        custo: relatorio ? relatorio.custo : null,
        dias: relatorio ? relatorio.dias : null,
      });
    });
  });
  var orcadas = pendencias.filter(function (p) {
    return Number.isFinite(p.custo);
  });
  document.getElementById("custoRetrabalho").textContent = orcadas.length
    ? orcadas
        .reduce(function (s, p) {
          return s + p.custo;
        }, 0)
        .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "Sem orçamento";
  document.getElementById("prazoRetrabalho").textContent = orcadas.length
    ? Math.max.apply(
        null,
        orcadas.map(function (p) {
          return p.dias;
        }),
      ) + " dias úteis"
    : "A estimar";
  document.getElementById("detalheImpacto").textContent =
    orcadas.length +
    " de " +
    pendencias.length +
    " pendências possuem estimativa. " +
    (pendencias.length - orcadas.length) +
    " aguardam avaliação de custo e prazo.";
  document.getElementById("pendenciasEngenharia").innerHTML =
    pendencias
      .map(function (p) {
        return (
          '<div class="pendencia"><div><strong>' +
          p.lote +
          " · " +
          p.criterio +
          "</strong><p>" +
          p.acao +
          '</p></div><div class="prazo">' +
          p.responsavel +
          "<p>Prazo " +
          p.prazo +
          "</p></div></div>"
        );
      })
      .join("") ||
    "<p>Todos os critérios possuem evidências. O próximo passo é a revisão do engenheiro.</p>";
  var projetos = Array.from(
    new Set(
      resultadosEngenharia.map(function (r) {
        return r.lote.projeto;
      }),
    ),
  );
  document.getElementById("comparacaoRevisoes").innerHTML = projetos
    .map(function (projeto) {
      var revisoes = resultadosEngenharia.filter(function (r) {
        return r.lote.projeto === projeto;
      });
      if (revisoes.length < 2)
        return (
          "<p>" +
          projeto +
          " · selecione todos os lotes do equipamento para comparar revisões.</p>"
        );
      return (
        "<h3>" +
        projeto +
        "</h3>" +
        revisoes
          .map(function (r) {
            var pico = r.leituras.length
              ? numeroEngenharia(
                  Math.max.apply(
                    null,
                    r.leituras.map(function (l) {
                      return l.temperatura;
                    }),
                  ),
                  1,
                ) + " °C"
              : "Sem dados";
            return (
              '<div class="comparacao-linha"><span>Revisão ' +
              r.lote.revisao +
              "<p>" +
              r.lote.protocolo +
              " · " +
              r.lote.unidades +
              " unidades</p></span><strong>" +
              pico +
              " de pico<p>" +
              r.falhas +
              " critérios reprovados</p></strong></div>"
            );
          })
          .join("")
      );
    })
    .join("");
}
function abrirEvidenciasEngenharia(id) {
  var r = resultadosEngenharia.find(function (resultado) {
    return resultado.lote.id === id;
  });
  if (!r) return;
  document.getElementById("tituloEvidencias").textContent =
    r.lote.projeto + " · " + id + " · revisão " + r.lote.revisao;
  document.getElementById("conteudoEvidencias").innerHTML =
    "<p>Protocolo " +
    r.lote.protocolo +
    " · evidências simuladas · " +
    decisaoEngenharia(r) +
    "</p>" +
    criteriosEngenharia
      .map(function (c) {
        var relatorio = r.lote.relatorios[c.id];
        var resultado = relatorio
          ? relatorio.evidencia
          : c.id === "termico"
            ? "Maior temperatura registrada " +
              (r.leituras.length
                ? numeroEngenharia(
                    Math.max.apply(
                      null,
                      r.leituras.map(function (l) {
                        return l.temperatura;
                      }),
                    ),
                    1,
                  ) + " °C"
                : "indisponível") +
              ". Limite " +
              r.lote.limite +
              " °C."
            : c.id === "recursos"
              ? "Maior uso de RAM " +
                (r.leituras.length
                  ? numeroEngenharia(
                      Math.max.apply(
                        null,
                        r.leituras.map(function (l) {
                          return l.ram;
                        }),
                      ),
                    ) + "%"
                  : "indisponível") +
                ". Confira também CPU e espaço livre no protocolo."
              : "Registros de reinício inesperado e erros de rede conferidos no histórico do ensaio.";
        return (
          '<div class="evidencia-item"><strong>' +
          c.nome +
          "</strong> " +
          seloEngenharia(r.estados[c.id]) +
          "<p>" +
          c.regra +
          "</p><p>" +
          resultado +
          "</p><p>Origem " +
          c.origem +
          "</p></div>"
        );
      })
      .join("") +
    "<h3>Cobertura da telemetria</h3><p>" +
    r.recentes.length +
    " de " +
    r.lote.unidades +
    " equipamentos com coleta nas últimas 24 h. Equipamentos sem coleta recente impedem concluir os critérios automáticos.</p><h3>Próximo passo</h3><p>O engenheiro confere os relatórios e as condições de ensaio antes de decidir sobre a fabricação. Os resultados desta demonstração são simulados.</p>";
  document.getElementById("evidenciasEngenharia").showModal();
}
function exportarEngenharia() {
  var linhas = [
    [
      "Dados simulados",
      "Equipamento",
      "Lote",
      "Revisão",
      "Histórico (dias)",
      "Coletas recentes",
      "Unidades previstas",
    ].concat(
      criteriosEngenharia.map(function (c) {
        return c.nome;
      }),
      ["Decisão sugerida", "R²", "Projeção até limite (h)"],
    ),
  ];
  resultadosEngenharia.forEach(function (r) {
    linhas.push(
      [
        "Sim",
        r.lote.projeto,
        r.lote.id,
        r.lote.revisao,
        document.getElementById("filtroJanela").value,
        r.recentes.length,
        r.lote.unidades,
      ].concat(
        criteriosEngenharia.map(function (c) {
          return r.estados[c.id];
        }),
        [
          decisaoEngenharia(r),
          r.ajuste ? numeroEngenharia(r.ajuste.r2, 3) : "",
          r.projecao === null
            ? "Indisponível ou sem cruzamento elegível"
            : numeroEngenharia(r.projecao, 1),
        ],
      ),
    );
  });
  var csv =
    "\uFEFF" +
    linhas
      .map(function (linha) {
        return linha
          .map(function (v) {
            return '"' + String(v).replaceAll('"', '""') + '"';
          })
          .join(";");
      })
      .join("\r\n");
  var url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
  var link = document.createElement("a");
  link.href = url;
  link.download = "biotrace-validacao-demonstrativa.csv";
  link.click();
  setTimeout(function () {
    URL.revokeObjectURL(url);
  }, 1000);
}
document.addEventListener("DOMContentLoaded", function () {
  preencherLotesEngenharia();
  document.getElementById("filtroProjeto").onchange = function () {
    preencherLotesEngenharia();
    atualizarEngenharia();
  };
  document.getElementById("filtroLoteEngenharia").onchange =
    atualizarEngenharia;
  document.getElementById("filtroJanela").onchange = atualizarEngenharia;
  document.getElementById("limparEngenharia").onclick = function () {
    document.getElementById("filtroProjeto").value = "todos";
    document.getElementById("filtroJanela").value = "30";
    preencherLotesEngenharia();
    atualizarEngenharia();
  };
  document.getElementById("fecharEvidencias").onclick = function () {
    document.getElementById("evidenciasEngenharia").close();
  };
  document.getElementById("exportarEngenharia").onclick = exportarEngenharia;
  document.getElementById("criteriosEngenharia").innerHTML = criteriosEngenharia
    .map(function (c) {
      return (
        "<h3>" + c.nome + "</h3><p>" + c.regra + " Origem " + c.origem + ".</p>"
      );
    })
    .join("");
  atualizarEngenharia();
});
