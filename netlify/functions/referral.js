const crypto = require("crypto");
const { supabase, json } = require("./_db");

function validateTelegramInitData(initData, botToken) {
  if (!initData || !botToken) return null;

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");

  if (!hash) return null;

  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (
    calculatedHash.length !== hash.length ||
    !crypto.timingSafeEqual(
      Buffer.from(calculatedHash),
      Buffer.from(hash)
    )
  ) {
    return null;
  }

  const authDate = Number(params.get("auth_date") || 0);

  if (
    !authDate ||
    Math.floor(Date.now() / 1000) - authDate > 86400
  ) {
    return null;
  }

  const userRaw = params.get("user");

  if (!userRaw) return null;

  try {
    const user = JSON.parse(userRaw);

    return {
      user,
      startParam: params.get("start_param") || ""
    };
  } catch {
    return null;
  }
}

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return json({
      ok: false,
      message: "POST required"
    }, 405);
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const initData = String(body.initData || "");

    if (!initData) {
      return json({
        ok: false,
        message: "Telegram initData required"
      }, 400);
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      return json({
        ok: false,
        message: "Telegram bot token is not configured"
      }, 500);
    }

    const verified = validateTelegramInitData(
      initData,
      botToken
    );

    if (!verified?.user?.id) {
      return json({
        ok: false,
        message: "Invalid Telegram authentication"
      }, 401);
    }

    const referredId = Number(verified.user.id);
    const startParam = verified.startParam;

    if (!startParam.startsWith("ref_")) {
      return json({
        ok: true,
        new_referral: false,
        reward: 0,
        message: "No referral parameter"
      });
    }

    const referrerId = Number(
      startParam.substring(4)
    );

    if (
      !Number.isSafeInteger(referrerId) ||
      !Number.isSafeInteger(referredId)
    ) {
      return json({
        ok: false,
        message: "Invalid referral ID"
      }, 400);
    }

    if (referrerId === referredId) {
      return json({
        ok: false,
        message: "Self referral is not allowed"
      }, 400);
    }

    const result = await supabase(
      "rpc/apply_referral",
      {
        method: "POST",
        body: JSON.stringify({
          p_referrer_id: referrerId,
          p_referred_id: referredId
        })
      }
    );

    return json(result);

  } catch (error) {
    console.error("Referral error:", error);

    return json({
      ok: false,
      message: "Referral processing failed"
    }, 500);
  }
};
