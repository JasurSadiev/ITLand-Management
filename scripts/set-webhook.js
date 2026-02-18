const https = require('https');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const BOT_TOKEN = env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.argv[2];

if (!BOT_TOKEN) {
  console.error('❌ Error: NEXT_PUBLIC_TELEGRAM_BOT_TOKEN not found in .env.local');
  process.exit(1);
}

if (!WEBHOOK_URL) {
  console.log('Usage: node scripts/set-webhook.js <YOUR_TUNNEL_URL>');
  console.log('Example: node scripts/set-webhook.js https://abcd-123.ngrok-free.app');
  process.exit(1);
}

const fullUrl = `${WEBHOOK_URL.replace(/\/$/, '')}/api/telegram/webhook`;

const apiUri = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${encodeURIComponent(fullUrl)}`;

https.get(apiUri, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const response = JSON.parse(data);
    if (response.ok) {
      console.log('✅ Webhook set successfully!');
      console.log('Target URL:', fullUrl);
    } else {
      console.error('❌ Failed to set webhook:', response.description);
    }
  });
}).on('error', (err) => {
  console.error('❌ Error:', err.message);
});
