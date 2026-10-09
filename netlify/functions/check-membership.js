const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  if (req.method !== "POST") {
    return json(
      { ok: false, message: "Method not allowed" },
      405
    );
  }

  try {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

    if (!BOT_TOKEN) {
      return json(
        {
          ok: false,
          message: "Telegram bot token is not configured",
        },
        500
      );
    }

    const body = await req.json();
    const telegram_id = body.telegram_id;

    if (!telegram_id) {
      return json(
        {
          ok: false,
          message: "telegram_id required",
        },
        400
      );
    }

    // ADSKING Telegram group/channel
    const CHAT_ID = "@adsking11";

    const url =
      `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember` +
      `?chat_id=${encodeURIComponent(CHAT_ID)}` +
      `&user_id=${encodeURIComponent(telegram_id)}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.ok) {
      return json({
        ok: false,
        member: false,
        message: data.description || "Telegram API error",
      });
    }

    const status = data.result?.status;

    const member =
      status === "creator" ||
      status === "administrator" ||
      status === "member";

    return json({
      ok: true,
      member,
      status,
    });
  } catch (error) {
    return json(
      {
        ok: false,
        member: false,
        message: error.message,
      },
      500
    );
  }
};
