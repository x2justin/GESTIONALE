import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

type Patient = {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string | null
  place_of_birth: string | null
  tax_code: string | null
  gender: string | null
  citizenship: string | null
  residence_address: string | null
  residence_city: string | null
  residence_cap: string | null
  residence_province: string | null
  phone: string | null
  email: string | null
  is_active: boolean
  created_at: string
}

function formatDate(date: string | null) {
  if (!date) return '—'

  return new Date(`${date}T00:00:00`).toLocaleDateString('it-IT')
}

function displayValue(value: string | null) {
  return value?.trim() ? value : '—'
}

function formatGender(gender: string | null) {
  if (!gender) return '—'

  if (gender === 'M') return 'Maschio'
  if (gender === 'F') return 'Femmina'
  if (gender === 'Altro') return 'Altro'

  return gender
}

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>()

  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  async function loadPatient() {
    if (!id) {
      setErrorMessage('Paziente non valido.')
      setLoading(false)
      return
    }

    setLoading(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('patients')
      .select(`
        id,
        first_name,
        last_name,
        date_of_birth,
        place_of_birth,
        tax_code,
        gender,
        citizenship,
        residence_address,
        residence_city,
        residence_cap,
        residence_province,
        phone,
        email,
        is_active,
        created_at
      `)
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error(
        'Errore caricamento dettaglio paziente:',
        error
      )

      setErrorMessage('Impossibile caricare il paziente.')
      setPatient(null)
      setLoading(false)
      return
    }

    if (!data) {
      setErrorMessage(
        'Paziente non trovato oppure non hai accesso a questo paziente.'
      )
      setPatient(null)
      setLoading(false)
      return
    }

    setPatient(data)
    setLoading(false)
  }

  useEffect(() => {
    loadPatient()
  }, [id])

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-sm text-slate-500">
          Caricamento paziente...
        </p>
      </div>
    )
  }

  if (errorMessage || !patient) {
    return (
      <div className="space-y-6">
        <Link
          to="/operator/pazienti"
          className="inline-flex items-center text-sm font-medium text-slate-600 transition hover:text-slate-900"
        >
          ← Torna ai pazienti
        </Link>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm font-medium text-red-700">
            {errorMessage || 'Paziente non trovato.'}
          </p>

          <button
            onClick={loadPatient}
            className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Riprova
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Link
        to="/operator/pazienti"
        className="inline-flex items-center text-sm font-medium text-slate-600 transition hover:text-slate-900"
      >
        ← Torna ai pazienti
      </Link>

      {/* INTESTAZIONE */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xl font-semibold text-white">
            {patient.first_name.charAt(0)}
            {patient.last_name.charAt(0)}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-semibold text-slate-900">
                {patient.first_name} {patient.last_name}
              </h2>

              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  patient.is_active
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {patient.is_active ? 'Attivo' : 'Non attivo'}
              </span>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Scheda del paziente
            </p>
          </div>
        </div>
      </div>

      {/* DATI ANAGRAFICI */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 lg:p-8">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Dati anagrafici
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Informazioni anagrafiche del paziente.
          </p>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Nome
            </p>

            <p className="mt-1 text-sm font-medium text-slate-900">
              {displayValue(patient.first_name)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Cognome
            </p>

            <p className="mt-1 text-sm font-medium text-slate-900">
              {displayValue(patient.last_name)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Data di nascita
            </p>

            <p className="mt-1 text-sm font-medium text-slate-900">
              {formatDate(patient.date_of_birth)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Luogo di nascita
            </p>

            <p className="mt-1 text-sm font-medium text-slate-900">
              {displayValue(patient.place_of_birth)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Codice fiscale
            </p>

            <p className="mt-1 text-sm font-medium uppercase text-slate-900">
              {displayValue(patient.tax_code)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Sesso
            </p>

            <p className="mt-1 text-sm font-medium text-slate-900">
              {formatGender(patient.gender)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Cittadinanza
            </p>

            <p className="mt-1 text-sm font-medium text-slate-900">
              {displayValue(patient.citizenship)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Stato
            </p>

            <p className="mt-1 text-sm font-medium text-slate-900">
              {patient.is_active ? 'Attivo' : 'Non attivo'}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Inserito il
            </p>

            <p className="mt-1 text-sm font-medium text-slate-900">
              {formatDate(patient.created_at)}
            </p>
          </div>
        </div>
      </section>

      {/* RESIDENZA */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 lg:p-8">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Residenza
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Informazioni relative alla residenza del paziente.
          </p>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Indirizzo
            </p>

            <p className="mt-1 text-sm font-medium text-slate-900">
              {displayValue(patient.residence_address)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Comune
            </p>

            <p className="mt-1 text-sm font-medium text-slate-900">
              {displayValue(patient.residence_city)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              CAP
            </p>

            <p className="mt-1 text-sm font-medium text-slate-900">
              {displayValue(patient.residence_cap)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Provincia
            </p>

            <p className="mt-1 text-sm font-medium text-slate-900">
              {displayValue(patient.residence_province)}
            </p>
          </div>
        </div>
      </section>

      {/* CONTATTI */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 lg:p-8">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Contatti
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Recapiti del paziente o della famiglia.
          </p>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Telefono
            </p>

            <p className="mt-1 text-sm font-medium text-slate-900">
              {displayValue(patient.phone)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Email
            </p>

            <p className="mt-1 break-all text-sm font-medium text-slate-900">
              {displayValue(patient.email)}
            </p>
          </div>
        </div>
      </section>

      {/* CONSEGNE E TERAPIE */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-slate-900">
            Consegne
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Qui verranno mostrate le consegne relative a questo paziente.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-slate-900">
            Terapie
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Qui verranno mostrate le terapie programmate per questo paziente.
          </p>
        </section>
      </div>
    </div>
  )
}