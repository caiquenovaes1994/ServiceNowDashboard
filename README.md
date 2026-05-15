# 📊 ServiceNow Dynamic Dashboard

> Painel analítico de alta performance para monitoramento de chamados, NPS, SLA e Perfect Fix

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-Private-red?style=for-the-badge)

---

## 📋 Sobre o Projeto

O **ServiceNow Dynamic Dashboard** é uma aplicação web full-stack desenvolvida para centralizar e visualizar métricas operacionais de equipes de suporte e atendimento. O sistema oferece uma interface moderna com tema **Deep Blue Premium**, gráficos interativos e sincronização de dados em tempo real, tudo armazenado localmente com SQLite para máxima autonomia e velocidade.

A partir da versão atual, o dashboard suporta **ingestão automática de dados via exportação CSV do ServiceNow**, calculando SLA e Perfect Fix diretamente a partir dos registros brutos.

---

## ✨ Funcionalidades

| Recurso | Descrição |
| --- | --- |
| **KPIs Dinâmicos** | 8 cards organizados em 2 linhas × 4 colunas com totais, médias, SLA% e Perfect Fix |
| **Monitoramento de SLA** | Calcula a acurácia de SLA (`within_sla_count / closed_count × 100`) com alertas de cor dinâmicos |
| **Perfect Fix** | Rastreia chamados nunca reabertos (`perfect_fix_count / closed_count × 100`) com escala de cor em 3 faixas |
| **Importação de CSV** | Upload do export do ServiceNow para cálculo automático de SLA e Perfect Fix por mês |
| **Comparativo de NPS** | Gráfico de linha comparando NPS pessoal com a média corporativa, com destaques de melhor/pior mês |
| **Volume de Chamados** | Gráfico de barras com sobreposição de fechados vs. avaliados e indicadores de extremos |
| **Índice de Chamados** | Gráfico de linha com tooltip detalhado exibindo percentual de avaliação por mês |
| **Check-ins de Status** | Marcação de meses com Férias ou Projetos especiais, excluídos automaticamente das análises de NPS |
| **Relógio de Sistema** | Data e hora atualizadas em tempo real no cabeçalho |
| **Edição Controlada** | Tabela editável restrita ao mês atual e ao mês anterior, protegendo dados históricos |
| **Backup Automático** | Persistência com backup `.bak` via debounce, disparado a cada salvamento |
| **Auto-Seed** | Inicialização automática do banco com dados históricos de 2024–2026 em caso de banco vazio |
| **Migração de Schema** | Adição automática de colunas novas em bancos existentes (sem perda de dados) |
| **Dados Históricos** | Navegação por ano (2024, 2025, 2026) com cálculos independentes por período |

---

## 🛠️ Stack Tecnológica

### Frontend

- **React 18** — Componentização e renderização reativa
- **Vite 5** — Build tool ultrarrápido com HMR e proxy integrado
- **Recharts** — Gráficos responsivos e interativos (LineChart, BarChart)
- **Lucide React** — Ícones modernos e consistentes
- **Axios** — Comunicação HTTP com o backend
- **JetBrains Mono** — Tipografia monospace para valores numéricos de KPI

### Backend

- **Node.js + Express** — API RESTful leve e performática
- **SQLite 3** — Banco de dados embarcado, zero configuração
- **Multer** — Recepção de arquivos via `multipart/form-data`
- **csv-parser** — Leitura e parsing de arquivos CSV em stream
- **Morgan** — Logging de requisições HTTP em modo desenvolvimento
- **CORS** — Controle de acesso cross-origin

---

## 📁 Estrutura do Projeto

```text
ServiceNowDashboard/
├── server/                  # Backend da aplicação
│   ├── index.js             # Servidor Express e rotas da API
│   ├── database.js          # Camada de acesso ao banco SQLite
│   ├── uploads/             # Diretório temporário de CSVs (auto-limpo)
│   ├── dashboard.db         # Banco de dados principal
│   └── dashboard.db.bak     # Backup automático
├── src/                     # Frontend React
│   ├── App.jsx              # Componente principal + CsvUploader
│   ├── index.css            # Design system (tema Deep Blue Premium)
│   └── main.jsx             # Ponto de entrada da aplicação React
├── public/                  # Arquivos públicos estáticos
├── dist/                    # Build de produção (gerado pelo Vite)
├── start_dashboard.bat      # Script de inicialização com auto-restart (Windows)
├── package.json             # Dependências e scripts NPM
├── vite.config.js           # Configuração do Vite (porta, proxy)
└── eslint.config.js         # Configuração do ESLint
```

---

## 🚀 Como Executar

### Pré-requisitos

- [Node.js](https://nodejs.org/) v18 ou superior
- npm (incluído com o Node.js)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/caiquenovaes1994/ServiceNowDashboard.git

# Acesse o diretório do projeto
cd ServiceNowDashboard

# Instale as dependências
npm install
```

### Execução

#### Modo Desenvolvimento (Frontend + Backend simultâneos)

```bash
npm run dev
```

> O Vite dev server roda na porta **3002** e faz proxy das chamadas `/api` para o backend na porta **5000**.

#### Modo Produção

```bash
# Build do frontend
npm run build

# Inicia o servidor (serve o frontend compilado + API)
npm start
```

#### Via Script (Windows — execução contínua com auto-restart)

```bash
start_dashboard.bat
```

### Acesso

| Ambiente | URL |
| --- | --- |
| Desenvolvimento | `http://localhost:3002` |
| Produção | `http://localhost:5000` |

---

## 📡 API REST

| Método | Endpoint | Descrição |
| --- | --- | --- |
| `GET` | `/api/metrics?year=2026` | Retorna métricas do ano especificado |
| `POST` | `/api/metrics` | Cria ou atualiza métrica mensal (UPSERT completo) |
| `POST` | `/api/settings` | Salva configuração chave-valor |
| `POST` | `/api/upload-metrics` | Processa CSV do ServiceNow e atualiza SLA/Perfect Fix |

### Exemplo de Payload — `POST /api/metrics`

```json
{
  "year": 2026,
  "month": "Abril",
  "closed_count": 150,
  "evaluated_count": 28,
  "nps": 4.85,
  "nps_general": 4.72,
  "is_vacation": 0,
  "is_project": 0,
  "within_sla_count": 142,
  "perfect_fix_count": 130
}
```

### `POST /api/upload-metrics`

Recebe um arquivo CSV via `multipart/form-data` (campo `file`).

**Resposta de sucesso:**

```json
{
  "success": true,
  "rows_processed": 57,
  "rows_skipped": 0,
  "months_updated": 2,
  "summary": {
    "2026-03": { "within_sla": 31, "perfect_fix": 28 },
    "2026-04": { "within_sla": 24, "perfect_fix": 21 }
  }
}
```

---

## 📥 Importação de CSV do ServiceNow

### Como usar

1. Exporte os chamados diretamente pelo ServiceNow em formato **CSV**
2. No dashboard, clique em **"Importar CSV"** no cabeçalho
3. Selecione o arquivo — o processamento ocorre automaticamente
4. Os KPIs e gráficos atualizam em tempo real após o upload

### Colunas esperadas no CSV

| Coluna no CSV | Uso |
| --- | --- |
| `sys_created_on` | Data de criação do chamado |
| `sys_updated_on` | Data de atualização (usada para agrupar por mês) |
| `priority` | Prioridade do chamado (ex.: `"4 - Low"`, `"1 - Critical"`) |
| `u_reopen_count` | Número de vezes que o chamado foi reaberto |

### Lógica de Processamento

| Passo | Descrição |
| --- | --- |
| **Duração** | `(sys_updated_on − sys_created_on)` em segundos |
| **Verificação de SLA** | Compara a duração com o limite por prioridade (tabela abaixo) |
| **Perfect Fix** | `SLA cumprido == true` **E** `u_reopen_count == 0` |
| **Agrupamento** | Por mês/ano da coluna `sys_updated_on` |
| **Persistência** | UPSERT cirúrgico — atualiza apenas `within_sla_count` e `perfect_fix_count`, preservando NPS e demais campos |
| **Higiene** | Arquivo CSV removido do disco imediatamente após a leitura |

### Limites de SLA por Prioridade

| Prioridade | Limite |
| --- | --- |
| P1 — Critical | 4 horas |
| P2 — High | 24 horas |
| P3 — Moderate | 48 horas |
| P4 — Low | 96 horas |

---

## ⚙️ Scripts Disponíveis

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia frontend e backend em modo desenvolvimento |
| `npm run server` | Inicia apenas o servidor backend (porta 5000) |
| `npm run client` | Inicia apenas o frontend Vite (porta 3002) |
| `npm run build` | Gera build de produção do frontend |
| `npm start` | Inicia o servidor em modo produção |
| `npm run lint` | Executa análise estática de código (ESLint) |
| `npm run preview` | Preview local do build de produção |

---

## 📐 Lógica de Cálculo dos KPIs

### Linha 1 — Chamados & Qualidade

| KPI | Fórmula |
| --- | --- |
| **Total de Chamados Fechados** | Soma de `closed_count` no ano |
| **Fechados por mês** | `Total Fechados / Meses com registros` |
| **NPS Médio** | `Soma NPS / Meses com NPS > 0` |
| **SLA%** | `(Soma within_sla_count / Soma closed_count) × 100` |

### Linha 2 — Avaliações & Eficiência

| KPI | Fórmula |
| --- | --- |
| **Total de Chamados Avaliados** | Soma de `evaluated_count` no ano |
| **Avaliações por mês** | `Total Avaliados / Meses com registros` |
| **Índice de Avaliação** | `(Total Avaliados / Total Fechados) × 100` |
| **Perfect Fix** | `(Soma perfect_fix_count / Soma closed_count) × 100` |

> **Nota**: As médias mensais são calculadas dividindo pelo número de meses que possuem registros efetivos (`closed_count > 0` ou `evaluated_count > 0`) em cada ano, garantindo precisão tanto para anos fechados quanto para o ano corrente.

---

## 🎨 Regras de Cores dos KPIs

### SLA%

| Faixa | Cor |
| --- | --- |
| ≥ 95% | 🟢 Verde (`--success`) |
| 71% a 94% | 🟠 Laranja (`--secondary`) |
| ≤ 70% | 🔴 Vermelho (`--error`) |

### Perfect Fix

| Faixa | Cor |
| --- | --- |
| ≥ 80% | 🟢 Verde (`--success`) |
| 71% a 79% | 🟠 Laranja (`--secondary`) |
| ≤ 70% | 🔴 Vermelho (`--error`) |

---

## 🗄️ Schema do Banco de Dados

A tabela `metrics` contém as seguintes colunas, com migração automática para bancos existentes:

| Coluna | Tipo | Descrição |
| --- | --- | --- |
| `year` | INTEGER | Ano de referência |
| `month` | TEXT | Mês de referência (em português) |
| `closed_count` | INTEGER | Chamados fechados no mês |
| `evaluated_count` | INTEGER | Chamados avaliados no mês |
| `nps` | REAL | NPS pessoal do mês |
| `nps_general` | REAL | NPS geral corporativo |
| `is_vacation` | INTEGER | 1 = mês de férias |
| `is_project` | INTEGER | 1 = mês em projeto especial |
| `within_sla_count` | INTEGER | Chamados atendidos dentro do SLA |
| `perfect_fix_count` | INTEGER | Chamados nunca reabertos (Perfect Fix) |

---

## 🎨 Personalização

O sistema de design está centralizado em `src/index.css`, utilizando variáveis CSS para fácil customização:

```css
--primary: #38bdf8;       /* Azul principal */
--secondary: #f97316;     /* Laranja (atenção) */
--success: #34d399;       /* Verde (meta atingida) */
--error: #ef4444;         /* Vermelho (alerta crítico) */
```

- **Tipografia** — JetBrains Mono para valores numéricos, Plus Jakarta Sans para textos
- **Animações** — Micro-animações e transições suaves
- **Layout** — Grid responsivo com glassmorphism e tema Deep Blue Premium

---

## 📄 Licença

Este projeto é de uso **privado e proprietário**. Todos os direitos reservados.

---

## 👨‍💻 Desenvolvido por

**Caique Novaes** — Analista de Suporte & Desenvolvedor

[![GitHub](https://img.shields.io/badge/GitHub-caiquenovaes1994-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/caiquenovaes1994)

Feito com ❤️ e ☕ — *2024–2026*
