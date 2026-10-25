const lotesMock = [
  {
    id_lote_equipamento: 1,
    numero_lote: "LT-2026-001",
    nome_modelo: "ECG-12",
    cliente: "CardioVida Ltda",
    equipamentos: [
      { componentes: [{ habilitado: true, valor_atual: 91, limite_uso: 85, limite_ociosidade: 15 }, { habilitado: true, valor_atual: 55, limite_uso: 80, limite_ociosidade: 20 }, { habilitado: true, valor_atual: 42, limite_uso: 90, limite_ociosidade: 15 }, { habilitado: true, valor_atual: 35, limite_uso: 80, limite_ociosidade: 20 }] },
      { componentes: [{ habilitado: true, valor_atual: 62, limite_uso: 85, limite_ociosidade: 15 }, { habilitado: true, valor_atual: 78, limite_uso: 80, limite_ociosidade: 20 }, { habilitado: true, valor_atual: 48, limite_uso: 90, limite_ociosidade: 15 }, { habilitado: true, valor_atual: 40, limite_uso: 80, limite_ociosidade: 20 }] }
    ],
    historicoForecasting: {
      labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6 (Proj)', 'Sem 7 (Proj)'],
      real: [58, 61, 64, 68, 72, null, null],
      projecao: [null, null, null, null, 72, 77, 83],
      limiteCritico: 85
    }
  },
  {
    id_lote_equipamento: 2,
    numero_lote: "LT-2026-002",
    nome_modelo: "BPAP",
    cliente: "PulmoTech Brasil",
    equipamentos: [
      { componentes: [{ habilitado: true, valor_atual: 45, limite_uso: 85, limite_ociosidade: 15 }, { habilitado: true, valor_atual: 75, limite_uso: 80, limite_ociosidade: 20 }, { habilitado: true, valor_atual: 30, limite_uso: 90, limite_ociosidade: 15 }, { habilitado: true, valor_atual: 12, limite_uso: 80, limite_ociosidade: 20 }] }
    ],
    historicoForecasting: {
      labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6 (Proj)', 'Sem 7 (Proj)'],
      real: [45, 47, 46, 48, 50, null, null],
      projecao: [null, null, null, null, 50, 52, 54],
      limiteCritico: 85
    }
  },
  {
    id_lote_equipamento: 3,
    numero_lote: "LT-2026-003",
    nome_modelo: "Osteomax",
    cliente: "OrtoSurgical S.A.",
    equipamentos: [
      { componentes: [{ habilitado: true, valor_atual: 45, limite_uso: 85, limite_ociosidade: 15 }, { habilitado: true, valor_atual: 50, limite_uso: 80, limite_ociosidade: 20 }, { habilitado: true, valor_atual: 35, limite_uso: 90, limite_ociosidade: 15 }, { habilitado: true, valor_atual: 40, limite_uso: 80, limite_ociosidade: 20 }] },
      { componentes: [{ habilitado: true, valor_atual: 42, limite_uso: 85, limite_ociosidade: 15 }, { habilitado: true, valor_atual: 52, limite_uso: 80, limite_ociosidade: 20 }, { habilitado: true, valor_atual: 32, limite_uso: 90, limite_ociosidade: 15 }, { habilitado: true, valor_atual: 38, limite_uso: 80, limite_ociosidade: 20 }] }
    ],
    historicoForecasting: {
      labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6 (Proj)', 'Sem 7 (Proj)'],
      real: [40, 42, 43, 44, 45, null, null],
      projecao: [null, null, null, null, 45, 46, 47],
      limiteCritico: 85
    }
  }
];

let pizzaChartInstance = null;
let forecastingChartInstance = null;
let correlationChartInstance = null;

function classificar(comp) {
  if (!comp.habilitado) return "Desabilitado";
  if (comp.valor_atual > comp.limite_uso) return "Excedeu";
  if (comp.valor_atual >= 0.9 * comp.limite_uso) return "Atencao";
  if (comp.valor_atual < comp.limite_ociosidade) return "Ociosidade";
  return "Normal";
}

function inicializar() {
  const select = document.getElementById("selectLoteGlobal");
  if (!select) return;
  select.innerHTML = lotesMock.map(l => `<option value="${l.id_lote_equipamento}">${l.numero_lote} · Modelo ${l.nome_modelo}</option>`).join("");
  
  if (lotesMock.length > 0) {
    atualizarDashboard(lotesMock[0].id_lote_equipamento);
  }
}

function mudarLoteGlobal(idLote) {
  atualizarDashboard(idLote);
}

function atualizarDashboard(idLote) {
  const lote = lotesMock.find(l => l.id_lote_equipamento === parseInt(idLote));
  if (!lote) return;

  const metaEl = document.getElementById("filterMeta");
  if (metaEl) {
    metaEl.innerHTML = `
      <div><b>Cliente:</b> ${lote.cliente}</div>
      <div><b>Modelo:</b> ${lote.nome_modelo}</div>
    `;
  }

  renderizarGraficoPizza(lote);
  renderizarGraficoForecasting(lote);
  renderizarGraficoCorrelacao();
}

function renderizarGraficoPizza(lote) {
  let qtdNormais = 0;
  let qtdAlertas = 0;

  lote.equipamentos.forEach(eq => {
    eq.componentes.forEach(c => {
      if (!c.habilitado) return;
      if (classificar(c) === "Normal") qtdNormais++;
      else qtdAlertas++;
    });
  });

  const ctx = document.getElementById('pizzaLoteCanvas');
  if (!ctx) return;

  if (pizzaChartInstance) pizzaChartInstance.destroy();

  pizzaChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Funcionando sem alerta', 'Em alerta / Anomalia'],
      datasets: [{
        data: [qtdNormais, qtdAlertas],
        backgroundColor: ['#10B981', '#EF4444'],
        borderWidth: 3,
        borderColor: '#FFFFFF'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, font: { family: 'Geist', size: 12 } } },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = qtdNormais + qtdAlertas;
              const val = context.raw;
              const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
              return ` ${context.label}: ${val} (${pct}%)`;
            }
          }
        }
      },
      cutout: '70%'
    }
  });

  const totalComp = qtdNormais + qtdAlertas;
  const taxaSucesso = totalComp > 0 ? ((qtdNormais / totalComp) * 100).toFixed(1) : 0;
  
  const footerEl = document.getElementById("batchSummaryFooter");
  if (footerEl) {
    footerEl.innerHTML = `
      <div class="summary-item"><span class="summary-label">Componentes</span><span class="summary-value">${totalComp}</span></div>
      <div class="summary-item"><span class="summary-label">Integridade</span><span class="summary-value" style="color:var(--status-normal);">${taxaSucesso}%</span></div>
      <div class="summary-item"><span class="summary-label">Anomalias</span><span class="summary-value" style="color:var(--status-excedeu);">${qtdAlertas}</span></div>
    `;
  }
}

function renderizarGraficoForecasting(lote) {
  const fData = lote.historicoForecasting;
  const ctx = document.getElementById('forecastingCanvas');
  if (!ctx) return;

  if (forecastingChartInstance) forecastingChartInstance.destroy();

  forecastingChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: fData.labels,
      datasets: [
        {
          label: 'Histórico Real (Temp Média)',
          data: fData.real,
          borderColor: '#8E39E2',
          backgroundColor: 'rgba(142,57,226,0.1)',
          borderWidth: 2.5,
          tension: 0.2,
          fill: true
        },
        {
          label: 'Regressão / Projeção (Forecasting)',
          data: fData.projecao,
          borderColor: '#F59E0B',
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0.2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, font: { family: 'Geist', size: 11 } } },
        tooltip: { mode: 'index', intersect: false }
      },
      scales: {
        y: {
          min: 30,
          max: 100,
          grid: { color: '#ECEAF3' },
          ticks: { font: { family: 'JetBrains Mono', size: 10 } }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Geist', size: 11 } }
        }
      }
    }
  });

  const fFooter = document.getElementById("forecastingFooter");
  if (fFooter) {
    fFooter.innerHTML = `
      <div class="summary-item"><span class="summary-label">Tendência (Slope)</span><span class="summary-value" style="color:var(--primary);">+3.5 ºC/sem</span></div>
      <div class="summary-item"><span class="summary-label">Limite Crítico</span><span class="summary-value" style="color:var(--status-excedeu);">${fData.limiteCritico} ºC</span></div>
      <div class="summary-item"><span class="summary-label">Risco de Exaustão</span><span class="summary-value">Em ~3 semanas</span></div>
    `;
  }
}

function renderizarGraficoCorrelacao() {
  const ctx = document.getElementById('correlationCanvas');
  if (!ctx) return;

  if (correlationChartInstance) correlationChartInstance.destroy();

  correlationChartInstance = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: 'LT-2026-001 (ECG-12)',
          data: [
            { x: 120, y: 58.0 },
            { x: 240, y: 67.0 },
            { x: 360, y: 76.0 },
            { x: 480, y: 84.0 },
            { x: 600, y: 92.0 }
          ],
          backgroundColor: '#EF4444',
          borderColor: '#EF4444',
          pointRadius: 6,
          pointHoverRadius: 8,
          showLine: true,
          borderDash: [5, 5],
          borderWidth: 2
        },
        {
          label: 'LT-2026-002 (BPAP)',
          data: [
            { x: 100, y: 52.0 },
            { x: 200, y: 56.0 },
            { x: 300, y: 61.0 },
            { x: 400, y: 65.0 }
          ],
          backgroundColor: '#8E39E2',
          borderColor: '#8E39E2',
          pointRadius: 6,
          pointHoverRadius: 8,
          showLine: true,
          borderDash: [5, 5],
          borderWidth: 2
        },
        {
          label: 'LT-2026-003 (Osteomax)',
          data: [
            { x: 50, y: 45.0 },
            { x: 150, y: 49.0 },
            { x: 250, y: 53.0 }
          ],
          backgroundColor: '#10B981',
          borderColor: '#10B981',
          pointRadius: 6,
          pointHoverRadius: 8,
          showLine: true,
          borderDash: [5, 5],
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 12, font: { family: 'Geist', size: 11 } }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return ` ${context.dataset.label}: Uptime ${context.raw.x}h | Temp ${context.raw.y}ºC`;
            }
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Uptime Contínuo (Horas)', font: { family: 'Geist', size: 12 } },
          grid: { color: '#ECEAF3' },
          ticks: { font: { family: 'JetBrains Mono', size: 10 } }
        },
        y: {
          title: { display: true, text: 'Temperatura da CPU (ºC)', font: { family: 'Geist', size: 12 } },
          min: 40,
          max: 100,
          grid: { color: '#ECEAF3' },
          ticks: { font: { family: 'JetBrains Mono', size: 10 } }
        }
      }
    }
  });
}

window.onload = inicializar;