
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

type Profile = {
  id: string
  first_name: string
  last_name: string
  description: string | null
  role: 'admin' | 'operator' | 'parent'
  is_active: boolean
}

function getRoleLabel(role: Profile['role']) {
  if (role === 'admin') return 'Amministratore'
  if (role === 'operator') return 'Operatore'
  if (role === 'parent') return 'Genitore'

  return role
}

function displayDescription(description: string | null) {
  return description?.trim()
    ? description
    : 'Nessuna descrizione disponibile.'
}

export default function PublicProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  async function loadProfile() {
    if (!id) {
      setErrorMessage('Profilo non valido.')
      setLoading(false)
      return
    }

    setLoading(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('profiles')
      .select(
        'id, first_name, last_name, description, role, is_active'
      )
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error(
        'Errore caricamento profilo:',
        error
      )

      setErrorMessage(
        'Impossibile caricare il profilo.'
      )
      setProfile(null)
      setLoading(false)
      return
    }

    if (!data) {
      setErrorMessage('Profilo non trovato.')
      setProfile(null)
      setLoading(false)
      return
    }

    setProfile(data)
    setLoading(false)
  }

  useEffect(() => {
    loadProfile()
  }, [id])

  function handleBack() {
    navigate(-1)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
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

  if (errorMessage || !profile) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <button
            type="button"
            onClick={handleBack}
            className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            ← Torna indietro
          </button>

          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="text-sm font-medium text-red-700">
              {errorMessage || 'Profilo non trovato.'}
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
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xl font-semibold text-white">
                {profile.first_name.charAt(0).toUpperCase()}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                    {profile.first_name} {profile.last_name}
                  </h1>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      profile.is_active
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {profile.is_active
                      ? 'Attivo'
                      : 'Non attivo'}
                  </span>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  {getRoleLabel(profile.role)}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6 px-6 py-6 sm:px-8">
            <section>
              <h2 className="text-lg font-semibold text-slate-900">
                Informazioni
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Informazioni pubbliche del profilo.
              </p>
            </section>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Nome
                </p>

                <p className="mt-1 text-sm font-medium text-slate-900">
                  {profile.first_name}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Cognome
                </p>

                <p className="mt-1 text-sm font-medium text-slate-900">
                  {profile.last_name}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Ruolo
                </p>

                <p className="mt-1 text-sm font-medium text-slate-900">
                  {getRoleLabel(profile.role)}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Stato
                </p>

                <p className="mt-1 text-sm font-medium text-slate-900">
                  {profile.is_active
                    ? 'Attivo'
                    : 'Non attivo'}
                </p>
              </div>
            </div>

            <section className="border-t border-slate-100 pt-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Descrizione
              </h2>

              <div className="mt-4 rounded-xl bg-slate-50 p-4">
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {displayDescription(profile.description)}
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}