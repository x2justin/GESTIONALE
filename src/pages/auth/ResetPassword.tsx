import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingRecovery, setCheckingRecovery] = useState(true)
  const [recoveryReady, setRecoveryReady] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    let active = true
    async function check() {
      const params = new URLSearchParams(window.location.search)
      const tokenHash = params.get('token_hash')
      const tokenType = params.get('type')
      if (tokenHash && tokenType === 'recovery') {
        const { error: verifyError } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' })
        if (!active) return
        if (verifyError) setError('Il link non è valido o è scaduto. Richiedi un nuovo link.')
        else setRecoveryReady(true)
        setCheckingRecovery(false)
        return
      }
      const { data: { session } } = await supabase.auth.getSession()
      if (!active) return
      if (session) setRecoveryReady(true)
      else setError('Il link non è valido o è scaduto. Richiedi un nuovo link.')
      setCheckingRecovery(false)
    }
    check().catch(() => {
      if (active) {
        setError('Non è stato possibile verificare il link. Richiedi un nuovo link.')
        setCheckingRecovery(false)
      }
    })
    return () => { active = false }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError('')

    if (!recoveryReady) {
      setError(
        'La sessione di recupero non è disponibile. Richiedi un nuovo link.'
      )
      return
    }

    if (password.length < 8) {
      setError('La password deve contenere almeno 8 caratteri.')
      return
    }

    if (password !== confirmPassword) {
      setError('Le password non coincidono.')
      return
    }

    setLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    })

    if (updateError) {
      console.error('PASSWORD UPDATE ERROR:', updateError)
      setError(
        updateError.message ||
          'Impossibile reimpostare la password. Riprova.'
      )
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)

    await supabase.auth.signOut()

    setTimeout(() => {
      window.location.href = '/login'
    }, 1500)
  }

  if (checkingRecovery) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-sm text-slate-400">
          Verifica del link di recupero...
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-xl font-bold text-slate-950 shadow-lg">
            G
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white">
            Reimposta la password
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Crea una nuova password per il tuo account.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
          {success ? (
            <div className="rounded-xl border border-green-900/50 bg-green-950/40 px-4 py-4 text-sm text-green-300">
              Password reimpostata correttamente. Ti stiamo portando al
              login...
            </div>
          ) : !recoveryReady ? (
            <div className="space-y-4">
              <div
                role="alert"
                className="rounded-xl border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-300"
              >
                {error ||
                  'Il link di recupero non è valido o è scaduto.'}
              </div>

              <a
                href="/forgot-password"
                className="block w-full rounded-xl bg-white px-4 py-3 text-center font-semibold text-slate-950 transition hover:bg-slate-200"
              >
                Richiedi un nuovo link
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Nuova password
                </label>

                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Inserisci la nuova password"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400 focus:ring-2 focus:ring-slate-700"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Conferma password
                </label>

                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  placeholder="Ripeti la nuova password"
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
                  ? 'Reimpostazione in corso...'
                  : 'Reimposta password'}
              </button>
            </form>
          )}

          {!success && (
            <div className="mt-5 text-center">
              <a
                href="/login"
                className="text-sm text-slate-400 transition hover:text-white"
              >
                Torna al login
              </a>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}