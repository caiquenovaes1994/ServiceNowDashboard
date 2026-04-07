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
| **KPIs em Tempo Real** | Totais anuais e médias diárias calculadas automaticamente com base no mês corrente |
| **Comparativo de NPS** | Gráfico de linha comparando NPS pessoal com a média corporativa |
| **Check-ins de Status** | Marcação de meses com Férias, Projetos especiais ou outras categorias |
| **Relógio de Sistema** | Data e hora atualizadas em tempo real no cabeçalho |
| **Entrada de Dados Ágil** | Tabela editável com auto-sync para inserção rápida de métricas mensais |
| **Backup Automático** | Persistência de dados com backup `.bak` integrado ao fluxo de salvamento |
| **Dados Históricos** | Suporte a importação e visualização de dados de anos anteriores |

---

## 🛠️ Stack Tecnológica

### Frontend

- **React 18** — Componentização e renderização reativa
- **Vite 5** — Build tool ultrarrápido com HMR
- **Recharts** — Gráficos responsivos e interativos
- **Lucide React** — Ícones modernos e consistentes
- **Axios** — Comunicação HTTP com o backend

### Backend

- **Node.js + Express** — API RESTful leve e performática
- **SQLite 3** — Banco de dados embarcado, zero configuração
- **Morgan** — Logging de requisições HTTP
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
│   ├── App.css              # Estilos do componente App
│   ├── index.css            # Design system (tema Deep Blue Premium)
│   ├── main.jsx             # Ponto de entrada da aplicação React
│   └── assets/              # Recursos estáticos
├── dist/                    # Build de produção (gerado pelo Vite)
├── public/                  # Arquivos públicos estáticos
├── start_dashboard.bat      # Script de inicialização (Windows)
├── package.json             # Dependências e scripts NPM
├── vite.config.js           # Configuração do Vite
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
git clone https://github.com/seu-usuario/ServiceNowDashboard.git

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

#### Modo Produção

```bash
# Build do frontend
npm run build

# Inicia o servidor (serve o frontend compilado + API)
npm start
```

#### Via Script (Windows — execução contínua)

```bash
start_dashboard.bat
```

### Acesso

Após iniciar, o dashboard estará disponível em:

```text
http://localhost:3002
```

---

## ⚙️ Scripts Disponíveis

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia frontend e backend em modo desenvolvimento |
| `npm run server` | Inicia apenas o servidor backend |
| `npm run client` | Inicia apenas o frontend (Vite dev server) |
| `npm run build` | Gera build de produção do frontend |
| `npm start` | Inicia o servidor em modo produção |
| `npm run lint` | Executa análise estática de código (ESLint) |

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
