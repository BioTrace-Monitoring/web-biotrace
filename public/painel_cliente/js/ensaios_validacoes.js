var protocolosEnsaios = [
  {
    id: "VAL-ECG-01",
    versao: 1,
    projeto: "ECG-12",
    nome: "Operação contínua e integração",
    responsavel: "Luís Phelipe",
    procedimento:
      "Operar seis unidades por 24 horas sob carga padronizada. Conferir periféricos e executar o checklist de layout.",
    temperatura: 85,
    ram: 90,
    cpu: 95,
    disco: 20,
    duracao: 24,
  },
  {
    id: "VAL-BPAP-02",
    versao: 1,
    projeto: "BPAP",
    nome: "Validação funcional do BPAP",
    responsavel: "Mariana Costa",
    procedimento:
      "Executar cenários funcionais e operação contínua por 24 horas. Registrar a integração e a revisão de placa.",
    temperatura: 80,
    ram: 90,
    cpu: 95,
    disco: 20,
    duracao: 24,
  },
];
var relatoriosEnsaios = [
  {
    id: "REL-001",
    protocolo: "VAL-ECG-01",
    versao: 1,
    projeto: "ECG-12",
    lote: "LT-001",
    revisao: "A",
    responsavel: "Luís Phelipe",
    inicio: "2026-11-09T08:00",
    fim: "2026-11-10T08:00",
    series: "ECG-001 a ECG-006",
    temperatura: 78.9,
    ram: 95,
    cpu: 81,
    disco: 31,
    estabilidade: "Reprovado",
    layout: "Reprovado",
    compatibilidade: "Reprovado",
    funcionamento: "Aprovado",
    evidencia: "REV-014 e INT-021 · referência demonstrativa",
    observacoes:
      "Dissipador precisa ser reposicionado. Periférico apresentou falha de reconhecimento. Houve reinício inesperado durante o ensaio.",
  },
  {
    id: "REL-002",
    protocolo: "VAL-ECG-01",
    versao: 1,
    projeto: "ECG-12",
    lote: "LT-002",
    revisao: "B",
    responsavel: "Camila Santos",
    inicio: "2026-11-10T08:00",
    fim: "2026-11-11T08:00",
    series: "ECG-007 a ECG-012",
    temperatura: 62.1,
    ram: 71,
    cpu: 76,
    disco: 34,
    estabilidade: "Aprovado",
    layout: "Aprovado",
    compatibilidade: "Aprovado",
    funcionamento: "Aprovado",
    evidencia: "REV-019, INT-026 e FUN-018 · referências demonstrativas",
    observacoes:
      "Revisão B testada com o mesmo protocolo. Dissipador reposicionado e integração corrigida.",
  },
  {
    id: "REL-003",
    protocolo: "VAL-BPAP-02",
    versao: 1,
    projeto: "BPAP",
    lote: "LT-003",
    revisao: "A",
    responsavel: "Mariana Costa",
    inicio: "2026-11-10T09:00",
    fim: "2026-11-11T09:00",
    series: "BPAP-001 a BPAP-006",
    temperatura: 64.2,
    ram: 78,
    cpu: 73,
    disco: 28,
    estabilidade: "Não executado",
    layout: "Aprovado",
    compatibilidade: "Não executado",
    funcionamento: "Não executado",
    evidencia: "REV-022 · referência demonstrativa",
    observacoes:
      "Relatório parcial. Recuperar coletas de duas unidades e concluir os cenários de integração e funcionamento.",
  },
];
var correcoesEnsaios = [
  {
    id: "AC-001",
    relatorio: "REL-001",
    projeto: "ECG-12",
    criterio: "Layout",
    descricao: "Reposicionar dissipador e repetir revisão da placa.",
    responsavel: "Engenharia de hardware",
    prazo: "2026-11-14",
    situacao: "Em andamento",
    orcado: "Sim",
    horas: 40,
    valorHora: 100,
    quantidade: 10,
    valorMaterial: 500,
    servicos: 1000,
    horasTeste: 20,
    dias: 5,
  },
  {
    id: "AC-002",
    relatorio: "REL-001",
    projeto: "ECG-12",
    criterio: "Compatibilidade",
    descricao:
      "Ajustar firmware e repetir teste de reconhecimento do periférico.",
    responsavel: "Equipe de integração",
    prazo: "2026-11-13",
    situacao: "Aguardando novo ensaio",
    orcado: "Sim",
    horas: 20,
    valorHora: 100,
    quantidade: 0,
    valorMaterial: 0,
    servicos: 0,
    horasTeste: 10,
    dias: 2,
  },
  {
    id: "AC-003",
    relatorio: "REL-003",
    projeto: "BPAP",
    criterio: "Funcionamento",
    descricao: "Executar os cenários funcionais pendentes e anexar evidências.",
    responsavel: "Equipe de validação",
    prazo: "2026-11-17",
    situacao: "Aberta",
    orcado: "Não",
    horas: 0,
    valorHora: 0,
    quantidade: 0,
    valorMaterial: 0,
    servicos: 0,
    horasTeste: 0,
    dias: 0,
  },
];
var abaEnsaios = "protocolos";
var tipoCadastroEnsaios = "protocolos";
function escaparEnsaio(v) {
  return String(v ?? "").replace(/[&<>"']/g, function (c) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c];
  });
}
function moedaEnsaio(v) {
  return Number(v).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
function custoEnsaio(c) {
  return (
    (c.horas + c.horasTeste) * c.valorHora +
    c.quantidade * c.valorMaterial +
    c.servicos
  );
}
function protocoloDoRelatorio(r) {
  return protocolosEnsaios.find(function (p) {
    return p.id === r.protocolo && p.versao === r.versao;
  });
}
function resultadosRelatorio(r) {
  var p = protocoloDoRelatorio(r);
  return {
    Temperatura: r.temperatura < p.temperatura ? "Aprovado" : "Reprovado",
    Recursos:
      r.ram < p.ram && r.cpu < p.cpu && r.disco >= p.disco
        ? "Aprovado"
        : "Reprovado",
    Estabilidade: r.estabilidade,
    Layout: r.layout,
    Compatibilidade: r.compatibilidade,
    Funcionamento: r.funcionamento,
  };
}
function situacaoRelatorio(r) {
  var resultados = Object.values(resultadosRelatorio(r));
  return resultados.includes("Reprovado")
    ? "Requer correção"
    : resultados.includes("Não executado")
      ? "Parcial"
      : "Pronto para revisão";
}
function dadosAbaEnsaios() {
  return {
    protocolos: protocolosEnsaios,
    relatorios: relatoriosEnsaios,
    correcoes: correcoesEnsaios,
  }[abaEnsaios];
}
function atualizarRegistrosEnsaios() {
  document.getElementById("totalProtocolos").textContent =
    protocolosEnsaios.length;
  document.getElementById("totalRelatorios").textContent =
    relatoriosEnsaios.length;
  document.getElementById("totalCorrecoes").textContent =
    correcoesEnsaios.length;
  var orcadas = correcoesEnsaios.filter(function (c) {
    return c.orcado === "Sim";
  });
  document.getElementById("totalOrcamento").textContent = moedaEnsaio(
    orcadas.reduce(function (s, c) {
      return s + custoEnsaio(c);
    }, 0),
  );
  document.getElementById("coberturaOrcamento").textContent =
    orcadas.length +
    " de " +
    correcoesEnsaios.length +
    " ações possuem orçamento";
  var busca = document
    .getElementById("buscaRegistros")
    .value.trim()
    .toLocaleLowerCase("pt-BR");
  var projeto = document.getElementById("projetoRegistros").value;
  var dados = dadosAbaEnsaios().filter(function (r) {
    return (
      (projeto === "todos" || r.projeto === projeto) &&
      Object.values(r).join(" ").toLocaleLowerCase("pt-BR").includes(busca)
    );
  });
  document.querySelectorAll("[data-aba]").forEach(function (b) {
    var ativa = b.dataset.aba === abaEnsaios;
    b.setAttribute("aria-pressed", String(ativa));
    b.classList.toggle("secundario", !ativa);
  });
  document.getElementById("novoRegistro").textContent = {
    protocolos: "+ Cadastrar protocolo",
    relatorios: "+ Registrar ensaio",
    correcoes: "+ Registrar correção",
  }[abaEnsaios];
  document.getElementById("resumoRegistros").textContent =
    dados.length + " registros neste recorte · cenário fictício";
  document.getElementById("listaRegistros").innerHTML =
    dados
      .map(function (r) {
        var titulo =
          abaEnsaios === "protocolos"
            ? r.nome
            : abaEnsaios === "relatorios"
              ? r.lote + " · revisão " + r.revisao
              : r.criterio;
        var detalhe =
          abaEnsaios === "protocolos"
            ? r.id + " · versão " + r.versao
            : abaEnsaios === "relatorios"
              ? r.id + " · " + situacaoRelatorio(r)
              : r.id +
                " · " +
                r.situacao +
                " · " +
                (r.orcado === "Sim"
                  ? moedaEnsaio(custoEnsaio(r))
                  : "Orçamento pendente");
        return (
          '<article class="registro-ensaio"><div><h3>' +
          escaparEnsaio(titulo) +
          "</h3><p>" +
          escaparEnsaio(detalhe) +
          "</p><p>" +
          escaparEnsaio(r.projeto + " · " + r.responsavel) +
          '</p></div><button class="botao secundario" data-ver="' +
          escaparEnsaio(r.id) +
          '" type="button">Ver detalhes →</button></article>'
        );
      })
      .join("") ||
    "<p>Nenhum registro encontrado. Ajuste a busca ou o equipamento.</p>";
  document.querySelectorAll("[data-ver]").forEach(function (b) {
    b.onclick = function () {
      abrirRegistroEnsaio(this.dataset.ver);
    };
  });
}
function campoEnsaio(nome, rotulo, tipo, valor, opcoes) {
  var atributos = ' name="' + nome + '" id="cad-' + nome + '" required';
  var controle =
    tipo === "select"
      ? "<select" +
        atributos +
        ">" +
        opcoes
          .map(function (o) {
            var v = typeof o === "string" ? o : o.valor;
            var t = typeof o === "string" ? o : o.texto;
            return (
              '<option value="' +
              escaparEnsaio(v) +
              '"' +
              (String(v) === String(valor) ? " selected" : "") +
              ">" +
              escaparEnsaio(t) +
              "</option>"
            );
          })
          .join("") +
        "</select>"
      : tipo === "textarea"
        ? "<textarea" +
          atributos +
          ' rows="3" maxlength="2000">' +
          escaparEnsaio(valor) +
          "</textarea>"
        : "<input" +
          atributos +
          ' type="' +
          tipo +
          '" value="' +
          escaparEnsaio(valor) +
          '"' +
          (tipo === "number"
            ? ' min="0" max="10000000" step="0.01"'
            : ' maxlength="200"') +
          ">";
  return (
    "<label" +
    (tipo === "textarea" ? ' class="linha-inteira"' : "") +
    ">" +
    rotulo +
    controle +
    "</label>"
  );
}
function abrirCadastroEnsaio(tipo, origem) {
  tipoCadastroEnsaios = tipo;
  document.getElementById("erroCadastro").textContent = "";
  var f = campoEnsaio;
  var campos = "";
  document.getElementById("tituloCadastro").textContent = {
    protocolos: "Cadastrar protocolo",
    relatorios: "Registrar ensaio",
    correcoes: "Registrar ação de correção",
  }[tipo];
  if (tipo === "protocolos") {
    campos =
      f("projeto", "Equipamento", "select", "ECG-12", ["ECG-12", "BPAP"]) +
      f("nome", "Nome do protocolo", "text", "") +
      f("responsavel", "Responsável", "text", "") +
      f("duracao", "Duração mínima do teste (horas)", "number", 24) +
      f(
        "procedimento",
        "Procedimento, carga de trabalho e verificações manuais",
        "textarea",
        "",
      ) +
      "<fieldset><legend>Critérios automáticos de referência</legend>" +
      f("temperatura", "Temperatura máxima da CPU (°C)", "number", 85) +
      f("ram", "Uso máximo de RAM (%)", "number", 90) +
      f("cpu", "Uso máximo de CPU (%)", "number", 95) +
      f("disco", "Espaço livre mínimo (%)", "number", 20) +
      '</fieldset><p class="linha-inteira texto-apoio">Cada cadastro cria um protocolo na versão 1. Layout, compatibilidade e funcionamento serão avaliados manualmente no relatório. Os valores são referências configuráveis para a simulação.</p>';
  } else if (tipo === "relatorios") {
    campos =
      f(
        "protocolo",
        "Protocolo e versão",
        "select",
        origem || protocolosEnsaios[0].id,
        protocolosEnsaios.map(function (p) {
          return {
            valor: p.id,
            texto: p.id + " · v" + p.versao + " · " + p.projeto,
          };
        }),
      ) +
      f("lote", "Lote", "text", "") +
      f("revisao", "Revisão da placa", "text", "") +
      f("responsavel", "Responsável pelo ensaio", "text", "") +
      f(
        "inicio",
        "Início do ensaio (Brasília)",
        "datetime-local",
        "2026-11-10T08:00",
      ) +
      f(
        "fim",
        "Fim do ensaio (Brasília)",
        "datetime-local",
        "2026-11-11T08:00",
      ) +
      f("series", "Números de série participantes", "textarea", "") +
      '<fieldset><legend>Resumo da captura simulada</legend><p class="linha-inteira texto-apoio">Nesta demonstração, preencha os valores do teste. Na integração futura, eles poderão vir da ETL.</p>' +
      f("temperatura", "Pico de temperatura (°C)", "number", 65) +
      f("ram", "Maior uso de RAM (%)", "number", 75) +
      f("cpu", "Maior uso de CPU (%)", "number", 80) +
      f("disco", "Menor espaço livre (%)", "number", 35) +
      "</fieldset>";
    ["estabilidade", "layout", "compatibilidade", "funcionamento"].forEach(
      function (c) {
        campos += f(
          c,
          c[0].toUpperCase() + c.slice(1),
          "select",
          "Não executado",
          ["Não executado", "Aprovado", "Reprovado"],
        );
      },
    );
    campos +=
      f(
        "evidencia",
        "Referências das evidências (ex. REV-023, INT-030)",
        "text",
        "",
      ) +
      f("observacoes", "Resultados, condições e observações", "textarea", "");
  } else {
    var relat =
      relatoriosEnsaios.find(function (r) {
        return r.id === origem;
      }) || relatoriosEnsaios[0];
    campos =
      f(
        "relatorio",
        "Relatório de origem",
        "select",
        relat.id,
        relatoriosEnsaios.map(function (r) {
          return {
            valor: r.id,
            texto: r.id + " · " + r.projeto + " · " + r.lote,
          };
        }),
      ) +
      f(
        "criterio",
        "Critério a corrigir ou concluir",
        "select",
        "Layout",
        Object.keys(resultadosRelatorio(relat)),
      ) +
      f("descricao", "Correção proposta e evidência esperada", "textarea", "") +
      f("responsavel", "Responsável", "text", "") +
      f("prazo", "Prazo previsto", "date", "2026-11-18") +
      f("orcado", "Já existe uma estimativa?", "select", "Não", [
        "Não",
        "Sim",
      ]) +
      '<fieldset id="camposOrcamento"><legend>Composição do orçamento</legend>' +
      f("horas", "Horas de correção", "number", 0) +
      f("valorHora", "Custo por hora (R$)", "number", 0) +
      f("quantidade", "Quantidade de peças / placas", "number", 0) +
      f("valorMaterial", "Preço por peça / placa (R$)", "number", 0) +
      f("servicos", "Serviços externos (R$)", "number", 0) +
      f("horasTeste", "Horas para repetir os ensaios", "number", 0) +
      f("dias", "Duração estimada (dias úteis)", "number", 0) +
      "</fieldset>";
  }
  document.getElementById("camposCadastro").innerHTML = campos;
  document.getElementById("resumoOrcamento").hidden = tipo !== "correcoes";
  if (tipo === "correcoes") {
    document.getElementById("formCadastro").oninput = atualizarOrcamentoEnsaio;
    atualizarOrcamentoEnsaio();
  } else document.getElementById("formCadastro").oninput = null;
  document.getElementById("dialogCadastro").showModal();
}
function atualizarOrcamentoEnsaio() {
  var form = document.getElementById("formCadastro");
  var d = new FormData(form);
  var conhecido = d.get("orcado") === "Sim";
  document.getElementById("camposOrcamento").disabled = !conhecido;
  var c = {};
  [
    "horas",
    "horasTeste",
    "valorHora",
    "quantidade",
    "valorMaterial",
    "servicos",
  ].forEach(function (k) {
    c[k] = Number(d.get(k) || 0);
  });
  document.getElementById("resumoOrcamento").textContent = conhecido
    ? "Estimativa total " +
      moedaEnsaio(custoEnsaio(c)) +
      ". Fórmula: (horas de correção + horas de teste) × custo/hora + quantidade × preço unitário + serviços externos."
    : "Orçamento pendente. Esta ação ficará fora da soma financeira até receber uma estimativa.";
}
function salvarCadastroEnsaio(evento) {
  evento.preventDefault();
  var form = evento.currentTarget;
  var d = Object.fromEntries(new FormData(form));
  var erro = "";
  [
    "temperatura",
    "ram",
    "cpu",
    "disco",
    "duracao",
    "horas",
    "horasTeste",
    "valorHora",
    "quantidade",
    "valorMaterial",
    "servicos",
    "dias",
  ].forEach(function (k) {
    if (k in d) d[k] = Number(d[k]);
  });
  if (
    ["ram", "cpu", "disco"].some(function (k) {
      return k in d && (d[k] < 0 || d[k] > 100);
    })
  )
    erro = "Os percentuais devem estar entre 0 e 100.";
  if (tipoCadastroEnsaios === "protocolos") {
    if (d.duracao <= 0) erro = "Informe uma duração maior que zero.";
    d.id = "VAL-DEMO-" + String(protocolosEnsaios.length + 1).padStart(3, "0");
    d.versao = 1;
  }
  if (tipoCadastroEnsaios === "relatorios") {
    var p = protocolosEnsaios.find(function (p) {
      return p.id === d.protocolo;
    });
    if (new Date(d.fim) <= new Date(d.inicio))
      erro = "O fim do ensaio precisa ser posterior ao início.";
    if (
      (new Date(d.fim) - new Date(d.inicio)) / 3600000 < p.duracao &&
      [d.layout, d.compatibilidade, d.funcionamento, d.estabilidade].every(
        function (v) {
          return v === "Aprovado";
        },
      )
    )
      erro =
        "A duração é menor que a prevista no protocolo. Registre o ensaio como parcial, com uma verificação não executada.";
    d.id = "REL-" + String(relatoriosEnsaios.length + 1).padStart(3, "0");
    d.projeto = p.projeto;
    d.versao = p.versao;
  }
  if (tipoCadastroEnsaios === "correcoes") {
    var r = relatoriosEnsaios.find(function (r) {
      return r.id === d.relatorio;
    });
    d.id = "AC-" + String(correcoesEnsaios.length + 1).padStart(3, "0");
    d.projeto = r.projeto;
    d.situacao = "Aberta";
    [
      "horas",
      "horasTeste",
      "valorHora",
      "quantidade",
      "valorMaterial",
      "servicos",
      "dias",
    ].forEach(function (k) {
      d[k] = Number(d[k] || 0);
    });
  }
  if (erro) {
    document.getElementById("feedbackEnsaios").textContent = erro;
    document.getElementById("erroCadastro").textContent = erro;
    return;
  }
  ({
    protocolos: protocolosEnsaios,
    relatorios: relatoriosEnsaios,
    correcoes: correcoesEnsaios,
  })[tipoCadastroEnsaios].push(d);
  abaEnsaios = tipoCadastroEnsaios;
  document.getElementById("buscaRegistros").value = "";
  document.getElementById("projetoRegistros").value = "todos";
  document.getElementById("dialogCadastro").close();
  atualizarRegistrosEnsaios();
  document.getElementById("feedbackEnsaios").textContent =
    d.id + " adicionado à demonstração desta sessão.";
}
function abrirRegistroEnsaio(id) {
  var r = dadosAbaEnsaios().find(function (r) {
    return r.id === id;
  });
  document.getElementById("tituloRegistro").textContent =
    id + " · " + r.projeto;
  var detalhes = {};
  var extra = "";
  var acao = "";
  if (abaEnsaios === "protocolos") {
    detalhes = {
      Nome: r.nome,
      Versão: r.versao,
      Responsável: r.responsavel,
      "Duração mínima": r.duracao + " horas",
      Procedimento: r.procedimento,
      "Limite térmico": r.temperatura + " °C",
      "Limites de recursos":
        "CPU < " +
        r.cpu +
        "% · RAM < " +
        r.ram +
        "% · disco livre ≥ " +
        r.disco +
        "%",
    };
    acao =
      '<button class="botao" data-criar="relatorios" data-origem="' +
      escaparEnsaio(id) +
      '">Registrar ensaio deste protocolo</button>';
  } else if (abaEnsaios === "relatorios") {
    detalhes = {
      Protocolo: r.protocolo + " · versão " + r.versao,
      Lote: r.lote,
      "Revisão da placa": r.revisao,
      Responsável: r.responsavel,
      Início: r.inicio.replace("T", " às "),
      Fim: r.fim.replace("T", " às "),
      Equipamentos: r.series,
      Evidências: r.evidencia,
      Observações: r.observacoes,
      "Picos da captura":
        r.temperatura +
        " °C · RAM " +
        r.ram +
        "% · CPU " +
        r.cpu +
        "% · disco livre mínimo " +
        r.disco +
        "%",
    };
    extra =
      "<h3>Resultado dos critérios</h3>" +
      Object.entries(resultadosRelatorio(r))
        .map(function (e) {
          return (
            '<div class="comparacao-linha"><span>' +
            e[0] +
            "</span><strong>" +
            e[1] +
            "</strong></div>"
          );
        })
        .join("") +
      '<p class="texto-apoio">Temperatura e recursos são comparados com a versão do protocolo. Os demais resultados são registros manuais da simulação. O parecer final cabe ao engenheiro.</p>';
    acao =
      '<button class="botao" data-criar="correcoes" data-origem="' +
      escaparEnsaio(id) +
      '">Registrar correção vinculada</button>';
  } else {
    detalhes = {
      Relatório: r.relatorio,
      Critério: r.criterio,
      Correção: r.descricao,
      Responsável: r.responsavel,
      Prazo: r.prazo,
      Situação: r.situacao,
      Orçamento: r.orcado === "Sim" ? moedaEnsaio(custoEnsaio(r)) : "A estimar",
    };
    if (r.orcado === "Sim")
      extra =
        "<p>Duração estimada " +
        r.dias +
        " dias úteis. O prazo final depende do agendamento e das dependências da correção.</p>";
    if (r.situacao !== "Aguardando novo ensaio")
      acao =
        '<button id="avancarCorrecao" class="botao">' +
        (r.situacao === "Aberta"
          ? "Simular início da correção"
          : "Enviar para novo ensaio") +
        "</button>";
    else
      extra +=
        '<p class="aviso-demo">Correção aguardando verificação. Registre outro ensaio para avaliar o resultado da intervenção.</p>';
  }
  document.getElementById("detalheRegistro").innerHTML =
    '<dl class="detalhes-lista">' +
    Object.entries(detalhes)
      .map(function (e) {
        return (
          "<div><dt>" +
          escaparEnsaio(e[0]) +
          "</dt><dd>" +
          escaparEnsaio(e[1]) +
          "</dd></div>"
        );
      })
      .join("") +
    "</dl>" +
    extra;
  document.getElementById("acoesRegistro").innerHTML = acao;
  document.querySelectorAll("[data-criar]").forEach(function (b) {
    b.onclick = function () {
      document.getElementById("dialogRegistro").close();
      abrirCadastroEnsaio(this.dataset.criar, this.dataset.origem);
    };
  });
  var avancar = document.getElementById("avancarCorrecao");
  if (avancar)
    avancar.onclick = function () {
      r.situacao =
        r.situacao === "Aberta" ? "Em andamento" : "Aguardando novo ensaio";
      atualizarRegistrosEnsaios();
      abrirRegistroEnsaio(id);
    };
  var dialog = document.getElementById("dialogRegistro");
  if (!dialog.open) dialog.showModal();
}
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll("[data-aba]").forEach(function (b) {
    b.onclick = function () {
      abaEnsaios = this.dataset.aba;
      atualizarRegistrosEnsaios();
    };
  });
  document.querySelectorAll("[data-fechar]").forEach(function (b) {
    b.onclick = function () {
      document.getElementById(this.dataset.fechar).close();
    };
  });
  document.getElementById("buscaRegistros").oninput = atualizarRegistrosEnsaios;
  document.getElementById("projetoRegistros").onchange =
    atualizarRegistrosEnsaios;
  document.getElementById("novoRegistro").onclick = function () {
    abrirCadastroEnsaio(abaEnsaios);
  };
  document.getElementById("formCadastro").onsubmit = salvarCadastroEnsaio;
  atualizarRegistrosEnsaios();
});
