
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type DeliveryType = 'internal' | 'patient'

type Patient = {
  id: string
  first_name: string
  last_name: string
}

type Delivery = {
  id: string
  type: DeliveryType
  title: string
  content: string
  created_at: string
  author: {
    first_name: string
    last_name: string
  } | null
  patient: Patient | null
}

export default function Deliveries() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [patients, setPatients] = useState<Patient[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showCreateModal, setShowCreateModal] = useState(false)

  const [type, setType] = useState<DeliveryType>('internal')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [patientId, setPatientId] = useState('')

  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function loadData() {
    setLoading(true)
    setError('')

    const [deliveriesResult, patientsResult] = await Promise.all([
      supabase
        .from('deliveries')
        .select(`
          id,
          type,
          title,
          content,
          created_at,
          profiles (
            first_name,
            last_name
          ),
          patients (
            id,
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false }),

      supabase
        .from('patients')
        .select('id, first_name, last_name')
        .order('last_name', { ascending: true }),
    ])

    if (deliveriesResult.error) {
      console.error(
        'Errore caricamento consegne:',
        deliveriesResult.error
      )
      setError('Impossibile caricare le consegne.')
      setLoading(false)
      return
    }

    if (patientsResult.error) {
      console.error(
        'Errore caricamento pazienti:',
        patientsResult.error
      )
      setError('Impossibile caricare i pazienti.')
      setLoading(false)
      return
    }

    const formattedDeliveries: Delivery[] = (
      deliveriesResult.data ?? []
    ).map((delivery) => {
      const profile = Array.isArray(delivery.profiles)
        ? delivery.profiles[0]
        : delivery.profiles

      const patient = Array.isArray(delivery.patients)
        ? delivery.patients[0]
        : delivery.patients

      return {
        id: delivery.id,
        type: delivery.type as DeliveryType,
        title: delivery.title,
        content: delivery.content,
        created_at: delivery.created_at,
        author: profile
          ? {
              first_name: profile.first_name,
              last_name: profile.last_name,
            }
          : null,
        patient: patient
          ? {
              id: patient.id,
              first_name: patient.first_name,
              last_name: patient.last_name,
            }
          : null,
      }
    })

    setDeliveries(formattedDeliveries)
    setPatients(patientsResult.data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  function openCreateModal() {
    setType('internal')
    setTitle('')
    setContent('')
    setPatientId('')
    setShowCreateModal(true)
  }

  function closeCreateModal() {
    if (creating) return

    setShowCreateModal(false)
    setTitle('')
    setContent('')
    setPatientId('')
    setType('internal')
  }

  async function handleCreateDelivery() {
    if (!title.trim() || !content.trim()) {
      alert('Compila titolo e contenuto.')
      return
    }

    if (type === 'patient' && !patientId) {
      alert('Seleziona un paziente.')
      return
    }

    setCreating(true)

    const {
      data: {
        user,
      },
    } = await supabase.auth.getUser()

    if (!user) {
      alert('Sessione non valida.')
      setCreating(false)
      return
    }

    const { error } = await supabase
      .from('deliveries')
      .insert({
        author_id: user.id,
        patient_id: type === 'patient' ? patientId : null,
        type,
        title: title.trim(),
        content: content.trim(),
      })

    if (error) {
      console.error('Errore creazione consegna:', error)
      alert('Impossibile creare la consegna.')
      setCreating(false)
      return
    }

    closeCreateModal()
    await loadData()

    setCreating(false)
  }

  async function handleDeleteDelivery(delivery: Delivery) {
    const confirmed = window.confirm(
      `Sei sicuro di voler eliminare la consegna "${delivery.title}"?`
    )

    if (!confirmed) {
      return
    }

    setDeletingId(delivery.id)

    const { error } = await supabase
      .from('deliveries')
      .delete()
      .eq('id', delivery.id)

    if (error) {
      console.error('Errore eliminazione consegna:', error)
      alert('Impossibile eliminare la consegna.')
      setDeletingId(null)
      return
    }

    setDeliveries((currentDeliveries) =>
      currentDeliveries.filter(
        (item) => item.id !== delivery.id
      )
    )

    setDeletingId(null)
  }

  function formatDate(dateString: string) {
    return new Intl.DateTimeFormat('it-IT', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateString))
  }

  return (
    <div className="space-y-8">
      {/* Header pagina */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Consegne
          </h2>

          <p className="mt-2 text-slate-500">
            Gestisci le comunicazioni e le consegne del gestionale.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Nuova consegna
        </button>
      </div>

      {/* Lista */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-48 items-center justify-center p-6">
            <p className="text-sm text-slate-400">
              Caricamento consegne...
            </p>
          </div>
        ) : error ? (
          <div className="p-6">
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          </div>
        ) : deliveries.length === 0 ? (
          <div className="flex min-h-48 items-center justify-center p-6">
            <div className="text-center">
              <p className="font-medium text-slate-700">
                Nessuna consegna presente.
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Crea la prima consegna per iniziare.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {deliveries.map((delivery) => (
              <div
                key={delivery.id}
                className="p-5 sm:p-6"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    {/* Tipo e paziente */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          delivery.type === 'internal'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {delivery.type === 'internal'
                          ? 'Interna'
                          : 'Paziente'}
                      </span>

                      {delivery.patient && (
                        <span className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {delivery.patient.last_name}{' '}
                          {delivery.patient.first_name}
                        </span>
                      )}
                    </div>

                    {/* Titolo */}
                    <h3 className="mt-3 text-lg font-semibold text-slate-900">
                      {delivery.title}
                    </h3>

                    {/* Contenuto */}
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                      {delivery.content}
                    </p>

                    {/* Meta */}
                    <div className="mt-4 flex flex-col gap-1 text-xs text-slate-400 sm:flex-row sm:gap-3">
                      <span>
                        Autore:{' '}
                        {delivery.author
                          ? `${delivery.author.first_name} ${delivery.author.last_name}`
                          : 'Utente non disponibile'}
                      </span>

                      <span className="hidden sm:block">
                        •
                      </span>

                      <span>
                        {formatDate(delivery.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Azioni */}
                  <div className="flex shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteDelivery(delivery)
                      }
                      disabled={deletingId === delivery.id}
                      className="rounded-xl px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingId === delivery.id
                        ? 'Eliminazione...'
                        : 'Elimina'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal creazione */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4"
          onClick={closeCreateModal}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Nuova consegna
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Crea una nuova comunicazione.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCreateModal}
                disabled={creating}
                className="rounded-lg px-2 py-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                aria-label="Chiudi"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-5">
              {/* Tipo */}
              <div>
                <label
                  htmlFor="delivery-type"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Tipo di consegna
                </label>

                <select
                  id="delivery-type"
                  value={type}
                  onChange={(event) => {
                    const newType =
                      event.target.value as DeliveryType

                    setType(newType)

                    if (newType === 'internal') {
                      setPatientId('')
                    }
                  }}
                  disabled={creating}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 disabled:bg-slate-100"
                >
                  <option value="internal">
                    Consegna interna
                  </option>

                  <option value="patient">
                    Consegna paziente
                  </option>
                </select>
              </div>

              {/* Paziente */}
              {type === 'patient' && (
                <div>
                  <label
                    htmlFor="delivery-patient"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Paziente
                  </label>

                  <select
                    id="delivery-patient"
                    value={patientId}
                    onChange={(event) =>
                      setPatientId(event.target.value)
                    }
                    disabled={creating}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 disabled:bg-slate-100"
                  >
                    <option value="">
                      Seleziona un paziente
                    </option>

                    {patients.map((patient) => (
                      <option
                        key={patient.id}
                        value={patient.id}
                      >
                        {patient.last_name}{' '}
                        {patient.first_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Titolo */}
              <div>
                <label
                  htmlFor="delivery-title"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Titolo
                </label>

                <input
                  id="delivery-title"
                  type="text"
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  disabled={creating}
                  placeholder="Titolo della consegna"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 disabled:bg-slate-100"
                />
              </div>

              {/* Contenuto */}
              <div>
                <label
                  htmlFor="delivery-content"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Contenuto
                </label>

                <textarea
                  id="delivery-content"
                  value={content}
                  onChange={(event) =>
                    setContent(event.target.value)
                  }
                  disabled={creating}
                  rows={5}
                  placeholder="Scrivi il contenuto della consegna..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 disabled:bg-slate-100"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeCreateModal}
                disabled={creating}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Annulla
              </button>

              <button
                type="button"
                onClick={handleCreateDelivery}
                disabled={creating}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating
                  ? 'Creazione...'
                  : 'Crea consegna'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}