# ADSKING — production reward backend starter

This package moves reward authority off the browser. The browser must never increment ADSK directly.

## 1. Database
Run `sql/schema.sql` in Supabase SQL Editor.

## 2. Netlify environment variables
Set:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY (server only; never expose to frontend)
- TELEGRAM_BOT_TOKEN
- MONETAG_CALLBACK_SECRET

## 3. Monetag callback
`netlify/functions/reward.js` is an adapter. IMPORTANT: Monetag's exact callback URL, signature header, signing algorithm, and payload field names must be copied from the Monetag publisher documentation for the ad product/account you are using. Do not guess them.

The adapter expects after mapping:
- reward_id / transaction_id: unique reward/event id
- telegram_id: Telegram user id
- ad_type: regular | boost | withdrawal
- amount: reward amount

It verifies an HMAC-SHA256 callback signature, then calls the database function `apply_ad_reward`, which is idempotent by `reward_id`.

Callback URL:
https://YOUR-DOMAIN/.netlify/functions/reward

## 4. Frontend integration
The current HTML in this starter still contains the UI. Replace any direct `balance += 10` / `balance += ...` logic with:
1. Ask Monetag to show the rewarded ad.
2. Wait for the ad provider's verified completion/callback flow.
3. Refresh the user balance from your backend.

Never trust a query parameter from the browser as proof that an ad was watched.

## 5. Membership
Keep TELEGRAM_BOT_TOKEN on Netlify. The existing check-membership function calls Telegram getChatMember.
