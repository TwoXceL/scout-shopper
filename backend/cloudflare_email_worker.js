/**
 * Scout $hopper — Cloudflare Email Worker for Inbound E-Receipt Ingestion
 * 
 * SETUP INSTRUCTIONS:
 * 1. In Cloudflare Dashboard, go to Email Routing -> Email Workers.
 * 2. Create a new Worker and paste this code.
 * 3. Add an Email Routing Rule: "Catch-all" or "receipts+*@scoutshopper.app" -> Action: Send to Worker.
 * 4. Set Environment Variable in Worker Settings:
 *    - SCOUT_API_URL: "https://your-api-domain.com/api/webhooks/inbound-email"
 *    - SCOUT_WEBHOOK_SECRET: "your_secret_token_here"
 */

export default {
  async email(message, env, ctx) {
    try {
      const recipient = message.to;      // e.g. receipts+usr_demo@scoutshopper.app
      const sender = message.from;        // e.g. order-confirm@homedepot.ca
      const subject = message.headers.get("subject") || "Store Electronic Receipt";
      
      // Read raw email MIME body
      const rawEmail = await new Response(message.raw).text();

      // Forward to Scout $hopper API Webhook
      const apiUrl = env.SCOUT_API_URL || "http://127.0.0.1:8000/api/webhooks/inbound-email";
      const webhookSecret = env.SCOUT_WEBHOOK_SECRET || "scout_dev_secret";

      const payload = {
        recipient: recipient,
        sender: sender,
        subject: subject,
        raw_mime: rawEmail,
        timestamp: Date.now() / 1000
      };

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Secret": webhookSecret,
          "User-Agent": "Cloudflare-Email-Worker/1.0"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.error(`Failed to ingest receipt. Status: ${response.status}`);
        message.setReject("Failed to ingest e-receipt");
      } else {
        console.log(`Successfully ingested e-receipt for ${recipient}`);
      }
    } catch (err) {
      console.error("Error processing inbound receipt email:", err);
    }
  }
};
