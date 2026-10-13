import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

type ResetTestPasswordBody = {
  user_id: string;
};

export default {
  fetch: withSupabase(
    { auth: "user" },
    async (req, ctx) => {
      try {
        if (req.method !== "POST") {
          return Response.json(
            { error: "Metodo non consentito." },
            { status: 405 }
          );
        }

        const adminId = ctx.userClaims?.id;

        if (!adminId) {
          return Response.json(
            { error: "Utente non autenticato." },
            { status: 401 }
          );
        }

        const { data: adminProfile, error: adminProfileError } =
          await ctx.supabase
            .from("profiles")
            .select("id, role, is_active")
            .eq("id", adminId)
            .single();

        const profile = adminProfile as {
          role: string;
          is_active: boolean;
        } | null;

        if (
          adminProfileError ||
          !profile ||
          profile.role !== "admin" ||
          profile.is_active !== true
        ) {
          return Response.json(
            { error: "Non hai i permessi per eseguire questa operazione." },
            { status: 403 }
          );
        }

        const body = (await req.json()) as ResetTestPasswordBody;
        const userId = body.user_id?.trim();

        if (!userId) {
          return Response.json(
            { error: "ID utente obbligatorio." },
            { status: 400 }
          );
        }

        const { data: targetUser, error: targetUserError } =
          await ctx.supabaseAdmin.auth.admin.getUserById(userId);

        if (targetUserError || !targetUser?.user) {
          return Response.json(
            { error: "Utente Auth non trovato." },
            { status: 404 }
          );
        }

        if (targetUser.user.email !== "admin.test@example.com") {
          return Response.json(
            {
              error:
                "Questa funzione temporanea può essere utilizzata solo con admin.test@example.com.",
            },
            { status: 400 }
          );
        }

        const temporaryPassword =
          "TestPassword-2026-ANFAS!";

        const { error: updateError } =
          await ctx.supabaseAdmin.auth.admin.updateUserById(
            userId,
            {
              password: temporaryPassword,
            }
          );

        if (updateError) {
          console.error(
            "UPDATE TEST PASSWORD ERROR:",
            updateError
          );

          return Response.json(
            {
              error: updateError.message,
            },
            { status: 500 }
          );
        }

        return Response.json({
          success: true,
          message: "Password temporanea impostata correttamente.",
        });
      } catch (error) {
        console.error(
          "RESET TEST PASSWORD ERROR:",
          error
        );

        return Response.json(
          {
            error: "Errore interno del server.",
          },
          { status: 500 }
        );
      }
    }
  ),
};