# Política de Segurança

## Versões com Suporte

| Versão | Suportada |
| --- | --- |
| Última release na `main` | ✅ Sim |
| Branches de feature / PRs | ❌ Não |

## Relatando uma Vulnerabilidade

Se você encontrar uma vulnerabilidade de segurança neste projeto, **por favor, não abra uma Issue pública**. Em vez disso, siga o fluxo abaixo para que possamos tratar o problema com responsabilidade.

### 📧 Canal de Contato

Envie um e-mail para **[caiquenovaes1994@gmail.com](mailto:caiquenovaes1994@gmail.com)** com as seguintes informações:

1. **Descrição** — Resumo claro da vulnerabilidade
2. **Passos para reprodução** — Como reproduzir o problema (se aplicável)
3. **Impacto estimado** — Qual o possível dano se explorada (ex.: acesso indevido a dados, escalação de privilégios)
4. **Evidências** — Capturas de tela, logs, payloads ou provas de conceito (se disponíveis)

### ⏱️ Tempo de Resposta

| Etapa | Prazo |
| --- | --- |
| Confirmação de recebimento | Até **48 horas** |
| Avaliação e triagem | Até **7 dias** |
| Correção ou mitigação | Caso a caso, com comunicação constante |

### 🔒 Compromissos

- Não divulgaremos sua identidade sem consentimento
- Manteremos você informado(a) sobre o progresso da correção
- Creditaremos publicamente (se autorizado) na release note de correção

## Boas Práticas Adotadas

Este projeto adota as seguintes medidas de segurança:

### Armazenamento Local

- O banco de dados SQLite opera **localmente** (`server/dashboard.db`), sem exposição a serviços externos
- Arquivos de backup (`.bak`) são gerados automaticamente via debounce em `server/backups/`
- Arquivos CSV temporários são **removidos imediatamente** após processamento

### Dependências

- Dependências são fixadas com `package-lock.json` para garantir builds reprodutíveis
- Recomenda-se executar `npm audit` periodicamente para identificar vulnerabilidades conhecidas

### Acesso à API

- A API Express opera com **CORS habilitado** — em produção, recomenda-se restringir a origem permitida
- Não há autenticação integrada — o dashboard é projetado para **uso em rede local/confiável**
- Uploads são limitados pelo Multer (processamento em disco temporário, limpeza automática)

### Dados Sensíveis

- Nenhum dado pessoal identificável (PII) é coletado ou armazenado pelo dashboard
- As métricas registradas são exclusivamente operacionais (contagens, NPS, SLA)
- O arquivo `.gitignore` exclui o banco de dados (`*.db`, `*.db.bak`) do versionamento

## Escopo

Esta política se aplica exclusivamente ao código-fonte deste repositório e suas dependências diretas. Não cobre:

- Instâncias do ServiceNow de onde os dados são exportados
- Infraestrutura de rede onde o dashboard é executado
- Extensões ou forks de terceiros

---

> **Obrigado por ajudar a manter este projeto seguro!** 🛡️
