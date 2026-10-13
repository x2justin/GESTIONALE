import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'

export default function SetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    let mounted = true
    async function checkSession() {
      try {
        const params = new URLSearchParams(window.location.search)
        const tokenHash = params.get('token_hash')
        const type = params.get('type')

        if (tokenHash && type) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as 'invite' | 'recovery' | 'email',
          })
          if (verifyError) {
            if (mounted) {
              setError('Il link di invito non è valido o è scaduto. Richiedi un nuovo invito.')
              setCheckingSession(false)
            }
            return
          }
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (!mounted) return
        if (sessionError || !session) {
          setError('Il link di invito non è valido o è scaduto. Richiedi un nuovo invito.')
        }
        setCheckingSession(false)
      } catch {
        if (!mounted) return
        setError('Il link di invito non è valido o è scaduto. Richiedi un nuovo invito.')
        setCheckingSession(false)
      }
    }
    checkSession()
    return () => { mounted = false }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('La password deve contenere almeno 8 caratteri.')
      return
    }
    if (password !== confirmPassword) {
      setError('Le password non coincidono.')
      return
    }
    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError(updateError.message || 'Impossibile impostare la password. Riprova.')
      setLoading(false)
      return
    }
    setSuccess(true)
    setLoading(false)
    await supabase.auth.signOut()
    window.setTimeout(() => { window.location.href = '/login' }, 1500)
  }

  if (checkingSession) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4"><div className="text-sm text-slate-400">Verifica del link...</div></main>
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-xl font-bold text-slate-950 shadow-lg">G</div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Imposta la password</h1>
          <p className="mt-2 text-sm text-slate-400">Crea la password per il tuo account.</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
          {success ? (
            <div className="rounded-xl border border-green-900/50 bg-green-950/40 px-4 py-4 text-sm text-green-300">Password impostata correttamente. Ti stiamo portando al login...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-200">Nuova password</label>
                <input id="password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Inserisci la password" required className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400 focus:ring-2 focus:ring-slate-700" />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-slate-200">Conferma password</label>
                <input id="confirmPassword" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Ripeti la password" required className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400 focus:ring-2 focus:ring-slate-700" />
              </div>
              {error && <div role="alert" className="rounded-xl border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-300">{error}</div>}
              <button type="submit" disabled={loading} className="w-full rounded-xl bg-white px-4 py-3 font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50">{loading ? 'Impostazione in corso...' : 'Imposta password'}</button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
