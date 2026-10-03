# BioTrace 🏥

![STATUS EM DESENVOLVIMENTO](https://img.shields.io/badge/Status-Em%20Desenvolvimento-orange?style=for-the-badge)
![INSTITUIÇÃO SPTECH SCHOOL](https://img.shields.io/badge/Institui%C3%A7%C3%A3o-SPTech%20School-blue?style=for-the-badge)

**Monitoramento de Componentes de Hardware para Equipamentos Hospitalares**

## 📖 Sobre o Projeto

A eficiência e a confiabilidade do atendimento em UTIs e Unidades Semi-Intensivas dependem diretamente da estabilidade dos hardwares dos dispositivos médicos à beira do leito. Em ambientes hospitalares dinâmicos, esses equipamentos sofrem com sobrecargas de processamento, vazamentos de memória e falhas de rede. Quando o sistema congela, interrompe-se a transmissão contínua de sinais vitais para a central de enfermagem.

Atualmente, cerca de 88% das indisponibilidades (que somam uma média de 49 horas anuais) só são identificadas de forma reativa, após a equipe médica constatar o travamento físico no quarto do paciente. O **BioTrace** nasce para transformar a atuação da equipe de TI Hospitalar e Engenharia Clínica de reativa para preventiva, mitigando riscos inestimáveis à vida humana e prejuízos operacionais.

### 🎯 Objetivo

Desenvolver uma aplicação baseada no modelo cliente-servidor para o monitoramento contínuo de computadores e dispositivos relacionados à infraestrutura hospitalar. O sistema realiza a coleta em tempo real de métricas críticas (CPU, RAM, disco, rede e processos), enviando-as a um painel web centralizado. A solução aplica conceitos do ITIL (Monitoramento de Serviços, Gestão de Incidentes e Gestão de Problemas) para identificar anomalias, emitir alertas e abrir chamados antes que os dispositivos congelem.

---

## ✨ Funcionalidades Principais

* **Monitoramento Contínuo:** Coleta automática e periódica do percentual de uso de CPU, consumo de memória RAM, espaço em disco, estado da rede e processos vitais através de uma aplicação cliente (agente).
* **Dashboard Centralizado:** Painel web responsivo com indicadores gráficos, histórico de equipamentos e classificação de estado por níveis de severidade (normal, atenção, crítico, indisponível).
* **Gestão da Infraestrutura (CRUDs):** Módulos completos para cadastro de usuários/perfis de acesso, dispositivos monitorados e configuração de regras de limites aceitáveis.
* **Alertas Automatizados via Slack:** Disparo imediato de notificações para canais de comunicação da equipe técnica quando os limites configurados são ultrapassados.
* **Abertura de Chamados no Jira:** Integração automática para criação de tickets de incidentes, anexando informações do equipamento, horários e logs produzidos.
* **Análise de Tendências:** Mecanismo integrado para identificar comportamentos anormais na infraestrutura com base no histórico das métricas, apoiando uma atuação preventiva.

---

## 🛠️ Tecnologias e Ferramentas

A arquitetura do projeto segue um fluxo de Agente > API > Banco de Dados > Aplicação Web, utilizando a seguinte stack de tecnologias:

### Front-end

![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)

### Back-end & Banco de Dados

![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![MySQL](https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white)

### Captura e Logs

![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![Java](https://img.shields.io/badge/java-%23ED8B00.svg?style=for-the-badge&logo=openjdk&logoColor=white)

### Outras Ferramentas

![Slack](https://img.shields.io/badge/Slack-4A154B?style=for-the-badge&logo=slack&logoColor=white)
![Jira](https://img.shields.io/badge/jira-%230052CC.svg?style=for-the-badge&logo=jira&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-%23232F3E.svg?style=for-the-badge&logo=amazonaws&logoColor=white)

---

## ⚙️ Metodologia

O projeto é conduzido utilizando **Metodologia Ágil**, estruturada em Sprints. O processo é apoiado por três pilares fundamentais:

1. **Comunicação:** Reuniões *Daily* para acompanhamento e remoção de impedimentos.
2. **Transparência:** Gestão visual do backlog via Planner, com tarefas estimadas usando a sequência de Fibonacci.
3. **Melhoria Contínua:** Retrospectivas ao final de cada Sprint para aprimorar processos e a qualidade das entregas voltadas ao público-alvo (Analistas de TI Hospitalar e Engenharia Clínica).

---

## 👥 Equipe Desenvolvedora

Este projeto está sendo construído pelos seguintes alunos:

- Ana Clara Ferreira Clarete
- Bruno Rafael Silva Gonçalves
- Eduardo Guaglioni Lupianez
- Jonatas Pereira Teles
- Miguel Pereira Soares
- Pedro Ludovic Nascimento Lima