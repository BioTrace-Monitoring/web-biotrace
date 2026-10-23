// ============================================================
// DASHBOARD BIOTRACE - VERSÃO MOCADA (sem API)
//
// Parte 1: dados fictícios + "api" fake (retorna Promises)
// Parte 2: telas (renderização e interação)
//
// Para ligar na API real depois, basta reescrever as funções do
// objeto "api" com fetch(); o resto do arquivo não muda.
// ============================================================


// ============================================================
// PARTE 1 - DADOS MOCADOS
// ============================================================

var MOCK_LOTES = [
    { id: 1, numero: "LT-DEMO-001", idModelo: 1, modelo: "ECG-12" },
    { id: 2, numero: "LT-DEMO-002", idModelo: 2, modelo: "BPAP" },
    { id: 3, numero: "LT-DEMO-003", idModelo: 3, modelo: "Osteomax" }
];

var MOCK_TIPOS_COMPONENTE = [
    { id: 1, nome: "CPU" },
    { id: 2, nome: "Memória RAM" },
    { id: 3, nome: "Disco" },
    { id: 4, nome: "Rede" }
];

var MOCK_TIPO_METRICA = { id: 1, nome: "Uso", unidade: "%" };

var MOCK_EQUIPAMENTOS = [
    { id: 1, serie: "DEMO-A-0001", hospital: "Hospital São Lucas", lote: 1 },
    { id: 2, serie: "DEMO-A-0002", hospital: "Hospital São Lucas", lote: 1 },
    { id: 3, serie: "DEMO-A-0003", hospital: "Hospital Vida", lote: 1 },
    { id: 4, serie: "DEMO-B-0001", hospital: "Hospital Vida", lote: 2 },
    { id: 5, serie: "DEMO-B-0002", hospital: "Hospital Vida", lote: 2 },
    { id: 6, serie: "DEMO-C-0001", hospital: "Santa Clara", lote: 3 },
    { id: 7, serie: "DEMO-C-0002", hospital: "Santa Clara", lote: 3 },
    { id: 8, serie: "DEMO-C-0003", hospital: "Hospital São Lucas", lote: 3 }
];

// Um parâmetro por equipamento x tipo de componente (8 x 4 = 32)
var MOCK_PARAMETROS = [];

MOCK_EQUIPAMENTOS.forEach(function (eq)
{
    MOCK_TIPOS_COMPONENTE.forEach(function (tc)
    {
        var uso = 85;
        var habilitado = true;

        if (tc.nome == "Disco")
        {
            uso = 90;
        }

        // Rede do lote BPAP desabilitada (aparece como "Não (0/2)")
        if (tc.nome == "Rede" && (eq.serie == "DEMO-B-0001" || eq.serie == "DEMO-B-0002"))
        {
            habilitado = false;
        }

        // CPU de um equipamento do Osteomax divergente (aparece como "85% a 95%")
        if (tc.nome == "CPU" && eq.serie == "DEMO-C-0003")
        {
            uso = 95;
        }

        MOCK_PARAMETROS.push({
            idEquipamento: eq.id,
            idTipoComponente: tc.id,
            uso: uso,
            ociosidade: 15,
            habilitado: habilitado
        });
    });
});

function mockLote(id)
{
    return MOCK_LOTES.find(function (l) { return l.id == id; });
}

function mockEquipamento(id)
{
    return MOCK_EQUIPAMENTOS.find(function (e) { return e.id == id; });
}

function mockParametrosDoEquipamento(idEq)
{
    return MOCK_PARAMETROS.filter(function (p) { return p.idEquipamento == idEq; });
}

function mockParametrosDoLote(idLote)
{
    return MOCK_PARAMETROS.filter(function (p)
    {
        return mockEquipamento(p.idEquipamento).lote == idLote;
    });
}

function mockUnicos(lista)
{
    return lista.filter(function (v, i) { return lista.indexOf(v) === i; });
}

function contarHabilitados(params)
{
    return params.filter(function (p) { return p.habilitado; }).length;
}

// Simula a resposta de rede (com um pequeno atraso)
function responder(dados)
{
    return new Promise(function (resolve)
    {
        setTimeout(function ()
        {
            resolve(JSON.parse(JSON.stringify(dados)));
        }, 100);
    });
}

var api =
{
    resumo: function ()
    {
        return responder([{
            total_lotes: MOCK_LOTES.length,
            total_equipamentos: MOCK_EQUIPAMENTOS.length,
            total_hospitais: mockUnicos(MOCK_EQUIPAMENTOS.map(function (e) { return e.hospital; })).length,
            total_parametros: MOCK_PARAMETROS.length,
            parametros_habilitados: contarHabilitados(MOCK_PARAMETROS)
        }]);
    },

    lotes: function ()
    {
        var resultado = MOCK_LOTES.slice().sort(function (a, b) { return b.id - a.id; }).map(function (l)
        {
            var equips = MOCK_EQUIPAMENTOS.filter(function (e) { return e.lote == l.id; });
            var hospitais = mockUnicos(equips.map(function (e) { return e.hospital; })).sort();
            var params = mockParametrosDoLote(l.id);

            return {
                id_lote_equipamento: l.id,
                numero_lote: l.numero,
                id_modelo: l.idModelo,
                nome_modelo: l.modelo,
                qtd_equipamentos: equips.length,
                qtd_hospitais: hospitais.length,
                hospitais: hospitais.join(", "),
                qtd_componentes: params.length,
                qtd_parametros: params.length,
                qtd_habilitados: contarHabilitados(params)
            };
        });

        return responder(resultado);
    },

    equipamentosLote: function (idLote)
    {
        var resultado = MOCK_EQUIPAMENTOS.filter(function (e) { return e.lote == idLote; }).map(function (e)
        {
            var params = mockParametrosDoEquipamento(e.id);

            return {
                id_equipamento: e.id,
                numero_serie: e.serie,
                nome_hospital: e.hospital,
                qtd_componentes: params.length,
                qtd_parametros: params.length,
                qtd_habilitados: contarHabilitados(params)
            };
        });

        return responder(resultado);
    },

    parametros: function ()
    {
        var linhas = [];

        MOCK_LOTES.forEach(function (l)
        {
            MOCK_TIPOS_COMPONENTE.forEach(function (tc)
            {
                var params = mockParametrosDoLote(l.id).filter(function (p)
                {
                    return p.idTipoComponente == tc.id;
                });

                if (params.length === 0)
                {
                    return;
                }

                var usos = params.map(function (p) { return p.uso; });
                var ocios = params.map(function (p) { return p.ociosidade; });

                linhas.push({
                    id_lote_equipamento: l.id,
                    numero_lote: l.numero,
                    id_modelo: l.idModelo,
                    nome_modelo: l.modelo,
                    id_tipo_componente: tc.id,
                    nome_componente: tc.nome,
                    id_tipo_metrica: MOCK_TIPO_METRICA.id,
                    tipo_metrica: MOCK_TIPO_METRICA.nome,
                    unidade: MOCK_TIPO_METRICA.unidade,
                    qtd_equipamentos: mockUnicos(params.map(function (p) { return p.idEquipamento; })).length,
                    qtd_parametros: params.length,
                    qtd_habilitados: contarHabilitados(params),
                    min_uso: Math.min.apply(null, usos),
                    max_uso: Math.max.apply(null, usos),
                    min_ociosidade: Math.min.apply(null, ocios),
                    max_ociosidade: Math.max.apply(null, ocios)
                });
            });
        });

        linhas.sort(function (a, b)
        {
            if (a.numero_lote != b.numero_lote)
            {
                return a.numero_lote < b.numero_lote ? -1 : 1;
            }

            return a.nome_componente.localeCompare(b.nome_componente);
        });

        return responder(linhas);
    },

    atualizarParametro: function (dados)
    {
        MOCK_PARAMETROS.forEach(function (param)
        {
            var eq = mockEquipamento(param.idEquipamento);
            var lote = mockLote(eq.lote);

            var mesmoEscopo = dados.escopo == "modelo"
                ? lote.idModelo == dados.idModelo
                : lote.id == dados.idLote;

            if (mesmoEscopo && param.idTipoComponente == dados.idTipoComponente)
            {
                param.uso = dados.limiteUso;
                param.ociosidade = dados.limiteOciosidade;
                param.habilitado = dados.habilitado;
            }
        });

        return responder({ ok: true });
    }
};


// ============================================================
// PARTE 2 - TELAS
// ============================================================

var listaLotes = [];
var listaParametros = [];
var loteSelecionado = null;
var parametroSelecionado = null;

function esc(texto)
{
    var mapa = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

    return String(texto == null ? "" : texto).replace(/[&<>"']/g, function (c)
    {
        return mapa[c];
    });
}

function formatarPorcentagem(valor)
{
    return (Math.round(Number(valor) * 10) / 10) + "%";
}

function verificarSessaoGestor()
{
    // Mocado: não redireciona para o login, usa um nome padrão
    var nome = sessionStorage.NOME_USUARIO || "Ana Souza";
    document.getElementById("b_usuario").textContent = nome;
}

function sair()
{
    sessionStorage.clear();
    window.location = "index.html";
}

function trocarAba(aba)
{
    document.getElementById("tela_lotes").classList.toggle("oculto", aba != "lotes");
    document.getElementById("tela_limites").classList.toggle("oculto", aba != "limites");
    document.getElementById("aba_lotes").classList.toggle("ativa", aba == "lotes");
    document.getElementById("aba_limites").classList.toggle("ativa", aba == "limites");
}

function carregarTudo()
{
    carregarResumo();
    carregarLotes();
    carregarParametros();
}

function carregarResumo()
{
    api.resumo()
        .then(function (resultado)
        {
            var resumo = resultado[0];

            document.getElementById("kpi_lotes").textContent = resumo.total_lotes;
            document.getElementById("kpi_equipamentos").textContent = resumo.total_equipamentos;
            document.getElementById("kpi_hospitais").textContent = resumo.total_hospitais;
            document.getElementById("kpi_metricas").textContent = resumo.parametros_habilitados;
            document.getElementById("kpi_metricas_detalhe").textContent = "de " + resumo.total_parametros + " parâmetros";
        })
        .catch(function (erro)
        {
            console.log(erro);
        });
}

function carregarLotes()
{
    api.lotes()
        .then(function (resultado)
        {
            listaLotes = resultado;
            renderizarLotes();

            // Se havia um lote aberto, atualiza o painel lateral também
            if (loteSelecionado != null)
            {
                selecionarLote(loteSelecionado);
            }
        })
        .catch(function (erro)
        {
            console.log(erro);
        });
}

function classeSaude(porcentagem)
{
    if (porcentagem >= 90)
    {
        return "verde";
    }

    if (porcentagem >= 70)
    {
        return "ambar";
    }

    return "vermelho";
}

function renderizarLotes()
{
    var termo = document.getElementById("ipt_busca_lote").value.trim().toLowerCase();
    var corpo = document.getElementById("corpo_tabela_lotes");

    corpo.innerHTML = "";

    var filtrados = listaLotes.filter(function (lote)
    {
        var texto = (lote.numero_lote + " " + lote.nome_modelo + " " + (lote.hospitais || "")).toLowerCase();
        return texto.indexOf(termo) !== -1;
    });

    if (filtrados.length === 0)
    {
        corpo.innerHTML = `<tr><td colspan="6" class="celula-vazia">Nenhum lote encontrado</td></tr>`;
        return;
    }

    filtrados.forEach(function (lote)
    {
        var porcentagem = lote.qtd_parametros > 0 ? Math.round(lote.qtd_habilitados * 100 / lote.qtd_parametros) : 0;

        var linha = document.createElement("tr");
        linha.className = "linha-clicavel" + (loteSelecionado == lote.id_lote_equipamento ? " selecionada" : "");
        linha.onclick = function ()
        {
            selecionarLote(lote.id_lote_equipamento);
        };

        linha.innerHTML = `
            <td class="mono">${esc(lote.numero_lote)}</td>
            <td>${esc(lote.nome_modelo)}</td>
            <td>
                ${esc(lote.hospitais || "Sem equipamentos")}
                <div class="texto-suave">${lote.qtd_hospitais} hospital(is)</div>
            </td>
            <td class="mono">${lote.qtd_equipamentos}</td>
            <td class="mono">${lote.qtd_componentes}</td>
            <td>
                <span class="texto-suave">${lote.qtd_habilitados} de ${lote.qtd_parametros} (${porcentagem}%)</span>
                <div class="barra"><div class="barra-preenchida ${classeSaude(porcentagem)}" style="width: ${porcentagem}%"></div></div>
            </td>
        `;

        corpo.appendChild(linha);
    });
}

function selecionarLote(idLote)
{
    loteSelecionado = idLote;
    renderizarLotes();

    api.equipamentosLote(idLote)
        .then(function (equipamentos)
        {
            renderizarPainelLote(idLote, equipamentos);
        })
        .catch(function (erro)
        {
            console.log(erro);
        });
}

function renderizarPainelLote(idLote, equipamentos)
{
    var lote = listaLotes.find(function (l)
    {
        return l.id_lote_equipamento == idLote;
    });

    var itens = equipamentos.map(function (eq)
    {
        var classeChip = eq.qtd_habilitados == eq.qtd_parametros ? "chip-verde" : "chip-ambar";

        return `
            <div class="item-equipamento">
                <div>
                    <div class="mono">${esc(eq.numero_serie)}</div>
                    <div class="texto-suave">${esc(eq.nome_hospital)}</div>
                </div>
                <span class="chip ${classeChip}">${eq.qtd_habilitados}/${eq.qtd_parametros} métricas</span>
            </div>
        `;
    }).join("");

    if (itens == "")
    {
        itens = `<div class="painel-vazio">Nenhum equipamento neste lote ainda.</div>`;
    }

    document.getElementById("painel_lote").innerHTML = `
        <div class="painel-rotulo">Detalhes do lote</div>
        <div class="painel-titulo mono">${esc(lote.numero_lote)}</div>
        <div class="painel-subtitulo">${esc(lote.nome_modelo)} · ${esc(lote.hospitais || "Sem hospitais")}</div>

        <div class="mini-kpis">
            <div class="mini-kpi"><strong>${lote.qtd_equipamentos}</strong><span>equipamentos</span></div>
            <div class="mini-kpi"><strong>${lote.qtd_componentes}</strong><span>componentes</span></div>
            <div class="mini-kpi"><strong>${lote.qtd_habilitados}/${lote.qtd_parametros}</strong><span>métricas</span></div>
        </div>

        <div class="lista-equipamentos">${itens}</div>

        <button class="btn-largo" onclick="irParaLimites(${lote.id_lote_equipamento})">Ver limites deste lote</button>
    `;
}

function irParaLimites(idLote)
{
    trocarAba("limites");
    document.getElementById("sel_filtro_lote").value = idLote;
    renderizarParametros();
}

function carregarParametros()
{
    api.parametros()
        .then(function (resultado)
        {
            listaParametros = resultado;
            preencherFiltros();
            renderizarParametros();

            if (parametroSelecionado != null)
            {
                var existente = encontrarParametro(parametroSelecionado);

                if (existente)
                {
                    selecionarParametro(parametroSelecionado);
                }
            }
        })
        .catch(function (erro)
        {
            console.log(erro);
        });
}

function chaveParametro(p)
{
    return p.id_lote_equipamento + "-" + p.id_tipo_componente + "-" + p.id_tipo_metrica;
}

function encontrarParametro(chave)
{
    return listaParametros.find(function (p)
    {
        return chaveParametro(p) == chave;
    });
}

function preencherFiltros()
{
    var selLote = document.getElementById("sel_filtro_lote");
    var selComp = document.getElementById("sel_filtro_componente");
    var loteAtual = selLote.value;
    var compAtual = selComp.value;

    selLote.innerHTML = `<option value="">Todos os lotes</option>`;
    selComp.innerHTML = `<option value="">Todos os componentes</option>`;

    var lotesVistos = {};
    var componentesVistos = {};

    listaParametros.forEach(function (p)
    {
        if (!lotesVistos[p.id_lote_equipamento])
        {
            lotesVistos[p.id_lote_equipamento] = true;

            var opcaoLote = document.createElement("option");
            opcaoLote.value = p.id_lote_equipamento;
            opcaoLote.textContent = p.numero_lote + " (" + p.nome_modelo + ")";
            selLote.appendChild(opcaoLote);
        }

        if (!componentesVistos[p.id_tipo_componente])
        {
            componentesVistos[p.id_tipo_componente] = true;

            var opcaoComp = document.createElement("option");
            opcaoComp.value = p.id_tipo_componente;
            opcaoComp.textContent = p.nome_componente;
            selComp.appendChild(opcaoComp);
        }
    });

    selLote.value = loteAtual;
    selComp.value = compAtual;
}

function renderizarParametros()
{
    var filtroLote = document.getElementById("sel_filtro_lote").value;
    var filtroComp = document.getElementById("sel_filtro_componente").value;
    var corpo = document.getElementById("corpo_tabela_parametros");

    corpo.innerHTML = "";

    var filtrados = listaParametros.filter(function (p)
    {
        return (filtroLote == "" || p.id_lote_equipamento == filtroLote) &&
               (filtroComp == "" || p.id_tipo_componente == filtroComp);
    });

    if (filtrados.length === 0)
    {
        corpo.innerHTML = `<tr><td colspan="6" class="celula-vazia">Nenhum parâmetro encontrado. Os parâmetros existem quando o equipamento possui componentes e métricas cadastrados.</td></tr>`;
        return;
    }

    filtrados.forEach(function (p)
    {
        var chave = chaveParametro(p);
        var padronizado = p.min_uso == p.max_uso && p.min_ociosidade == p.max_ociosidade;

        var textoUso = p.min_uso == p.max_uso
            ? "≤ " + formatarPorcentagem(p.max_uso)
            : formatarPorcentagem(p.min_uso) + " a " + formatarPorcentagem(p.max_uso);

        var textoOciosidade = p.min_ociosidade == p.max_ociosidade
            ? "≥ " + formatarPorcentagem(p.min_ociosidade)
            : formatarPorcentagem(p.min_ociosidade) + " a " + formatarPorcentagem(p.max_ociosidade);

        var classeHabilitada = p.qtd_habilitados == p.qtd_parametros ? "chip-verde" : (p.qtd_habilitados == 0 ? "chip-cinza" : "chip-ambar");
        var textoHabilitada = p.qtd_habilitados == p.qtd_parametros ? "Sim" : (p.qtd_habilitados == 0 ? "Não" : "Parcial");

        var linha = document.createElement("tr");
        linha.className = "linha-clicavel" + (parametroSelecionado == chave ? " selecionada" : "");
        linha.onclick = function ()
        {
            selecionarParametro(chave);
        };

        linha.innerHTML = `
            <td>
                <div class="mono">${esc(p.numero_lote)}</div>
                <div class="texto-suave">${esc(p.nome_modelo)}</div>
            </td>
            <td>
                ${esc(p.nome_componente)}
                <div class="texto-suave">${esc(p.tipo_metrica)} (${esc(p.unidade)}) · ${p.qtd_equipamentos} equip.</div>
            </td>
            <td class="mono">${textoUso}</td>
            <td class="mono">${textoOciosidade}</td>
            <td><span class="chip ${classeHabilitada}">${textoHabilitada} (${p.qtd_habilitados}/${p.qtd_parametros})</span></td>
            <td><span class="chip ${padronizado ? "chip-verde" : "chip-ambar"}">${padronizado ? "Padronizado" : "Divergente"}</span></td>
        `;

        corpo.appendChild(linha);
    });
}

function selecionarParametro(chave)
{
    var p = encontrarParametro(chave);

    if (!p)
    {
        return;
    }

    parametroSelecionado = chave;
    renderizarParametros();

    document.getElementById("painel_parametro_vazio").classList.add("oculto");
    document.getElementById("painel_parametro").classList.remove("oculto");

    document.getElementById("prm_titulo").textContent = p.nome_componente + " · " + p.tipo_metrica;
    document.getElementById("prm_subtitulo").textContent = p.numero_lote + " · " + p.nome_modelo;

    document.getElementById("rng_uso").value = Number(p.max_uso);
    document.getElementById("rng_ociosidade").value = Number(p.min_ociosidade);
    document.getElementById("chk_habilitado").checked = Number(p.qtd_habilitados) > 0;
    document.getElementById("sel_escopo").value = "lote";

    atualizarRotulos();
    atualizarImpacto();
}

function atualizarRotulos()
{
    document.getElementById("lbl_uso").textContent = formatarPorcentagem(document.getElementById("rng_uso").value);
    document.getElementById("lbl_ociosidade").textContent = formatarPorcentagem(document.getElementById("rng_ociosidade").value);
}

function atualizarImpacto()
{
    var p = encontrarParametro(parametroSelecionado);

    if (!p)
    {
        return;
    }

    var escopo = document.getElementById("sel_escopo").value;
    var afetados = listaParametros.filter(function (item)
    {
        if (item.id_tipo_componente != p.id_tipo_componente || item.id_tipo_metrica != p.id_tipo_metrica)
        {
            return false;
        }

        return escopo == "modelo" ? item.id_modelo == p.id_modelo : item.id_lote_equipamento == p.id_lote_equipamento;
    });

    var parametros = 0;
    var equipamentos = 0;

    afetados.forEach(function (item)
    {
        parametros += Number(item.qtd_parametros);
        equipamentos += Number(item.qtd_equipamentos);
    });

    document.getElementById("txt_impacto").textContent =
        "Afeta " + parametros + " parâmetro(s) em " + equipamentos + " equipamento(s) de " + afetados.length + " lote(s).";
}

function salvarParametro()
{
    var p = encontrarParametro(parametroSelecionado);

    if (!p)
    {
        return false;
    }

    var limiteUso = Number(document.getElementById("rng_uso").value);
    var limiteOciosidade = Number(document.getElementById("rng_ociosidade").value);

    if (limiteOciosidade >= limiteUso)
    {
        alert("O limite de ociosidade deve ser menor que o limite de uso!");
        return false;
    }

    var botao = document.getElementById("btn_aplicar");
    botao.disabled = true;

    api.atualizarParametro({
        escopo: document.getElementById("sel_escopo").value,
        idLote: p.id_lote_equipamento,
        idModelo: p.id_modelo,
        idTipoComponente: p.id_tipo_componente,
        idTipoMetrica: p.id_tipo_metrica,
        limiteUso: limiteUso,
        limiteOciosidade: limiteOciosidade,
        habilitado: document.getElementById("chk_habilitado").checked
    })
        .then(function ()
        {
            botao.disabled = false;
            alert("Parâmetros atualizados com sucesso!");
            carregarTudo();
        })
        .catch(function (erro)
        {
            botao.disabled = false;
            console.log(erro);
            alert("Não foi possível atualizar os parâmetros!");
        });
}