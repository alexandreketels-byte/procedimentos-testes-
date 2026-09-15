let dados = [];
let procedimentosData = {};
let pinAdm = null;          // guardado só na sessão do navegador
let procAtual = null;       // id do procedimento aberto na tela

// 🔗 Cole aqui a URL do seu App da Web (Apps Script → Implantar → Novo App da Web)
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw_7ybW_c83KezWpAE5vrRSEgAKySN-rvMClMS6IdCUzacC949gkCkVNLATZKBRqkwS/exec";

// ===== CONTATOS (equipe.csv) =====

fetch("equipe.csv")
  .then(response => {
    const dataArquivo = new Date(response.headers.get("Last-Modified"));
    if (!isNaN(dataArquivo)) {
      const opcoes = { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" };
      document.getElementById("ultimaAtualizacao").textContent =
        "⏰ Última atualização: " + dataArquivo.toLocaleString("pt-BR", opcoes);
    }
    return response.text();
  })
  .then(text => {
    const linhas = text.trim().split("\n").slice(1);
    dados = linhas.map(linha => {
      const [setor, nome, celular, email, ramal] = linha.split(",");
      return { setor, nome, celular, email, ramal };
    });
    mostrarCards(dados);
  });

function mostrarCards(lista) {
  const container = document.getElementById("cardsContainer");
  if (!container) return;
  container.innerHTML = "";

  if (lista.length === 0) {
    container.innerHTML = "<p>Nenhum resultado encontrado.</p>";
    document.getElementById("contadorResultados").textContent = "";
    return;
  }

  lista.forEach(d => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.innerHTML = `
      <div class="setor">${d.setor || ""}</div>
      <div class="nome">${d.nome || ""}</div>
      <div class="contato"><i class="fa-brands fa-whatsapp" style="color: #25D366;"></i> ${d.celular || ""}</div>
      <div class="contato"><i class="fa-solid fa-envelope"></i> ${d.email || ""}</div>
      <div class="contato"><i class="fa-solid fa-phone"></i> ${d.ramal || ""}</div>
    `;
    container.appendChild(card);
  });

  document.getElementById("contadorResultados").textContent =
    `${lista.length} contato${lista.length > 1 ? "s" : ""} encontrado${lista.length > 1 ? "s" : ""}`;
}

const inputContatos = document.getElementById("searchInput");
if (inputContatos) {
  inputContatos.addEventListener("input", e => {
    const valor = e.target.value.toLowerCase();
    const filtrados = dados.filter(d =>
      d.nome.toLowerCase().includes(valor) || d.setor.toLowerCase().includes(valor)
    );
    mostrarCards(filtrados);
  });
}

// ===== PROCEDIMENTOS (vindos da planilha) =====

function carregarProcedimentos() {
  return fetch(APPS_SCRIPT_URL + "?t=" + Date.now())
    .then(r => r.json())
    .then(json => {
      procedimentosData = json;
    })
    .catch(() => console.log("Não foi possível carregar os procedimentos da planilha."));
}

carregarProcedimentos();

document.querySelectorAll(".dropdown-content a[data-proc]").forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    mostrarProcedimento(link.getAttribute("data-proc"));
  });
});

// ===== FORMATAÇÃO DO TEXTO =====
// Aceita os dois formatos:
//  - texto simples (linha em branco = parágrafo, "- " = lista, **negrito**)
//  - HTML, quando o conteúdo foi escrito pelo editor do site
function escapeHtml(texto) {
  return texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function pareceHtml(texto) {
  return /<(p|br|b|strong|i|em|u|ul|ol|li|span|div|font)\b/i.test(texto);
}

function formatarConteudo(texto) {
  if (!texto) return "";
  if (pareceHtml(texto)) return texto; // já veio formatado do editor

  const blocos = texto.replace(/\r\n/g, "\n").split(/\n\s*\n/);

  return blocos.map(bloco => {
    const linhas = bloco.split("\n").filter(l => l.trim() !== "");
    if (linhas.length === 0) return "";

    const ehLista = linhas.every(l => l.trim().startsWith("- "));

    const aplicarInline = linha => {
      let l = escapeHtml(linha);
      l = l.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
      l = l.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank">$1</a>');
      return l;
    };

    if (ehLista) {
      const itens = linhas
        .map(l => `<li>${aplicarInline(l.trim().replace(/^-\s+/, ""))}</li>`)
        .join("");
      return `<ul>${itens}</ul>`;
    }

    return `<p>${linhas.map(aplicarInline).join("<br>")}</p>`;
  }).join("");
}

// ===== TELA DE VISUALIZAÇÃO DO PROCEDIMENTO =====

function mostrarProcedimento(id) {
  const conteudo = document.querySelector(".container");
  const proc = procedimentosData[id];
  procAtual = id;

  if (!proc) {
    conteudo.innerHTML = `
      <button class="botao-voltar" onclick="location.reload()">⬅ Voltar</button>
      <p>Procedimento ainda não cadastrado ou não encontrado.</p>
    `;
    return;
  }

  conteudo.innerHTML = `
    <div class="barra-procedimento">
      <button class="botao-voltar" onclick="location.reload()">⬅ Voltar</button>
      ${pinAdm ? `<button class="botao-editar" id="btnEditar">✏️ Editar</button>` : ""}
    </div>

    <div class="procedimento-conteudo">
      <h2>${escapeHtml(proc.titulo)}</h2>
      <div class="procedimento-texto" id="textoProcedimento">
        ${proc.conteudo ? formatarConteudo(proc.conteudo) : "<p><em>Conteúdo ainda não preenchido.</em></p>"}
      </div>
      ${proc.atualizado ? `<p class="procedimento-atualizado">Última atualização: ${proc.atualizado}</p>` : ""}
    </div>
  `;

  const btnEditar = document.getElementById("btnEditar");
  if (btnEditar) {
    btnEditar.addEventListener("click", () => abrirEditor(id));
  }
}

// ===== EDITOR VISUAL =====

function abrirEditor(id) {
  const proc = procedimentosData[id];
  const conteudo = document.querySelector(".container");

  conteudo.innerHTML = `
    <div class="barra-procedimento">
      <button class="botao-voltar" id="btnCancelar">✖ Cancelar</button>
      <button class="botao-salvar" id="btnSalvar">💾 Salvar</button>
    </div>

    <div class="editor-wrapper">
      <h2 class="editor-titulo">${escapeHtml(proc.titulo)}</h2>

      <div class="editor-ferramentas">
        <button type="button" data-cmd="bold" title="Negrito"><b>N</b></button>
        <button type="button" data-cmd="italic" title="Itálico"><i>I</i></button>
        <button type="button" data-cmd="underline" title="Sublinhado"><u>S</u></button>
        <button type="button" data-cmd="insertUnorderedList" title="Lista">• Lista</button>

        <span class="editor-separador"></span>

        <label class="editor-cor">
          Cor:
          <input type="color" id="corTexto" value="#ffffff">
        </label>

        <span class="editor-separador"></span>

        <button type="button" data-cmd="removeFormat" title="Limpar formatação">🧹 Limpar</button>
      </div>

      <div id="editorConteudo" class="editor-area" contenteditable="true">${
        proc.conteudo ? formatarConteudo(proc.conteudo) : ""
      }</div>

      <p class="editor-dica">Selecione o texto e use os botões acima para formatar.</p>
      <p class="editor-status" id="editorStatus"></p>
    </div>
  `;

  const editor = document.getElementById("editorConteudo");

  // Botões de formatação
  document.querySelectorAll(".editor-ferramentas button[data-cmd]").forEach(btn => {
    btn.addEventListener("mousedown", e => {
      e.preventDefault(); // não perde a seleção do texto
      document.execCommand(btn.getAttribute("data-cmd"), false, null);
      editor.focus();
    });
  });

  // Seletor de cor
  document.getElementById("corTexto").addEventListener("input", e => {
    document.execCommand("foreColor", false, e.target.value);
    editor.focus();
  });

  document.getElementById("btnCancelar").addEventListener("click", () => {
    mostrarProcedimento(id);
  });

  document.getElementById("btnSalvar").addEventListener("click", () => {
    salvarProcedimento(id, editor.innerHTML);
  });
}

function salvarProcedimento(id, html) {
  const status = document.getElementById("editorStatus");
  const btnSalvar = document.getElementById("btnSalvar");

  status.textContent = "Salvando...";
  status.className = "editor-status";
  btnSalvar.disabled = true;

  fetch(APPS_SCRIPT_URL, {
    method: "POST",
    // text/plain evita o preflight CORS, que o Apps Script não responde
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      acao: "salvar",
      pin: pinAdm,
      id: id,
      conteudo: html
    })
  })
    .then(r => r.json())
    .then(resp => {
      btnSalvar.disabled = false;

      if (resp.ok) {
        status.textContent = "✅ Salvo com sucesso!";
        status.className = "editor-status sucesso";

        // atualiza em memória para não precisar recarregar a página
        procedimentosData[id].conteudo = html;
        procedimentosData[id].atualizado = resp.atualizado || "";

        setTimeout(() => mostrarProcedimento(id), 900);
      } else {
        status.textContent = "❌ " + (resp.erro || "Erro ao salvar.");
        status.className = "editor-status erro";
      }
    })
    .catch(() => {
      btnSalvar.disabled = false;
      status.textContent = "❌ Erro de conexão ao salvar.";
      status.className = "editor-status erro";
    });
}

// ===== LOGIN DE ADMINISTRADOR =====

const btnAdm = document.getElementById("botaoAdm");

if (btnAdm) {
  btnAdm.addEventListener("click", () => {
    if (pinAdm) {
      // já logado → sair
      pinAdm = null;
      atualizarBotaoAdm();
      if (procAtual) mostrarProcedimento(procAtual);
      return;
    }
    abrirLoginAdm();
  });
}

function atualizarBotaoAdm() {
  if (!btnAdm) return;
  btnAdm.textContent = pinAdm ? "🔓 Sair do modo edição" : "🔒 Modo edição";
  btnAdm.classList.toggle("adm-ativo", !!pinAdm);
}

function abrirLoginAdm() {
  const modal = document.createElement("div");
  modal.id = "modalAdm";
  modal.innerHTML = `
    <div class="modal-conteudo">
      <span class="fechar-popup" id="fecharAdm">&times;</span>
      <h3>Modo edição</h3>
      <p>Informe o PIN de administrador:</p>
      <input type="password" id="inputPin" inputmode="numeric" placeholder="PIN" autocomplete="off">
      <button id="btnEntrarAdm">Entrar</button>
      <p class="editor-status" id="statusAdm"></p>
    </div>
  `;
  document.body.appendChild(modal);

  const input = document.getElementById("inputPin");
  input.focus();

  const fechar = () => modal.remove();
  document.getElementById("fecharAdm").addEventListener("click", fechar);

  const tentarEntrar = () => {
    const pin = input.value.trim();
    const status = document.getElementById("statusAdm");

    if (!pin) {
      status.textContent = "Digite o PIN.";
      status.className = "editor-status erro";
      return;
    }

    status.textContent = "Verificando...";
    status.className = "editor-status";

    fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ acao: "validar", pin: pin })
    })
      .then(r => r.json())
      .then(resp => {
        if (resp.ok) {
          pinAdm = pin;
          atualizarBotaoAdm();
          fechar();
          if (procAtual) mostrarProcedimento(procAtual);
        } else {
          status.textContent = "❌ " + (resp.erro || "PIN incorreto.");
          status.className = "editor-status erro";
          input.value = "";
          input.focus();
        }
      })
      .catch(() => {
        status.textContent = "❌ Erro de conexão.";
        status.className = "editor-status erro";
      });
  };

  document.getElementById("btnEntrarAdm").addEventListener("click", tentarEntrar);
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") tentarEntrar();
  });
}

atualizarBotaoAdm();

// ===== PDFs (mantido para formulários que continuam em arquivo) =====

document.querySelectorAll(".dropdown-content a[href$='.pdf']").forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    mostrarPDF(link.getAttribute("href"));
  });
});

function mostrarPDF(url) {
  const conteudo = document.querySelector(".container");
  conteudo.innerHTML = `
    <button class="botao-voltar" onclick="location.reload()">⬅ Voltar</button>
    <iframe src="${url}" class="visualizador-pdf"></iframe>
  `;
}

// ===== POPUP DE AVISOS =====

function mostrarPopup(mensagem) {
  const popup = document.createElement("div");
  popup.id = "popupAviso";
  popup.innerHTML = `
    <div class="popup-conteudo">
      <span class="fechar-popup">&times;</span>
      <p>${mensagem.replace(/<br><br>/g, "<hr class='linha-popup'>")}</p>
    </div>
  `;
  document.body.appendChild(popup);

  popup.querySelector(".fechar-popup").addEventListener("click", () => popup.remove());
}

function destacarDatas(msg) {
  const regexDatas = /(?:^|<br><br>)(\d{1,2}\/\d{1,2}\/\d{2,4})/g;
  return msg.replace(regexDatas, (match, data) =>
    match.replace(data, `<span style="color: red; font-weight: bold; font-size: 20px;">${data}</span>`)
  );
}

fetch("popup.json?V=1")
  .then(r => r.json())
  .then(cfg => {
    if (!cfg.ativo) return;

    const agora = Date.now();
    const ultimaVez = localStorage.getItem("popup_mostrado_v1_tempo");
    const dezMin = 10 * 60 * 1000;

    if (!ultimaVez || (agora - parseInt(ultimaVez)) > dezMin) {
      mostrarPopup(destacarDatas(cfg.mensagem));
      localStorage.setItem("popup_mostrado_v1_tempo", agora);
    }
  })
  .catch(() => console.log("Popup desativado ou arquivo não encontrado"));

const btnNotificacoes = document.getElementById("botaoNotificacoes");
if (btnNotificacoes) {
  btnNotificacoes.addEventListener("click", () => {
    fetch("popup.json?btn=1")
      .then(r => r.json())
      .then(cfg => mostrarPopup(destacarDatas(cfg.mensagem)))
      .catch(() => alert("Erro ao carregar notificações!"));
  });
}

// ===== BUSCA GLOBAL =====

const itensBusca = [];

document.querySelectorAll(".dropdown-content a").forEach(link => {
  itensBusca.push({
    texto: link.textContent.toLowerCase(),
    label: link.textContent,
    url: link.getAttribute("href"),
    proc: link.getAttribute("data-proc")
  });
});

const campoBusca = document.getElementById("buscaGlobal");
const resultadosDiv = document.getElementById("resultadosBusca");

if (campoBusca) {
  campoBusca.addEventListener("input", () => {
    const termo = campoBusca.value.toLowerCase().trim();
    resultadosDiv.innerHTML = "";

    if (!termo) {
      resultadosDiv.style.display = "none";
      return;
    }

    const resultados = itensBusca.filter(item => item.texto.includes(termo));

    resultadosDiv.style.display = "block";

    if (resultados.length === 0) {
      resultadosDiv.innerHTML = "<div class='resultado-item'>Nenhum resultado</div>";
      return;
    }

    resultados.slice(0, 8).forEach(item => {
      const div = document.createElement("div");
      div.className = "resultado-item";
      div.textContent = item.label;
      div.onclick = () => {
        if (item.proc) {
          mostrarProcedimento(item.proc);
        } else {
          window.location.href = item.url;
        }
      };
      resultadosDiv.appendChild(div);
    });
  });
}

document.querySelectorAll('.dropbtn').forEach(btn => {
  btn.addEventListener('click', e => e.preventDefault());
});
