# ServiceNow Dynamic Dashboard

Painel interativo e elegante para monitoramento de performance (Chamados e NPS) com armazenamento local em SQLite.

## Estrutura do Projeto

- `/server`: API Node.js e banco de dados SQLite.
- `/src`: Frontend React com tema Dark Blue e gráficos Recharts.

## Funcionalidades

- **KPIs em Tempo Real**: Visualização de totais anuais e médias diárias baseadas no mês atual.
- **Comparativo de NPS**: Gráfico de linha comparando seu NPS pessoal com a média da empresa.
- **Check-ins de Status**: Marcação de meses com Férias ou Projetos especiais.
- **Relógio de Sistema**: Data e hora atualizadas no cabeçalho.
- **Entrada de Dados Ágil**: Tabela editável no rodapé para inserção rápida de métricas mensais.

## Como Executar

1. Certifique-se de ter o Node.js instalado.
2. Na raiz do projeto, execute o script de inicialização (24/7):

   ```bash
   start_dashboard.bat
   ```

3. O dashboard será aberto automaticamente ou poderá ser acessado em:
   `http://localhost:3002`

## Personalização

As cores e estilos principais podem ser ajustados em `src/index.css`. Atualmente configurado para um tema **Deep Blue Premium**.
