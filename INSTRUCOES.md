# Portal de Procedimentos — edição pelo próprio site

## O que muda

Os procedimentos deixam de ser PDFs. O conteúdo passa a ficar numa planilha
do Google, mas **você não precisa abrir a planilha pra editar** — dá pra
editar direto no site, com PIN de administrador, formatando com negrito,
itálico, sublinhado, listas e cor de fonte.

Os downloads reais (formulários .xlsx/.pptx que o usuário baixa e preenche)
continuam como estavam.

## Passo 1 — Criar a planilha

1. Crie uma planilha no Google Sheets.
2. Renomeie a primeira aba para `Procedimentos` (nome exato).
3. Importe o `procedimentos_scaffold.csv` nessa aba. Ele já vem com as
   colunas certas (`ID`, `Setor`, `Titulo`, `Conteudo`, `UltimaAtualizacao`)
   e uma linha para cada procedimento do menu atual.
4. **Não apague nem renomeie a coluna `ID`** — é ela que liga a planilha ao
   link do menu.

Você pode deixar a coluna `Conteudo` toda vazia por enquanto e preencher
tudo depois, direto pelo site.

## Passo 2 — Configurar o Apps Script

1. Na planilha: Extensões → Apps Script.
2. Apague o conteúdo padrão e cole o `Code.gs`.
3. Troque `SHEET_ID` pelo ID da planilha (trecho da URL entre `/d/` e `/edit`).
4. **Defina o PIN de administrador** (importante — não coloque o PIN no código):
   - Apps Script → ⚙️ Configurações do projeto
   - Role até "Propriedades do script" → Adicionar propriedade
   - Propriedade: `PIN_ADM`
   - Valor: o PIN que você quiser (ex: `4829`)
   - Salvar
5. Implantar → Nova implantação → ⚙️ → **App da Web**:
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
6. Autorize as permissões quando pedir.
7. Copie a URL gerada (termina em `/exec`).

⚠️ Mudou o **código** do Apps Script? Precisa de **nova implantação**.
Editou conteúdo pelo site ou pela planilha? Não precisa.

## Passo 3 — Ligar o site

1. No `script.js`, troque:
   ```js
   const APPS_SCRIPT_URL = "COLE_AQUI_A_URL_DO_APPS_SCRIPT";
   ```
   pela URL do passo anterior.
2. Suba `index.inc`, `script.js` e `style.css` para o GitHub Pages.

## Como editar no dia a dia

1. Abra o site e clique em **🔒 Modo edição** (canto superior).
2. Digite o PIN. O botão fica verde: **🔓 Sair do modo edição**.
3. Abra qualquer procedimento pelo menu → aparece o botão **✏️ Editar**.
4. Escreva normalmente. Selecione o texto e use a barra de ferramentas:
   - **N** negrito, *I* itálico, <u>S</u> sublinhado
   - • Lista com marcadores
   - Seletor de **Cor** da fonte
   - 🧹 Limpar formatação
5. Clique em **💾 Salvar**. Grava direto na planilha.

Quem não tem o PIN só enxerga o conteúdo — nem vê o botão de editar.

O PIN vale só enquanto a aba estiver aberta. Fechou o navegador, precisa
digitar de novo. Isso é proposital: evita que alguém sente no seu
computador e saia editando.

## Sobre a segurança

O PIN é validado **dentro do Apps Script**, não no navegador. Ninguém
descobre o PIN lendo o código do site.

Sendo direto sobre o limite disso: é proteção adequada pra um portal
interno — impede edição acidental e curiosidade de colega. Não é blindagem
contra alguém tecnicamente determinado, porque a URL do Apps Script fica
visível no código do site. Pro uso de vocês, é proporcional. Se um dia o
conteúdo ficar sensível a ponto de justificar mais, o caminho é login com
conta Google em vez de PIN.

Dica: troque o PIN quando alguém com acesso sair da equipe. É só mudar o
valor em Propriedades do script — não precisa nova implantação.

## Formatos aceitos no conteúdo

O site entende os dois:
- **Texto simples** (se você preencher pela planilha): linha em branco =
  parágrafo, `- ` no começo da linha = item de lista, `**palavra**` = negrito.
- **HTML** (o que o editor do site gera automaticamente).

Ou seja, dá pra misturar: preencher alguns pela planilha e outros pelo site,
sem conflito.

## Migração gradual

Procedimento sem conteúdo mostra "Conteúdo ainda não preenchido" em vez de
quebrar. Dá pra migrar os mais usados primeiro e deixar o resto pra depois.
