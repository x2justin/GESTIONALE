import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { Resend } from "resend";
import { Webhook } from "standardwebhooks";

const resend = new Resend(
  Deno.env.get("RESEND_API_KEY") as string
);

const hookSecret = (
  Deno.env.get("SEND_EMAIL_HOOK_SECRET") as string
).replace("v1,whsec_", "");

type HookPayload = {
  user: {
    email: string;
    user_metadata?: {
      first_name?: string;
      last_name?: string;
    };
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
    token_new: string;
    token_hash_new: string;
  };
};

export default {
  fetch: withSupabase(
    { auth: "none" },
    async (req) => {
      try {
        if (req.method !== "POST") {
          return new Response("Metodo non consentito.", {
            status: 405,
          });
        }

        const payload = await req.text();
        const headers = Object.fromEntries(req.headers);

        const webhook = new Webhook(hookSecret);

        const {
          user,
          email_data,
        } = webhook.verify(payload, headers) as HookPayload;

        if (!user?.email) {
          return Response.json(
            { error: "Email destinatario mancante." },
            { status: 400 }
          );
        }

        const {
          token_hash,
          email_action_type,
        } = email_data;

        const isRecovery =
          email_action_type === "recovery";

        const destinationPath = isRecovery
          ? "/reset-password"
          : "/set-password";

        const verifyUrl =
          `https://gestionale.dpdns.org${destinationPath}` +
          `?token_hash=${encodeURIComponent(token_hash)}` +
          `&type=${encodeURIComponent(email_action_type)}`;

        const firstName =
          user.user_metadata?.first_name || "";

        const subject = isRecovery
          ? "Reimposta la password - Gestionale ANFAS"
          : "Invito al Gestionale ANFAS";

        const html = `
          <!DOCTYPE html>
          <html lang="it">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>${subject}</title>
            </head>

            <body
              style="
                margin: 0;
                padding: 0;
                background-color: #f4f4f5;
                font-family: Arial, Helvetica, sans-serif;
                color: #18181b;
              "
            >
              <div
                style="
                  max-width: 600px;
                  margin: 40px auto;
                  background-color: #ffffff;
                  border-radius: 12px;
                  padding: 40px;
                  box-sizing: border-box;
                "
              >
                <h1
                  style="
                    margin: 0 0 24px 0;
                    font-size: 24px;
                  "
                >
                  Gestionale ANFAS
                </h1>

                ${
                  isRecovery
                    ? `
                      <p style="font-size: 16px; line-height: 1.6;">
                        Ciao${firstName ? ` ${firstName}` : ""},
                      </p>

                      <p style="font-size: 16px; line-height: 1.6;">
                        hai richiesto di reimpostare la password del tuo
                        account.
                      </p>

                      <p style="font-size: 16px; line-height: 1.6;">
                        Clicca sul pulsante qui sotto per impostare una
                        nuova password.
                      </p>

                      <div style="margin: 32px 0;">
                        <a
                          href="${verifyUrl}"
                          style="
                            display: inline-block;
                            background-color: #18181b;
                            color: #ffffff;
                            text-decoration: none;
                            padding: 12px 20px;
                            border-radius: 8px;
                            font-size: 16px;
                          "
                        >
                          Reimposta password
                        </a>
                      </div>
                    `
                    : `
                      <p style="font-size: 16px; line-height: 1.6;">
                        Ciao${firstName ? ` ${firstName}` : ""},
                      </p>

                      <p style="font-size: 16px; line-height: 1.6;">
                        sei stato invitato a utilizzare il Gestionale ANFAS.
                      </p>

                      <p style="font-size: 16px; line-height: 1.6;">
                        Per iniziare, clicca sul pulsante qui sotto e
                        imposta la password del tuo account.
                      </p>

                      <div style="margin: 32px 0;">
                        <a
                          href="${verifyUrl}"
                          style="
                            display: inline-block;
                            background-color: #18181b;
                            color: #ffffff;
                            text-decoration: none;
                            padding: 12px 20px;
                            border-radius: 8px;
                            font-size: 16px;
                          "
                        >
                          Imposta password
                        </a>
                      </div>
                    `
                }

                <p
                  style="
                    font-size: 14px;
                    line-height: 1.6;
                    color: #71717a;
                    margin-top: 32px;
                  "
                >
                  Se non hai richiesto questa email, puoi ignorarla.
                </p>

                <hr
                  style="
                    border: 0;
                    border-top: 1px solid #e4e4e7;
                    margin: 32px 0;
                  "
                />

                <p
                  style="
                    font-size: 12px;
                    color: #a1a1aa;
                    margin: 0;
                  "
                >
                  Gestionale ANFAS
                </p>
              </div>
            </body>
          </html>
        `;

        const { error: resendError } =
          await resend.emails.send({
            from: "Gestionale ANFAS <gestionale@gestionale.dpdns.org>",
            to: [user.email],
            subject,
            html,
          });

        if (resendError) {
          console.error(
            "RESEND ERROR:",
            resendError
          );

          return Response.json(
            {
              error: {
                message: resendError.message,
              },
            },
            { status: 500 }
          );
        }

        return Response.json({});
      } catch (error) {
        console.error(
          "SEND EMAIL HOOK ERROR:",
          error
        );

        return Response.json(
          {
            error:
              "Errore durante l'invio dell'email.",
          },
          { status: 401 }
        );
      }
    }
  ),
};