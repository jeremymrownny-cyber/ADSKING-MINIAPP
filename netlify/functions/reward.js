import crypto from 'node:crypto';
import {supabase,json} from './_db.js';

function hmacValid(raw, signature) {
  const secret = process.env.MONETAG_CALLBACK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
  try { return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature)); }
  catch { return false; }
}

export default async (req) => {
  if (req.method !== 'POST') return json({ok:false,message:'Method not allowed'},405);
  const raw = await req.text();
  const signature = req.headers.get('x-monetag-signature') || '';
  if (!hmacValid(raw, signature)) return json({ok:false,message:'Invalid callback signature'},401);

  try {
    const p = JSON.parse(raw);
    // Adapter fields. Map these to the exact fields Monetag sends in your publisher account.
    const rewardId = String(p.reward_id ?? p.transaction_id ?? p.id ?? '');
    const telegramId = Number(p.telegram_id ?? p.user_id ?? p.sub_id ?? 0);
    const adType = String(p.ad_type ?? 'regular');
    const amount = Number(p.amount ?? 10);
    if (!rewardId || !Number.isSafeInteger(telegramId) || !['regular','boost','withdrawal'].includes(adType) || !Number.isFinite(amount) || amount <= 0) {
      return json({ok:false,message:'Invalid reward payload'},400);
    }

    const result = await supabase('rpc/apply_ad_reward', {
      method:'POST',
      body:JSON.stringify({p_reward_id:rewardId,p_telegram_id:telegramId,p_ad_type:adType,p_amount:amount})
    });
    return json(result);
  } catch(e) { return json({ok:false,message:e.message},500); }
};
