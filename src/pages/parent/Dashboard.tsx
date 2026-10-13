
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

type PatientAccess = {
  patient_id: string
}

type Patient = {
  id: string
  first_name: string
  last_name: string | null
  is_active: boolean
}

export default function Dashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  function handleProfile() {
    setMenuOpen(false)
    navigate('/profilo')
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false)
      }
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      )
    }
  }, [menuOpen])

  async function loadPatients() {
    setLoading(true)
    setErrorMessage('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setErrorMessage('Sessione non valida.')
      setPatients([])
      setLoading(false)
      return
    }

    const { data: accessData, error: accessError } =
      await supabase
        .from('patient_access')
        .select('patient_id')
        .eq('user_id', user.id)

    if (accessError) {
      console.error(
        'Errore caricamento accessi genitore:',
        accessError
      )

      setErrorMessage(
        'Impossibile caricare i pazienti associati.'
      )
      setPatients([])
      setLoading(false)
      return
    }

    const accessRows = (accessData ?? []) as PatientAccess[]

    if (accessRows.length === 0) {
      setPatients([])
      setLoading(false)
      return
    }

    const patientIds = accessRows.map(
      (access) => access.patient_id
    )

    const { data: patientsData, error: patientsError } =
      await supabase
        .from('patients')
        .select('id, first_name, last_name, is_active')
        .in('id', patientIds)
        .order('last_name', { ascending: true })

    if (patientsError) {
      console.error(
        'Errore caricamento pazienti genitore:',
        patientsError
      )

      setErrorMessage(
        'Impossibile caricare i dati dei pazienti.'
      )
      setPatients([])
      setLoading(false)
      return
    }

    setPatients(patientsData ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadPatients()
  }, [])

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Area Genitore
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Visualizza le informazioni relative ai tuoi
              pazienti associati.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-900">
                {profile?.first_name} {profile?.last_name}
              </p>

              <p className="text-xs text-slate-500">
                Genitore
              </p>
            </div>

            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-label="Apri menu profilo"
                aria-expanded={menuOpen}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {profile?.first_name?.charAt(0).toUpperCase()}
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-12 z-50 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {profile?.first_name} {profile?.last_name}
                    </p>

                    <p className="text-xs text-slate-500">
                      Genitore
                    </p>
                  </div>

                  <div className="p-1.5">
                    <button
                      type="button"
                      onClick={handleProfile}
                      className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      Profilo
                    </button>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      Esci
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="hidden rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-900 sm:block"
            >
              Esci
            </button>
          </div>
        </header>

        {loading && (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-slate-500">
              Caricamento pazienti...
            </p>
          </div>
        )}

        {!loading && errorMessage && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="text-sm font-medium text-red-700">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={loadPatients}
              className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Riprova
            </button>
          </div>
        )}

        {!loading && !errorMessage && patients.length === 0 && (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="font-medium text-slate-700">
              Nessun paziente associato
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Non risultano pazienti associati al tuo account.
            </p>
          </div>
        )}

        {!loading && !errorMessage && patients.length > 0 && (
          <section className="mt-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {patients.map((patient) => (
                <Link
                  key={patient.id}
                  to={`/parent/pazienti/${patient.id}`}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                      {patient.first_name.charAt(0)}
                      {patient.last_name?.charAt(0) ?? ''}
                    </div>

                    <div className="min-w-0">
                      <h2 className="truncate font-semibold text-slate-900">
                        {patient.first_name}{' '}
                        {patient.last_name ?? ''}
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        {patient.is_active
                          ? 'Paziente attivo'
                          : 'Paziente non attivo'}
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
          </section>
        )}
      </div>
    </main>
  )
}