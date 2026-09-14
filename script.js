let dados = [];
let procedimentosData = {};

// 🔗 Cole aqui a URL do seu App da Web (Apps Script → Implantar → Novo App da Web)
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw_7ybW_c83KezWpAE5vrRSEgAKySN-rvMClMS6IdCUzacC949gkCkVNLATZKBRqkwS/exec";

// Carrega CSV e exibe data de atualização
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

// Mostra os dados em cards
function mostrarCards(lista) {
  const container = document.getElementById("cardsContainer");
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

// Filtro de busca
document.getElementById("searchInput").addEventListener("input", e => {
  const valor = e.target.value.toLowerCase();
  const filtrados = dados.filter(d =>
    d.nome.toLowerCase().includes(valor) || d.setor.toLowerCase().includes(valor)
  );
  mostrarCards(filtrados);
});

// ===== PROCEDIMENTOS (vindos da planilha via Apps Script) =====

// Carrega todos os procedimentos assim que a página abre
fetch(APPS_SCRIPT_URL)
  .then(r => r.json())
  .then(json => {
    procedimentosData = json;
  })
  .catch(() => console.log("Não foi possível carregar os procedimentos da planilha."));

// Intercepta cliques nos itens do menu que apontam pra um procedimento
document.querySelectorAll(".dropdown-content a[data-proc]").forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    const id = link.getAttribute("data-proc");
    mostrarProcedimento(id);
  });
});

function mostrarProcedimento(id) {
  const conteudo = document.querySelector(".container");
  const proc = procedimentosData[id];

  if (!proc) {
    conteudo.innerHTML = `
      <button id="voltar" class="botao-voltar">⬅ Voltar</button>
      <p>Procedimento ainda não cadastrado ou não encontrado.</p>
    `;
    document.getElementById("voltar").addEventListener("click", () => location.reload());
    return;
  }

  conteudo.innerHTML = `
    <button id="voltar" style="
      background: linear-gradient(90deg, orange, gold);
      color: black;
      border: none;
      border-radius: 8px;
      padding: 10px 20px;
      font-weight: bold;
      box-shadow: 3px 3px 6px rgba(0,0,0,0.6);
      cursor: pointer;
      margin-bottom: 15px;
    ">⬅ Voltar</button>

    <div class="procedimento-conteudo">
      <h2>${proc.titulo}</h2>
      <div class="procedimento-texto">${proc.conteudo || "<p><em>Conteúdo ainda não preenchido na planilha.</em></p>"}</div>
      ${proc.atualizado ? `<p class="procedimento-atualizado">Última atualização: ${proc.atualizado}</p>` : ""}
    </div>
  `;

  document.getElementById("voltar").addEventListener("click", () => location.reload());
}

// Mantido para links diretos a PDFs reais que continuem existindo no site (ex: formulários)
document.querySelectorAll(".dropdown-content a[href$='.pdf']").forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    const pdfUrl = link.getAttribute("href");
    mostrarPDF(pdfUrl);
  });
});

function mostrarPDF(url) {
  const conteudo = document.querySelector(".container");
  conteudo.innerHTML = `
    <button id="voltar" style="
      background: linear-gradient(90deg, orange, gold);
      color: black;
      border: none;
      border-radius: 8px;
      padding: 10px 20px;
      font-weight: bold;
      box-shadow: 3px 3px 6px rgba(0,0,0,0.6);
      cursor: pointer;
      margin-bottom: 15px;
    ">⬅ Voltar</button>

    <iframe src="${url}" style="
      width: 95%;
      height: 90vh;
      border: none;
      border-radius: 10px;
      box-shadow: 0 0 10px rgba(0,0,0,0.4);
    "></iframe>
  `;

  document.getElementById("voltar").addEventListener("click", () => location.reload());
}

// ===== POP UP DE NOVO PROCEDIMENTO no arquivo json quando quiser colocar um pop up é so deixar como ativo e se não quiser é só deixar como false =====
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

  popup.querySelector(".fechar-popup").addEventListener("click", () => {
  popup.remove();
});
}

// Buscar status no popup.json
    fetch("popup.json?V=1")
  .then(r => r.json())
  .then(cfg => {
    if (cfg.ativo) {

      const agora = Date.now();
      const ultimaVez = localStorage.getItem("popup_mostrado_v1_tempo");
      const dezMin = 10 * 60 * 1000;

      const podeMostrar =
        !ultimaVez || (agora - parseInt(ultimaVez)) > dezMin;

      if (podeMostrar) {

        // 🔥 DESTACAR TODAS AS DATAS NO INÍCIO DE CADA BLOCO
        let msg = cfg.mensagem;

        // Pega datas no início OU após <br><br>
        let regexDatas = /(?:^|<br><br>)(\d{1,2}\/\d{1,2}\/\d{2,4})/g;

        let msgFormatada = msg.replace(
          regexDatas,
          (match, data) =>
            match.replace(
              data,
              `<span style="color: red; font-weight: bold; font-size: 20px;">${data}</span>`
            )
        );

        mostrarPopup(msgFormatada);

        localStorage.setItem("popup_mostrado_v1_tempo", agora);
      }
    }
  })
  .catch(() => console.log("Popup desativado ou arquivo não encontrado"));


// ===== BOTÃO DE NOTIFICAÇÕES =====
document.getElementById("botaoNotificacoes").addEventListener("click", () => {
  fetch("popup.json?btn=1")
    .then(r => r.json())
    .then(cfg => {

      // 🔥 DESTACAR TODAS AS DATAS AO CLICAR NO BOTÃO TAMBÉM
      let msg = cfg.mensagem;
      let regexDatas = /(?:^|<br><br>)(\d{1,2}\/\d{1,2}\/\d{2,4})/g;

      let msgFormatada = msg.replace(
        regexDatas,
        (match, data) =>
          match.replace(
            data,
            `<span style="color: red; font-weight: bold; font-size: 20px;">${data}</span>`
          )
      );

      mostrarPopup(msgFormatada);
    })
    .catch(() => alert("Erro ao carregar notificações!"));
});

// ===== BUSCA GLOBAL DO SITE =====
const itensBusca = [];

// Captura todos os links do menu (procedimentos e links normais)
document.querySelectorAll(".dropdown-content a").forEach(link => {
  itensBusca.push({
    texto: link.textContent.toLowerCase(),
    label: link.textContent,
    url: link.getAttribute("href"),
    proc: link.getAttribute("data-proc") // null se não for um procedimento
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

    const resultados = itensBusca.filter(item =>
      item.texto.includes(termo)
    );

    if (resultados.length === 0) {
      resultadosDiv.style.display = "block";
      resultadosDiv.innerHTML = "<div class='resultado-item'>Nenhum resultado</div>";
      return;
    }

    resultadosDiv.style.display = "block";

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
  btn.addEventListener('click', function(e) {
    e.preventDefault();
  });
});
