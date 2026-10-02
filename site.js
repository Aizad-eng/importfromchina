// Shared config: set your WhatsApp number here (country code + number, digits only)
const WHATSAPP_NUMBER = "92XXXXXXXXXX";
const WHATSAPP_MESSAGE = "Hi! I want to import a product from China. Here are the details:";
const waHref = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(WHATSAPP_MESSAGE);
document.querySelectorAll(".wa-link").forEach(a => a.href = waHref);
const y = document.getElementById("year"); if (y) y.textContent = new Date().getFullYear();
