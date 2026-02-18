# Telegram Bot Setup Instructions

## Step 1: Create Your Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Send the command: `/newbot`
3. Choose a name for your bot (e.g., "ITLand Teacher Assistant")
4. Choose a username (must end in 'bot', e.g., "itland_teacher_bot")
5. **Save the bot token** - it looks like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`

## Step 2: Get Your Chat ID

1. Send any message to your new bot (just say "hi" or "test")
2. Open this URL in your browser (replace `<YOUR_BOT_TOKEN>` with your actual token):
   ```
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   ```
3. Look for `"chat":{"id":123456789` in the JSON response
4. **Save this chat ID number**

## Step 3: Add Credentials to Your Project

1. Create a file named `.env.local` in your project root (if it doesn't exist)
2. Add these lines (replace with your actual values):
   ```
   NEXT_PUBLIC_TELEGRAM_BOT_TOKEN=your_bot_token_here
   NEXT_PUBLIC_TELEGRAM_CHAT_ID=your_chat_id_here
   ```
3. Save the file
4. Restart your dev server (`npm run dev`)

## Step 4: Local Development (Important!)

Telegram cannot reach `localhost`. To test the bot locally, you need a tunnel like **ngrok**:

1.  **Install ngrok** if you haven't: `npm install -g ngrok`
2.  **Start a tunnel**: `ngrok http 3000` (or your dev port)
3.  **Copy the Forwarding URL** (e.g., `https://abcd-123.ngrok-free.app`)
4.  **Register the Webhook** using the helper script:
    ```bash
    node scripts/set-webhook.js <YOUR_NGROK_URL>
    ```

Once set, Telegram will send messages to your local machine!

---

> [!IMPORTANT]
> Whenever you restart ngrok and get a new URL, you must run the `set-webhook.js` script again with the new URL.
