import { useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setLoading(true)
    setError('')
    setSuccess(false)

    const { error: resetError } =
      await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: 'https://gestionale-anfas.vercel.app/reset-password',
        }
      )

    if (resetError) {
      console.error('PASSWORD RESET ERROR:', resetError)
      setError(
        resetError.message ||
          'Impossibile inviare il link per reimpostare la password.'
      )
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-xl font-bold text-slate-950 shadow-lg">
            G
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white">
            Recupera password
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Inserisci la tua email per ricevere il link di recupero.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
          {success ? (
            <div className="rounded-xl border border-green-900/50 bg-green-950/40 px-4 py-4 text-sm text-green-300">
              Se l&apos;email è associata a un account, riceverai un
              messaggio con il link per reimpostare la password.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="nome@email.com"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400 focus:ring-2 focus:ring-slate-700"
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-300"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-white px-4 py-3 font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? 'Invio in corso...'
                  : 'Invia link di recupero'}
              </button>
            </form>
          )}

          <div className="mt-5 text-center">
            <a
              href="/login"
              className="text-sm text-slate-400 transition hover:text-white"
            >
              Torna al login
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}