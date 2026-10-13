import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

type DeleteUserBody = {
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

        // Verifica che chi esegue l'operazione sia un admin attivo
        const { data: adminProfileData, error: adminProfileError } =
          await ctx.supabase
            .from("profiles")
            .select("id, role, is_active")
            .eq("id", adminId)
            .single();

        type AdminProfile = {
          id: string;
          role: string;
          is_active: boolean;
        };

        const adminProfile =
          adminProfileData as AdminProfile | null;

        if (adminProfileError || !adminProfile) {
          return Response.json(
            { error: "Profilo admin non trovato." },
            { status: 403 }
          );
        }

        if (
          adminProfile.role !== "admin" ||
          adminProfile.is_active !== true
        ) {
          return Response.json(
            { error: "Non hai i permessi per eliminare utenti." },
            { status: 403 }
          );
        }

        const body = (await req.json()) as DeleteUserBody;
        const userId = body.user_id?.trim();

        if (!userId) {
          return Response.json(
            { error: "ID utente obbligatorio." },
            { status: 400 }
          );
        }

        // Impedisce all'admin di eliminare se stesso
        if (userId === adminId) {
          return Response.json(
            { error: "Non puoi eliminare il tuo stesso account." },
            { status: 400 }
          );
        }

        // Recuperiamo il profilo dell'utente da eliminare
        const { data: targetProfileData, error: targetProfileError } =
          await ctx.supabaseAdmin
            .from("profiles")
            .select("id, role, first_name, last_name")
            .eq("id", userId)
            .single();

        type TargetProfile = {
          id: string;
          role: string;
          first_name: string | null;
          last_name: string | null;
        };

        const targetProfile =
          targetProfileData as TargetProfile | null;

        if (targetProfileError || !targetProfile) {
          return Response.json(
            { error: "Utente non trovato." },
            { status: 404 }
          );
        }

        // Per ora questa funzione permette di eliminare solo
        // operatori e genitori.
        if (
          targetProfile.role !== "operator" &&
          targetProfile.role !== "parent"
        ) {
          return Response.json(
            {
              error:
                "Questo tipo di utente non può essere eliminato.",
            },
            { status: 400 }
          );
        }

        // Prima eliminiamo il profilo.
        // patient_access verrà eliminato automaticamente grazie a ON DELETE CASCADE.
        // Le deliveries resteranno grazie a ON DELETE SET NULL.
        const { error: profileDeleteError } =
          await ctx.supabaseAdmin
            .from("profiles")
            .delete()
            .eq("id", userId);

        if (profileDeleteError) {
          console.error(
            "PROFILE DELETE ERROR:",
            profileDeleteError
          );

          return Response.json(
            {
              error:
                "Impossibile eliminare il profilo dell'utente.",
            },
            { status: 500 }
          );
        }

        // Eliminiamo anche l'account Auth.
        const { error: authDeleteError } =
          await ctx.supabaseAdmin.auth.admin.deleteUser(userId);

        if (authDeleteError) {
          console.error(
            "AUTH DELETE ERROR:",
            authDeleteError
          );

          return Response.json(
            {
              error:
                "Profilo eliminato, ma si è verificato un problema durante l'eliminazione dell'account.",
            },
            { status: 500 }
          );
        }

        return Response.json({
          success: true,
          message: "Utente eliminato correttamente.",
          user: {
            id: targetProfile.id,
            first_name: targetProfile.first_name,
            last_name: targetProfile.last_name,
            role: targetProfile.role,
          },
        });
      } catch (error) {
        console.error("DELETE-USER ERROR:", error);

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