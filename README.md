<!-- markdownlint-disable MD012 MD033 MD041 -->

<div align="center">

# 📊 ServiceNow Dashboard & Incident Suite

> Plataforma Integrada de Gestão Operacional de Incidentes, Monitoramento de Chamados, Análise de NPS, SLA e Perfect Fix

![Node.js 18+](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat&logo=node.js&logoColor=white)
![React 18.2.0](https://img.shields.io/badge/React-18.2.0-61DAFB?style=flat&logo=react&logoColor=black)
![Vite 5.4+](https://img.shields.io/badge/Vite-5.4%2B-646CFF?style=flat&logo=vite&logoColor=white)
![Express 4.18.2](https://img.shields.io/badge/Express-4.18.2-000000?style=flat&logo=express&logoColor=white)
![SQLite3 5.1.7](https://img.shields.io/badge/SQLite3-5.1.7-003B57?style=flat&logo=sqlite&logoColor=white)
![ExcelJS 4.4.0](https://img.shields.io/badge/ExcelJS-4.4.0-217346?style=flat&logo=microsoft-excel&logoColor=white)
![PWA Ready](https://img.shields.io/badge/PWA-Enabled-5A0FC8?style=flat&logo=pwa&logoColor=white)
![Vanilla CSS](https://img.shields.io/badge/CSS-Vanilla%20Pure-1572B6?style=flat&logo=css3&logoColor=white)

</div>

---

## 📋 Sobre o Projeto

O **ServiceNow Dashboard & Incident Suite** é uma solução corporativa unificada desenvolvida para centralizar tanto a **análise estratégica de desempenho** (NPS, SLA, Perfect Fix, volume) quanto a **gestão operacional de incidentes em tempo real**.

Construído com base em uma arquitetura moderna e modular (React 18 + Vite no frontend, Express nativo em ESM com SQLite no backend e um Design System em **Vanilla CSS puro**), o sistema opera de forma autônoma, leve e com persistência local de dados.

---

## ✨ Módulos da Aplicação

### 1. 📈 Módulo Analítico (Métricas & KPIs)

- **8 Cards Dinâmicos de KPI**: Visão rápida de fechados no ano, fechados por mês, NPS pessoal, NPS geral corporativo, SLA%, avaliados no ano, avaliações por mês e taxa de Perfect Fix.
- **Gráficos Comparativos Recharts**:
  - Comparativo de NPS (Pessoal vs. Média Geral da Empresa) com destaques dinâmicos de melhor/pior mês.
  - Volume de chamados fechados vs. chamados avaliados.
  - Acurácia de SLA e taxa de Perfect Fix com linha de meta (95%).
- **Detalhamento Mensal Retrátil**: Tabela analítica expansível com animação CSS Grid para edição controlada do mês corrente e anterior.
- **Upload Unificado de Dados**:
  - Ingestão de export CSV do ServiceNow com cálculo automático de SLA útil (considerando horário comercial e feriados nacionais, estaduais-SP e municipais de SP) e Perfect Fix.
  - Ingestão de JSON corporativo (`asmt_metric_result.json`) para cálculo do NPS Geral.

### 2. 🚨 Módulo Operacional de Incidentes

- **Visualização por Sub-abas**: Alternância instantânea entre incidentes **Abertos** e **Resolvidos**.
- **Ordenação Inteligente**:
  - Aba *Abertos*: Ordenação customizada com **Drag & Drop nativo (HTML5)** direto na linha através de alça visual (`GripVertical`), com persistência instantânea no banco de dados.
  - Aba *Resolvidos*: Ordenação cronológica automática reversa por data/hora de resolução (mais recente no topo).
- **Major Incidents & Chamados Filhos**:
  - Banner dinâmico no topo destacando ocorrências massivas ativas (5+ chamados).
  - Controle de atribuição *"Minha Responsabilidade"* com contadores sincronizados.
  - Modal de gestão e vinculação de chamados filhos associados ao Major Incident com exportação individual.
- **Destaque Visual para Incidentes Pendentes (+3 dias)**:
  - Alerta visual marcante em linhas de incidentes sem atualização há 3 ou mais dias (fundo suave em tom âmbar, barra lateral luminosa de alerta e pill animado pulsante `+3d`).
- **Atualização Rápida de Timestamp**:
  - Botão de ação rápida (`RotateCw`) na coluna de data/hora para atualizar instantaneamente a data da última atualização para o momento presente, gravando entrada no histórico sem necessidade de abrir modais de edição.
- **Estatísticas Interativas de Rodapé**:
  - Painéis dinâmicos de *"Incidentes por Hotel"* e *"Incidentes por Responsável"* com barras de preenchimento proporcional e filtragem rápida por clique (toggle).
- **Busca Rápida Animada**:
  - Campo de busca neon expansível e colapsável com botão de limpeza rápida.
- **Exportação XLSX Avançada**:
  - Geração de planilhas Excel formatadas profissionalmente via **ExcelJS** com cabeçalho executivo escuro (`#1F2937`), zebrado de linhas (`#FFFFFF` e `#D9D9D9`) e criação automática de abas filhas dedicadas `(!) [Incidente]` para cada Major Incident.
  - Code-splitting dinâmico com carregamento assíncrono do módulo de exportação apenas sob demanda.

### 3. ⚙️ Módulo de Cadastros Base (Hotéis e Responsáveis)

- Centralizado no dropdown de **Configurações** (ícone de engrenagem) no cabeçalho.
- CRUD completo de Hotéis (RID, Nome, status Ativo/Inativo) e Responsáveis (Nome, status Ativo/Inativo).
- Busca textual em tempo real e filtros de status (*Ativos*, *Inativos*, *Todos*).
- **Paginação Completa**: 20 itens por página com controles numéricos inteligentes e elipses.
- Diálogos de confirmação padronizados para exclusões seguras.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Propósito |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite 5 | Renderização reativa, HMR ultrarrápido e modularização |
| **Design System** | Vanilla CSS Puro | Design executivo *Deep Blue Premium* modularizado em 8 arquivos CSS |
| **PWA** | vite-plugin-pwa | Suporte a Service Worker, cache offline e manifesto instalável |
| **Gráficos** | Recharts 2.12 | Visualização interativa e responsiva de métricas e indicadores |
| **Ícones** | Lucide React | Biblioteca de ícones SVG limpos e padronizados (sem CDNs externas) |
| **Exportação** | ExcelJS 4.4 | Geração client-side de planilhas `.xlsx` formatadas e zebradas |
| **Backend** | Node.js + Express (ESM) | API RESTful nativa em módulos ECMAScript |
| **Banco de Dados** | SQLite 3 | Banco de dados relacional embarcado em arquivo único local (`server/dashboard.db`) |
| **Auditoria & Logs** | Winston | Registro cronológico em arquivo (`audit.log`) e tabela SQLite com poda automática |
| **Segurança** | Helmet + CORS | Headers de segurança HTTP e controle de acesso |
| **Agendador** | Scheduler customizado | Backups automáticos do SQLite com rotação de até 30 arquivos |

---

## 📁 Estrutura de Diretórios

```text
ServiceNowDashboard/
├── server/                        # Backend da aplicação (ESM nativo)
│   ├── controllers/               # Controladores de negócio (Incident, Hotel, Responsible, Major)
│   ├── routes/                    # Rotas da API RESTful (/api/...)
│   ├── services/                  # Regras de banco, auditoria e scheduler de backups
│   ├── uploads/                   # Diretório de arquivos temporários de upload (ignorado no git)
│   ├── backups/                   # Backups rotativos automáticos do SQLite (ignorado no git)
│   ├── database.js                # Inicialização do banco, schema e helpers assíncronos
│   ├── dashboard.db               # Banco de dados principal SQLite (ignorado no git)
│   └── index.js                   # Ponto de entrada do servidor Express
├── src/                           # Frontend React
│   ├── components/
│   │   ├── common/                # Componentes compartilhados (Header, NavTabs, Pagination, Modals)
│   │   ├── incidents/             # Tabela de incidentes, modais de histórico, chamados e major cards
│   │   └── settings/              # Módulos de gestão de Hotéis e Responsáveis
│   ├── styles/                    # Design System Vanilla CSS Refatorado
│   │   ├── tokens.css             # Cores, fontes, sombras e transições (Deep Blue)
│   │   ├── base.css               # Reset, tipografia global e scrollbars
│   │   ├── layout.css             # Grid do dashboard, toolbar, relógio e rodapé
│   │   ├── cards.css              # Cards com glassmorphism e badges de status
│   │   ├── tables.css             # Tabelas com linhas zebradas, drag & drop e alertas (+3d)
│   │   ├── forms.css              # Inputs, autocomplete, botões e campo de busca neon
│   │   ├── modals.css             # Janelas modais flutuantes com backdrop blur
│   │   ├── badges.css             # Badges de RID, tags de status e pills pulsantes
│   │   └── index.css              # Ponto de unificação de todos os estilos
│   ├── utils/
│   │   └── excelExport.js         # Utilitário assíncrono para exportação XLSX com ExcelJS
│   ├── App.jsx                    # Componente raiz com navegação e gerenciamento de estado
│   └── main.jsx                   # Ponto de entrada React com registro PWA
├── public/                        # Assets estáticos, favicon e manifest
├── start_dashboard.bat            # Inicializador para Windows com auto-restart em falhas
├── package.json                   # Dependências e scripts npm
├── vite.config.js                 # Configuração de build, proxy e PWA
└── eslint.config.js               # Regras de linting do projeto
```

---

## 🚀 Como Executar

### Pré-requisitos

- [Node.js](https://nodejs.org/) v18 ou superior instalado.
- npm (incluído no instalador do Node.js).

### 1. Instalação das Dependências

```bash
npm install
```

### 2. Execução em Desenvolvimento (Frontend + Backend)

```bash
npm run dev
```

- **Frontend (Vite)**: `http://localhost:3002`
- **Backend (Express API)**: `http://localhost:5000` (com proxy automático configurado no Vite)

### 3. Execução em Produção

```bash
# Gera os arquivos minificados do frontend na pasta dist/
npm run build

# Inicia o servidor Node.js servindo a API e os arquivos estáticos de dist/
npm start
```

### 4. Inicialização Rápida no Windows (Script com Auto-Restart)

Dê um duplo clique no arquivo:

```text
start_dashboard.bat
```

Ou execute via prompt de comando. O script monitora o processo e reinicia automaticamente os serviços caso ocorra alguma interrupção inesperada.

---

## 📡 Endpoints da API REST

### Métricas & Análises

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/metrics?year=2026` | Retorna métricas analíticas mensais do ano especificado |
| `POST` | `/api/metrics` | Cria ou atualiza manualmente métrica mensal (UPSERT) |
| `POST` | `/api/upload-metrics` | Processa CSV do ServiceNow para cálculo de SLA e Perfect Fix |
| `POST` | `/api/upload-json` | Processa JSON de avaliações para cálculo do NPS Geral corporativo |

### Gestão de Incidentes

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/incidentes?status=Aberto` | Lista incidentes filtrados por status (*Aberto* ou *Resolvido*) |
| `GET` | `/api/incidentes/:id` | Retorna os detalhes de um incidente específico |
| `POST` | `/api/incidentes` | Cria um novo incidente (e vincula chamados caso seja Major) |
| `PUT` | `/api/incidentes/:id` | Atualiza dados do incidente (ou apenas data de atualização com `forcar_historico`) |
| `DELETE` | `/api/incidentes/:id` | Exclui permanentemente o incidente, chamados filhos e histórico |
| `PUT` | `/api/incidentes/reordenar` | Persiste a nova ordem das linhas (Drag & Drop) via array de IDs |
| `GET` | `/api/incidentes/:id/historico` | Retorna o histórico cronológico de situações do incidente |
| `GET` | `/api/incidentes/:id/chamados` | Retorna todos os chamados filhos vinculados ao incidente |
| `POST` | `/api/incidentes/:id/chamados` | Adiciona chamado filho a um incidente massivo (*Major*) |
| `DELETE` | `/api/chamados/:id` | Remove um chamado filho vinculado |
| `GET` | `/api/incidentes-maiores` | Retorna dados agregados de incidentes massivos ativos |
| `POST` | `/api/incidentes-maiores/:num/toggle` | Alterna a flag de responsabilidade do analista sobre o Major Incident |

### Cadastros Base

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/hoteis` | Lista hotéis cadastrados |
| `POST` | `/api/hoteis` | Cadastra novo hotel (RID único e Nome) |
| `PUT` | `/api/hoteis/:id` | Atualiza dados do hotel ou status ativo/inativo |
| `DELETE` | `/api/hoteis/:id` | Exclui hotel do catálogo |
| `GET` | `/api/responsaveis` | Lista responsáveis cadastrados |
| `POST` | `/api/responsaveis` | Cadastra novo responsável |
| `PUT` | `/api/responsaveis/:id` | Atualiza nome ou status do responsável |
| `DELETE` | `/api/responsaveis/:id` | Exclui responsável do catálogo |

---

## ⚙️ Comandos Úteis

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia simultaneamente o servidor backend e o cliente Vite em modo desenvolvimento |
| `npm run server` | Inicia apenas o backend Express (`server/index.js`) na porta 5000 |
| `npm run client` | Inicia apenas o cliente Vite (`localhost:3002`) |
| `npm run build` | Compila o bundle minificado de produção em `dist/` |
| `npm run lint` | Executa o linter ESLint em todo o código-fonte |
| `npm run preview` | Executa visualização prévia local da pasta `dist/` |

---

## 🎨 Tipografia e Tokens Visuais

O projeto adota uma hierarquia tipográfica precisa, documentada em detalhes no artifact [font_families_inventory.md](file:///C:/Users/caiqu/.gemini/antigravity-ide/brain/d1841552-cd8c-4025-9fc8-77014c0058a1/font_families_inventory.md):

- **`--font-main` (`Plus Jakarta Sans`)**: Interface principal, textos e tabelas operacionais.
- **`--font-title` (`Montserrat`)**: Títulos de grande impacto visual e modais.
- **`--font-mono` (`JetBrains Mono`)**: Tickets, dados tabulares, valores numéricos de KPI e relógio.

---

## 📄 Licença

Este projeto é de uso interno corporativo sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<div align="center">

## 👨‍💻 Desenvolvido por

**Caique Novaes** — Analista de Suporte & Desenvolvedor

[![GitHub](https://img.shields.io/badge/GitHub-caiquenovaes1994-181717?style=flat&logo=github&logoColor=white)](https://github.com/caiquenovaes1994)
[![Gmail](https://img.shields.io/badge/Gmail-D14836?style=flat&logo=gmail&logoColor=white)](mailto:caiquenovaes1994@gmail.com)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-caiquenovaes-0A66C2?style=flat&logo=linkedin&logoColor=white)](https://linkedin.com/in/caiquenovaes)
[![Telegram](https://img.shields.io/badge/Telegram-caiquenovaes1994-26A5E4?style=flat&logo=telegram&logoColor=white)](https://t.me/caiquenovaes1994)

Feito com ❤️ e ☕ — *2024–2026*

</div>
