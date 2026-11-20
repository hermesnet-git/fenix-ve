curl --request POST \
  --url http://esteira2.oss.vivo.com.br/tlf-api/workforceManagementJourney/v1/workOrder/appointment \
  --header 'Authorization: Bearer  ' \
  --header 'Content-Type: application/json' \
  --header 'X-Vivo-Correlation-Id: 222' \
  --header 'X-Vivo-Transaction-Id: 111' \
  --header 'flow: B2B_MASSIVO' \
  --header 'requestSystem: MVE' \
  --data '{
  "WorkOrder_Create": {
    "@type": "WorkOrder",
    "sourceSystem": "SERVICENOWB2BMASSIVO",
    "id": "AL_WO20261021_1100",
    "relatedParty": [
      {
        "@type": "CustomerValue",
        "category": "ONE",
        "documentNumber": "01861536000164",
        "id": "001Ot000t6ChyIAEFG",
        "name": "PANIFICADORA SUPERPAO",
        "contactMedium": [
          {
            "@type": "ContactMediumValue",
            "name": "João da Silva",
            "characteristic": [
              {
                "@type": "ContactMediumValueCharacteristic",
                "emailAddress": "gustavo.souza.ext@telefonica.com",
                "mobileNumber": "11920001000",
                "phoneNumber": "1120001000",
                "workNumber": "1130002000"
              }
            ]
          }
        ]
      },
      {
        "@type": "CustomerOrderValue",
        "dateOfSale": "2025-10-30T23:35:14.000Z",
        "id": "500W400000lPdj3IAC",
        "orderProtocol": "31072026-8572624",
        "characteristic": [
          {
            "@type": "Characteristic",
            "name": "Detail",
            "value": "REDE SATURADA;SA-1004"
          }
        ]
      },
      {
        "@type": "WorkOrderPendency",
        "context": "TRIAGEM"
      }
    ],
    "workOrderItem": [
      {
        "@type": "WorkOrderItem",
        "id": "AL_WO20261021_1100:1",
        "place": {
          "@type": "GeographicAddress",
          "cnl": "41000",
          "cnlAcronym": "CTA",
          "city": "Curitiba",
          "neighborhood": "Portão",
          "postcode": "81070360",
          "stateOrProvince": "PR",
          "streetCode": "27421",
          "streetName": "Rua Constantino de Sousa",
          "streetNr": "3215",
          "networkOwner": "VIVO2",
          "accessTechnology": "GPON",
          "centralOffice": "",
          "telephonicArea": "",
          "geographicLocation": {
            "@type": "GeographicLocation",
            "bbox": [
              "-49.32869",
              "-25.44258"
            ]
          },
          "geographicSite": {
            "@type": "Cabinet",
            "id": "PRCTA_G1D23"
          },
          "geographicSubAddress": {
            "@type": "GeographicSubAddress",
            "name": "AP 401 AND 4"
          }
        },
        "relatedEntity": [
          {
            "@type": "ProductEntity",
            "id": "0QLOt000003UxfGOAS",
            "name": "Banda Larga",
            "action": "Ativo",
            "status": "Ativo",
            "characteristic": [
              {
                "@type": "Characteristic",
                "name": "Code",
                "value": "21000"
              },
              {
                "@type": "Characteristic",
                "name": "Designator",
                "value": "CTA-WFM116145-013"
              },
              {
                "@type": "Characteristic",
                "name": "Technology",
                "value": "GPON"
              }
            ]
          },
          {
            "@type": "ProductEntity",
            "id": "0QLOt000003UxfHOAS",
            "name": "ACESSO",
            "status": "Ativo",
            "action": "Ativo",
            "characteristic": [
              {
                "@type": "Characteristic",
                "name": "Designator",
                "value": "CTA-WFMTT1161001-069"
              }
            ]
          },
          {
            "@type": "ProductEntity",
            "id": "Banda Larga-VEL",
            "name": "500 Mbps",
            "action": "Ativo",
            "status": "Ativo"
          },
          {
            "@type": "ProductEntity",
            "id": "Banda Larga-IPFIXO",
            "name": "IP Fixo",
            "action": "Ativo",
            "status": "Ativo"
          },
          {
            "@type": "ProductEntity",
            "id": "Roteador",
            "name": "HGU",
            "status": "Ativo",
            "action": "Ativo"
          }
        ],
        "specification": {
          "acronym": "TT_B",
          "type": "TROUBLETICKET",
          "specificationDescription": [
            {
              "name": "PRODUTO",
              "value": "Banda"
            },
            {
              "name": "TIPO",
              "value": "Defeito"
            },
            {
              "name": "DETALHE",
              "value": "Autenticação"
            },
            {
              "name": "SEQUENCIA",
              "value": "1/1"
            }
          ]
        }
      }
    ]
  },
  "Appointment_Create": {
    "description": "Agendamento da atividade",
    "category": "CORPORATE",
    "canBeAntecipated": true,
    "externalId": "AL_WO20261021_1100:1",
    "scheduleDate": "2026-11-22",
    "relatedParty": [
      {
        "@type": "Attendant",
        "id": "Cliente via Vivo Empresa",
        "role": ""
      },
      {
        "@type": "TimeSlot",
        "id": "15:30-17:30",
        "resourceId": "BKT_GRUPO_02_NV_FB",
        "resourceName": "Bucket - Bucket_Curitiba Vivo",
        "validFor": {
          "startDateTime": "2026-11-22T15:30:00.000-03:00",
          "endDateTime": "2026-11-22T17:30:00.000-03:00"
        }
      }
    ],
    "note": [
      {
        "id": "CRM_NOTES",
        "text": "Agendamento realizado pelo cliente no fluxo de aceite de proposta no Vivo Empresas"
      },
      {
        "id": "ADDRESS_REFERENCE",
        "text": "PROXIMO ESCOLA PORTUGA"
      }
    ]
  }
}'