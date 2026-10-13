import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import type { Database } from "../../../src/database.types.ts";

type CreateUserBody = {
  email: string;
  first_name: string;
  last_name: string;
  role: "operator" | "parent";
};

export default {
  fetch: withSupabase<Database>(
    { auth: "user" },
    async (req, ctx) => {
      try {
        // Accettiamo solo richieste POST
        if (req.method !== "POST") {
          return Response.json(
            { error: "Metodo non consentito." },
            { status: 405 }
          );
        }

        // ID dell'utente autenticato che sta effettuando la richiesta
        const adminId = ctx.userClaims?.id;

        if (!adminId) {
          return Response.json(
            { error: "Utente non autenticato." },
            { status: 401 }
          );
        }

        // Recuperiamo il profilo dell'utente che sta effettuando la richiesta
        const {
          data: adminProfile,
          error: adminProfileError,
        } = await ctx.supabase
          .from("profiles")
          .select("id, role, is_active")
          .eq("id", adminId)
          .single();

        if (adminProfileError || !adminProfile) {
          return Response.json(
            { error: "Profilo admin non trovato." },
            { status: 403 }
          );
        }

        // Verifica che l'utente sia un admin attivo
        if (
          adminProfile.role !== "admin" ||
          adminProfile.is_active !== true
        ) {
          return Response.json(
            {
              error:
                "Non hai i permessi per creare utenti.",
            },
            { status: 403 }
          );
        }

        // Leggiamo i dati inviati dal frontend
        const body = (await req.json()) as CreateUserBody;

        const email = body.email?.trim().toLowerCase();
        const firstName = body.first_name?.trim();
        const lastName = body.last_name?.trim();
        const role = body.role;

        // Validazione campi obbligatori
        if (!email || !firstName || !lastName || !role) {
          return Response.json(
            {
              error:
                "Tutti i campi sono obbligatori.",
            },
            { status: 400 }
          );
        }

        // Validazione ruolo
        if (
          role !== "operator" &&
          role !== "parent"
        ) {
          return Response.json(
            { error: "Ruolo non valido." },
            { status: 400 }
          );
        }

        // Invitiamo l'utente tramite Supabase Auth.
        //
        // inviteUserByEmail:
        // - crea l'account Auth
        // - genera il link di invito
        // - attiva il Send Email Hook configurato
        const {
          data: invitedUser,
          error: inviteError,
        } =
          await ctx.supabaseAdmin.auth.admin.inviteUserByEmail(
            email,
            {
              data: {
                first_name: firstName,
                last_name: lastName,
              },
              redirectTo:
                "https://gestionale-anfas.vercel.app/set-password",
            }
          );

        if (
          inviteError ||
          !invitedUser?.user
        ) {
          return Response.json(
            {
              error:
                inviteError?.message ??
                "Impossibile invitare l'utente.",
            },
            { status: 400 }
          );
        }

        const newUserId = invitedUser.user.id;

        // Dati del profilo applicativo
        const userProfile: Database["public"]["Tables"]["profiles"]["Insert"] = {
          id: newUserId,
          first_name: firstName,
          last_name: lastName,
          role,
          is_active: true,
        };

        // Creazione del profilo
        const { error: profileError } =
          await ctx.supabaseAdmin
            .from("profiles")
            .insert(userProfile);

        // Se la creazione del profilo fallisce,
        // eliminiamo l'account Auth per evitare
        // un utente orfano.
        if (profileError) {
          console.error(
            "PROFILE CREATE ERROR:",
            profileError
          );

          await ctx.supabaseAdmin.auth.admin.deleteUser(
            newUserId
          );

          return Response.json(
            {
              error:
                "Impossibile creare il profilo dell'utente.",
            },
            { status: 500 }
          );
        }

        // Tutto completato correttamente
        return Response.json({
          success: true,
          message:
            "Utente invitato correttamente.",
          user: {
            id: newUserId,
            email,
            first_name: firstName,
            last_name: lastName,
            role,
          },
        });
      } catch (error) {
        console.error(
          "CREATE-USER ERROR:",
          error
        );

        return Response.json(
          {
            error:
              "Errore interno del server.",
          },
          { status: 500 }
        );
      }
    }
  ),
};