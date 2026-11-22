/*
 * Raio-X · revisão das análises (decisões de quem revisa). A página grava este arquivo; não edite à mão com a página aberta.
 * itens["INT14:R10"] = { status: ok (tudo certo) | pendente | revisado | aplicado,
 *   destino: [bpmn, postman, doc]   → bpmn e postman entram no lote do agente; doc é só informativo, para o time da documentação
 *   nota                            → o que o modelo deve fazer (o contexto vem da própria linha INT14:R10 nos dados)
 *   em (ISO), aplicadoEm, commit }
 */
RAIOX.revisao({
  "versao": 1,
  "itens": {
    "INT00:S01": {
      "status": "pendente",
      "destino": [],
      "em": "2026-11-22T02:22:59.423Z"
    },
    "INT00:S10": {
      "status": "ok",
      "destino": [],
      "em": "2026-11-22T00:02:31.808Z"
    },
    "INT01:R01": {
      "status": "pendente",
      "destino": [],
      "em": "2026-11-21T18:58:12.960Z"
    },
    "INT03:R03": {
      "status": "pendente",
      "destino": [],
      "nota": "Legal. tudo certo por aqui!",
      "em": "2026-11-21T04:03:03.365Z"
    }
  }
});
