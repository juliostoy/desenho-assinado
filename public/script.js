```javascript
// Login Google e geração do desenho pelo servidor.

const CLIENT_ID =
  "923868626911-fk5896ugar344366kkiduq4bgokisec8.apps.googleusercontent.com";

const formulario = document.getElementById("formulario");
const campoNumero = document.getElementById("numero");
const area = document.getElementById("desenho");
const mensagem = document.getElementById("mensagem");
const botaoBaixar = document.getElementById("baixar");
const statusLogin = document.getElementById("status-login");
const botaoGoogle = document.getElementById("google-button");

let tokenGoogle = "";
let svgAtual = "";

function mostrarMensagem(texto) {
  mensagem.textContent = texto;
}

function iniciarLoginGoogle() {
  if (!window.google?.accounts?.id) {
    statusLogin.textContent =
      "Não foi possível carregar o login do Google. Atualize a página.";
    return;
  }

  window.google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: receberCredencial
  });

  window.google.accounts.id.renderButton(botaoGoogle, {
    type: "standard",
    theme: "outline",
    size: "large",
    text: "signin_with",
    shape: "rectangular",
    width: 260
  });

  statusLogin.textContent = "Entre com sua conta Google para continuar.";
}

function receberCredencial(resposta) {
  tokenGoogle = resposta.credential;
  statusLogin.textContent =
    "Login Google concluído. Você já pode gerar seu desenho.";
  mostrarMensagem("");
}

window.addEventListener("load", iniciarLoginGoogle);

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  mostrarMensagem("");

  area.replaceChildren();
  svgAtual = "";
  botaoBaixar.hidden = true;

  if (!tokenGoogle) {
    mostrarMensagem("Entre com sua conta Google antes de desenhar.");
    return;
  }

  const numero = Number(campoNumero.value);

  if (
    campoNumero.value.trim() === "" ||
    !Number.isInteger(numero) ||
    numero < 1 ||
    numero > 100
  ) {
    mostrarMensagem("Digite um inteiro entre 1 e 100.");
    return;
  }

  try {
    const resposta = await fetch("/api/desenho", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${tokenGoogle}`
      },
      body: JSON.stringify({ numero })
    });

    const conteudo = await resposta.text();

    if (!resposta.ok) {
      if (resposta.status === 400) {
        mostrarMensagem(
          "Dados inválidos. Digite um número inteiro entre 1 e 100."
        );
      } else if (resposta.status === 401) {
        tokenGoogle = "";
        statusLogin.textContent =
          "Sua autenticação não foi aceita. Entre novamente com o Google.";
        mostrarMensagem(
          "Autenticação inválida ou expirada. Faça login novamente."
        );
      } else {
        mostrarMensagem(
          `Não foi possível gerar o desenho (erro ${resposta.status}).`
        );
      }
      return;
    }

    if (!resposta.headers.get("content-type")?.includes("image/svg+xml")) {
      mostrarMensagem("O servidor retornou uma resposta inesperada.");
      return;
    }

    svgAtual = conteudo;
    area.innerHTML = svgAtual;
    botaoBaixar.hidden = false;
    mostrarMensagem("Desenho gerado com sucesso.");
  } catch (erro) {
    mostrarMensagem(
      "Não foi possível conectar ao servidor. Tente novamente."
    );
  }
});

botaoBaixar.addEventListener("click", () => {
  if (!svgAtual) return;

  const arquivo = new Blob([svgAtual], {
    type: "image/svg+xml"
  });

  const url = URL.createObjectURL(arquivo);
  const link = document.createElement("a");

  link.href = url;
  link.download = "exemplo.svg";
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
});
```
