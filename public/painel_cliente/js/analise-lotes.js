/* ============ 1. DADOS SIMULADOS ============ */
const HISTERESE = 3; // p.p. acima do limite para considerar o lote "resolvido"
const LIM_OCIOSO = 70; // % do tempo parado para considerar "Subutilizado"
const ALFA = 0.05;

const CATEGORIAS = [
  { id: 'normal',  nome: 'Sem alertas',      cor: '#10B981' },
  { id: 'atencao', nome: 'Em atenção',       cor: '#F59E0B' },
  { id: 'limite',  nome: 'Limite excedido',  cor: '#EF4444' },
  { id: 'falha',   nome: 'Falha de leitura', cor: '#991B1B' },
  { id: 'abaixo',  nome: 'Abaixo do mínimo', cor: '#3B82F6' }
];

const mockData = {
  'LT-2026-001': {
    historico: [92, 88, 91, 79, 85, 88, 78, 82, 85, 84, 82, 79, 80, 75],
    varOntem: -5,
    frescorAtrasado: false,
    estados: {
      normal: ['ECG12-0002', 'ECG12-0004', 'ECG12-0005', 'ECG12-0006', 'ECG12-0007', 'ECG12-0008'],
      atencao: [],
      limite: ['ECG12-0001', 'ECG12-0003'],
      falha: [],
      abaixo: []
    }
  },
  'LT-2026-002': {
    historico: [100, 100, 100, 100, 100, 98, 99, 100, 100, 100, 98, 95, 73, 75],
    varOntem: 2,
    frescorAtrasado: false,
    estados: {
      normal: ['BPAP-01', 'BPAP-02', 'BPAP-03', 'BPAP-04', 'BPAP-05', 'BPAP-06', 'BPAP-07', 'BPAP-08', 'BPAP-09'],
      atencao: ['BPAP-10'],
      limite: ['BPAP-11'],
      falha: [],
      abaixo: ['BPAP-12']
    }
  },
  'LT-2026-003': {
    historico: [85, 82, 84, 76, 81, 84, 75, 79, 81, 80, 81, 78, 89, 87.5],
    varOntem: -1.5,
    frescorAtrasado: true,
    estados: {
      normal: ['OST-01', 'OST-02', 'OST-03', 'OST-04', 'OST-05', 'OST-06', 'OST-07'],
      atencao: [],
      limite: [],
      falha: ['OST-08'],
      abaixo: []
    }
  }
};

const COR_PERFIL = {
  'Quase sem uso': '#3B82F6',
  'Uso em picos': '#F59E0B',
  'Uso constante': '#10B981'
};

const ACAO_PERFIL = {
  'Quase sem uso': 'Candidatos a realocação',
  'Uso em picos': 'Vigiar a temperatura',
  'Uso constante': 'Manter como está'
};

/* ============ 2. ESTADO & UTILITÁRIOS ============ */
let loteAtual = 'LT-2026-001';
let loteAtualId = null;
let lotesDisponiveis = [];
let donut = null;
let perfChart = null;
let perfisAtuais = [];
let perfilSelecionado = null;
let nOciosos = 0;
let toastTimer;

const $ = (id) => document.getElementById(id);
const getLimite = () => parseInt($('limite-slider').value, 10);
const fmt = (n) => String(n).replace('.', ',');
const media = (a) => a.reduce((s, v) => s + v, 0) / a.length;

function obterDadosMockLote() {
  return mockData[loteAtual] || {
    historico: [100, 100, 100, 100, 100, 100, 100, 100],
    varOntem: 0,
    frescorAtrasado: false,
    estados: { normal: [], atencao: [], limite: [], falha: [], abaixo: [] }
  };
}

function obterHeadersAuth() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function showToast(msg) {
  const t = $('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

function calcIntegridade(lote) {
  const total = Object.values(lote.estados).reduce((a, c) => a + c.length, 0);
  const normal = lote.estados.normal.length;
  const pct = total > 0 ? (normal / total) * 100 : 100;
  return { total, normal, anomalias: total - normal, pct };
}

function gerarEventos(historico, limite) {
  const eventos = [];
  let emAlerta = false;
  historico.forEach((v, i) => {
    const diasAtras = historico.length - 1 - i;
    if (!emAlerta && v < limite) {
      emAlerta = true;
      eventos.push({ diasAtras, tipo: 'Alerta aberto', css: 'red', valor: v });
    } else if (emAlerta && v >= limite + HISTERESE) {
      emAlerta = false;
      eventos.push({ diasAtras, tipo: 'Resolvido', css: 'green', valor: v });
    }
  });
  return eventos;
}

/* ============ 3. PLUGINS DO CHART.JS (ROSCA) ============ */
const centerTextPlugin = {
  id: 'centerText',
  afterDraw(chart) {
    const arc = chart.getDatasetMeta(0).data[0];
    if (!arc) return;
    const lote = obterDadosMockLote();
    const { total, anomalias, pct } = calcIntegridade(lote);
    const ctx = chart.ctx;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = "bold 26px 'JetBrains Mono', monospace";
    ctx.fillStyle = pct >= getLimite() ? '#047857' : '#B91C1C';
    ctx.fillText(`${fmt(pct.toFixed(1))}%`, arc.x, arc.y - 14);
    ctx.font = "12px 'Poppins', sans-serif";
    ctx.fillStyle = '#77717d';
    ctx.fillText(`${anomalias} de ${total} em anomalia`, arc.x, arc.y + 12);
    const v = lote.varOntem;
    ctx.font = "11px 'Poppins', sans-serif";
    ctx.fillStyle = v >= 0 ? '#047857' : '#B91C1C';
    const prefixo = v > 0 ? '▲ +' : v < 0 ? '▼ ' : '';
    ctx.fillText(`${prefixo}${fmt(v)} p.p. vs. ontem`, arc.x, arc.y + 30);
    ctx.restore();
  }
};

const radialLimitPlugin = {
  id: 'radialLimit',
  afterDraw(chart) {
    const arc = chart.getDatasetMeta(0).data[0];
    if (!arc) return;
    const limite = getLimite();
    const ang = (limite / 100) * 2 * Math.PI - Math.PI / 2;
    const cos = Math.cos(ang);
    const sin = Math.sin(ang);
    const { x, y, innerRadius: ri, outerRadius: ro } = arc;
    const ctx = chart.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + (ri - 4) * cos, y + (ri - 4) * sin);
    ctx.lineTo(x + (ro + 8) * cos, y + (ro + 8) * sin);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#6d3fc0';
    ctx.stroke();
    ctx.font = "bold 11px 'Poppins', sans-serif";
    ctx.fillStyle = '#6d3fc0';
    ctx.textAlign = cos >= 0 ? 'left' : 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Limite ${limite}%`, x + (ro + 14) * cos, y + (ro + 14) * sin);
    ctx.restore();
  }
};

function initDonut() {
  const canvas = $('alertas-donut');
  if (!canvas) return;
  donut = new Chart(canvas.getContext('2d'), {
    type: 'doughnut',
    plugins: [centerTextPlugin, radialLimitPlugin],
    data: {
      labels: CATEGORIAS.map((c) => c.nome),
      datasets: [{
        data: [],
        backgroundColor: CATEGORIAS.map((c) => c.cor),
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      layout: { padding: 36 },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(40, 36, 45, 0.95)',
          padding: 12,
          titleFont: { size: 13, family: "'Poppins', sans-serif" },
          bodyFont: { size: 12, family: "'JetBrains Mono', monospace" },
          callbacks: {
            title: (c) => `${c[0].label} (${c[0].raw})`,
            label: (c) => {
              const lista = obterDadosMockLote().estados[CATEGORIAS[c.dataIndex].id];
              if (!lista.length) return 'Nenhum equipamento';
              const linhas = lista.slice(0, 4);
              if (lista.length > 4) linhas.push(`+${lista.length - 4} equipamentos`);
              return linhas;
            }
          }
        }
      },
      onHover: (e, els) => { e.native.target.style.cursor = els.length ? 'pointer' : 'default'; },
      onClick: (e, els) => {
        if (els.length) showToast(`Abrindo Equipamentos por lote filtrado por: ${CATEGORIAS[els[0].index].nome}`);
      }
    }
  });
}

function renderLegenda(dados) {
  const box = $('legend');
  if (!box) return;
  box.innerHTML = '';
  CATEGORIAS.forEach((cat, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'legend-item';
    b.style.opacity = dados[i] === 0 ? '0.55' : '1';
    b.innerHTML = `<span><span class="dot" style="background:${cat.cor}"></span>${cat.nome}</span><span class="legend-count">${dados[i]}</span>`;
    b.addEventListener('click', () => showToast(`Abrindo Equipamentos por lote filtrado por: ${cat.nome}`));
    box.appendChild(b);
  });
}

function renderNotificacoes(lote, limite) {
  const tbody = $('notificacoes-body');
  if (!tbody) return;
  const canal = $('toggle-slack').checked
    ? ($('toggle-email').checked ? 'E-mail + Slack' : 'Slack')
    : ($('toggle-email').checked ? 'E-mail' : 'Nenhum canal');
  const eventos = gerarEventos(lote.historico, limite).reverse().slice(0, 5);

  if (!eventos.length) {
    tbody.innerHTML = `<tr><td colspan="4" style="color:var(--text-secondary)">Nenhum aviso seria disparado com este limite.</td></tr>`;
    return;
  }

  tbody.innerHTML = eventos.map((e) => {
    const quando = e.diasAtras === 0 ? 'Hoje' : e.diasAtras === 1 ? 'Ontem' : `${e.diasAtras} dias atrás`;
    const msg = e.tipo === 'Alerta aberto'
      ? `Integridade do lote ${loteAtual} caiu para ${fmt(e.valor)}% (limite: ${limite}%)`
      : `Lote ${loteAtual} voltou ao normal (${fmt(e.valor)}%)`;
    return `<tr>
      <td class="mono-val" style="color:var(--text-secondary)">${quando}</td>
      <td style="font-weight:500">${canal}</td>
      <td><span class="badge ${e.css}">${e.tipo}</span></td>
      <td>${msg}</td>
    </tr>`;
  }).join('');
}

/* ============ 4. DASHBOARD 1: ANÁLISE DE OCIOSIDADE ============ */
async function carregarOciosidade(idLote) {
  const body = $('idle-body');
  const insight = $('idle-insight');

  if (!idLote) {
    nOciosos = 0;
    body.innerHTML = '<p class="card-subtitle">Selecione um lote para visualizar a ociosidade dos equipamentos.</p>';
    insight.textContent = 'Nenhum lote selecionado.';
    renderResumo();
    return;
  }

  try {
    const resp = await fetch(`/analise-lotes/${idLote}/ociosidade`, { headers: obterHeadersAuth() });
    const dados = await resp.json();
    if (!resp.ok || !dados.sucesso) {
      throw new Error(dados.mensagem || 'Erro ao carregar ociosidade do lote.');
    }

    const lista = dados.equipamentos || [];
    if (!lista.length) {
      nOciosos = 0;
      body.innerHTML = '<p class="card-subtitle">Nenhum equipamento vinculado a este lote.</p>';
      insight.textContent = 'Nenhum equipamento cadastrado neste lote.';
      renderResumo();
      return;
    }

    body.innerHTML = lista.map((e) => {
      const semLeituras = e.percentual_ociosidade === null;
      const pct = semLeituras ? 0 : e.percentual_ociosidade;
      const sub = !semLeituras && pct > LIM_OCIOSO;
      const badgeClass = sub ? 'orange' : 'neutral';
      const badgeText = semLeituras ? 'Sem leituras' : (sub ? 'Subutilizado' : 'Em uso');
      const barColor = sub ? 'var(--orange)' : '#CBD5E1';
      const pctTexto = semLeituras ? '--' : `${pct}%`;

      return `<div class="idle-row">
        <span class="mono-val idle-name">${e.numero_serie}</span>
        <span class="bar-track" aria-label="Ociosidade de ${e.numero_serie}: ${pctTexto}">
          <span class="bar-fill" style="width:${pct}%;background:${barColor}"></span>
        </span>
        <span class="mono-val idle-pct">${pctTexto}</span>
        <span class="badge ${badgeClass}">${badgeText}</span>
      </div>`;
    }).join('');

    const parados = lista.filter((e) => e.percentual_ociosidade !== null && e.percentual_ociosidade > LIM_OCIOSO);
    const comLeituras = lista.filter((e) => e.percentual_ociosidade !== null).length;
    nOciosos = parados.length;

    if (comLeituras === 0) {
      insight.textContent = 'Nenhuma leitura de CPU registrada nos últimos 7 dias para este lote.';
    } else if (nOciosos > 0) {
      insight.textContent = `${nOciosos} equipamento(s) ficaram parados mais de ${LIM_OCIOSO}% do tempo e podem ser realocados: ${parados.map((e) => e.numero_serie).join(', ')}.`;
    } else {
      insight.textContent = `Nenhum equipamento ficou parado mais de ${LIM_OCIOSO}% do tempo neste lote.`;
    }
    renderResumo();
  } catch (erro) {
    nOciosos = 0;
    body.innerHTML = `<p class="card-subtitle">${erro.message}</p>`;
    insight.textContent = 'Não foi possível calcular a ociosidade deste lote.';
    renderResumo();
  }
}

/* ============ 5. DASHBOARD 2: PERFIS DE USO (K-MEANS + KRUSKAL-WALLIS) ============ */
const dist2 = (a, b) => a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0);

function kmeans(X, k) {
  let cent = [X[0]];
  while (cent.length < k) {
    let melhor = 0;
    let dMax = -1;
    X.forEach((x, i) => {
      const d = Math.min(...cent.map((c) => dist2(x, c)));
      if (d > dMax) {
        dMax = d;
        melhor = i;
      }
    });
    cent.push(X[melhor]);
  }
  let lab = new Array(X.length).fill(-1);
  for (let it = 0; it < 50; it++) {
    const nl = X.map((x) => {
      const d = cent.map((c) => dist2(x, c));
      return d.indexOf(Math.min(...d));
    });
    if (nl.every((v, i) => v === lab[i])) break;
    lab = nl;
    cent = cent.map((c, j) => {
      const m = X.filter((_, i) => lab[i] === j);
      return m.length ? c.map((_, d) => media(m.map((v) => v[d]))) : c;
    });
  }
  return lab;
}

function silhouette(X, lab, k) {
  const d = (a, b) => Math.sqrt(dist2(a, b));
  let total = 0;
  X.forEach((x, i) => {
    const mesmo = X.filter((_, j) => j !== i && lab[j] === lab[i]);
    if (!mesmo.length) return;
    const a = media(mesmo.map((y) => d(x, y)));
    let b = Infinity;
    for (let c = 0; c < k; c++) {
      if (c === lab[i]) continue;
      const o = X.filter((_, j) => lab[j] === c);
      if (o.length) b = Math.min(b, media(o.map((y) => d(x, y))));
    }
    total += (b - a) / Math.max(a, b);
  });
  return total / X.length;
}

function lgamma(xx) {
  const c = [
    76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5
  ];
  let y = xx;
  let tmp = xx + 5.5;
  tmp -= (xx + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (const cj of c) ser += cj / ++y;
  return -tmp + Math.log(2.5066282746310005 * ser / xx);
}

function gammaQ(a, x) {
  if (x <= 0) return 1;
  const gl = lgamma(a);
  if (x < a + 1) {
    let ap = a;
    let sum = 1 / a;
    let del = sum;
    for (let n = 0; n < 200; n++) {
      ap++;
      del *= x / ap;
      sum += del;
      if (Math.abs(del) < Math.abs(sum) * 1e-9) break;
    }
    return 1 - sum * Math.exp(-x + a * Math.log(x) - gl);
  }
  let b = x + 1 - a;
  let c = 1e30;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i <= 200; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = b + an / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-9) break;
  }
  return Math.exp(-x + a * Math.log(x) - gl) * h;
}

function kruskal(grupos) {
  const todos = grupos.flatMap((g, gi) => g.map((v) => ({ v, gi }))).sort((a, b) => a.v - b.v);
  const N = todos.length;
  const rank = new Array(N);
  for (let i = 0; i < N;) {
    let j = i;
    while (j + 1 < N && todos[j + 1].v === todos[i].v) j++;
    for (let m = i; m <= j; m++) rank[m] = (i + j) / 2 + 1;
    i = j + 1;
  }
  const soma = grupos.map(() => 0);
  todos.forEach((t, i) => { soma[t.gi] += rank[i]; });
  const H = (12 / (N * (N + 1))) * grupos.reduce((acc, g, gi) => acc + soma[gi] ** 2 / g.length, 0) - 3 * (N + 1);
  return { H, p: gammaQ((grupos.length - 1) / 2, H / 2) };
}

const pFmt = (p) => (p < 0.001 ? '< 0,001' : fmt(p.toFixed(3)));

function initPerfis() {
  const canvas = $('perf-canvas');
  if (!canvas) return;
  perfChart = new Chart(canvas.getContext('2d'), {
    type: 'scatter',
    data: { datasets: [] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          min: 0,
          max: 100,
          title: { display: true, text: '% do tempo parado', font: { family: "'Poppins', sans-serif", weight: '600' } },
          ticks: { callback: (v) => `${v}%` },
          grid: { color: 'rgba(233, 229, 237, 0.7)' }
        },
        y: {
          min: 0,
          title: { display: true, text: 'Variação de picos de uso', font: { family: "'Poppins', sans-serif", weight: '600' } },
          grid: { color: 'rgba(233, 229, 237, 0.7)' }
        }
      },
      plugins: {
        legend: {
          display: true,
          labels: { boxWidth: 12, usePointStyle: true, pointStyle: 'circle', font: { size: 12, family: "'Poppins', sans-serif" } }
        },
        tooltip: {
          backgroundColor: 'rgba(40, 36, 45, 0.95)',
          padding: 12,
          titleFont: { size: 13, family: "'Poppins', sans-serif" },
          bodyFont: { size: 12, family: "'JetBrains Mono', monospace" },
          callbacks: {
            title: (items) => items[0]?.dataset?.label || '',
            label: (c) => `${c.raw.n} · ${c.raw.x}% parado · variação ${fmt(c.raw.y)}`
          }
        }
      }
    }
  });
}

function atualizarScatterDatasets() {
  if (!perfChart) return;
  perfChart.data.datasets = perfisAtuais.map((g) => {
    const ativo = !perfilSelecionado || perfilSelecionado === g.nome;
    const cor = COR_PERFIL[g.nome];
    return {
      label: g.nome,
      backgroundColor: ativo ? cor : `${cor}33`,
      borderColor: '#ffffff',
      borderWidth: 2,
      pointRadius: ativo ? 8 : 5,
      pointHoverRadius: 10,
      data: g.m.map((p) => ({ x: p.x, y: p.y, n: p.n }))
    };
  });
  perfChart.update('none');
}

function renderLegendaPerfis() {
  const container = $('perf-lista');
  if (!container) return;

  container.innerHTML = perfisAtuais.map((g) => {
    const isActive = perfilSelecionado === g.nome;
    const isDimmed = perfilSelecionado && !isActive;
    const stateClass = isActive ? 'is-active' : isDimmed ? 'is-dimmed' : '';

    return `<button type="button" class="perfil-item ${stateClass}" data-perfil="${g.nome}" aria-pressed="${isActive}">
      <div class="perfil-head">
        <span class="perfil-title"><span class="dot" style="background:${COR_PERFIL[g.nome]}"></span>${g.nome}</span>
        <span class="perfil-count">${g.m.length} equipamento(s)</span>
      </div>
      <div class="perfil-acao">${ACAO_PERFIL[g.nome]}</div>
      <div class="mono-val perfil-equipamentos">${g.m.map((p) => p.n).join(', ')}</div>
    </button>`;
  }).join('') + `<p class="perfil-hint">Clique em um perfil acima para destacar o grupo no gráfico.</p>`;

  container.querySelectorAll('.perfil-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const nome = btn.getAttribute('data-perfil');
      perfilSelecionado = perfilSelecionado === nome ? null : nome;
      atualizarScatterDatasets();
      renderLegendaPerfis();
    });
  });
}

function renderPerfisVazio(mensagemLista, mensagemInsight) {
  perfisAtuais = [];
  atualizarScatterDatasets();
  if ($('perf-lista')) {
    $('perf-lista').innerHTML = `<p class="card-subtitle">${mensagemLista}</p>`;
  }
  if ($('perf-insight')) {
    $('perf-insight').textContent = mensagemInsight;
  }
  if ($('perf-tec')) {
    $('perf-tec').innerHTML = '';
  }
}

async function carregarPerfis(idLote) {
  if (!perfChart) return;
  perfilSelecionado = null;

  if (!idLote) {
    renderPerfisVazio(
      'Selecione um lote para visualizar os perfis de uso.',
      'Nenhum lote selecionado.'
    );
    return;
  }

  let pts = [];
  try {
    const resp = await fetch(`/analise-lotes/${idLote}/perfis`, { headers: obterHeadersAuth() });
    const dados = await resp.json();
    if (!resp.ok || !dados.sucesso) {
      throw new Error(dados.mensagem || 'Erro ao carregar perfis de uso do lote.');
    }

    pts = (dados.pontos || []).map((p) => ({
      n: p.numero_serie,
      x: Number(p.percentual_ociosidade),
      y: Number(p.variacao_picos)
    }));
  } catch (erro) {
    renderPerfisVazio(erro.message, 'Não foi possível calcular os perfis de uso deste lote.');
    return;
  }

  if (!pts.length) {
    renderPerfisVazio(
      'Sem leituras de CPU nos últimos 7 dias para agrupar perfis de uso.',
      'Nenhuma leitura de CPU registrada nos últimos 7 dias para este lote.'
    );
    return;
  }

  if (pts.length === 1) {
    const nomePerfil = pts[0].x >= 60 ? 'Quase sem uso' : 'Uso constante';
    perfisAtuais = [{ nome: nomePerfil, m: pts, mo: pts[0].x, md: pts[0].y }];
    atualizarScatterDatasets();
    renderLegendaPerfis();
    $('perf-insight').textContent = `Apenas 1 equipamento possui leituras nos últimos 7 dias (${nomePerfil.toLowerCase()}).`;
    $('perf-tec').innerHTML = `
      <div class="stat-box">
        <small>Amostra insuficiente para agrupamento</small>
        <strong class="mono-val">n = 1 equipamento com leituras</strong>
      </div>
    `;
    return;
  }

  // Padronização (z-score)
  const mu = [media(pts.map((p) => p.x)), media(pts.map((p) => p.y))];
  const sd = [pts.map((p) => p.x), pts.map((p) => p.y)].map(
    (c, i) => Math.sqrt(media(c.map((v) => (v - mu[i]) ** 2))) || 1
  );
  const X = pts.map((p) => [(p.x - mu[0]) / sd[0], (p.y - mu[1]) / sd[1]]);

  // Escolha de k (2 ou 3) pela silhouette
  const candidatosK = pts.length >= 3 ? [2, 3] : [2];
  const sils = {};
  let melhor = null;
  for (const k of candidatosK) {
    const lab = kmeans(X, k);
    const sc = silhouette(X, lab, k);
    sils[k] = sc;
    if (!melhor || sc > melhor.sc) melhor = { k, sc, lab };
  }
  const { k, sc, lab } = melhor;

  // Nomeação semântica dos grupos
  const gs = Array.from({ length: k }, (_, g) => {
    const m = pts.filter((_, i) => lab[i] === g);
    return { m, mo: media(m.map((p) => p.x)), md: media(m.map((p) => p.y)) };
  }).filter((g) => g.m.length);

  gs.sort((a, b) => b.mo - a.mo);
  let resto = gs;
  if (gs[0].mo >= 60) {
    gs[0].nome = 'Quase sem uso';
    resto = gs.slice(1);
  }
  const gMed = media(pts.map((p) => p.y));
  resto.sort((a, b) => b.md - a.md).forEach((g, i) => {
    g.nome = (i === 0 && (resto.length > 1 || g.md > gMed)) ? 'Uso em picos' : 'Uso constante';
  });

  perfisAtuais = gs;
  atualizarScatterDatasets();
  renderLegendaPerfis();

  // Teste de Kruskal-Wallis
  const temMultiplosGrupos = gs.length >= 2;
  const kwX = temMultiplosGrupos ? kruskal(gs.map((g) => g.m.map((p) => p.x))) : { H: 0, p: 1 };
  const kwY = temMultiplosGrupos ? kruskal(gs.map((g) => g.m.map((p) => p.y))) : { H: 0, p: 1 };
  const diferem = temMultiplosGrupos && Math.min(kwX.p, kwY.p) * 2 < ALFA;
  const q = sc >= 0.5 ? 'boa' : sc >= 0.25 ? 'razoável' : 'fraca';

  const resumoPerfis = gs.map((g) => {
    const rotulo = g.nome === 'Uso em picos' ? 'em picos' : g.nome.toLowerCase();
    return `${g.m.length} ${rotulo}`;
  }).join(', ');

  $('perf-insight').textContent =
    `Perfis encontrados: ${resumoPerfis}. Separação dos grupos: ${q}. ` +
    (diferem ? 'Os grupos são realmente diferentes entre si.' : 'A diferença entre os grupos pode ser acaso.');

  const k3Texto = sils[3] !== undefined ? fmt(sils[3].toFixed(2)) : '--';

  $('perf-tec').innerHTML = `
    <div class="stat-box">
      <small>Silhouette média (qualidade dos grupos)</small>
      <strong class="mono-val">${fmt(sc.toFixed(2))} (${q}) · k = ${k}</strong>
    </div>
    <div class="stat-box">
      <small>Comparação entre k=2 e k=3</small>
      <strong class="mono-val">k=2: ${fmt(sils[2].toFixed(2))} | k=3: ${k3Texto}</strong>
    </div>
    <div class="stat-box">
      <small>Kruskal-Wallis · % tempo parado</small>
      <strong class="mono-val">H = ${fmt(kwX.H.toFixed(2))} · p ${pFmt(kwX.p)}</strong>
    </div>
    <div class="stat-box">
      <small>Kruskal-Wallis · variação de uso</small>
      <strong class="mono-val">H = ${fmt(kwY.H.toFixed(2))} · p ${pFmt(kwY.p)} · n = ${pts.length}</strong>
    </div>
  `;
}

/* ============ 6. REATIVIDADE & RESUMO ============ */
function renderResumo() {
  const lote = obterDadosMockLote();
  const h = lote.historico;
  const { pct, anomalias } = calcIntegridade(lote);
  const v7 = +(h[h.length - 1] - h[h.length - 8]).toFixed(1);
  const dir = v7 < 0
    ? `queda de ${fmt(Math.abs(v7))} pontos`
    : v7 > 0
      ? `alta de ${fmt(v7)} pontos`
      : 'estável';

  $('resumo-texto').textContent =
    `O lote ${loteAtual} está com ${fmt(pct.toFixed(1))}% de integridade (${dir} em 7 dias). ` +
    `${anomalias} componente(s) em anomalia e ${nOciosos} equipamento(s) parado(s) mais de ${LIM_OCIOSO}% do tempo.`;
}

function atualizarReatividade() {
  const limite = getLimite();
  const lote = obterDadosMockLote();
  const { pct } = calcIntegridade(lote);

  $('slider-val').textContent = `${limite}%`;
  $('hint-histerese').textContent = `Alerta abre abaixo de ${limite}% e só resolve a partir de ${Math.min(limite + HISTERESE, 100)}%.`;
  $('hist-val').textContent = HISTERESE;

  const badge = $('alerta-status');
  const emAlerta = pct < limite;
  badge.textContent = emAlerta ? 'Alerta ativo' : 'Dentro do limite';
  badge.className = `badge ${emAlerta ? 'red' : 'green'}`;

  $('sim-num').textContent = gerarEventos(lote.historico, limite).filter((e) => e.tipo === 'Alerta aberto').length;
  renderNotificacoes(lote, limite);
  if (donut) donut.update('none');
  renderResumo();
}

async function atualizarTudo() {
  const lote = obterDadosMockLote();
  const dados = CATEGORIAS.map((c) => lote.estados[c.id].length);
  if (donut) donut.data.datasets[0].data = dados;
  renderLegenda(dados);
  atualizarReatividade();
  await Promise.all([
    carregarOciosidade(loteAtualId),
    carregarPerfis(loteAtualId)
  ]);
}

async function carregarLotes() {
  const select = $('lote-select');
  const idEmpresa = Number(localStorage.getItem('FK_EMPRESA'));
  const url = Number.isSafeInteger(idEmpresa) && idEmpresa > 0
    ? `/analise-lotes/lotes?idEmpresa=${idEmpresa}`
    : '/analise-lotes/lotes';

  try {
    const resp = await fetch(url, { headers: obterHeadersAuth() });
    const dados = await resp.json();
    if (!resp.ok || !dados.sucesso) {
      throw new Error(dados.mensagem || 'Não foi possível carregar os lotes.');
    }

    lotesDisponiveis = dados.lotes || [];
    select.innerHTML = '';

    if (!lotesDisponiveis.length) {
      select.innerHTML = '<option value="">Nenhum lote cadastrado</option>';
      loteAtualId = null;
      loteAtual = '--';
      return;
    }

    lotesDisponiveis.forEach((l) => {
      const opt = document.createElement('option');
      opt.value = String(l.id_lote_equipamento);
      opt.textContent = `${l.numero_lote} · Modelo ${l.nome_modelo}`;
      select.appendChild(opt);
    });

    loteAtualId = lotesDisponiveis[0].id_lote_equipamento;
    loteAtual = lotesDisponiveis[0].numero_lote;
  } catch (erro) {
    showToast(erro.message);
    loteAtualId = null;
  }
}

/* ============ 7. INICIALIZAÇÃO ============ */
window.addEventListener('DOMContentLoaded', async () => {
  initDonut();
  initPerfis();
  await carregarLotes();
  await atualizarTudo();

  $('lote-select').addEventListener('change', (e) => {
    const idSelecionado = Number(e.target.value);
    const loteEncontrado = lotesDisponiveis.find((l) => l.id_lote_equipamento === idSelecionado);
    loteAtualId = loteEncontrado ? loteEncontrado.id_lote_equipamento : null;
    loteAtual = loteEncontrado ? loteEncontrado.numero_lote : '--';
    atualizarTudo();
  });
  $('limite-slider').addEventListener('input', atualizarReatividade);
  $('toggle-email').addEventListener('change', atualizarReatividade);
  $('toggle-slack').addEventListener('change', atualizarReatividade);
  $('btn-salvar').addEventListener('click', () => showToast('Configuração de alerta salva com sucesso!'));
  $('link-alertas').addEventListener('click', (e) => {
    e.preventDefault();
    showToast('Abrindo Equipamentos por lote filtrado por: Somente com alertas');
  });
});
