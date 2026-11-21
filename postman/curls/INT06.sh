curl -sS -X POST 'https://api-hml.telefonica.com.br/gtw-redes/serviceTestManagement/v1/serviceTest' \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -H 'X-Vivo-Transaction-Id: 4e6a1e91-960c-4e5b-bb45-a270104128fc' \
  -H 'X-Vivo-Correlation-Id: c2f11b7c-d664-47f4-9959-966db2a27d9a' \
  -H "Authorization: Bearer $TOKEN" \
  --data '{"name":"Diagnostic-FTTH-Automatic","mode":"ONDEMAND","relatedParty":[{"role":"AccessDesignator","id":"SPO-SF897657-013"},{"role":"SistemaOrigem","id":"ServiceNow","@referredType":"Organization"},{"role":"ExternalId","id":"qa-1795007905378"}],"relatedService":{"id":"SPO-SF703229-069","name":"Internet","@referredType":"Service"},"testSpecification":{"id":"spec-ftth-gpon-basico","@referredType":"ServiceTestSpecification"},"characteristic":[{"name":"executionMode","value":"AUTOMATIC"}]}'