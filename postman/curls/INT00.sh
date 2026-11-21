curl -sS -X GET 'https://api-hml.telefonica.com.br/serviceNowTroubleTicket/v1/troubleTicket?designatorId=SPO-SF897657-013&status=Active&ticketType=Case&offset=0&limit=5&sys_class_name=sn_sprb_mgmt_case' \
  -H 'Accept: application/json' \
  -H 'X-Vivo-Transaction-Id: TID_ELJY_FTAT933INT003_2026-11-18T14:01:17.729Z' \
  -H 'X-Vivo-Correlation-Id: 12345' \
  -H 'iss: 3912e8705df940629d040c63cad9c0bc' \
  -H "Authorization: Bearer $TOKEN"