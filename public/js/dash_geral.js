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
    // Dados para Regressão Linear / Forecasting (Ex: Média de temperatura do lote ao longo de semanas + projeção)
    historicoForecasting: {
      labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6 (Proj)', 'Sem 7 (Proj)'],
      real: [58, 61, 64, 68, 72, null, null],
      projecao: [null, null, null, null, 72, 77, 83], // Tendência de alta indicando risco de atingir limite (85ºC)
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

function classificar(comp) {
  if (!comp.habilitado) return "Desabilitado";
  if (comp.valor_atual > comp.limite_uso) return "Excedeu";
  if (comp.valor_atual >= 0.9 * comp.limite_uso) return "Atencao";
  if (comp.valor_atual < comp.limite_ociosidade) return "Ociosidade";
  return "Normal";
}

function inicializar() {
  const select = document.getElementById("selectLoteGlobal");
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

  // Atualiza metadados do topo
  document.getElementById("filterMeta").innerHTML = `
    <div><b>Cliente:</b> ${lote.cliente}</div>
    <div><b>Modelo:</b> ${lote.nome_modelo}</div>
  `;

  renderizarGraficoPizza(lote);
  renderizarGraficoForecasting(lote);
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
  
  document.getElementById("batchSummaryFooter").innerHTML = `
    <div class="summary-item"><span class="summary-label">Componentes</span><span class="summary-value">${totalComp}</span></div>
    <div class="summary-item"><span class="summary-label">Integridade</span><span class="summary-value" style="color:var(--status-normal);">${taxaSucesso}%</span></div>
    <div class="summary-item"><span class="summary-label">Anomalias</span><span class="summary-value" style="color:var(--status-excedeu);">${qtdAlertas}</span></div>
  `;
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

  document.getElementById("forecastingFooter").innerHTML = `
    <div class="summary-item"><span class="summary-label">Tendência (Slope)</span><span class="summary-value" style="color:var(--primary);">+3.5 ºC/sem</span></div>
    <div class="summary-item"><span class="summary-label">Limite Crítico</span><span class="summary-value" style="color:var(--status-excedeu);">${fData.limiteCritico} ºC</span></div>
    <div class="summary-item"><span class="summary-label">Risco de Exaustão</span><span class="summary-value">Em ~3 semanas</span></div>
  `;
}

window.onload = inicializar;