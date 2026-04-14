# 📊 ServiceNow Dynamic Dashboard

> Painel analítico de alta performance para monitoramento de chamados e NPS

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-Private-red?style=for-the-badge)

---

## 📋 Sobre o Projeto

O **ServiceNow Dynamic Dashboard** é uma aplicação web full-stack desenvolvida para centralizar e visualizar métricas operacionais de equipes de suporte e atendimento. O sistema oferece uma interface moderna com tema **Deep Blue Premium**, gráficos interativos e sincronização de dados em tempo real, tudo armazenado localmente com SQLite para máxima autonomia e velocidade.

---

## ✨ Funcionalidades

| Recurso | Descrição |
| --- | --- |
| **KPIs Dinâmicos** | Totais anuais e médias calculadas com base nos meses com registros efetivos em cada ano |
| **Comparativo de NPS** | Gráfico de linha comparando NPS pessoal com a média corporativa, com destaques de melhor/pior mês |
| **Volume de Chamados** | Gráfico de barras com sobreposição de fechados vs. avaliados e indicadores de extremos |
| **Índice de Chamados** | Gráfico de linha com tooltip detalhado exibindo percentual de avaliação por mês |
| **Check-ins de Status** | Marcação de meses com Férias ou Projetos especiais, excluídos automaticamente das análises de NPS |
| **Relógio de Sistema** | Data e hora atualizadas em tempo real no cabeçalho |
| **Edição Controlada** | Tabela editável restrita ao mês atual e ao mês anterior, protegendo dados históricos |
| **Backup Automático** | Persistência com backup `.bak` via debounce, disparado a cada salvamento |
| **Auto-Seed** | Inicialização automática do banco com dados históricos de 2024–2026 em caso de banco vazio |
| **Migração de Schema** | Adição automática de colunas novas (`nps_general`, `is_vacation`, `is_project`) em bancos existentes |
| **Dados Históricos** | Navegação por ano (2024, 2025, 2026) com cálculos independentes por período |

---

## 🛠️ Stack Tecnológica

### Frontend

- **React 18** — Componentização e renderização reativa
- **Vite 5** — Build tool ultrarrápido com HMR e proxy integrado
- **Recharts** — Gráficos responsivos e interativos (LineChart, BarChart)
- **Lucide React** — Ícones modernos e consistentes
- **Axios** — Comunicação HTTP com o backend

### Backend

- **Node.js + Express** — API RESTful leve e performática
- **SQLite 3** — Banco de dados embarcado, zero configuração
- **Morgan** — Logging de requisições HTTP em modo desenvolvimento
- **CORS** — Controle de acesso cross-origin

---

## 📁 Estrutura do Projeto

```text
ServiceNowDashboard/
├── server/                  # Backend da aplicação
│   ├── index.js             # Servidor Express e rotas da API
│   ├── database.js          # Camada de acesso ao banco SQLite
│   ├── dashboard.db         # Banco de dados principal
│   └── dashboard.db.bak     # Backup automático
├── src/                     # Frontend React
│   ├── App.jsx              # Componente principal do dashboard
│   ├── index.css            # Design system (tema Deep Blue Premium)
│   └── main.jsx             # Ponto de entrada da aplicação React
├── public/                  # Arquivos públicos estáticos
│   ├── favicon.svg          # Ícone da aplicação
│   └── icons.svg            # Sprites de ícones
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
| `POST` | `/api/metrics` | Cria ou atualiza métrica mensal (UPSERT) |
| `POST` | `/api/settings` | Salva configuração chave-valor |

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
  "is_project": 0
}
```

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

| KPI | Fórmula |
| --- | --- |
| **Fechados por mês** | `Total Fechados / Meses com registros` |
| **Fechados por dia** | `Total Fechados / (Meses com registros × 22)` |
| **Avaliações por mês** | `Total Avaliados / Meses com registros` |
| **Avaliações por dia** | `Total Avaliados / (Meses com registros × 22)` |
| **Índice de Avaliação** | `(Total Avaliados / Total Fechados) × 100` |
| **NPS Médio** | `Soma NPS / Meses com NPS > 0` |

> **Nota**: As médias mensais são calculadas dividindo pelo número de meses que possuem registros efetivos (`closed_count > 0` ou `evaluated_count > 0`) em cada ano, garantindo precisão tanto para anos fechados quanto para o ano corrente.

---

## 🎨 Personalização

O sistema de design está centralizado em `src/index.css`, utilizando variáveis CSS para fácil customização:

- **Paleta de cores** — Tema Deep Blue Premium com gradientes e glassmorphism
- **Tipografia** — Fontes modernas e responsivas
- **Animações** — Micro-animações e transições suaves

---

## 📄 Licença

Este projeto é de uso **privado e proprietário**. Todos os direitos reservados.

---

## 👨‍💻 Desenvolvido por

**Caique Novaes** — Analista de Suporte & Desenvolvedor

[![GitHub](https://img.shields.io/badge/GitHub-caiquenovaes1994-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/caiquenovaes1994)

Feito com ❤️ e ☕ — *2024–2026*
