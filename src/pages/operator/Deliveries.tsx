
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

type DeliveryType = 'internal' | 'patient'

type Patient = {
  id: string
  first_name: string
  last_name: string | null
}

type Delivery = {
  id: string
  type: DeliveryType
  title: string
  content: string
  created_at: string
  author: {
    id: string
    first_name: string
    last_name: string
  } | null
  patient: Patient | null
}

export default function Deliveries() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [type, setType] = useState<DeliveryType>('internal')
  const [patientId, setPatientId] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  async function loadData() {
    setLoading(true)
    setErrorMessage('')

    const [deliveriesResult, patientsResult] =
      await Promise.all([
        supabase
          .from('deliveries')
          .select(`
            id,
            type,
            title,
            content,
            created_at,
            profiles (
              id,
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
        'Errore caricamento consegne operatore:',
        deliveriesResult.error
      )

      setErrorMessage('Impossibile caricare le consegne.')
      setDeliveries([])
      setLoading(false)
      return
    }

    if (patientsResult.error) {
      console.error(
        'Errore caricamento pazienti operatore:',
        patientsResult.error
      )

      setErrorMessage('Impossibile caricare i pazienti.')
      setDeliveries([])
      setPatients([])
      setLoading(false)
      return
    }

    const formattedDeliveries: Delivery[] = (
      deliveriesResult.data ?? []
    ).map((delivery: any) => {
      const author = Array.isArray(delivery.profiles)
        ? delivery.profiles[0] ?? null
        : delivery.profiles ?? null

      const patient = Array.isArray(delivery.patients)
        ? delivery.patients[0] ?? null
        : delivery.patients ?? null

      return {
        id: delivery.id,
        type: delivery.type,
        title: delivery.title,
        content: delivery.content,
        created_at: delivery.created_at,
        author,
        patient,
      }
    })

    setDeliveries(formattedDeliveries)
    setPatients(patientsResult.data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  function resetForm() {
    setType('internal')
    setPatientId('')
    setTitle('')
    setContent('')
  }

  function closeModal() {
    if (saving) {
      return
    }

    setIsModalOpen(false)
    resetForm()
  }

  async function handleCreateDelivery() {
    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()

    if (!trimmedTitle || !trimmedContent) {
      alert('Inserisci titolo e contenuto.')
      return
    }

    if (type === 'patient' && !patientId) {
      alert('Seleziona un paziente.')
      return
    }

    setSaving(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      alert('Sessione non trovata.')
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from('deliveries')
      .insert({
        author_id: user.id,
        patient_id: type === 'patient' ? patientId : null,
        type,
        title: trimmedTitle,
        content: trimmedContent,
      })

    if (error) {
      console.error(
        'Errore creazione consegna operatore:',
        error
      )

      alert('Impossibile creare la consegna.')
      setSaving(false)
      return
    }

    setSaving(false)
    setIsModalOpen(false)
    resetForm()
    await loadData()
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('it-IT', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Consegne
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Comunicazioni e consegne disponibili per te.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Nuova consegna
        </button>
      </div>

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">
            Caricamento consegne...
          </p>
        </div>
      )}

      {!loading && errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm font-medium text-red-700">
            {errorMessage}
          </p>

          <button
            onClick={loadData}
            className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Riprova
          </button>
        </div>
      )}

      {!loading && !errorMessage && deliveries.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm font-medium text-slate-700">
            Nessuna consegna
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Non ci sono consegne disponibili al momento.
          </p>
        </div>
      )}

      {!loading && !errorMessage && deliveries.length > 0 && (
        <div className="space-y-4">
          {deliveries.map((delivery) => (
            <div
              key={delivery.id}
              className="rounded-2xl border border-slate-200 bg-white p-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        delivery.type === 'internal'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {delivery.type === 'internal'
                        ? 'Interna'
                        : 'Paziente'}
                    </span>

                    {delivery.patient && (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {delivery.patient.first_name}{' '}
                        {delivery.patient.last_name}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-3 text-lg font-semibold text-slate-900">
                    {delivery.title}
                  </h3>
                </div>

                <p className="shrink-0 text-xs text-slate-400">
                  {formatDate(delivery.created_at)}
                </p>
              </div>

              <div className="mt-5 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {delivery.content}
              </div>

              {delivery.author && (
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <p className="text-xs text-slate-400">
                    Inserita da
                  </p>

                  <Link
                    to={`/profilo/${delivery.author.id}`}
                    className="mt-1 block text-sm font-medium text-slate-700 transition hover:text-slate-500"
                  >
                    {delivery.author.first_name}{' '}
                    {delivery.author.last_name}
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">
                  Nuova consegna
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Crea una nuova comunicazione.
                </p>
              </div>

              <button
                onClick={closeModal}
                disabled={saving}
                className="text-xl text-slate-400 transition hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Tipo
                </label>

                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setType('internal')
                      setPatientId('')
                    }}
                    className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                      type === 'internal'
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    Interna
                  </button>

                  <button
                    type="button"
                    onClick={() => setType('patient')}
                    className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                      type === 'patient'
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    Paziente
                  </button>
                </div>
              </div>

              {type === 'patient' && (
                <div>
                  <label
                    htmlFor="patient"
                    className="text-sm font-medium text-slate-700"
                  >
                    Paziente
                  </label>

                  <select
                    id="patient"
                    value={patientId}
                    onChange={(event) =>
                      setPatientId(event.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  >
                    <option value="">
                      Seleziona un paziente
                    </option>

                    {patients.map((patient) => (
                      <option
                        key={patient.id}
                        value={patient.id}
                      >
                        {patient.first_name}{' '}
                        {patient.last_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label
                  htmlFor="title"
                  className="text-sm font-medium text-slate-700"
                >
                  Titolo
                </label>

                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  placeholder="Titolo della consegna"
                />
              </div>

              <div>
                <label
                  htmlFor="content"
                  className="text-sm font-medium text-slate-700"
                >
                  Contenuto
                </label>

                <textarea
                  id="content"
                  value={content}
                  onChange={(event) =>
                    setContent(event.target.value)
                  }
                  rows={5}
                  className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  placeholder="Scrivi il contenuto della consegna..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Annulla
              </button>

              <button
                type="button"
                onClick={handleCreateDelivery}
                disabled={saving}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Salvataggio...' : 'Crea consegna'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}