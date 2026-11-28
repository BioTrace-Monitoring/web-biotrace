# Eficiência de Chamados no BioTrace

## O que acontece quando você abre a tela

1. O login guarda `ID_USUARIO`, `FK_EMPRESA` e o token no navegador. O [JavaScript da dashboard](public/painel_cliente/js/dash_eficiencia_chamados.js) lê esses valores e dispara duas requisições em paralelo.
2. **`GET /mapa/locais/:idUsuario`** confere o usuário do token, consulta o MySQL e devolve `empresaId`, `bases` e `hospitais`. O backend transforma CEP e número em coordenadas usando ViaCEP e serviços de geocodificação. A tela usa os locais retornados para montar o mapa. [Rota](src/routes/mapa.js) · [Controller](src/controllers/localizacaoController.js) · [SQL](src/models/localizacaoModel.js)
3. **`GET /chamados/:idEmpresa`** confere a empresa do token, coloca o ID no endereço configurado e faz um GET para a API Java. A API Java consulta o Jira e devolve os funcionários com seus chamados concluídos. O Express valida a resposta, calcula os tempos e envia os dados para a dashboard. [Rota](src/routes/chamados.js) · [Controller](src/controllers/chamadosController.js)
4. A dashboard usa a data de resolução para filtrar os últimos 1, 3, 6 ou 12 meses. Ao selecionar um chamado, ela cruza os IDs do chamado com os cadastros do MySQL para mostrar sua base e seu hospital no mapa.

## O que a API Java precisa receber e devolver

Configure o endereço abaixo no `.env.dev` em desenvolvimento ou no `.env` em produção. Reinicie o Express após editar o arquivo. Use um endereço que a máquina do Express consiga acessar e mantenha `{idEmpresa}` na posição esperada pelo Java. A chamada será um GET sem corpo, com `Accept: application/json` e prazo de 15 segundos. [Configuração do ambiente](app.js)

```env
JAVA_CHAMADOS_URL=http://192.168.1.50:8080/jira/chamados/{idEmpresa}
```

Para a empresa 7, o Java recebe `GET /jira/chamados/7`. Ele deve filtrar pela empresa e devolver um JSON como este:

```json
{
  "empresaId": 7,
  "funcionarios": [
    {
      "id": "tecnico-42",
      "nome": "Mariana Silva",
      "cargo": "Técnica de equipamentos",
      "baseId": 3,
      "chamados": [
        {
          "id": "BT-123",
          "equipamento": "BT-2048",
          "hospitalId": 12,
          "inicioAtendimento": "2026-11-23T07:00:00-03:00",
          "resolvidoEm": "2026-11-23T08:00:00-03:00",
          "deslocamentoEstimadoMinutos": 35
        }
      ]
    }
  ]
}
```

- `empresaId` deve ser numérico e igual ao solicitado. Use IDs estáveis para funcionários e a chave do Jira para cada chamado. Envie os chamados concluídos dos últimos 12 meses. Use listas vazias quando não houver registros.
- `inicioAtendimento` vem do horário da primeira mudança para **Em andamento** no histórico do Jira. `resolvidoEm` vem da data de resolução. Envie datas ISO 8601 com fuso horário. A data de resolução é obrigatória. O início pode ser `null` para chamados antigos sem esse registro.
- `baseId` e `hospitalId` devem corresponder aos IDs do MySQL. Se um chamado informar sua própria `baseId`, ela tem prioridade sobre a base do funcionário. `cargo`, `equipamento` e os IDs de locais podem ficar ausentes quando indisponíveis.
- `deslocamentoEstimadoMinutos` é um número opcional. O mapa mostra os pontos cadastrados e a estimativa recebida do Java. Para obter essa estimativa automaticamente, a integração ainda precisa de uma fonte para o tempo da viagem.

## Como a tela calcula a eficiência

No exemplo, o chamado pode ter sido aberto na sexta. A conta começa na segunda às 7h, quando o técnico moveu para **Em andamento**, e termina às 8h. O resultado é **60 min de atendimento**. Com **35 min de viagem estimada**, sobram **25 min de tempo ajustado**.

A tela usa o tempo ajustado para a mediana do funcionário, a mediana da equipe e a classificação. A mediana da equipe usa os chamados de todos os funcionários no período. Chamados sem início válido, sem estimativa ou com estimativa maior que o atendimento continuam no histórico e ficam fora da mediana ajustada. Os limites iniciais são 180 e 360 minutos. O botão **Salvar** aplica os novos limites à página atual, e recarregar volta aos padrões.

## Como conferir localmente

1. Com o Java rodando, teste seu endpoint a partir da máquina que roda o Express e confira o JSON.
2. Configure `JAVA_CHAMADOS_URL`, reinicie o Express, entre com um usuário da empresa de teste e abra **Eficiência de Chamados**.
3. Na aba **Rede** do navegador, procure as requisições `/mapa/locais/...` e `/chamados/...`. Em chamados, `401` indica ausência de token, `403` pode indicar sessão inválida ou empresa incompatível, `503` indica configuração ausente ou inválida, `502` indica falha ou resposta inválida do Java e `504` indica que a consulta excedeu o prazo.
