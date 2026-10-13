
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

export default function Profile() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [description, setDescription] = useState('')

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (!profile) return

    setFirstName(profile.first_name)
    setLastName(profile.last_name)
    setDescription(profile.description ?? '')
  }, [profile])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setErrorMessage('')
    setSuccessMessage('')

    if (!user) {
      setErrorMessage('Sessione non valida.')
      return
    }

    const trimmedFirstName = firstName.trim()
    const trimmedLastName = lastName.trim()
    const trimmedDescription = description.trim()

    if (!trimmedFirstName || !trimmedLastName) {
      setErrorMessage('Nome e cognome sono obbligatori.')
      return
    }

    setLoading(true)

    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: trimmedFirstName,
        last_name: trimmedLastName,
        description: trimmedDescription || null,
      })
      .eq('id', user.id)

    if (error) {
      console.error('Errore aggiornamento profilo:', error)

      setErrorMessage(
        'Impossibile salvare le modifiche. Riprova.'
      )
      setLoading(false)
      return
    }

    setSuccessMessage('Profilo aggiornato correttamente.')
    setLoading(false)

    setTimeout(() => {
      window.location.reload()
    }, 700)
  }

  function handleBack() {
    if (profile?.role === 'admin') {
      navigate('/admin')
      return
    }

    if (profile?.role === 'operator') {
      navigate('/operator')
      return
    }

    if (profile?.role === 'parent') {
      navigate('/parent')
      return
    }

    navigate('/login')
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm text-slate-500">
              Caricamento profilo...
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <button
            type="button"
            onClick={handleBack}
            className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            ← Torna indietro
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-6 sm:px-8">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-900 text-lg font-semibold text-white">
                {profile.first_name.charAt(0).toUpperCase()}
              </div>

              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                  Il mio profilo
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Modifica le informazioni che gli altri utenti
                  possono vedere.
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6 px-6 py-6 sm:px-8"
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="first-name"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Nome
                </label>

                <input
                  id="first-name"
                  type="text"
                  value={firstName}
                  onChange={(event) =>
                    setFirstName(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  placeholder="Nome"
                  autoComplete="given-name"
                />
              </div>

              <div>
                <label
                  htmlFor="last-name"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Cognome
                </label>

                <input
                  id="last-name"
                  type="text"
                  value={lastName}
                  onChange={(event) =>
                    setLastName(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  placeholder="Cognome"
                  autoComplete="family-name"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Descrizione
              </label>

              <textarea
                id="description"
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                rows={5}
                maxLength={500}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                placeholder="Scrivi qualcosa su di te..."
              />

              <p className="mt-2 text-xs text-slate-400">
                {description.length}/500 caratteri
              </p>
            </div>

            {errorMessage && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {successMessage}
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleBack}
                className="rounded-xl px-5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Annulla
              </button>

              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Salvataggio...' : 'Salva modifiche'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}