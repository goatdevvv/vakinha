// Salve este arquivo como: api/payments/pix.js
// (ou seja: crie uma pasta "api", dentro dela uma pasta "payments",
// e coloque este arquivo dentro com o nome "pix.js")
//
// Esta função roda no SERVIDOR do Vercel, nunca no navegador do visitante.
// Por isso a chave da VenoPag fica segura aqui, nas variáveis de ambiente.

const { VenoPagClient } = require("venopag");

const client = new VenoPagClient({
  clientId: process.env.VENOPAG_CLIENT_ID,
  clientSecret: process.env.VENOPAG_CLIENT_SECRET,
});

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido." });
  }

  const amount = Number(req.body?.amount);
  if (!Number.isFinite(amount) || amount < 1) {
    return res
      .status(400)
      .json({ error: "Informe um valor válido a partir de R$ 1,00." });
  }

  try {
    const cobranca = await client.criarCashin(
      amount,
      undefined, // nome do doador (opcional)
      undefined, // CPF/CNPJ do doador (opcional)
      "Doação - Campanha Chapecó", // descrição da cobrança
      process.env.VENOPAG_WEBHOOK_URL // opcional
    );

    // LOG TEMPORÁRIO: mostra a resposta completa da VenoPag nos logs do
    // Vercel, pra a gente ver o nome certo de cada campo. Pode remover
    // depois que o site estiver funcionando 100%.
    console.log("Resposta completa da VenoPag:", JSON.stringify(cobranca));

    return res.status(200).json({
      qrCode:
        cobranca.pix_copia_cola ??
        cobranca.copia_cola ??
        cobranca.copy_paste ??
        cobranca.emv ??
        cobranca.brcode ??
        cobranca.qr_url,
      qrCodeBase64: cobranca.qr_image ?? cobranca.qrcode_base64 ?? null,
      requestNumber: cobranca.request_number,
      status: cobranca.status,
    });
  } catch (err) {
    console.error("Erro ao gerar PIX na VenoPag:", err);
    return res
      .status(502)
      .json({ error: "Não foi possível gerar o PIX agora. Tente novamente." });
  }
};
