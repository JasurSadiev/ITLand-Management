/**
 * WhatsApp integration via Wazzup API
 */

export async function sendWazzupMessage(chatId: string, text: string) {
  const API_KEY = process.env.WAZZUP_API_KEY;
  const CHANNEL_ID = process.env.WAZZUP_CHANNEL_ID;

  if (!API_KEY || !CHANNEL_ID) {
    console.error("Wazzup credentials missing in environment variables");
    return { success: false, error: "Credentials missing" };
  }

  try {
    const response = await fetch("https://api.wazzup24.com/v3/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        channelId: CHANNEL_ID,
        chatType: "whatsapp",
        chatId: chatId.replace(/\D/g, ""), // Ensure numbers only for WhatsApp
        text: text,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Wazzup API Error:", data);
      return { success: false, error: data };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Wazzup Fetch Error:", error);
    return { success: false, error };
  }
}
