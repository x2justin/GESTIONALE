
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type ParentPatient = {
  id: string
  first_name: string
  last_name: string
}

type Parent = {
  id: string
  first_name: string
  last_name: string
  role: 'parent'
  is_active: boolean
  patients: ParentPatient[]
}

export default function Parents() {
  const [parents, setParents] = useState<Parent[]>([])
  const [loading, setLoading] = useState(true)

  const [showCreateModal, setShowCreateModal] = useState(false)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')

  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function loadParents() {
    setLoading(true)

    const { data: parentsData, error: parentsError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, role, is_active')
      .eq('role', 'parent')
      .order('last_name', { ascending: true })

    if (parentsError) {
      console.error('Errore caricamento genitori:', parentsError)
      setParents([])
      setLoading(false)
      return
    }

    const parentIds = (parentsData ?? []).map((parent) => parent.id)

    if (parentIds.length === 0) {
      setParents([])
      setLoading(false)
      return
    }

    const { data: accessData, error: accessError } = await supabase
      .from('patient_access')
      .select(`
        user_id,
        patient_id,
        access_type,
        patients (
          id,
          first_name,
          last_name
        )
      `)
      .eq('access_type', 'parent')
      .in('user_id', parentIds)

    if (accessError) {
      console.error(
        'Errore caricamento associazioni genitori:',
        accessError
      )
      setParents([])
      setLoading(false)
      return
    }

    const formattedParents: Parent[] = (parentsData ?? []).map(
      (parent) => {
        const patientAccesses = (accessData ?? []).filter(
          (access) => access.user_id === parent.id
        )

        const patients: ParentPatient[] = patientAccesses
          .map((access) => {
            const patient = Array.isArray(access.patients)
              ? access.patients[0]
              : access.patients

            if (!patient) {
              return null
            }

            return {
              id: patient.id,
              first_name: patient.first_name,
              last_name: patient.last_name,
            }
          })
          .filter(
            (patient): patient is ParentPatient =>
              patient !== null
          )
          .sort((a, b) =>
            a.last_name.localeCompare(b.last_name)
          )

        return {
          id: parent.id,
          first_name: parent.first_name,
          last_name: parent.last_name,
          role: parent.role as 'parent',
          is_active: parent.is_active,
          patients,
        }
      }
    )

    setParents(formattedParents)
    setLoading(false)
  }

  useEffect(() => {
    loadParents()
  }, [])

  async function handleCreateParent() {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      alert('Compila tutti i campi.')
      return
    }

    setCreating(true)

    const { data, error } = await supabase.functions.invoke(
      'create-user',
      {
        body: {
          email: email.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          role: 'parent',
        },
      }
    )

    if (error) {
      console.error('Errore creazione genitore:', error)
      alert(`Errore: ${error.message}`)
      setCreating(false)
      return
    }

    if (data?.error) {
      alert(`Errore: ${data.error}`)
      setCreating(false)
      return
    }

    setFirstName('')
    setLastName('')
    setEmail('')
    setShowCreateModal(false)

    await loadParents()

    setCreating(false)
  }

  async function handleDeleteParent(parent: Parent) {
    const confirmed = window.confirm(
      `Sei sicuro di voler eliminare ${parent.first_name} ${parent.last_name}?`
    )

    if (!confirmed) {
      return
    }

    setDeletingId(parent.id)

    const { data, error } = await supabase.functions.invoke(
      'delete-user',
      {
        body: {
          user_id: parent.id,
        },
      }
    )

    if (error) {
      console.error('Errore eliminazione genitore:', error)
      alert(`Errore: ${error.message}`)
      setDeletingId(null)
      return
    }

    if (data?.error) {
      alert(`Errore: ${data.error}`)
      setDeletingId(null)
      return
    }

    setParents((currentParents) =>
      currentParents.filter((item) => item.id !== parent.id)
    )

    setDeletingId(null)
  }

  return (
    <div className="space-y-8">
      {/* Header pagina */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Genitori
          </h2>

          <p className="mt-2 text-slate-500">
            Gestisci i genitori e i pazienti a loro associati.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Nuovo genitore
        </button>
      </div>

      {/* Lista */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-48 items-center justify-center p-6">
            <p className="text-sm text-slate-400">
              Caricamento genitori...
            </p>
          </div>
        ) : parents.length === 0 ? (
          <div className="flex min-h-48 items-center justify-center p-6">
            <div className="text-center">
              <p className="font-medium text-slate-700">
                Nessun genitore presente.
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Crea il primo genitore per iniziare.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {parents.map((parent) => (
              <div
                key={parent.id}
                className="flex flex-col gap-5 p-5 sm:p-6"
              >
                {/* Dati genitore */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-semibold text-slate-900">
                        {parent.last_name} {parent.first_name}
                      </h3>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          parent.is_active
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {parent.is_active ? 'Attivo' : 'Disattivo'}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      Genitore
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeleteParent(parent)}
                    disabled={deletingId === parent.id}
                    className="self-start rounded-xl px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingId === parent.id
                      ? 'Eliminazione...'
                      : 'Elimina'}
                  </button>
                </div>

                {/* Pazienti associati */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-700">
                      Pazienti associati
                    </p>

                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500">
                      {parent.patients.length}
                    </span>
                  </div>

                  {parent.patients.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-400">
                      Nessun paziente associato.
                    </p>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {parent.patients.map((patient) => (
                        <div
                          key={patient.id}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                        >
                          <p className="text-sm font-medium text-slate-900">
                            {patient.last_name} {patient.first_name}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal creazione */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Nuovo genitore
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Crea un nuovo account genitore.
                </p>
              </div>

              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg px-2 py-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Nome
                </label>

                <input
                  type="text"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  placeholder="Nome"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Cognome
                </label>

                <input
                  type="text"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  placeholder="Cognome"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  placeholder="email@esempio.it"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={creating}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Annulla
              </button>

              <button
                onClick={handleCreateParent}
                disabled={creating}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating ? 'Creazione...' : 'Crea genitore'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}