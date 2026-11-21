curl -sS -X GET 'https://api-hml.telefonica.com.br/serviceNowTroubleTicket/v1/troubleTicket?designatorId=SPO-SF897657-013&status=Active&ticketType=Case&offset=0&limit=5&sys_class_name=sn_sprb_mgmt_case' \
  -H 'Accept: application/json' \
  -H 'X-Vivo-Transaction-Id: TID_ELJY_FTAT933INT003_2026-11-18T12:48:10.188Z' \
  -H 'X-Vivo-Correlation-Id: 12345' \
  -H 'iss: 3912e8705df940629d040c63cad9c0bc' \
  -H "Authorization: Bearer $TOKEN"

URL CORRETA !!!!
curl --location 'https://api-hml.telefonica.com.br/serviceNowTroubleTicket/v1/troubleTicket?ticketType=Case&sys_class_name=sn_sprb_mgmt_case&active=true&correlation_display=SPO-SF910004-069' \
--header 'Accept: application/json' \
--header 'X-Vivo-Transaction-Id: TID_ELJY_FTAT933INT003_2026-11-18T15:22:20.348Z' \
--header 'X-Vivo-Correlation-Id: CID_VE_FTAT933_1795010982907' \
--header 'iss: 3912e8705df940629d040c63cad9c0bc'