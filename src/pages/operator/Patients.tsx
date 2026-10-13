
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

type Patient = {
  id: string
  first_name: string
  last_name: string
  is_active: boolean
}

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  async function loadPatients() {
    setLoading(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('patients')
      .select('id, first_name, last_name, is_active')
      .eq('is_active', true)
      .order('last_name', { ascending: true })

    if (error) {
      console.error(
        'Errore caricamento pazienti operatore:',
        error
      )

      setErrorMessage('Impossibile caricare i pazienti.')
      setPatients([])
      setLoading(false)
      return
    }

    setPatients(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadPatients()
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">
          I miei pazienti
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Elenco dei pazienti che ti sono stati assegnati.
        </p>
      </div>

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">
            Caricamento pazienti...
          </p>
        </div>
      )}

      {!loading && errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm font-medium text-red-700">
            {errorMessage}
          </p>

          <button
            onClick={loadPatients}
            className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Riprova
          </button>
        </div>
      )}

      {!loading && !errorMessage && patients.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm font-medium text-slate-700">
            Nessun paziente assegnato
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Al momento non hai pazienti associati al tuo account.
          </p>
        </div>
      )}

      {!loading && !errorMessage && patients.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {patients.map((patient) => (
            <Link
              key={patient.id}
              to={`/operator/pazienti/${patient.id}`}
              className="block rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-slate-300 hover:shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                  {patient.first_name.charAt(0)}
                  {patient.last_name.charAt(0)}
                </div>

                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-slate-900">
                    {patient.first_name} {patient.last_name}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Paziente assegnato
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-sm font-medium text-slate-600">
                  Apri scheda
                </span>

                <span className="text-sm text-slate-400">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}