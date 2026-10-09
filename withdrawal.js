import {supabase,json} from './_db.js';

export default async (req) => {
  if (req.method !== 'POST') return json({ok:false,message:'Method not allowed'},405);
  try {
    const {telegram_id,binance_id,amount} = await req.json();
    const n = Number(amount);
    if (!telegram_id || !binance_id || !Number.isFinite(n)) return json({ok:false,message:'Invalid request'},400);
    const users = await supabase(`users?telegram_id=eq.${encodeURIComponent(telegram_id)}&select=balance,withdrawal_ads`);
    const u = users[0];
    if (!u) return json({ok:false,message:'User not found'},404);
    if (Number(u.withdrawal_ads) < 100) return json({ok:false,message:'100 withdrawal ads required'},400);
    if (n < 10000) return json({ok:false,message:'Minimum withdrawal is 10,000 ADSK'},400);
    if (Number(u.balance) < n) return json({ok:false,message:'Insufficient balance'},400);
    const rows = await supabase('withdrawals', {method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({telegram_id,binance_id,amount:n,status:'Pending'})});
    await supabase(`users?telegram_id=eq.${encodeURIComponent(telegram_id)}`, {method:'PATCH',body:JSON.stringify({balance:Number(u.balance)-n,updated_at:new Date().toISOString()})});
    return json({ok:true,withdrawal:rows[0]});
  } catch(e) { return json({ok:false,message:e.message},500); }
};
