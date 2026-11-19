# Zela Nacional - APIs para Conexões Estaduais e Nacionais

## Visão Geral

Este documento lista todas as APIs necessárias para conectar os consórcios regionais, prefeituras, concessionárias e o sistema nacional do Zela. As APIs são organizadas por serviço e fornecem a base para a integração entre os diferentes atores do sistema.

## Base URLs

| Ambiente | Base URL | Descrição |
|----------|----------|-----------|
| Desenvolvimento | `http://localhost:8000/api` | API Gateway Local |
| Homologação | `https://homolog.zela.gov.br/api` | API Gateway de Homologação |
| Produção | `https://api.zela.gov.br/api` | API Gateway de Produção |

## Autenticação

Todas as APIs requerem autenticação via JWT Bearer Token, exceto os endpoints públicos.

### Endpoints de Autenticação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/auth/login` | Login de usuário |
| POST | `/auth/register` | Registro de novo usuário |
| POST | `/auth/refresh` | Refresh do access token |
| POST | `/auth/logout` | Logout do usuário |
| POST | `/auth/validate` | Validação do token |

**Headers de Autenticação:**
```http
Authorization: Bearer <access_token>
```

## Serviços e APIs

### 1. Auth Service (Serviço de Autenticação)

#### Base URL: `/auth`

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|---------------|
| POST | `/login` | Autenticar usuário | - |
| POST | `/register` | Criar novo usuário | JWT |
| POST | `/refresh` | Refresh token | - |
| POST | `/logout` | Logout | JWT |
| GET | `/users` | Listar usuários | JWT |
| GET | `/users/{id}` | Obter usuário | JWT |
| POST | `/users` | Criar usuário | JWT |
| PUT | `/users/{id}` | Atualizar usuário | JWT |
| DELETE | `/users/{id}` | Deletar usuário | JWT |
| GET | `/roles` | Listar roles | JWT |
| POST | `/roles` | Criar role | JWT |
| PUT | `/roles/{id}` | Atualizar role | JWT |
| DELETE | `/roles/{id}` | Deletar role | JWT |
| GET | `/permissions` | Listar permissões | JWT |
| POST | `/permissions` | Criar permissão | JWT |

### 2. Routing Service (MATCH Engine)

#### Base URL: `/routing`

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|---------------|
| POST | `/route` | Rotear ocorrência | JWT |
| POST | `/batch-route` | Rotear batch de ocorrências | JWT |
| GET | `/decision/{occurrenceId}` | Obter decisão de roteamento | JWT |
| GET | `/history/{occurrenceId}` | Obter histórico de roteamento | JWT |
| GET | `/stats` | Estatísticas de roteamento | JWT |
| POST | `/reassign/{occurrenceId}` | Reatribuir ocorrência | JWT |

**Endpoint Principal - MATCH:**
```http
POST /routing/route
Content-Type: application/json
Authorization: Bearer <token>

{
  "consortiumId": "cio-sp",
  "categoryId": "BURACO",
  "subcategoryId": "GRANDE",
  "latitude": -22.1234,
  "longitude": -51.3456,
  "address": "Rua das Flores, 123",
  "municipalityId": "3509502-cio-sp",
  "riskLevel": "HIGH",
  "description": "Buraco grande na via pública"
}

Response:
{
  "consortiumId": "cio-sp",
  "clientId": "prefeitura-pp",
  "priorityScore": 85,
  "slaHours": 12,
  "confidence": 0.92,
  "needsHumanReview": false,
  "explanation": "Category: BURACO | Location: Rua das Flores, 123 | Selected client: prefeitura-pp (score: 85.5) | Competence score: 90 | Workload score: 80.0 | Risk level: HIGH",
  "modelVersion": "MATCH-v1.0",
  "processingTimeMs": 120.5,
  "reincidenceScore": 0.3,
  "currentLoad": 5,
  "decisionTimestamp": "2024-01-01T12:00:00Z"
}
```

### 3. Citizen Service (Cidadão)

#### Base URL: `/citizens`

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|---------------|
| POST | `/` | Criar cidadão | - |
| GET | `/{id}` | Obter cidadão | JWT |
| PUT | `/{id}` | Atualizar cidadão | JWT |
| DELETE | `/{id}` | Deletar cidadão | JWT |
| GET | `/search` | Buscar cidadãos | JWT |
| POST | `/occurrences` | Criar ocorrência (cidadão) | JWT |
| GET | `/occurrences/{id}` | Obter ocorrência do cidadão | JWT |

### 4. Intake Service (Ingestão)

#### Base URL: `/intake`

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|---------------|
| POST | `/occurrences` | Criar ocorrência | JWT |
| POST | `/occurrences/whatsapp` | Criar ocorrência via WhatsApp | JWT |
| POST | `/occurrences/sms` | Criar ocorrência via SMS | JWT |
| POST | `/occurrences/web` | Criar ocorrência via Web | JWT |
| GET | `/occurrences/{id}` | Obter ocorrência | JWT |
| PUT | `/occurrences/{id}` | Atualizar ocorrência | JWT |
| POST | `/occurrences/{id}/attachments` | Adicionar anexo | JWT |
| DELETE | `/occurrences/{id}/attachments/{attachmentId}` | Remover anexo | JWT |

### 5. Media Service (Mídia)

#### Base URL: `/media`

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|---------------|
| POST | `/upload` | Upload de arquivo | JWT |
| GET | `/{id}` | Obter mídia | JWT |
| DELETE | `/{id}` | Deletar mídia | JWT |
| POST | `/transcribe/{id}` | Transcrever áudio | JWT |
| GET | `/transcriptions/{id}` | Obter transcrição | JWT |
| POST | `/classify/{id}` | Classificar imagem | JWT |
| GET | `/classifications/{id}` | Obter classificação | JWT |
| POST | `/ocr/{id}` | OCR de documento | JWT |

### 6. Classification Service (Classificação)

#### Base URL: `/classification`

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|---------------|
| POST | `/classify` | Classificar ocorrência | JWT |
| GET | `/categories` | Listar categorias | JWT |
| POST | `/categories` | Criar categoria | JWT |
| PUT | `/categories/{id}` | Atualizar categoria | JWT |
| DELETE | `/categories/{id}` | Deletar categoria | JWT |
| GET | `/subcategories` | Listar subcategorias | JWT |
| POST | `/subcategories` | Criar subcategoria | JWT |

### 7. Workflow Service (Fluxo de Trabalho)

#### Base URL: `/workflow`

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|---------------|
| GET | `/` | Listar workflows | JWT |
| POST | `/` | Criar workflow | JWT |
| GET | `/{id}` | Obter workflow | JWT |
| PUT | `/{id}` | Atualizar workflow | JWT |
| DELETE | `/{id}` | Deletar workflow | JWT |
| POST | `/{id}/start` | Iniciar workflow | JWT |
| POST | `/{id}/step` | Executar passo | JWT |
| GET | `/{id}/history` | Histórico do workflow | JWT |

### 8. Notification Service (Notificações)

#### Base URL: `/notifications`

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|---------------|
| GET | `/` | Listar notificações | JWT |
| POST | `/` | Criar notificação | JWT |
| GET | `/{id}` | Obter notificação | JWT |
| PUT | `/{id}/read` | Marcar como lida | JWT |
| PUT | `/{id}/unread` | Marcar como não lida | JWT |
| DELETE | `/{id}` | Deletar notificação | JWT |
| POST | `/email` | Enviar email | JWT |
| POST | `/sms` | Enviar SMS | JWT |
| POST | `/whatsapp` | Enviar WhatsApp | JWT |
| POST | `/push` | Enviar push notification | JWT |

### 9. Analytics Service (Analytics)

#### Base URL: `/analytics`

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|---------------|
| GET | `/stats` | Estatísticas gerais | JWT |
| GET | `/kpis` | KPIs do sistema | JWT |
| GET | `/occurrences-by-category` | Ocorrências por categoria | JWT |
| GET | `/occurrences-by-priority` | Ocorrências por prioridade | JWT |
| GET | `/occurrences-by-status` | Ocorrências por status | JWT |
| GET | `/occurrences-by-municipality` | Ocorrências por município | JWT |
| GET | `/occurrences-by-consortium` | Ocorrências por consórcio | JWT |
| GET | `/sla-compliance` | Conformidade de SLA | JWT |
| GET | `/resolution-time` | Tempo médio de resolução | JWT |
| GET | `/reincidence-rate` | Taxa de reincidência | JWT |
| GET | `/equity-monitor` | Monitor de equidade | JWT |
| POST | `/reports` | Gerar relatório | JWT |
| GET | `/reports/{id}` | Obter relatório | JWT |

### 10. Billing Service (Faturamento)

#### Base URL: `/billing`

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|---------------|
| GET | `/cycles` | Listar ciclos de faturamento | JWT |
| POST | `/cycles` | Criar ciclo de faturamento | JWT |
| GET | `/cycles/{id}` | Obter ciclo de faturamento | JWT |
| PUT | `/cycles/{id}` | Atualizar ciclo de faturamento | JWT |
| DELETE | `/cycles/{id}` | Deletar ciclo de faturamento | JWT |
| GET | `/invoices` | Listar faturas | JWT |
| POST | `/invoices` | Criar fatura | JWT |
| GET | `/invoices/{id}` | Obter fatura | JWT |
| PUT | `/invoices/{id}/pay` | Pagar fatura | JWT |
| POST | `/pix` | Gerar QR Code PIX | JWT |
| GET | `/pix/{id}` | Obter status do PIX | JWT |

### 11. Audit Service (Auditoria)

#### Base URL: `/audit`

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|---------------|
| GET | `/logs` | Listar logs de auditoria | JWT |
| GET | `/logs/{id}` | Obter log de auditoria | JWT |
| GET | `/logs/export` | Exportar logs | JWT |
| POST | `/logs` | Criar log de auditoria | JWT |
| GET | `/ai-decisions` | Listar decisões da IA | JWT |
| GET | `/ai-decisions/{id}` | Obter decisão da IA | JWT |

### 12. Pool Lowdataesc Service

#### Base URL: `/pool`

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|---------------|
| GET | `/` | Listar pools | JWT |
| POST | `/` | Criar pool | JWT |
| GET | `/{id}` | Obter pool | JWT |
| PUT | `/{id}` | Atualizar pool | JWT |
| DELETE | `/{id}` | Deletar pool | JWT |
| GET | `/{id}/usage` | Uso do pool | JWT |
| POST | `/{id}/allocate` | Alocar recurso no pool | JWT |
| POST | `/{id}/release` | Liberar recurso do pool | JWT |

## APIs Externas (Integrações)

### 1. Gov.br

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `https://api.gov.br/autenticacao/v1/autorizar` | Autorização OAuth2 |
| GET | `https://api.gov.br/autenticacao/v1/usuario` | Obter dados do usuário |

### 2. WhatsApp Business API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `https://graph.facebook.com/v18.0/{phone-number-id}/messages` | Enviar mensagem |
| GET | `https://graph.facebook.com/v18.0/{phone-number-id}/messages` | Listar mensagens |
| POST | `https://graph.facebook.com/v18.0/{phone-number-id}/media` | Upload de mídia |

### 3. IBGE API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `https://servicodados.ibge.gov.br/api/v1/localidades/estados` | Listar estados |
| GET | `https://servicodados.ibge.gov.br/api/v1/localidades/estados/{UF}/municipios` | Listar municípios |
| GET | `https://servicodados.ibge.gov.br/api/v3/agregados/6579/periodos/2022/variaveis/9324|206|207|208|209|210/...` | Dados demográficos |

### 4. OpenStreetMap (Nominatim)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `https://nominatim.openstreetmap.org/search` | Buscar endereço |
| GET | `https://nominatim.openstreetmap.org/reverse` | Geocodificação reversa |

### 5. PIX API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `https://pix.api.bcb.gov.br/pix/v1/cob` | Criar cobrança |
| GET | `https://pix.api.bcb.gov.br/pix/v1/cob/{txid}` | Consultar cobrança |
| POST | `https://pix.api.bcb.gov.br/pix/v1/payments` | Iniciar pagamento |

### 6. SABESP API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `https://api.sabesp.com.br/v1/ocorrencias` | Registrar ocorrência |
| GET | `https://api.sabesp.com.br/v1/ocorrencias/{id}` | Consultar ocorrência |

### 7. Energisa API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `https://api.energisa.com.br/v1/ocorrencias` | Registrar ocorrência |
| GET | `https://api.energisa.com.br/v1/ocorrencias/{id}` | Consultar ocorrência |

## Webhooks

### 1. WhatsApp Webhook

**Endpoint:** `POST /webhooks/whatsapp`

**Headers:**
```http
X-Hub-Signature-256: <signature>
Content-Type: application/json
```

**Body:**
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "102345678901234",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "5511999999999",
              "phone_number_id": "123456789012345"
            },
            "contacts": [
              {
                "profile": {
                  "name": "João Silva"
                },
                "wa_id": "5511988888888"
              }
            ],
            "messages": [
              {
                "from": "5511988888888",
                "id": "wamid.ABCDEF...=",
                "timestamp": "1678901234567",
                "type": "text",
                "text": {
                  "body": "Tem um buraco na Rua das Flores"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

### 2. SMS Webhook

**Endpoint:** `POST /webhooks/sms`

**Headers:**
```http
Content-Type: application/json
```

**Body:**
```json
{
  "from": "5511988888888",
  "to": "5511999999999",
  "body": "Tem um buraco na Rua das Flores",
  "timestamp": "1678901234567"
}
```

## Rate Limiting

| Serviço | Limite | Janela |
|---------|--------|--------|
| Auth Service | 100 req/min | Por IP |
| Routing Service | 1000 req/min | Por consortium |
| Intake Service | 500 req/min | Por consortium |
| Media Service | 200 req/min | Por consortium |
| Analytics Service | 100 req/min | Por consortium |

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Unprocessable Entity |
| 429 | Too Many Requests |
| 500 | Internal Server Error |
| 502 | Bad Gateway |
| 503 | Service Unavailable |

## Segurança

### Headers de Segurança

Todos os endpoints devem incluir os seguintes headers de segurança:

```http
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https: wss:; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self';
Referrer-Policy: strict-origin-when-cross-origin
```

### CORS

```http
Access-Control-Allow-Origin: https://zela.gov.br, https://*.zela.gov.br
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
```

## Versionamento

A API segue versionamento semântico (SemVer):

- **MAJOR**: Mudanças incompatíveis
- **MINOR**: Novas funcionalidades compatíveis
- **PATCH**: Correções de bugs compatíveis

A versão atual é **v1.0.0**.

## Changelog

### v1.0.0 (2024-01-01)
- Lançamento inicial
- Todos os endpoints de autenticação
- MATCH Engine v1.0
- Integração com Gov.br
- Integração com WhatsApp Business API
- Integração com IBGE
- Integração com OpenStreetMap

## Contato

Para dúvidas ou problemas com as APIs:

- **Email**: suporte@zela.gov.br
- **Documentação**: https://docs.zela.gov.br
- **Status**: https://status.zela.gov.br

## Licença

MIT License - Copyright (c) 2024 Zela Nacional
