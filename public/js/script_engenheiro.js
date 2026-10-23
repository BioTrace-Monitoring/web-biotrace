const lotesMock = [
  {
    id_lote_equipamento: 1,
    numero_lote: "LT-2026-001",
    nome_modelo: "ECG-12",
    razao_social: "CardioVida Equipamentos Ltda",
    equipamentos: [
      {
        id_equipamento: 101,
        numero_serie: "ECG12-0001",
        nome_hospital: "Hospital São Lucas",
        componentes: [
          { id_componente: 1, nome_componente: "CPU", tipo_metrica: "Uso", unidade: "%", limite_uso: 85, limite_ociosidade: 15, habilitado: true, valor_atual: 91, status_leitura: "ok", historico: [65,66,68,70,72,71,73,75,74,76,78,80,82,81,83,84,85,86,88,87,89,90,90,91] },
          { id_componente: 2, nome_componente: "Memória RAM", tipo_metrica: "Uso", unidade: "%", limite_uso: 80, limite_ociosidade: 20, habilitado: true, valor_atual: 55, status_leitura: "ok", historico: [50,52,51,53,54,55,52,54,55,53,55,54,56,55,54,53,55,54,55,56,54,55,54,55] },
          { id_componente: 3, nome_componente: "Disco", tipo_metrica: "Uso", unidade: "%", limite_uso: 90, limite_ociosidade: 15, habilitado: true, valor_atual: 42, status_leitura: "ok", historico: [40,41,40,42,41,40,41,42,41,42,40,41,42,41,42,40,41,42,41,42,40,41,42,42] },
          { id_componente: 4, nome_componente: "Rede", tipo_metrica: "Uso", unidade: "%", limite_uso: 80, limite_ociosidade: 20, habilitado: true, valor_atual: 35, status_leitura: "ok", historico: [30,32,34,35,33,35,34,36,35,34,35,33,35,34,35,33,35,34,35,34,35,34,35,35] }
        ]
      },
      {
        id_equipamento: 102,
        numero_serie: "ECG12-0002",
        nome_hospital: "Hospital São Lucas",
        componentes: [
          { id_componente: 5, nome_componente: "CPU", tipo_metrica: "Uso", unidade: "%", limite_uso: 85, limite_ociosidade: 15, habilitado: true, valor_atual: 62, status_leitura: "ok", historico: [60,61,60,62,61,63,62,60,61,62,61,63,62,61,60,62,61,63,62,61,60,62,61,62] },
          { id_componente: 6, nome_componente: "Memória RAM", tipo_metrica: "Uso", unidade: "%", limite_uso: 80, limite_ociosidade: 20, habilitado: true, valor_atual: 78, status_leitura: "ok", historico: [68,69,70,71,72,72,73,74,75,74,75,76,75,76,77,76,77,78,77,78,77,78,77,78] },
          { id_componente: 7, nome_componente: "Disco", tipo_metrica: "Uso", unidade: "%", limite_uso: 90, limite_ociosidade: 15, habilitado: true, valor_atual: 48, status_leitura: "ok", historico: [45,46,45,47,46,48,47,48,46,47,48,47,46,47,48,47,48,46,47,48,47,48,47,48] },
          { id_componente: 8, nome_componente: "Rede", tipo_metrica: "Uso", unidade: "%", limite_uso: 80, limite_ociosidade: 20, habilitado: true, valor_atual: 40, status_leitura: "ok", historico: [38,39,40,39,41,40,39,40,41,40,39,40,41,40,39,40,41,40,39,40,41,40,39,40] }
        ]
      },
      {
        id_equipamento: 103,
        numero_serie: "ECG12-0003",
        nome_hospital: "Hospital Vida",
        componentes: [
          { id_componente: 9, nome_componente: "CPU", tipo_metrica: "Uso", unidade: "%", limite_uso: 85, limite_ociosidade: 15, habilitado: true, valor_atual: 58, status_leitura: "ok", historico: [55,56,57,58,56,57,58,57,56,58,57,56,58,57,56,58,57,56,58,57,56,58,57,58] },
          { id_componente: 10, nome_componente: "Memória RAM", tipo_metrica: "Uso", unidade: "%", limite_uso: 80, limite_ociosidade: 20, habilitado: true, valor_atual: 64, status_leitura: "ok", historico: [60,61,62,63,62,64,63,62,64,63,62,64,63,62,64,63,62,64,63,62,64,63,62,64] },
          { id_componente: 11, nome_componente: "Disco", tipo_metrica: "Uso", unidade: "%", limite_uso: 90, limite_ociosidade: 15, habilitado: true, valor_atual: 93, status_leitura: "ok", historico: [75,76,78,80,81,83,84,86,85,87,88,89,90,90,91,91,92,92,93,92,93,93,93,93] },
          { id_componente: 12, nome_componente: "Rede", tipo_metrica: "Uso", unidade: "%", limite_uso: 80, limite_ociosidade: 20, habilitado: true, valor_atual: 45, status_leitura: "ok", historico: [42,43,44,45,43,44,45,44,43,45,44,43,45,44,43,45,44,43,45,44,43,45,44,45] }
        ]
      },
      {
        id_equipamento: 104,
        numero_serie: "ECG12-0004",
        nome_hospital: "Hospital Vida",
        componentes: [
          { id_componente: 13, nome_componente: "CPU", tipo_metrica: "Uso", unidade: "%", limite_uso: 85, limite_ociosidade: 15, habilitado: true, valor_atual: 50, status_leitura: "ok", historico: [48,49,50,49,51,50,49,50,51,50,49,50,51,50,49,50,51,50,49,50,51,50,49,50] },
          { id_componente: 14, nome_componente: "Memória RAM", tipo_metrica: "Uso", unidade: "%", limite_uso: 80, limite_ociosidade: 20, habilitado: true, valor_atual: 58, status_leitura: "ok", historico: [55,56,57,58,56,57,58,57,56,58,57,56,58,57,56,58,57,56,58,57,56,58,57,58] },
          { id_componente: 15, nome_componente: "Disco", tipo_metrica: "Uso", unidade: "%", limite_uso: 90, limite_ociosidade: 15, habilitado: true, valor_atual: 38, status_leitura: "ok", historico: [35,36,37,38,36,37,38,37,36,38,37,36,38,37,36,38,37,36,38,37,36,38,37,38] },
          { id_componente: 16, nome_componente: "Rede", tipo_metrica: "Uso", unidade: "%", limite_uso: 80, limite_ociosidade: 20, habilitado: true, valor_atual: 0, status_leitura: "sem_leitura", historico: [40,42,41,43,42,44,42,43,41,40,42,41,43,42,40,41,42,40,41,39,38,null,null,null] }
        ]
      },
      {
        id_equipamento: 105,
        numero_serie: "ECG12-0005",
        nome_hospital: "Santa Clara",
        componentes: [
          { id_componente: 17, nome_componente: "CPU", tipo_metrica: "Uso", unidade: "%", limite_uso: 85, limite_ociosidade: 15, habilitado: true, valor_atual: 79, status_leitura: "ok", historico: [65,67,68,70,71,72,73,74,75,76,76,77,78,77,78,78,79,78,79,78,79,78,79,79] },
          { id_componente: 18, nome_componente: "Memória RAM", tipo_metrica: "Uso", unidade: "%", limite_uso: 80, limite_ociosidade: 20, habilitado: true, valor_atual: 60, status_leitura: "ok", historico: [58,59,60,59,61,60,59,60,61,60,59,60,61,60,59,60,61,60,59,60,61,60,59,60] },
          { id_componente: 19, nome_componente: "Disco", tipo_metrica: "Uso", unidade: "%", limite_uso: 90, limite_ociosidade: 15, habilitado: true, valor_atual: 52, status_leitura: "ok", historico: [50,51,52,51,53,52,51,52,53,52,51,52,53,52,51,52,53,52,51,52,53,52,51,52] },
          { id_componente: 20, nome_componente: "Rede", tipo_metrica: "Uso", unidade: "%", limite_uso: 80, limite_ociosidade: 20, habilitado: true, valor_atual: 30, status_leitura: "ok", historico: [28,29,30,29,31,30,29,30,31,30,29,30,31,30,29,30,31,30,29,30,31,30,29,30] }
        ]
      }
    ]
  },
  {
    id_lote_equipamento: 2,
    numero_lote: "LT-2026-002",
    nome_modelo: "BPAP",
    razao_social: "PulmoTech Brasil Ltda",
    equipamentos: [
      {
        id_equipamento: 201,
        numero_serie: "BPAP-0101",
        nome_hospital: "Hospital São Lucas",
        componentes: [
          { id_componente: 21, nome_componente: "CPU", tipo_metrica: "Uso", unidade: "%", limite_uso: 85, limite_ociosidade: 15, habilitado: true, valor_atual: 45, status_leitura: "ok", historico: [42,43,44,45,43,44,45,44,43,45,44,43,45,44,43,45,44,43,45,44,43,45,44,45] },
          { id_componente: 22, nome_componente: "Memória RAM", tipo_metrica: "Uso", unidade: "%", limite_uso: 80, limite_ociosidade: 20, habilitado: true, valor_atual: 75, status_leitura: "ok", historico: [65,67,68,70,71,72,73,74,73,74,75,74,75,74,75,74,75,74,75,74,75,74,75,75] },
          { id_componente: 23, nome_componente: "Disco", tipo_metrica: "Uso", unidade: "%", limite_uso: 90, limite_ociosidade: 15, habilitado: true, valor_atual: 30, status_leitura: "ok", historico: [28,29,30,29,31,30,29,30,31,30,29,30,31,30,29,30,31,30,29,30,31,30,29,30] },
          { id_componente: 24, nome_componente: "Rede", tipo_metrica: "Uso", unidade: "%", limite_uso: 80, limite_ociosidade: 20, habilitado: true, valor_atual: 12, status_leitura: "ok", historico: [25,22,20,18,16,15,14,13,12,13,12,13,12,13,12,13,12,13,12,13,12,13,12,12] }
        ]
      },
      {
        id_equipamento: 202,
        numero_serie: "BPAP-0102",
        nome_hospital: "Hospital Vida",
        componentes: [
          { id_componente: 25, nome_componente: "CPU", tipo_metrica: "Uso", unidade: "%", limite_uso: 85, limite_ociosidade: 15, habilitado: true, valor_atual: 50, status_leitura: "ok", historico: [48,49,50,49,51,50,49,50,51,50,49,50,51,50,49,50,51,50,49,50,51,50,49,50] },
          { id_componente: 26, nome_componente: "Memória RAM", tipo_metrica: "Uso", unidade: "%", limite_uso: 80, limite_ociosidade: 20, habilitado: true, valor_atual: 52, status_leitura: "ok", historico: [50,51,52,51,53,52,51,52,53,52,51,52,53,52,51,52,53,52,51,52,53,52,51,52] },
          { id_componente: 27, nome_componente: "Disco", tipo_metrica: "Uso", unidade: "%", limite_uso: 90, limite_ociosidade: 15, habilitado: true, valor_atual: 35, status_leitura: "ok", historico: [33,34,35,34,36,35,34,35,36,35,34,35,36,35,34,35,36,35,34,35,36,35,34,35] },
          { id_componente: 28, nome_componente: "Rede", tipo_metrica: "Uso", unidade: "%", limite_uso: 80, limite_ociosidade: 20, habilitado: true, valor_atual: 40, status_leitura: "ok", historico: [38,39,40,39,41,40,39,40,41,40,39,40,41,40,39,40,41,40,39,40,41,40,39,40] }
        ]
      },
      {
        id_equipamento: 203,
        numero_serie: "BPAP-0103",
        nome_hospital: "Santa Clara",
        componentes: [
          { id_componente: 29, nome_componente: "CPU", tipo_metrica: "Uso", unidade: "%", limite_uso: 85, limite_ociosidade: 15, habilitado: true, valor_atual: 40, status_leitura: "ok", historico: [38,39,40,39,41,40,39,40,41,40,39,40,41,40,39,40,41,40,39,40,41,40,39,40] },
          { id_componente: 30, nome_componente: "Memória RAM", tipo_metrica: "Uso", unidade: "%", limite_uso: 80, limite_ociosidade: 20, habilitado: true, valor_atual: 48, status_leitura: "ok", historico: [46,47,48,47,49,48,47,48,49,48,47,48,49,48,47,48,49,48,47,48,49,48,47,48] },
          { id_componente: 31, nome_componente: "Disco", tipo_metrica: "Uso", unidade: "%", limite_uso: 90, limite_ociosidade: 15, habilitado: true, valor_atual: 28, status_leitura: "ok", historico: [26,27,28,27,29,28,27,28,29,28,27,28,29,28,27,28,29,28,27,28,29,28,27,28] },
          { id_componente: 32, nome_componente: "Rede", tipo_metrica: "Uso", unidade: "%", limite_uso: 80, limite_ociosidade: 20, habilitado: true, valor_atual: 32, status_leitura: "ok", historico: [30,31,32,31,33,32,31,32,33,32,31,32,33,32,31,32,33,32,31,32,33,32,31,32] }
        ]
      },
      {
        id_equipamento: 204,
        numero_serie: "BPAP-0104",
        nome_hospital: "Santa Clara",
        componentes: [
          { id_componente: 33, nome_componente: "CPU", tipo_metrica: "Uso", unidade: "%", limite_uso: 85, limite_ociosidade: 15, habilitado: true, valor_atual: 42, status_leitura: "ok", historico: [40,41,42,41,43,42,41,42,43,42,41,42,43,42,41,42,43,42,41,42,43,42,41,42] },
          { id_componente: 34, nome_componente: "Memória RAM", tipo_metrica: "Uso", unidade: "%", limite_uso: 80, limite_ociosidade: 20, habilitado: true, valor_atual: 50, status_leitura: "ok", historico: [48,49,50,49,51,50,49,50,51,50,49,50,51,50,49,50,51,50,49,50,51,50,49,50] },
          { id_componente: 35, nome_componente: "Disco", tipo_metrica: "Uso", unidade: "%", limite_uso: 90, limite_ociosidade: 15, habilitado: true, valor_atual: 31, status_leitura: "ok", historico: [29,30,31,30,32,31,30,31,32,31,30,31,32,31,30,31,32,31,30,31,32,31,30,31] },
          { id_componente: 36, nome_componente: "Rede", tipo_metrica: "Uso", unidade: "%", limite_uso: 80, limite_ociosidade: 20, habilitado: true, valor_atual: 36, status_leitura: "ok", historico: [34,35,36,35,37,36,35,36,37,36,35,36,37,36,35,36,37,36,35,36,37,36,35,36] }
        ]
      }
    ]
  },
  {
    id_lote_equipamento: 3,
    numero_lote: "LT-2026-003",
    nome_modelo: "Osteomax",
    razao_social: "OrtoSurgical Sistemas Médicos S.A.",
    equipamentos: [
      {
        id_equipamento: 301,
        numero_serie: "OST-2001",
        nome_hospital: "Hospital São Lucas",
        componentes: [
          { id_componente: 37, nome_componente: "CPU", tipo_metrica: "Uso", unidade: "%", limite_uso: 85, limite_ociosidade: 15, habilitado: true, valor_atual: 45, status_leitura: "ok", historico: [40,42,44,45,43,45,44,45,43,45,44,45,43,45,44,45,43,45,44,45,43,45,44,45] },
          { id_componente: 38, nome_componente: "Memória RAM", tipo_metrica: "Uso", unidade: "%", limite_uso: 80, limite_ociosidade: 20, habilitado: true, valor_atual: 50, status_leitura: "ok", historico: [48,49,50,49,51,50,49,50,51,50,49,50,51,50,49,50,51,50,49,50,51,50,49,50] },
          { id_componente: 39, nome_componente: "Disco", tipo_metrica: "Uso", unidade: "%", limite_uso: 90, limite_ociosidade: 15, habilitado: true, valor_atual: 35, status_leitura: "ok", historico: [33,34,35,34,36,35,34,35,36,35,34,35,36,35,34,35,36,35,34,35,36,35,34,35] },
          { id_componente: 40, nome_componente: "Rede", tipo_metrica: "Uso", unidade: "%", limite_uso: 80, limite_ociosidade: 20, habilitado: true, valor_atual: 40, status_leitura: "ok", historico: [38,39,40,39,41,40,39,40,41,40,39,40,41,40,39,40,41,40,39,40,41,40,39,40] }
        ]
      },
      {
        id_equipamento: 302,
        numero_serie: "OST-2002",
        nome_hospital: "Hospital São Lucas",
        componentes: [
          { id_componente: 41, nome_componente: "CPU", tipo_metrica: "Uso", unidade: "%", limite_uso: 85, limite_ociosidade: 15, habilitado: true, valor_atual: 42, status_leitura: "ok", historico: [40,41,42,41,43,42,41,42,43,42,41,42,43,42,41,42,43,42,41,42,43,42,41,42] },
          { id_componente: 42, nome_componente: "Memória RAM", tipo_metrica: "Uso", unidade: "%", limite_uso: 80, limite_ociosidade: 20, habilitado: true, valor_atual: 52, status_leitura: "ok", historico: [50,51,52,51,53,52,51,52,53,52,51,52,53,52,51,52,53,52,51,52,53,52,51,52] },
          { id_componente: 43, nome_componente: "Disco", tipo_metrica: "Uso", unidade: "%", limite_uso: 90, limite_ociosidade: 15, habilitado: true, valor_atual: 32, status_leitura: "ok", historico: [30,31,32,31,33,32,31,32,33,32,31,32,33,32,31,32,33,32,31,32,33,32,31,32] },
          { id_componente: 44, nome_componente: "Rede", tipo_metrica: "Uso", unidade: "%", limite_uso: 80, limite_ociosidade: 20, habilitado: true, valor_atual: 38, status_leitura: "ok", historico: [36,37,38,37,39,38,37,38,39,38,37,38,39,38,37,38,39,38,37,38,39,38,37,38] }
        ]
      },
      {
        id_equipamento: 303,
        numero_serie: "OST-2003",
        nome_hospital: "Hospital Vida",
        componentes: [
          { id_componente: 45, nome_componente: "CPU", tipo_metrica: "Uso", unidade: "%", limite_uso: 85, limite_ociosidade: 15, habilitado: true, valor_atual: 48, status_leitura: "ok", historico: [46,47,48,47,49,48,47,48,49,48,47,48,49,48,47,48,49,48,47,48,49,48,47,48] },
          { id_componente: 46, nome_componente: "Memória RAM", tipo_metrica: "Uso", unidade: "%", limite_uso: 80, limite_ociosidade: 20, habilitado: true, valor_atual: 55, status_leitura: "ok", historico: [53,54,55,54,56,55,54,55,56,55,54,55,56,55,54,55,56,55,54,55,56,55,54,55] },
          { id_componente: 47, nome_componente: "Disco", tipo_metrica: "Uso", unidade: "%", limite_uso: 90, limite_ociosidade: 15, habilitado: true, valor_atual: 30, status_leitura: "ok", historico: [28,29,30,29,31,30,29,30,31,30,29,30,31,30,29,30,31,30,29,30,31,30,29,30] },
          { id_componente: 48, nome_componente: "Rede", tipo_metrica: "Uso", unidade: "%", limite_uso: 80, limite_ociosidade: 20, habilitado: true, valor_atual: 35, status_leitura: "ok", historico: [33,34,35,34,36,35,34,35,36,35,34,35,36,35,34,35,36,35,34,35,36,35,34,35] }
        ]
      },
      {
        id_equipamento: 304,
        numero_serie: "OST-2004",
        nome_hospital: "Hospital Vida",
        componentes: [
          { id_componente: 49, nome_componente: "CPU", tipo_metrica: "Uso", unidade: "%", limite_uso: 85, limite_ociosidade: 15, habilitado: true, valor_atual: 44, status_leitura: "ok", historico: [42,43,44,43,45,44,43,44,45,44,43,44,45,44,43,44,45,44,43,44,45,44,43,44] },
          { id_componente: 50, nome_componente: "Memória RAM", tipo_metrica: "Uso", unidade: "%", limite_uso: 80, limite_ociosidade: 20, habilitado: true, valor_atual: 51, status_leitura: "ok", historico: [49,50,51,50,52,51,50,51,52,51,50,51,52,51,50,51,52,51,50,51,52,51,50,51] },
          { id_componente: 51, nome_componente: "Disco", tipo_metrica: "Uso", unidade: "%", limite_uso: 90, limite_ociosidade: 15, habilitado: true, valor_atual: 29, status_leitura: "ok", historico: [27,28,29,28,30,29,28,29,30,29,28,29,30,29,28,29,30,29,28,29,30,29,28,29] },
          { id_componente: 52, nome_componente: "Rede", tipo_metrica: "Uso", unidade: "%", limite_uso: 80, limite_ociosidade: 20, habilitado: true, valor_atual: 33, status_leitura: "ok", historico: [31,32,33,32,34,33,32,33,34,33,32,33,34,33,32,33,34,33,32,33,34,33,32,33] }
        ]
      }
    ]
  }
];

async function buscarLotes() {
  return new Promise(resolve => setTimeout(() => resolve(JSON.parse(JSON.stringify(lotesMock))), 50));
}

async function buscarLote(id) {
  return new Promise(resolve => {
    setTimeout(() => {
      const lote = lotesMock.find(l => l.id_lote_equipamento === parseInt(id));
      resolve(lote ? JSON.parse(JSON.stringify(lote)) : null);
    }, 50);
  });
}

function classificar(componente) {
  if (!componente.habilitado) return "Desabilitado";
  if (componente.status_leitura === "sem_leitura") return "Falha";
  if (componente.valor_atual > componente.limite_uso) return "Excedeu o limite";
  if (componente.valor_atual >= 0.9 * componente.limite_uso) return "Atenção";
  if (componente.valor_atual < componente.limite_ociosidade) return "Abaixo da ociosidade";
  return "Normal";
}

const SEVERIDADE = {
  "Falha": 1,
  "Excedeu o limite": 2,
  "Atenção": 3,
  "Abaixo da ociosidade": 4,
  "Normal": 5,
  "Desabilitado": 6
};

const STATUS_INFO = {
  "Normal": { color: "var(--status-normal)", bg: "var(--status-normal-bg)", chipClass: "normal", icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' },
  "Atenção": { color: "var(--status-atencao)", bg: "var(--status-atencao-bg)", chipClass: "atencao", icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' },
  "Excedeu o limite": { color: "var(--status-excedeu)", bg: "var(--status-excedeu-bg)", chipClass: "excedeu", icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>' },
  "Falha": { color: "var(--status-falha)", bg: "var(--status-falha-bg)", chipClass: "falha", icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' },
  "Abaixo da ociosidade": { color: "var(--status-ociosidade)", bg: "var(--status-ociosidade-bg)", chipClass: "ociosidade", icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>' },
  "Desabilitado": { color: "var(--status-desabilitado)", bg: "var(--status-desabilitado-bg)", chipClass: "desabilitado", icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>' }
};

let loteAtual = null;
let todosLotes = [];
let filtroKpiStatus = null;
let filtroComponenteTipo = "Todos";
let itemSelecionado = null;
let chartInstance = null;

async function inicializar() {
  todosLotes = await buscarLotes();
  povoarSeletorLotes();
  if (todosLotes.length > 0) {
    await carregarLote(todosLotes[0].id_lote_equipamento);
  }
}

function povoarSeletorLotes() {
  const select = document.getElementById("selectLote");
  select.innerHTML = todosLotes.map(l => `<option value="${l.id_lote_equipamento}">${l.numero_lote} · Modelo ${l.nome_modelo}</option>`).join("");
}

async function alterarLote(id) {
  const main = document.getElementById("mainContainer");
  main.classList.add("fade-out");
  setTimeout(async () => {
    await carregarLote(id);
    main.classList.remove("fade-out");
  }, 200);
}

async function carregarLote(id) {
  loteAtual = await buscarLote(id);
  filtroKpiStatus = null;
  filtroComponenteTipo = "Todos";
  document.getElementById("inputBusca").value = "";
  renderizarTudo();
}

function extrairTodosComponentes(lote) {
  const lista = [];
  lote.equipamentos.forEach(eq => {
    eq.componentes.forEach(comp => {
      const st = classificar(comp);
      lista.push({
        ...comp,
        statusCalculado: st,
        numero_serie: eq.numero_serie,
        nome_hospital: eq.nome_hospital,
        id_equipamento: eq.id_equipamento
      });
    });
  });
  return lista;
}

function renderizarTudo() {
  if (!loteAtual) return;
  const componentes = extrairTodosComponentes(loteAtual);

  renderizarMetaLote(componentes);
  renderizarVeredito(componentes);
  renderizarKPIs(componentes);
  renderizarChipsComponentes(componentes);
  renderizarTabela(componentes);
}

function renderizarMetaLote(componentes) {
  const hospitais = [...new Set(loteAtual.equipamentos.map(e => e.nome_hospital))];
  const htmlMeta = `
    <div class="meta-item">
      <span class="meta-label">Modelo</span>
      <span class="meta-value">${loteAtual.nome_modelo}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Cliente</span>
      <span class="meta-value">${loteAtual.razao_social}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Equipamentos</span>
      <span class="meta-value font-mono">${loteAtual.equipamentos.length}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Componentes</span>
      <span class="meta-value font-mono">${componentes.length}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Hospitais</span>
      <div class="hospital-chips">
        ${hospitais.map(h => `<span class="chip-hospital">${h}</span>`).join("")}
      </div>
    </div>
  `;
  document.getElementById("batchMeta").innerHTML = htmlMeta;
}

function renderizarVeredito(componentes) {
  const contagem = {
    "Falha": 0, "Excedeu o limite": 0, "Atenção": 0, "Abaixo da ociosidade": 0, "Normal": 0, "Desabilitado": 0
  };
  componentes.forEach(c => contagem[c.statusCalculado]++);

  const banner = document.getElementById("verdictBanner");
  let classe = "", icon = "", titulo = "", sub = "";

  if (contagem["Falha"] > 0 || contagem["Excedeu o limite"] > 0) {
    classe = "verdict-reprovado";
    icon = STATUS_INFO["Excedeu o limite"].icon;
    const partes = [];
    if (contagem["Excedeu o limite"] > 0) partes.push(`${contagem["Excedeu o limite"]} componente(s) excedeu(ram) o limite`);
    if (contagem["Falha"] > 0) partes.push(`${contagem["Falha"]} está(ão) com falha`);
    titulo = `Lote reprovado para produção: ${partes.join(" e ")}.`;
    sub = "Revise os itens abaixo antes de liberar o lote.";
  } else if (contagem["Atenção"] > 0 || contagem["Abaixo da ociosidade"] > 0) {
    classe = "verdict-ressalvas";
    icon = STATUS_INFO["Atenção"].icon;
    const partes = [];
    if (contagem["Atenção"] > 0) partes.push(`${contagem["Atenção"]} componente(s) em atenção`);
    if (contagem["Abaixo da ociosidade"] > 0) partes.push(`${contagem["Abaixo da ociosidade"]} abaixo da ociosidade`);
    titulo = `Lote aprovado com ressalvas: ${partes.join(" e ")}.`;
    sub = "Recomenda-se verificação preventiva antes do envio.";
  } else {
    classe = "verdict-aprovado";
    icon = STATUS_INFO["Normal"].icon;
    titulo = "Lote 100% Aprovado para Produção";
    sub = "Todos os componentes avaliados estão dentro dos parâmetros ideais de operação.";
  }

  banner.className = `verdict-banner ${classe}`;
  banner.innerHTML = `
    <div class="verdict-icon">${icon}</div>
    <div class="verdict-content">
      <div class="verdict-title">${titulo}</div>
      <div class="verdict-subtitle">${sub}</div>
    </div>
  `;
}

function renderizarKPIs(componentes) {
  const contagem = {
    avaliados: componentes.filter(c => c.habilitado).length,
    "Normal": 0, "Atenção": 0, "Excedeu o limite": 0, "Falha": 0, "Abaixo da ociosidade": 0
  };
  componentes.forEach(c => {
    if (c.habilitado && contagem[c.statusCalculado] !== undefined) contagem[c.statusCalculado]++;
  });

  const kpis = [
    { key: null, label: "Componentes avaliados", count: contagem.avaliados, color: "var(--text)" },
    { key: "Normal", label: "Normais", count: contagem["Normal"], color: "var(--status-normal)" },
    { key: "Atenção", label: "Atenção", count: contagem["Atenção"], color: "var(--status-atencao)" },
    { key: "Excedeu o limite", label: "Excederam o limite", count: contagem["Excedeu o limite"], color: "var(--status-excedeu)" },
    { key: "Falha", label: "Falhas", count: contagem["Falha"], color: "var(--status-falha)" },
    { key: "Abaixo da ociosidade", label: "Abaixo da ociosidade", count: contagem["Abaixo da ociosidade"], color: "var(--status-ociosidade)" }
  ];

  const html = kpis.map(k => `
    <div class="kpi-card ${filtroKpiStatus === k.key ? 'active' : ''}" onclick="filtrarPorKpi('${k.key}')">
      <div class="kpi-header">
        <span class="kpi-title">${k.label}</span>
        ${k.key && STATUS_INFO[k.key] ? `<span style="color:${STATUS_INFO[k.key].color}">${STATUS_INFO[k.key].icon}</span>` : ''}
      </div>
      <div class="kpi-value" style="color: ${k.color}">${k.count}</div>
    </div>
  `).join("");

  document.getElementById("kpiGrid").innerHTML = html;
}

function filtrarPorKpi(key) {
  if (key === "null" || key === "undefined") key = null;
  filtroKpiStatus = (filtroKpiStatus === key) ? null : key;
  const componentes = extrairTodosComponentes(loteAtual);
  renderizarKPIs(componentes);
  renderizarTabela(componentes);
}

function renderizarChipsComponentes(componentes) {
  const tipos = ["Todos", "CPU", "Memória RAM", "Disco", "Rede"];
  const html = tipos.map(tipo => {
    let probCount = 0;
    componentes.forEach(c => {
      if (tipo === "Todos" || c.nome_componente === tipo) {
        if (["Falha", "Excedeu o limite", "Atenção", "Abaixo da ociosidade"].includes(c.statusCalculado)) {
          probCount++;
        }
      }
    });
    const active = filtroComponenteTipo === tipo ? "active" : "";
    return `
      <button class="chip-comp ${active}" onclick="selecionarTipoComponente('${tipo}')">
        ${tipo}
        ${probCount > 0 ? `<span class="chip-badge">${probCount}</span>` : ''}
      </button>
    `;
  }).join("");
  document.getElementById("componentChips").innerHTML = html;
}

function selecionarTipoComponente(tipo) {
  filtroComponenteTipo = tipo;
  const componentes = extrairTodosComponentes(loteAtual);
  renderizarChipsComponentes(componentes);
  renderizarTabela(componentes);
}

function atualizarFiltros() {
  if (!loteAtual) return;
  const componentes = extrairTodosComponentes(loteAtual);
  renderizarTabela(componentes);
}

function renderizarTabela(componentes) {
  const apenasProblemas = document.getElementById("toggleProblemas").checked;
  const busca = document.getElementById("inputBusca").value.toLowerCase().trim();

  let filtrados = componentes.filter(c => {
    if (apenasProblemas) {
      if (c.statusCalculado === "Normal" || c.statusCalculado === "Desabilitado") return false;
    }
    if (filtroKpiStatus && c.statusCalculado !== filtroKpiStatus) return false;
    if (filtroComponenteTipo !== "Todos" && c.nome_componente !== filtroComponenteTipo) return false;
    if (busca && !c.numero_serie.toLowerCase().includes(busca)) return false;
    return true;
  });

  filtrados.sort((a, b) => SEVERIDADE[a.statusCalculado] - SEVERIDADE[b.statusCalculado]);

  const tbody = document.getElementById("tableBody");

  if (filtrados.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <div class="empty-icon">${STATUS_INFO["Normal"].icon}</div>
            <div style="font-weight: 600; font-size: 16px; color: var(--text);">Nenhum problema encontrado neste lote</div>
            <div style="font-size: 13px;">Todos os componentes atendem aos critérios de filtragem atuais.</div>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  const rows = filtrados.map(c => {
    const info = STATUS_INFO[c.statusCalculado];
    let rowClass = "data-row";
    if (c.statusCalculado === "Excedeu o limite") rowClass += " row-critical";
    if (c.statusCalculado === "Falha") rowClass += " row-fail";

    let reguaHtml = "";
    if (c.statusCalculado === "Falha") {
      reguaHtml = `
        <div class="track-wrapper">
          <div class="track-bg no-reading"></div>
        </div>
      `;
    } else {
      const pctIdle = c.limite_ociosidade;
      const pctOk = c.limite_uso - c.limite_ociosidade;
      const pctOver = 100 - c.limite_uso;
      const posVal = Math.min(Math.max(c.valor_atual, 0), 100);

      reguaHtml = `
        <div class="track-wrapper">
          <div class="track-bg">
            <div class="track-zone-idle" style="width: ${pctIdle}%"></div>
            <div class="track-zone-ok" style="width: ${pctOk}%"></div>
            <div class="track-zone-over" style="width: ${pctOver}%"></div>
          </div>
          <div class="track-marker" style="left: ${pctIdle}%">
            <span class="track-marker-label">${c.limite_ociosidade}</span>
          </div>
          <div class="track-marker" style="left: ${c.limite_uso}%">
            <span class="track-marker-label">${c.limite_uso}</span>
          </div>
          <div class="track-dot" style="left: ${posVal}%; background-color: ${info.color}"></div>
        </div>
      `;
    }

    let margemText = "";
    if (c.statusCalculado === "Falha") {
      margemText = "sem leitura nas últimas 3 horas";
    } else if (c.valor_atual > c.limite_uso) {
      const diff = (c.valor_atual - c.limite_uso).toFixed(1).replace(".", ",");
      margemText = `<span style="color:var(--status-excedeu); font-weight:600;">${diff} p.p. acima do limite</span>`;
    } else if (c.valor_atual < c.limite_ociosidade) {
      const diff = (c.limite_ociosidade - c.valor_atual).toFixed(1).replace(".", ",");
      margemText = `<span style="color:var(--status-ociosidade); font-weight:600;">${diff} p.p. abaixo da ociosidade</span>`;
    } else {
      const diff = (c.limite_uso - c.valor_atual).toFixed(1).replace(".", ",");
      margemText = `${diff} p.p. do limite`;
    }

    return `
      <tr class="${rowClass}" tabindex="0" onclick="abrirDrawer('${c.id_componente}')" onkeydown="if(event.key==='Enter') abrirDrawer('${c.id_componente}')">
        <td>
          <span class="status-chip ${info.chipClass}">
            ${info.icon}
            ${c.statusCalculado}
          </span>
        </td>
        <td style="font-weight:600;">${c.nome_componente}</td>
        <td>
          <div class="equip-cell">
            <span class="equip-serial">${c.numero_serie}</span>
            <span class="equip-hospital">${c.nome_hospital}</span>
          </div>
        </td>
        <td>
          <span class="val-cell">${c.status_leitura === "sem_leitura" ? "N/A" : c.valor_atual + "%"}</span>
        </td>
        <td>${reguaHtml}</td>
        <td><span class="margin-text">${margemText}</span></td>
      </tr>
    `;
  }).join("");

  tbody.innerHTML = rows;
}

function abrirDrawer(idComponente) {
  const componentes = extrairTodosComponentes(loteAtual);
  itemSelecionado = componentes.find(c => c.id_componente === parseInt(idComponente));
  if (!itemSelecionado) return;

  const info = STATUS_INFO[itemSelecionado.statusCalculado];
  document.getElementById("drawerTitle").innerText = `${itemSelecionado.nome_componente} · ${itemSelecionado.numero_serie}`;

  let acaoTexto = "";
  if (itemSelecionado.statusCalculado === "Excedeu o limite") {
    acaoTexto = "Revisar dissipação e dimensionamento deste componente antes de liberar o lote.";
  } else if (itemSelecionado.statusCalculado === "Falha") {
    acaoTexto = "Verificar conexão e integridade do componente.";
  } else if (itemSelecionado.statusCalculado === "Atenção") {
    acaoTexto = "Monitorar: o valor está próximo do limite.";
  } else if (itemSelecionado.statusCalculado === "Abaixo da ociosidade") {
    acaoTexto = "Componente subutilizado: avaliar redimensionamento.";
  } else {
    acaoTexto = "Operação normal: nenhuma intervenção necessária.";
  }

  let margemStr = "";
  if (itemSelecionado.statusCalculado === "Falha") {
    margemStr = "Sem leitura";
  } else if (itemSelecionado.valor_atual > itemSelecionado.limite_uso) {
    margemStr = `${(itemSelecionado.valor_atual - itemSelecionado.limite_uso).toFixed(1).replace(".", ",")} p.p. acima do limite`;
  } else if (itemSelecionado.valor_atual < itemSelecionado.limite_ociosidade) {
    margemStr = `${(itemSelecionado.limite_ociosidade - itemSelecionado.valor_atual).toFixed(1).replace(".", ",")} p.p. abaixo da ociosidade`;
  } else {
    margemStr = `${(itemSelecionado.limite_uso - itemSelecionado.valor_atual).toFixed(1).replace(".", ",")} p.p. do limite`;
  }

  const bodyHtml = `
    <div class="drawer-detail-grid">
      <div class="drawer-detail-item">
        <span class="drawer-detail-label">Status</span>
        <span class="status-chip ${info.chipClass}" style="align-self: flex-start; margin-top:2px;">
          ${info.icon} ${itemSelecionado.statusCalculado}
        </span>
      </div>
      <div class="drawer-detail-item">
        <span class="drawer-detail-label">Valor Atual</span>
        <span class="drawer-detail-val font-mono" style="font-size:18px;">${itemSelecionado.status_leitura === "sem_leitura" ? "N/A" : itemSelecionado.valor_atual + "%"}</span>
      </div>
      <div class="drawer-detail-item">
        <span class="drawer-detail-label">Lote / Modelo</span>
        <span class="drawer-detail-val">${loteAtual.numero_lote} (${loteAtual.nome_modelo})</span>
      </div>
      <div class="drawer-detail-item">
        <span class="drawer-detail-label">Hospital</span>
        <span class="drawer-detail-val">${itemSelecionado.nome_hospital}</span>
      </div>
      <div class="drawer-detail-item">
        <span class="drawer-detail-label">Limites (Ociosidade / Uso)</span>
        <span class="drawer-detail-val font-mono">${itemSelecionado.limite_ociosidade}% / ${itemSelecionado.limite_uso}%</span>
      </div>
      <div class="drawer-detail-item">
        <span class="drawer-detail-label">Margem Operacional</span>
        <span class="drawer-detail-val">${margemStr}</span>
      </div>
    </div>

    <div class="chart-card">
      <span class="chart-title">Histórico de 24h (Chart.js)</span>
      <div class="chart-container-box">
        <canvas id="drawerChartCanvas"></canvas>
      </div>
    </div>

    <div class="action-block" style="background:${info.bg}; color:${info.color}; border:1px solid ${info.color}33;">
      <div class="action-title">${info.icon} Ação Sugerida</div>
      <div>${acaoTexto}</div>
    </div>
  `;

  document.getElementById("drawerBody").innerHTML = bodyHtml;
  document.getElementById("drawerOverlay").classList.add("open");

  setTimeout(() => renderChartJs(itemSelecionado), 50);
}

function renderChartJs(item) {
  const ctx = document.getElementById('drawerChartCanvas');
  if (!ctx) return;

  if (chartInstance) {
    chartInstance.destroy();
  }

  const historico = item.historico || [];
  const labels = Array.from({length: 24}, (_, i) => `${24 - i}h atrás`);
  labels[23] = "Atual";

  const limiteUsoData = Array(24).fill(item.limite_uso);
  const limiteOciosidadeData = Array(24).fill(item.limite_ociosidade);

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Leitura (%)',
          data: historico,
          borderColor: '#8E39E2',
          backgroundColor: 'rgba(142, 57, 226, 0.1)',
          borderWidth: 2.5,
          pointRadius: 3,
          pointBackgroundColor: '#8E39E2',
          fill: true,
          spanGaps: false,
          tension: 0.3
        },
        {
          label: 'Limite Uso (%)',
          data: limiteUsoData,
          borderColor: '#EF4444',
          borderWidth: 1.5,
          borderDash: [4, 4],
          pointRadius: 0,
          fill: false
        },
        {
          label: 'Limite Ociosidade (%)',
          data: limiteOciosidadeData,
          borderColor: '#3B82F6',
          borderWidth: 1.5,
          borderDash: [4, 4],
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            boxWidth: 12,
            font: { family: 'Geist', size: 11 }
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        y: {
          min: 0,
          max: 100,
          ticks: {
            stepSize: 20,
            font: { family: 'JetBrains Mono', size: 10 }
          },
          grid: { color: '#ECEAF3' }
        },
        x: {
          ticks: {
            display: false
          },
          grid: { display: false }
        }
      }
    }
  });
}

function fecharDrawer(event) {
  if (event.target.id === "drawerOverlay") {
    fecharDrawerDirect();
  }
}

function fecharDrawerDirect() {
  document.getElementById("drawerOverlay").classList.remove("open");
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    fecharDrawerDirect();
  }
});

function exportarCSV() {
  if (!loteAtual) return;
  const componentes = extrairTodosComponentes(loteAtual);
  const problemas = componentes.filter(c => ["Falha", "Excedeu o limite", "Atenção", "Abaixo da ociosidade"].includes(c.statusCalculado));

  if (problemas.length === 0) {
    alert("Nenhum problema encontrado neste lote para exportar.");
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,Lote;Modelo;Hospital;Numero_Serie;Componente;Status;Valor_Atual;Limite_Ociosidade;Limite_Uso\n";

  problemas.forEach(p => {
    csvContent += `${loteAtual.numero_lote};${loteAtual.nome_modelo};${p.nome_hospital};${p.numero_serie};${p.nome_componente};${p.statusCalculado};${p.valor_atual};${p.limite_ociosidade};${p.limite_uso}\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `problemas_${loteAtual.numero_lote}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

window.onload = inicializar;