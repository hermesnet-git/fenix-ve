curl --request DELETE \
  --url 'http://preprod.oss.vivo.com.br/tlf-api/workforceManagementJourney/v1/workOrder/SFTESTE2832006A?reason=CANCELADO%20SISTEMICO&context=SISTEMICO' \
  --header 'Authorization: Bearer ' \
  --header 'Content-Type: application/json' \
  --header 'X-Vivo-Correlation-Id: 222' \
  --header 'X-Vivo-Transaction-Id: 111' \
  --header 'flow: B2B_MASSIVO' \
  --header 'requestSystem: MVE'