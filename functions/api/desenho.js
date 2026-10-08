```javascript
import { gerarDesenho, numeroValido } from "../../lib/desenho.js";

function resposta(texto, status, tipo = "text/plain; charset=utf-8") {
  return new Response(texto, {
    status,
    headers: { "Content-Type": tipo }
  });
}

export async function onRequest(context) {
  const { request, env } = context;

  // 1. Apenas POST é permitido.
  if (request.method !== "POST") {
    return resposta("Método não permitido.", 405);
  }

  // 2. Validar o corpo da requisição.
  let dados;

  try {
    dados = await request.json();
  } catch {
    return resposta("JSON inválido.", 400);
  }

  if (
    !dados ||
    !Object.prototype.hasOwnProperty.call(dados, "numero") ||
    !numeroValido(dados.numero)
  ) {
    return resposta(
      "Informe um número inteiro entre 1 e 100.",
      400
    );
  }

  // 3. Obter o token enviado pelo navegador.
  const autorizacao = request.headers.get("Authorization") || "";
  const correspondencia = autorizacao.match(/^Bearer\s+(.+)$/i);

  if (!correspondencia) {
    return resposta("Token de autenticação ausente.", 401);
  }

  const token = correspondencia[1];

  // 4. Confirmar o token com o Google.
  let dadosGoogle;

  try {
    const verificacao = await fetch(
      "https://oauth2.googleapis.com/tokeninfo?id_token=" +
        encodeURIComponent(token)
    );

    if (!verificacao.ok) {
      return resposta("Token Google inválido ou expirado.", 401);
    }

    dadosGoogle = await verificacao.json();
  } catch {
    return resposta("Não foi possível validar o token Google.", 401);
  }

  // 5. Confirmar destinatário e e-mail verificado.
  if (
    dadosGoogle.aud !== env.GOOGLE_CLIENT_ID ||
    dadosGoogle.email_verified !== "true" ||
    typeof dadosGoogle.email !== "string" ||
    dadosGoogle.email.length === 0
  ) {
    return resposta(
      "Token inválido ou e-mail não verificado.",
      401
    );
  }

  // 6. Gerar o desenho no servidor usando o e-mail verificado.
  try {
    const svg = gerarDesenho(dados.numero, dadosGoogle.email);

    return resposta(svg, 200, "image/svg+xml; charset=utf-8");
  } catch {
    return resposta("Não foi possível gerar o desenho.", 400);
  }
}
```
