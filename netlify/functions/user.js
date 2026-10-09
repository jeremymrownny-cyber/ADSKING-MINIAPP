import {supabase,json} from './_db.js';

export default async (req) => {
  if (req.method !== 'POST') return json({ok:false,message:'Method not allowed'},405);
  try {
    const {telegram_id, username='', first_name=''} = await req.json();
    if (!telegram_id) return json({ok:false,message:'telegram_id required'},400);
    const rows = await supabase(`users?telegram_id=eq.${encodeURIComponent(telegram_id)}&select=*`);
    if (!rows.length) {
      const created = await supabase('users', {method:'POST', headers:{Prefer:'return=representation'}, body:JSON.stringify({telegram_id,username,first_name})});
      return json({ok:true,user:created[0]});
    }
    const updated = await supabase(`users?telegram_id=eq.${encodeURIComponent(telegram_id)}`, {method:'PATCH', headers:{Prefer:'return=representation'}, body:JSON.stringify({username,first_name,updated_at:new Date().toISOString()})});
    return json({ok:true,user:updated[0] || rows[0]});
  } catch(e) { return json({ok:false,message:e.message},500); }
};
