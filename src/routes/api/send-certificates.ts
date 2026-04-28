import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

export const Route = createFileRoute("/api/send-certificates")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          // Verify auth token
          const auth = request.headers.get("authorization") ?? "";
          const token = auth.replace("Bearer ", "").trim();
          if (!token) return json({ error: "Unauthorized" }, 401);

          // Get user from Supabase
          const supabase = createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_PUBLISHABLE_KEY!,
            { global: { headers: { Authorization: `Bearer ${token}` } } }
          );
          const { data: u, error: ue } = await supabase.auth.getUser(token);
          if (ue || !u.user) return json({ error: "Unauthorized" }, 401);

          // Check environment variables
          const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
          const RESEND_API_KEY = process.env.RESEND_API_KEY;
          if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
            console.error("Missing email config: LOVABLE_API_KEY or RESEND_API_KEY");
            return json({ error: "Email not configured" }, 500);
          }

          // Parse request body
          let body;
          try {
            body = await request.json() as {
              projectName: string;
              items: { to: string; name: string; filename: string; pdfBase64: string }[];
            };
          } catch (e) {
            return json({ error: "Invalid JSON body" }, 400);
          }

          // Validate items
          if (!Array.isArray(body.items) || body.items.length === 0) {
            return json({ error: "No items to send" }, 400);
          }
          if (body.items.length > 200) return json({ error: "Max 200 per batch" }, 400);

          const subject = `Your certificate — ${body.projectName}`;
          let sent = 0;
          const errors: string[] = [];

          // Send emails
          for (const item of body.items) {
            try {
              // Validate email
              if (!item.to || !/.+@.+\..+/.test(item.to)) {
                errors.push(`Invalid email: ${item.to}`);
                continue;
              }

              // Build HTML email
              const html = `<div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#222">
                <h1 style="font-family:Georgia,serif;letter-spacing:.05em">Hello ${escapeHtml(item.name || "there")},</h1>
                <p>Your certificate for <strong>${escapeHtml(body.projectName)}</strong> is attached.</p>
                <p style="color:#888;font-size:12px;margin-top:24px">Sent via CertiGen</p>
              </div>`;

              // Send via Resend gateway
              const res = await fetch(`${GATEWAY_URL}/emails`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${LOVABLE_API_KEY}`,
                  "X-Connection-Api-Key": RESEND_API_KEY,
                },
                body: JSON.stringify({
                  from: "CertiGen <onboarding@resend.dev>",
                  to: [item.to],
                  subject,
                  html,
                  attachments: [{ filename: item.filename, content: item.pdfBase64 }],
                }),
              });

              if (!res.ok) {
                const errorText = await res.text();
                console.error(`Email send failed for ${item.to}:`, res.status, errorText);
                errors.push(`${item.to}: ${res.status} ${errorText.slice(0, 100)}`);
              } else {
                sent++;
              }
            } catch (itemError) {
              const msg = itemError instanceof Error ? itemError.message : String(itemError);
              console.error(`Error sending email to ${item.to}:`, msg);
              errors.push(`${item.to}: ${msg.slice(0, 100)}`);
            }
          }

          return json({ sent, total: body.items.length, errors });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error("API error:", msg);
          return json({ error: msg }, 500);
        }
      },
    },
  },
});
