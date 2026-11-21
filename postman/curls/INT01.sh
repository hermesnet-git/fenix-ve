curl -sS -X GET 'https://cssp-preprod.redecorp.br/customer-problem-management/v1/incidents?serviceDesignator=SPO-SF897657-013' \
  -H 'Accept: application/json' \
  -H 'X-Vivo-Correlation-Id: 12345' \
  -H "Authorization: Bearer $TOKEN"