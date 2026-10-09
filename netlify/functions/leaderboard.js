import { supabase, json } from './_db.js';

export default async (req) => {

  if (req.method !== 'GET') {
    return json(
      {
        ok: false,
        message: 'Method not allowed'
      },
      405
    );
  }

  try {

    const users = await supabase(
      'users?select=telegram_id,username,first_name,balance&order=balance.desc&limit=30'
    );

    const leaderboard = users.map((u, index) => ({
      rank: index + 1,
      telegram_id: u.telegram_id,
      username: u.username || '',
      first_name: u.first_name || 'ADSKING User',
      balance: Number(u.balance || 0)
    }));

    return json({
      ok: true,
      leaderboard
    });

  } catch (e) {

    return json({
      ok: false,
      message: e.message
    }, 500);

  }
};
