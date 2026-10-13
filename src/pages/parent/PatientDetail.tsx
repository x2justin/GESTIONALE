import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

type Patient = {
  id: string
  first_name: string
  last_name: string | null
  is_active: boolean | null
  created_at: string | null
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
  document_type: string | null
  document_number: string | null
  document_issue_date: string | null
  document_expiry_date: string | null
  document_issuing_authority: string | null
  notes: string | null
}

type Delivery = {
  id: string
  title: string
  content: string
  type: string
  created_at: string
  updated_at: string
}

type Therapy = {
  id: string
  medication_name: string
  dose: string
  start_date: string
  end_date: string | null
  frequency_type: string
  frequency_value: number | null
  scheduled_times: string[]
  weekdays: number[] | null
  notes: string | null
  status: string
  ended_at: string | null
}

type MedicationEvent = {
  id: string
  therapy_id: string
  scheduled_at: string
  status: string
  administered_by: string | null
  administered_at: string | null
  notes: string | null
}

function formatDate(value: string | null) {
  if (!value) return '—'

  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleDateString('it-IT')
}

function formatDateTime(value: string | null) {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString('it-IT', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function formatFrequency(
  frequencyType: string,
  frequencyValue: number | null
) {
  if (frequencyType === 'daily') {
    return 'Giornaliera'
  }

  if (frequencyType === 'every_n_days') {
    if (frequencyValue === 1) {
      return 'Ogni giorno'
    }

    if (frequencyValue) {
      return `Ogni ${frequencyValue} giorni`
    }

    return 'Ogni N giorni'
  }

  return frequencyType
}

function formatEventStatus(status: string) {
  switch (status) {
    case 'completed':
      return 'Somministrata'
    case 'skipped':
      return 'Saltata'
    case 'scheduled':
      return 'Programmata'
    default:
      return status
  }
}

function formatTherapyStatus(status: string) {
  switch (status) {
    case 'active':
      return 'Attiva'
    case 'cancelled':
      return 'Annullata'
    default:
      return status
  }
}

function getEventStatusClasses(status: string) {
  switch (status) {
    case 'completed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'skipped':
      return 'bg-red-50 text-red-700 border-red-200'
    case 'scheduled':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200'
  }
}

function getTherapyStatusClasses(status: string) {
  switch (status) {
    case 'active':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'cancelled':
      return 'bg-red-50 text-red-700 border-red-200'
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200'
  }
}

function formatScheduledTimes(times: string[]) {
  if (!times || times.length === 0) {
    return '—'
  }

  return times
    .map((time) => time.slice(0, 5))
    .join(', ')
}

function getTherapyName(
  therapyId: string,
  therapies: Therapy[]
) {
  const therapy = therapies.find(
    (item) => item.id === therapyId
  )

  if (!therapy) {
    return 'Terapia non disponibile'
  }

  return `${therapy.medication_name} — ${therapy.dose}`
}

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>()

  const [patient, setPatient] = useState<Patient | null>(null)
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [therapies, setTherapies] = useState<Therapy[]>([])
  const [medicationEvents, setMedicationEvents] = useState<
    MedicationEvent[]
  >([])

  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  async function loadPatientDetail() {
    if (!id) {
      setErrorMessage('Paziente non specificato.')
      setLoading(false)
      return
    }

    setLoading(true)
    setErrorMessage('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setErrorMessage('Sessione non valida.')
      setLoading(false)
      return
    }

    /*
     * Il caricamento del paziente è protetto dalla RLS.
     * Se il genitore non è associato al paziente,
     * Supabase non restituirà alcun record.
     */
    const { data: patientData, error: patientError } =
      await supabase
        .from('patients')
        .select(`
          id,
          first_name,
          last_name,
          is_active,
          created_at,
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
          document_type,
          document_number,
          document_issue_date,
          document_expiry_date,
          document_issuing_authority,
          notes
        `)
        .eq('id', id)
        .maybeSingle()

    if (patientError) {
      console.error(
        'Errore caricamento paziente:',
        patientError
      )

      setErrorMessage(
        'Impossibile caricare i dati del paziente.'
      )
      setLoading(false)
      return
    }

    if (!patientData) {
      setErrorMessage(
        'Paziente non trovato oppure non associato al tuo account.'
      )
      setLoading(false)
      return
    }

    const { data: deliveriesData, error: deliveriesError } =
      await supabase
        .from('deliveries')
        .select(
          'id, title, content, type, created_at, updated_at'
        )
        .eq('patient_id', id)
        .eq('type', 'patient')
        .order('created_at', { ascending: false })

    if (deliveriesError) {
      console.error(
        'Errore caricamento consegne:',
        deliveriesError
      )

      setErrorMessage(
        'Impossibile caricare le consegne del paziente.'
      )
      setLoading(false)
      return
    }

    const { data: therapiesData, error: therapiesError } =
      await supabase
        .from('therapies')
        .select(`
          id,
          medication_name,
          dose,
          start_date,
          end_date,
          frequency_type,
          frequency_value,
          scheduled_times,
          weekdays,
          notes,
          status,
          ended_at
        `)
        .eq('patient_id', id)
        .order('start_date', { ascending: false })

    if (therapiesError) {
      console.error(
        'Errore caricamento terapie:',
        therapiesError
      )

      setErrorMessage(
        'Impossibile caricare le terapie del paziente.'
      )
      setLoading(false)
      return
    }

    const therapyIds = (therapiesData ?? []).map(
      (therapy) => therapy.id
    )

    let eventsData: MedicationEvent[] = []

    if (therapyIds.length > 0) {
      const {
        data: medicationEventsData,
        error: medicationEventsError,
      } = await supabase
        .from('medication_events')
        .select(`
          id,
          therapy_id,
          scheduled_at,
          status,
          administered_by,
          administered_at,
          notes
        `)
        .in('therapy_id', therapyIds)
        .order('scheduled_at', { ascending: false })

      if (medicationEventsError) {
        console.error(
          'Errore caricamento somministrazioni:',
          medicationEventsError
        )

        setErrorMessage(
          'Impossibile caricare le somministrazioni del paziente.'
        )
        setLoading(false)
        return
      }

      eventsData = medicationEventsData ?? []
    }

    setPatient(patientData)
    setDeliveries(deliveriesData ?? [])
    setTherapies(therapiesData ?? [])
    setMedicationEvents(eventsData)
    setLoading(false)
  }

  useEffect(() => {
    loadPatientDetail()
  }, [id])

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-slate-500">
              Caricamento scheda paziente...
            </p>
          </div>
        </div>
      </main>
    )
  }

  if (errorMessage || !patient) {
    return (
      <main className="min-h-screen bg-slate-100">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            to="/parent"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            ← Torna all'Area Genitore
          </Link>

          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="text-sm font-medium text-red-700">
              {errorMessage || 'Paziente non trovato.'}
            </p>

            <button
              type="button"
              onClick={loadPatientDetail}
              className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Riprova
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/parent"
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          ← Torna all'Area Genitore
        </Link>

        <header className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-900 text-lg font-semibold text-white">
                {patient.first_name.charAt(0)}
                {patient.last_name?.charAt(0) ?? ''}
              </div>

              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                  {patient.first_name}{' '}
                  {patient.last_name ?? ''}
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  {patient.is_active
                    ? 'Paziente attivo'
                    : 'Paziente non attivo'}
                </p>
              </div>
            </div>
          </div>
        </header>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Dati del paziente
          </h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem
              label="Nome"
              value={patient.first_name}
            />

            <InfoItem
              label="Cognome"
              value={patient.last_name}
            />

            <InfoItem
              label="Data di nascita"
              value={formatDate(patient.date_of_birth)}
            />

            <InfoItem
              label="Luogo di nascita"
              value={patient.place_of_birth}
            />

            <InfoItem
              label="Sesso"
              value={patient.gender}
            />

            <InfoItem
              label="Cittadinanza"
              value={patient.citizenship}
            />

            <InfoItem
              label="Codice fiscale"
              value={patient.tax_code}
            />

            <InfoItem
              label="Telefono"
              value={patient.phone}
            />

            <InfoItem
              label="Email"
              value={patient.email}
            />

            <InfoItem
              label="Indirizzo"
              value={patient.residence_address}
            />

            <InfoItem
              label="Città"
              value={patient.residence_city}
            />

            <InfoItem
              label="CAP"
              value={patient.residence_cap}
            />

            <InfoItem
              label="Provincia"
              value={patient.residence_province}
            />

            <InfoItem
              label="Tipo documento"
              value={patient.document_type}
            />

            <InfoItem
              label="Numero documento"
              value={patient.document_number}
            />

            <InfoItem
              label="Data rilascio documento"
              value={formatDate(
                patient.document_issue_date
              )}
            />

            <InfoItem
              label="Scadenza documento"
              value={formatDate(
                patient.document_expiry_date
              )}
            />

            <InfoItem
              label="Autorità rilasciante"
              value={patient.document_issuing_authority}
            />
          </div>

          {patient.notes && (
            <div className="mt-6 border-t border-slate-100 pt-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Note
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                {patient.notes}
              </p>
            </div>
          )}
        </section>

        <section className="mt-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Consegne
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Comunicazioni relative a questo paziente.
            </p>
          </div>

          {deliveries.length === 0 ? (
            <EmptyState text="Nessuna consegna disponibile." />
          ) : (
            <div className="space-y-4">
              {deliveries.map((delivery) => (
                <article
                  key={delivery.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <h3 className="font-semibold text-slate-900">
                      {delivery.title}
                    </h3>

                    <span className="text-xs text-slate-400">
                      {formatDateTime(delivery.created_at)}
                    </span>
                  </div>

                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {delivery.content}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Terapie
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Terapie associate a questo paziente.
            </p>
          </div>

          {therapies.length === 0 ? (
            <EmptyState text="Nessuna terapia disponibile." />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {therapies.map((therapy) => (
                <article
                  key={therapy.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {therapy.medication_name}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Dose: {therapy.dose}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${getTherapyStatusClasses(
                        therapy.status
                      )}`}
                    >
                      {formatTherapyStatus(
                        therapy.status
                      )}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <InfoItem
                      label="Inizio"
                      value={formatDate(
                        therapy.start_date
                      )}
                    />

                    <InfoItem
                      label="Fine"
                      value={formatDate(
                        therapy.end_date
                      )}
                    />

                    <InfoItem
                      label="Frequenza"
                      value={formatFrequency(
                        therapy.frequency_type,
                        therapy.frequency_value
                      )}
                    />

                    <InfoItem
                      label="Orari"
                      value={formatScheduledTimes(
                        therapy.scheduled_times
                      )}
                    />
                  </div>

                  {therapy.notes && (
                    <div className="mt-5 border-t border-slate-100 pt-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Note
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                        {therapy.notes}
                      </p>
                    </div>
                  )}

                  {therapy.ended_at && (
                    <p className="mt-4 text-xs text-slate-400">
                      Terminata il{' '}
                      {formatDateTime(therapy.ended_at)}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Somministrazioni
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Stato delle somministrazioni delle terapie.
            </p>
          </div>

          {medicationEvents.length === 0 ? (
            <EmptyState text="Nessuna somministrazione disponibile." />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Terapia
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Programmata
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Stato
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Registrata
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Note
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">
                    {medicationEvents.map((event) => (
                      <tr key={event.id}>
                        <td className="px-5 py-4 text-sm font-medium text-slate-900">
                          {getTherapyName(
                            event.therapy_id,
                            therapies
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatDateTime(
                            event.scheduled_at
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getEventStatusClasses(
                              event.status
                            )}`}
                          >
                            {formatEventStatus(
                              event.status
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatDateTime(
                            event.administered_at
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {event.notes || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

function InfoItem({
  label,
  value,
}: {
  label: string
  value: string | null
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm text-slate-700">
        {value || '—'}
      </p>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  )
}