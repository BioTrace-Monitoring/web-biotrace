# Backend de protocolos e ensaios — etapa 2

## Preparação

Aplicar o esquema original e o script simplificado `001_engenharia_validacao.sql` do repositório `bd-biotrace` na base local. O arquivo atualmente está na raiz daquele repositório.

O servidor usa as configurações existentes de banco e JWT. Execute `npm start` após configurar o ambiente local normalmente. Todas as rotas abaixo exigem `Authorization: Bearer TOKEN_DO_LOGIN`.

A empresa e o usuário vêm do JWT. O backend também confere no banco se o usuário ainda pertence à empresa e é Administrador ou Gestor. O corpo das requisições não escolhe a empresa.

## Rotas

| Método | Caminho | Operação |
|---|---|---|
| GET | `/engenharia/protocolos` | Listar protocolos da empresa |
| GET | `/engenharia/protocolos/:id` | Consultar um protocolo |
| POST | `/engenharia/protocolos` | Criar protocolo na versão 1 |
| POST | `/engenharia/protocolos/:id/versoes` | Criar nova versão com todos os campos preenchidos |
| GET | `/engenharia/ensaios` | Listar ensaios da empresa |
| GET | `/engenharia/ensaios/:id` | Consultar ensaio e participantes |
| POST | `/engenharia/ensaios` | Criar ensaio planejado e seus participantes |
| POST | `/engenharia/ensaios/:id/iniciar` | Registrar início e término previsto |
| POST | `/engenharia/ensaios/:id/cancelar` | Cancelar ensaio planejado ou em execução |

Criações retornam HTTP 201, consultas e transições retornam 200. Erros de preenchimento retornam 400, sessão ausente 401, acesso negado 403, registro não encontrado na empresa 404 e conflito de estado 409. Datas retornam ISO em UTC.

## Criar protocolo

Exemplo de corpo JSON. Substituir o ID pelo cadastro real do modelo de equipamento da empresa:

```json
{
  "nome": "Validação do ECG-12",
  "procedimento": "Operar sob carga padronizada e registrar as verificações do protocolo.",
  "duracao_minutos": 1440,
  "intervalo_coleta_segundos": 180,
  "cobertura_minima_percentual": 95,
  "tolerancia_envio_minutos": 60,
  "limite_temperatura": 85,
  "limite_cpu": 95,
  "limite_ram": 90,
  "minimo_disco_livre": 20,
  "checklist_layout": "Conferir o posicionamento do dissipador.",
  "checklist_compatibilidade": "Testar os periféricos previstos.",
  "checklist_funcionamento": "Executar os cenários de operação.",
  "fk_modelo_equipamento": 1
}
```

Os valores são exemplos de configuração, não critérios automaticamente aprovados para equipamentos reais. `fk_responsavel` é opcional e assume o usuário autenticado. Quando informado, deve ser Administrador ou Gestor da mesma empresa.

As novas versões usam o mesmo corpo e mantêm nome e modelo de equipamento do protocolo original. A versão é calculada pelo servidor. Os registros antigos permanecem intactos; não há endpoint de alteração ou exclusão de protocolos utilizados. O banco bloqueia a linha do modelo durante o cadastro para serializar a numeração das versões.

## Criar ensaio

```json
{
  "fk_protocolo": 1,
  "ambiente": "bancada",
  "equipamentos": [1, 2],
  "observacoes": "Ensaio acadêmico com notebooks.",
  "reinicios_programados": "Nenhum reinício programado."
}
```

Selecionar IDs reais das unidades, não números de série digitados livremente. O responsável também pode ser informado. Todos os participantes devem pertencer à empresa e ao modelo de equipamento do protocolo. Em `campo`, precisam estar alocados em hospitais da empresa. Em `bancada`, a alocação não é obrigatória.

O servidor salva ensaio e participantes na mesma transação. Ao iniciar, revalida os vínculos e registra os lotes observados naquele instante. `inicio` é o horário atual UTC do servidor e `termino_previsto` soma a duração do protocolo. A requisição de início não liga o script Python. A captura precisa estar executando nos notebooks.

Repetir o início de um ensaio em execução devolve o mesmo início, sem reiniciar o relógio. Ensaios cancelados ou finalizados não podem ser iniciados. O cancelamento também pode ser repetido sem alterar o registro.

## Validação local

O teste `tests/engenharia.integration.test.js` requer banco descartável com o esquema e migração já aplicados. Ele insere fixtures com IDs 5001–5003 e deve ser executado em uma base vazia de testes, nunca na base de uso. Não carrega arquivos `.env` automaticamente.

Configure `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`, `AMBIENTE_PROCESSO` e uma chave `JWT_SECRET` exclusiva para testes. Então execute:

```bash
ENGENHARIA_TESTE_BANCO=isolado node --test tests/engenharia.integration.test.js
```

O teste cria um servidor HTTP temporário e verifica autenticação, cargo, isolamento de empresa, validação, versões concorrentes, transações, participantes, datas UTC, repetição de início e cancelamento. Sem a variável de confirmação, o teste é ignorado.

## Próximas etapas

As telas continuam demonstrativas nesta etapa. Ainda serão conectadas a estas rotas após validação do usuário. Relatórios, checklist, correções, leitura da Gold e processamento periódico serão implementados nas etapas seguintes. O vencimento do término previsto ainda não muda o estado automaticamente. O teste não acessa S3 ou AWS.
