# Zela Nacional - Sistema de Zeladoria Urbana Compartilhada via IA

> **Sistema Nacional SaaS B2G** - Plataforma federada que conecta cidadãos, consórcios intermunicipais, prefeituras, concessionárias e uma camada de IA orquestradora em escala nacional.

## Visão Geral

O Zela Nacional é uma solução inovadora para gestão de zeladoria urbana em escala nacional, utilizando inteligência artificial para otimizar o roteamento, priorização e resolução de ocorrências. O sistema foi projetado para escalar o modelo bem-sucedido do Zela no Oeste Paulista/SP para todo o Brasil.

## Arquitetura

```
┌──────────────────────────────────────────────────────────────┐
│                    CAMADA DE ENTRADA                         │
│  WhatsApp Business API · Web App · App PWA · SMS · Balcão   │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│               API GATEWAY (Kong / AWS API Gateway)           │
│        Auth · Rate Limit · Tenancy · Audit Log               │
└──────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────────┐
│ FRONTEND HUB │   │  BACKEND API │   │   IA ORQUESTRADORA│
│  (4 portals) │   │ (microsserviços)│  │  (MATCH Engine)   │
└──────────────┘   └──────────────┘   └──────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│   DADOS · PostgreSQL (transacional) · S3 (mídia) · Redis      │
│   (cache/filas) · OpenSearch (busca) · ClickHouse (analytics)│
└──────────────────────────────────────────────────────────────┘
```

## Estrutura do Projeto

```
zela-nacional/
├── apps/                          # Frontend Applications
│   ├── portal-cidadao/            # Portal do Cidadão (PWA)
│   ├── portal-consorcio/          # Portal do Consórcio
│   ├── portal-prefeitura/         # Portal da Prefeitura/Concessionária
│   ├── portal-nacional/           # Portal Nacional (Admin)
│   └── crm/                       # CRM de Controle
│
├── services/                      # Backend Microsserviços (NestJS)
│   ├── auth-service/              # Autenticação e Autorização
│   ├── citizen-service/           # Gestão de Cidadãos
│   ├── intake-service/            # Ingestão de Ocorrências
│   ├── media-service/             # Gestão de Mídias
│   ├── classification-service/   # Classificação de Ocorrências
│   ├── routing-service/           # MATCH Engine (Roteamento)
│   ├── workflow-service/          # Fluxo de Trabalho (BPMN)
│   ├── notification-service/     # Notificações
│   ├── analytics-service/         # Analytics e Relatórios
│   ├── billing-service/           # Faturamento
│   ├── audit-service/             # Auditoria
│   └── pool-lowdataesc/           # Pool de Contas Segregadas
│
├── ai/                            # Serviços de IA (Python FastAPI)
│   ├── match-service/             # MATCH Engine (Roteamento Inteligente)
│   ├── transcription-service/     # Transcrição de Áudio (Whisper)
│   └── classification-service/    # Classificação (Llama + CLIP)
│
├── packages/                      # Pacotes Compartilhados
│   ├── shared/                    # Código compartilhado
│   ├── ui/                        # Componentes UI compartilhados
│   ├── prisma/                    # Schema Prisma e Client
│   └── config/                    # Configurações compartilhadas
│
├── infra/                         # Infraestrutura
│   ├── terraform/                 # IaC (Terraform)
│   │   ├── modules/               # Módulos reutilizáveis
│   │   └── environments/          # Ambientes (dev, prod)
│   ├── helm/                      # Helm Charts para Kubernetes
│   └── gitops/                    # Configurações ArgoCD
│
├── docs/                          # Documentação
│   ├── APIS_CONEXOES_ESTADUAIS.md # APIs para conexões estaduais
│   └── openapi/                   # Contratos OpenAPI
│
├── docker-compose.yml             # Orquestração de Desenvolvimento
├── package.json                   # Workspace Root
├── turbo.json                     # Configuração Turborepo
└── README.md                      # Este arquivo
```

## Tecnologias Utilizadas

### Frontend
- **Next.js 14** - Framework React para SSR e SSG
- **React 18** - Biblioteca de UI
- **Tailwind CSS** - Estilização utilitária
- **Radix UI** - Componentes acessíveis
- **Framer Motion** - Animações
- **PWA** - Progressive Web App

### Backend
- **NestJS** - Framework Node.js para APIs
- **Node.js 18+** - Runtime JavaScript
- **TypeScript** - Tipagem estática
- **Prisma** - ORM para PostgreSQL
- **BullMQ** - Filas com Redis

### IA
- **Python 3.10+** - Linguagem principal
- **FastAPI** - Framework para APIs Python
- **Whisper** - Transcrição de áudio
- **Llama 3.1** - Modelos de linguagem
- **CLIP** - Classificação multimodal
- **Sentence-BERT** - Embeddings para deduplicação
- **scikit-learn** - ML tradicional

### Banco de Dados
- **PostgreSQL** - Banco transacional
- **Redis** - Cache e filas
- **OpenSearch** - Busca textual
- **ClickHouse** - Analytics (OLAP)
- **S3/MinIO** - Armazenamento de mídias

### Infraestrutura
- **AWS EKS** - Kubernetes gerenciado
- **Terraform** - IaC
- **ArgoCD** - GitOps
- **Kong** - API Gateway
- **Prometheus + Grafana** - Observabilidade
- **Loki + OpenTelemetry** - Logging e Tracing

## Configuração do Ambiente

### Pré-requisitos

- Node.js 18+ 
- pnpm 8+
- Python 3.10+
- Docker 20+
- Docker Compose 2+
- PostgreSQL 15+
- Redis 7+

### Instalação

1. **Clonar o repositório:**
```bash
git clone https://github.com/kauecodify/zela.git
cd zela
```

2. **Instalar dependências:**
```bash
# Instalar pnpm (se não tiver)
npm install -g pnpm

# Instalar dependências do workspace
pnpm install
```

3. **Configurar ambiente:**
```bash
# Copiar arquivos de exemplo
cp .env.example .env
cp apps/crm/.env.example apps/crm/.env
cp services/auth-service/.env.example services/auth-service/.env
# ... (repetir para todos os serviços)
```

4. **Configurar banco de dados:**
```bash
# Iniciar serviços com Docker Compose
docker-compose up -d postgres redis opensearch clickhouse minio

# Gerar schema do Prisma
cd packages/prisma
pnpm db:generate
pnpm db:push
pnpm db:seed
```

5. **Iniciar desenvolvimento:**
```bash
# Iniciar todos os serviços
pnpm dev

# Ou iniciar serviços específicos
pnpm --filter @zela/auth-service dev
pnpm --filter @zela/routing-service dev
pnpm --filter @zela/crm dev
```

## Scripts Disponíveis

### Root
```bash
pnpm dev          # Inicia todos os serviços em modo desenvolvimento
pnpm build        # Build de todos os serviços
pnpm lint         # Lint de todos os serviços
pnpm test         # Testes de todos os serviços
pnpm start        # Inicia todos os serviços em produção

pnpm docker:up    # Sobe containers com Docker Compose
pnpm docker:down  # Deruba containers

pnpm infra:plan   # Planeja infraestrutura Terraform
pnpm infra:apply  # Aplica infraestrutura Terraform
```

### Prisma
```bash
pnpm --filter @zela/prisma db:generate   # Gera client Prisma
pnpm --filter @zela/prisma db:push       # Aplica schema no BD
pnpm --filter @zela/prisma db:migrate    # Executa migrações
pnpm --filter @zela/prisma db:seed       # Popula BD com dados iniciais
pnpm --filter @zela/prisma db:studio     # Abre Prisma Studio
```

## API Gateway (Kong)

O Kong é usado como API Gateway para:
- Autenticação centralizada
- Rate limiting por consortium
- Roteamento de requisições
- Logging e auditoria

### Configuração do Kong

```yaml
# kong.yml
_format_version: "3.0"

services:
  - name: auth-service
    url: http://auth-service:3001
    routes:
      - name: auth-route
        paths: ["/auth"]

  - name: routing-service
    url: http://routing-service:3002
    routes:
      - name: routing-route
        paths: ["/routing"]

  - name: crm
    url: http://crm:3000
    routes:
      - name: crm-route
        paths: ["/"]

consumers:
  - username: zela-nacional
    custom_id: zela-nacional

plugins:
  - name: jwt
    service: auth-service
    config:
      key: zela-secret-key
      algorithm: HS256

  - name: rate-limiting
    service: routing-service
    config:
      minute: 1000
      policy: local
```

## MATCH Engine - Coração do Sistema

O MATCH Engine é o componente mais importante do Zela Nacional. Ele implementa a inteligência de roteamento que determina:

1. **Qual consórcio** deve tratar a ocorrência
2. **Qual client** (prefeitura ou concessionária) deve tratar
3. **Qual a prioridade** da ocorrência
4. **Qual o SLA** (prazo) para resolução
5. **Confiança** da decisão

### Pipeline do MATCH

```
Entrada → Transcrição → Classificação → Geocodificação
    → DEDUP (agrupamento) → MATCH (consórcio+cliente)
    → PRIORITIZE → ROUTE → MONITOR
```

### Modelo de Decisão

O MATCH usa uma combinação de:
- **Regras explícitas** (matriz de competências)
- **Heurísticas** (carga de trabalho, reincidência)
- **Modelos de ML** (classificação, priorização)

### Input do MATCH

```json
{
  "consortium_id": "cio-sp",
  "category_code": "BURACO",
  "subcategory_code": "GRANDE",
  "latitude": -22.1234,
  "longitude": -51.3456,
  "address": "Rua das Flores, 123",
  "municipality_id": "3509502-cio-sp",
  "risk_level": "HIGH",
  "description": "Buraco grande na via pública"
}
```

### Output do MATCH

```json
{
  "consortium_id": "cio-sp",
  "client_id": "prefeitura-pp",
  "priority_score": 85,
  "sla_hours": 12,
  "confidence": 0.92,
  "needs_human_review": false,
  "explanation": "Category: BURACO | Location: Rua das Flores, 123 | Selected client: prefeitura-pp (score: 85.5) | Competence score: 90 | Workload score: 80.0 | Risk level: HIGH",
  "model_version": "MATCH-v1.0",
  "processing_time_ms": 120.5,
  "reincidence_score": 0.3,
  "current_load": 5
}
```

## Multi-Tenancy

O sistema implementa isolamento lógico por `consortium_id`:

```sql
-- Todas as queries devem incluir o consortium_id
SELECT * FROM occurrence 
WHERE consortium_id = 'cio-sp'
  AND status = 'PENDING';
```

### Hierarquia

```
Nação
 └── Consórcios (ex: CIOP-SP, CIMGA-MG, AMURES-SC)
      └── Municípios clientes
           └── Concessionárias vinculadas
                └── Ocorrências
```

### Pool Lowdataesc

Contas segregadas para processamento em pool soberano:

```typescript
// packages/prisma/schema.prisma
model PoolLowdataesc {
  id          String
  name        String    @unique
  description String?
  consortiumId String
  consortium  Consortium @relation(fields: [consortiumId], references: [id])
  isActive    Boolean   @default(true)
  rateLimitPerMinute Int      @default(1000)
  storageQuotaGB     Int      @default(100)
  computeQuota       Int      @default(10)
}
```

## Integrações Externas

### 1. Gov.br
- Autenticação de cidadãos
- Validação de documentos

### 2. WhatsApp Business API
- Recebimento de ocorrências via WhatsApp > https://apps.fiesp.com.br/FiespLogin/Content/upload/startup/PITCH_1046c243-5e29-41c7-851f-c16810028d84ede61d94-8803-4570-9a0a-62ff6d500b8f.pdf
- Envio de notificações

### 3. IBGE API
- Dados de municípios
- Setores censitários
- População

### 4. OpenStreetMap / Nominatim
- Geocodificação de endereços
- Geocodificação reversa

### 5. PIX
- Cobrança de prefeituras
- Rateio de valores

### 6. Concessionárias
- SABESP (água e esgoto)
- Energisa (energia elétrica)
- Outras concessionárias regionais

## Segurança e Compliance

### LGPD
- Pseudonimização de dados
- Apagamento em 12 meses
- Consentimento explícito

### PL 2338/2023 (Marco Legal da IA)
- Classificação de risco por uso
- Avaliação de impacto
- Comitê de ética
- AI Owner nacional

### Segurança
- Criptografia em repouso (AES-256)
- Criptografia em trânsito (TLS 1.3)
- WAF (AWS WAF)
- Pentest anual
- Bug bounty
- SOC2 Type II

## Deploy

### Desenvolvimento
```bash
# Iniciar todos os serviços
pnpm docker:up

# Acessar aplicações
# - CRM: http://localhost:3019
# - Portal Cidadão: http://localhost:3000
# - Auth Service: http://localhost:3001
# - Routing Service: http://localhost:3002
# - MATCH Service: http://localhost:3003
```

### Produção (AWS)

```bash
# Provisionar infraestrutura
cd infra/terraform/environments/production
terraform init
terraform plan
terraform apply

# Deploy com ArgoCD
kubectl apply -f infra/gitops/
```

### Kubernetes (EKS)

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app: auth-service
  template:
    metadata:
      labels:
        app: auth-service
    spec:
      containers:
      - name: auth-service
        image: zela/auth-service:latest
        ports:
        - containerPort: 3001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: zela-secrets
              key: database-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

## Monitoramento

### Métricas (Prometheus + Grafana)
- Latência do MATCH
- Taxa de erro do Whisper
- Fila do BullMQ
- Utilização de GPU
- Requests por minuto

### Logging (Loki + OpenTelemetry)
- Logs de todas as requisições
- Logs de decisões da IA
- Logs de erros
- Retenção: 30 dias

### Tracing (OpenTelemetry + X-Ray)
- Rastreamento end-to-end
- Desde o WhatsApp até o PostgreSQL
- Visualização de fluxos

### Alertas
- Confiança média < 0.6 por mais de 1 hora
- Fila de "escalado-humano" > 50 itens
- Disponibilidade do RDS < 99.9%

## Roadmap

### Fase 1 (1 mês)
- Piloto regional (1 consórcio, 5 municípios)
- Implementação do MATCH Engine v1.0
- Integração com Gov.br

### Fase 2 (2 meses)
- Expansão estadual (3 consórcios, 50 municípios)
- MATCH Engine v2.0 (com ML)
- Integração com WhatsApp Business API

### Fase 3 (4 meses)
- 5 regiões, 10 consórcios
- MATCH Engine v3.0 (com reinforcement learning)
- Integração com concessionárias

### Fase 4 (6 meses)
- Cobertura nacional (todos os consórcios ativos)
- Pool soberano lowdataesc
- SLA médio de 1 dia útil
- Diferença centro×periferia ≤ 15%

## Meta Nacional

- **100%** das ocorrências com protocolo
- **SLA médio** de 1 dia útil
- **Diferença centro×periferia** ≤ 15%
- **Custo por ocorrência** ≤ R$ 0,05

## Contribuição

1. Fork o repositório
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## Licença

O Zela Nacional utiliza múltiplas licenças dependendo do componente:

- **AGPL 3.0** - Para o core do sistema (MATCH Engine, Auth Service, Routing Service)
- **BSD 3-Clause** - Para componentes de integração e utilitários
- **Claude 3.0** - Para modelos de IA e datasets de treinamento

Copyright (c) 2024 Zela Nacional. Todos os direitos reservados.

## Investimento e Modelos Comerciais

### Pré-Seed: R$ 300.000.000,00

O Zela Nacional está em fase de **pré-seed** com **R$ 300 milhões** disponíveis para **venda imediata B2G** (Business-to-Government).

#### Modelo de Negócio B2G:

1. **Licenciamento por Habitante**
   - R$ 0,05 por ocorrência processada
   - R$ 0,50 por habitante/ano (para municípios)
   - R$ 2,00 por habitante/ano (para consórcios)

2. **Implantação**
   - Custo único de R$ 50.000 por consórcio
   - Inclui treinamento e suporte inicial

3. **Manutenção e Suporte**
   - 15% do valor do licenciamento anual
   - Suporte 24/7 para clientes B2G

4. **Customização**
   - R$ 100.000 - R$ 500.000 por módulo customizado
   - Integração com sistemas legados

#### Oportunidade de Investimento:

- **Valuation Pré-Seed**: R$ 1,2 bilhão
- **Participação Disponível**: 25% (R$ 300 milhões)
- **ROI Projetado**: 3-5 anos
- **Modelo**: SaaS B2G com receita recorrente

#### Benefícios para Investidores:

- Contratos de longo prazo com governos
- Receita recorrente garantida
- Impacto social positivo
- Alinhado com políticas públicas de smart cities
- Prioridade em licitações governamentais

#### Contato para Investidores:

- **Email**: investimentos@zela.gov.br
- **Telefone**: +55 11 99999-9999
- **Site**: https://invest.zela.gov.br

## Contato

### Suporte Técnico
- **Email:** suporte@zela.gov.br
- **Site:** https://zela.gov.br
- **Documentação:** https://docs.zela.gov.br
- **Status:** https://status.zela.gov.br

### Investimentos e Vendas B2G
- **Email:** investimentos@zela.gov.br
- **Telefone**: +55 11 99999-9999
- **Site**: https://invest.zela.gov.br
- **Endereço**: Av. Paulista, 2000 - São Paulo, SP - CEP 01310-200

---

## Aviso Legal

Este material é confidencial e destinado apenas a partes interessadas autorizadas. A distribuição ou reprodução não autorizada é expressamente proibida.

*Projeto desenvolvido para a Global Solution 2026.2 - Grupo 8 - Zela Nacional*
*Pré-Seed: R$ 300M - Venda Imediata B2G*
