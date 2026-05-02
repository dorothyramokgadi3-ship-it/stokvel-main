import axios from "axios";

const WHATSAPP_API = "https://graph.facebook.com/v21.0";

export async function sendWhatsApp(to: string, body: string): Promise<void> {
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_TOKEN;
  if (!phoneId || !token) { console.error("WhatsApp credentials not configured"); return; }

  try {
    await axios.post(`${WHATSAPP_API}/${phoneId}/messages`, {
      messaging_product: "whatsapp", to: to.replace("+", ""), type: "text", text: { body },
    }, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
  } catch (error: any) {
    console.error("WhatsApp send failed:", error.response?.data || error.message);
  }
}

export async function sendWhatsAppImage(to: string, imageUrl: string, caption: string): Promise<void> {
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_TOKEN;
  if (!phoneId || !token) return;

  try {
    await axios.post(`${WHATSAPP_API}/${phoneId}/messages`, {
      messaging_product: "whatsapp", to: to.replace("+", ""), type: "image",
      image: { link: imageUrl, caption },
    }, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
  } catch (error: any) {
    console.error("WhatsApp image send failed:", error.response?.data || error.message);
  }
}
