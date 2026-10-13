
import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')

    const { error: loginError } =
      await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

    if (loginError) {
      console.error('LOGIN ERROR:', loginError)
      setError(loginError.message)
      setLoading(false)
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('Errore durante l\'accesso.')
      setLoading(false)
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || !profile.is_active) {
      await supabase.auth.signOut()
      setError('Account non autorizzato.')
      setLoading(false)
      return
    }

    if (profile.role === 'admin') {
      window.location.href = '/admin'
      return
    }

    if (profile.role === 'operator') {
      window.location.href = '/operator'
      return
    }

    if (profile.role === 'parent') {
      window.location.href = '/parent'
      return
    }

    await supabase.auth.signOut()
    setError('Ruolo account non valido.')
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
            Gestionale
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Accedi al tuo account
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-5">
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

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Inserisci la password"
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400 focus:ring-2 focus:ring-slate-700"
              />

              <div className="mt-2 text-right">
                <a
                  href="/forgot-password"
                  className="text-sm text-slate-400 transition hover:text-white"
                >
                  Password dimenticata?
                </a>
              </div>
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
              {loading ? 'Accesso in corso...' : 'Accedi'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}