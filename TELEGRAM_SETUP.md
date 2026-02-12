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

## Step 4: Test the Connection

Once you've added the credentials and restarted the server, I'll add a test button to verify the connection works!

---

> [!IMPORTANT]
> Never commit `.env.local` to git! It's already in `.gitignore` by default.
