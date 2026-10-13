import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

type Patient = {
  id: string
  first_name: string
  last_name: string
}

type Scheduler = {
  id: string
  first_name: string
  last_name: string
}

type Administrator = {
  id: string
  first_name: string
  last_name: string
}

type Therapy = {
  id: string
  patient_id: string
  medication_name: string
  dose: string
  start_date: string
  end_date: string | null
  frequency_type: 'once' | 'daily' | 'weekly' | 'every_n_days'
  frequency_value: number | null
  scheduled_times: string[]
  weekdays: number[] | null
  notes: string | null
  scheduled_by: Scheduler | null
  created_at: string
  status: 'active' | 'ended' | 'cancelled'
  patient: Patient | null
}

type MedicationEvent = {
  id: string
  therapy_id: string
  scheduled_at: string
  status: 'scheduled' | 'completed' | 'skipped'
  administered_by: string | null
  administered_at: string | null
  notes: string | null
  created_at: string
  administrator: Administrator | null
}

const weekdaysOptions = [
  { value: 1, label: 'Lunedì' },
  { value: 2, label: 'Martedì' },
  { value: 3, label: 'Mercoledì' },
  { value: 4, label: 'Giovedì' },
  { value: 5, label: 'Venerdì' },
  { value: 6, label: 'Sabato' },
  { value: 7, label: 'Domenica' },
]

export default function MedicationAdministration() {
  const [therapies, setTherapies] = useState<Therapy[]>([])
  const [events, setEvents] = useState<MedicationEvent[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [updatingEventId, setUpdatingEventId] = useState<string | null>(
    null
  )

  const [expandedTherapyId, setExpandedTherapyId] = useState<string | null>(
    null
  )

  async function loadData() {
    setLoading(true)
    setError('')

    const [therapiesResult, eventsResult] =
      await Promise.all([
        supabase
          .from('therapies')
          .select(`
            id,
            patient_id,
            medication_name,
            dose,
            start_date,
            end_date,
            frequency_type,
            frequency_value,
            scheduled_times,
            weekdays,
            notes,
            created_at,
            status,
            patients (
              id,
              first_name,
              last_name
            ),
            profiles!therapies_scheduled_by_fkey (
              id,
              first_name,
              last_name
            )
          `)
          .order('start_date', { ascending: true }),

        supabase
          .from('medication_events')
          .select(`
            id,
            therapy_id,
            scheduled_at,
            status,
            administered_by,
            administered_at,
            notes,
            created_at,
            profiles!medication_events_administered_by_fkey (
              id,
              first_name,
              last_name
            )
          `)
          .order('scheduled_at', { ascending: true }),
      ])

    if (therapiesResult.error) {
      console.error(
        'Errore caricamento terapie operatore:',
        therapiesResult.error
      )

      setError('Impossibile caricare le terapie.')
      setLoading(false)
      return
    }

    if (eventsResult.error) {
      console.error(
        'Errore caricamento somministrazioni operatore:',
        eventsResult.error
      )

      setError('Impossibile caricare le somministrazioni.')
      setLoading(false)
      return
    }

    const formattedTherapies: Therapy[] = (
      therapiesResult.data ?? []
    ).map((therapy) => {
      const patient = Array.isArray(therapy.patients)
        ? therapy.patients[0]
        : therapy.patients

      const scheduler = Array.isArray(therapy.profiles)
        ? therapy.profiles[0]
        : therapy.profiles

      return {
        id: therapy.id,
        patient_id: therapy.patient_id,
        medication_name: therapy.medication_name,
        dose: therapy.dose,
        start_date: therapy.start_date,
        end_date: therapy.end_date,
        frequency_type:
          therapy.frequency_type as Therapy['frequency_type'],
        frequency_value: therapy.frequency_value,
        scheduled_times: therapy.scheduled_times ?? [],
        weekdays: therapy.weekdays ?? null,
        notes: therapy.notes,
        created_at: therapy.created_at,
        status: therapy.status as Therapy['status'],
        patient: patient
          ? {
              id: patient.id,
              first_name: patient.first_name,
              last_name: patient.last_name,
            }
          : null,
        scheduled_by: scheduler
          ? {
              id: scheduler.id,
              first_name: scheduler.first_name,
              last_name: scheduler.last_name,
            }
          : null,
      }
    })

    const formattedEvents: MedicationEvent[] = (
      eventsResult.data ?? []
    ).map((event) => {
      const administrator = Array.isArray(event.profiles)
        ? event.profiles[0]
        : event.profiles

      return {
        id: event.id,
        therapy_id: event.therapy_id,
        scheduled_at: event.scheduled_at,
        status: event.status as MedicationEvent['status'],
        administered_by: event.administered_by,
        administered_at: event.administered_at,
        notes: event.notes,
        created_at: event.created_at,
        administrator: administrator
          ? {
              id: administrator.id,
              first_name: administrator.first_name,
              last_name: administrator.last_name,
            }
          : null,
      }
    })

    setTherapies(formattedTherapies)
    setEvents(formattedEvents)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleEventStatusChange(
    event: MedicationEvent,
    nextStatus: 'completed' | 'skipped'
  ) {
    if (event.status !== 'scheduled') {
      return
    }

    const confirmed = window.confirm(
      nextStatus === 'completed'
        ? 'Confermi che questa somministrazione è stata effettuata?'
        : 'Confermi che questa somministrazione è stata saltata?'
    )

    if (!confirmed) {
      return
    }

    setUpdatingEventId(event.id)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      alert('Sessione non valida.')
      setUpdatingEventId(null)
      return
    }

    const updatePayload =
      nextStatus === 'completed'
        ? {
            status: 'completed' as const,
            administered_by: user.id,
            administered_at: new Date().toISOString(),
          }
        : {
            status: 'skipped' as const,
            administered_by: user.id,
            administered_at: null,
          }

    const { data: updatedEvent, error } = await supabase
      .from('medication_events')
      .update(updatePayload)
      .eq('id', event.id)
      .eq('status', 'scheduled')
      .select(`
        id,
        therapy_id,
        scheduled_at,
        status,
        administered_by,
        administered_at,
        notes,
        created_at,
        profiles!medication_events_administered_by_fkey (
          id,
          first_name,
          last_name
        )
      `)
      .single()

    if (error) {
      console.error(
        'Errore aggiornamento somministrazione operatore:',
        error
      )

      alert('Impossibile aggiornare la somministrazione.')
      setUpdatingEventId(null)
      return
    }

    if (!updatedEvent) {
      alert(
        'La somministrazione non è stata aggiornata. Potrebbe essere già stata modificata.'
      )

      setUpdatingEventId(null)
      await loadData()
      return
    }

    const updatedAdministrator = Array.isArray(
      updatedEvent.profiles
    )
      ? updatedEvent.profiles[0]
      : updatedEvent.profiles

    const formattedUpdatedEvent: MedicationEvent = {
      id: updatedEvent.id,
      therapy_id: updatedEvent.therapy_id,
      scheduled_at: updatedEvent.scheduled_at,
      status: updatedEvent.status as MedicationEvent['status'],
      administered_by: updatedEvent.administered_by,
      administered_at: updatedEvent.administered_at,
      notes: updatedEvent.notes,
      created_at: updatedEvent.created_at,
      administrator: updatedAdministrator
        ? {
            id: updatedAdministrator.id,
            first_name: updatedAdministrator.first_name,
            last_name: updatedAdministrator.last_name,
          }
        : null,
    }

    setEvents((currentEvents) =>
      currentEvents.map((currentEvent) =>
        currentEvent.id === event.id
          ? formattedUpdatedEvent
          : currentEvent
      )
    )

    setUpdatingEventId(null)
  }

  function formatDate(dateString: string) {
    return new Intl.DateTimeFormat('it-IT', {
      dateStyle: 'medium',
    }).format(new Date(`${dateString}T00:00:00`))
  }

  function formatDateTime(dateString: string) {
    return new Intl.DateTimeFormat('it-IT', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateString))
  }

  function formatFrequency(therapy: Therapy) {
    switch (therapy.frequency_type) {
      case 'once':
        return 'Una volta'

      case 'daily':
        return 'Ogni giorno'

      case 'weekly':
        return 'Ogni settimana'

      case 'every_n_days':
        return `Ogni ${therapy.frequency_value} giorni`

      default:
        return therapy.frequency_type
    }
  }

  function formatWeekdays(days: number[] | null) {
    if (!days || days.length === 0) {
      return ''
    }

    return days
      .map(
        (day) =>
          weekdaysOptions.find(
            (option) => option.value === day
          )?.label
      )
      .filter(Boolean)
      .join(', ')
  }

  function formatTimes(times: string[]) {
    return times
      .map((time) => time.slice(0, 5))
      .join(', ')
  }

  function getTherapyEvents(therapyId: string) {
    return events.filter(
      (event) => event.therapy_id === therapyId
    )
  }

  function getEventStatusLabel(
    status: MedicationEvent['status']
  ) {
    switch (status) {
      case 'scheduled':
        return 'Programmata'

      case 'completed':
        return 'Somministrata'

      case 'skipped':
        return 'Saltata'

      default:
        return status
    }
  }

  function getEventStatusClass(
    status: MedicationEvent['status']
  ) {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-50 text-blue-700'

      case 'completed':
        return 'bg-emerald-50 text-emerald-700'

      case 'skipped':
        return 'bg-slate-100 text-slate-600'

      default:
        return 'bg-slate-100 text-slate-600'
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          Somministrazioni
        </h2>

        <p className="mt-2 text-slate-500">
          Terapie e somministrazioni dei tuoi pazienti.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-48 items-center justify-center p-6">
            <p className="text-sm text-slate-400">
              Caricamento terapie...
            </p>
          </div>
        ) : error ? (
          <div className="p-6">
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>

            <button
              type="button"
              onClick={loadData}
              className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Riprova
            </button>
          </div>
        ) : therapies.length === 0 ? (
          <div className="flex min-h-48 items-center justify-center p-6">
            <div className="text-center">
              <p className="font-medium text-slate-700">
                Nessuna terapia disponibile.
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Non risultano terapie associate ai tuoi pazienti.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {therapies.map((therapy) => {
              const therapyEvents = getTherapyEvents(therapy.id)

              const isExpanded =
                expandedTherapyId === therapy.id

              const scheduledEvents = therapyEvents.filter(
                (event) => event.status === 'scheduled'
              )

              return (
                <div
                  key={therapy.id}
                  className="p-5 sm:p-6"
                >
                  <div className="flex flex-col gap-5">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {therapy.patient && (
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                            {therapy.patient.last_name}{' '}
                            {therapy.patient.first_name}
                          </span>
                        )}

                        {therapy.status === 'active' ? (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                            Attiva
                          </span>
                        ) : therapy.status === 'cancelled' ? (
                          <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
                            Interrotta
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            Conclusa
                          </span>
                        )}
                      </div>

                      <h3 className="mt-3 text-lg font-semibold text-slate-900">
                        {therapy.medication_name}
                      </h3>

                      <p className="mt-1 text-sm font-medium text-slate-700">
                        Dose: {therapy.dose}
                      </p>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Inizio
                          </p>

                          <p className="mt-1 text-sm text-slate-700">
                            {formatDate(therapy.start_date)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Fine
                          </p>

                          <p className="mt-1 text-sm text-slate-700">
                            {therapy.end_date
                              ? formatDate(therapy.end_date)
                              : 'Nessuna'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Frequenza
                          </p>

                          <p className="mt-1 text-sm text-slate-700">
                            {formatFrequency(therapy)}
                          </p>

                          {therapy.frequency_type ===
                            'weekly' &&
                            therapy.weekdays && (
                              <p className="mt-1 text-xs text-slate-400">
                                {formatWeekdays(
                                  therapy.weekdays
                                )}
                              </p>
                            )}
                        </div>

                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Orari
                          </p>

                          <p className="mt-1 text-sm text-slate-700">
                            {formatTimes(
                              therapy.scheduled_times
                            )}
                          </p>
                        </div>
                      </div>

                      {therapy.notes && (
                        <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Note
                          </p>

                          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                            {therapy.notes}
                          </p>
                        </div>
                      )}

                      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-xs text-slate-400">
                          Programmato da:{' '}
                          {therapy.scheduled_by ? (
                            <Link
                              to={`/profilo/${therapy.scheduled_by.id}`}
                              className="font-medium text-slate-600 transition hover:text-slate-900 hover:underline"
                            >
                              {therapy.scheduled_by.first_name}{' '}
                              {therapy.scheduled_by.last_name}
                            </Link>
                          ) : (
                            'Utente non disponibile'
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedTherapyId(
                              isExpanded
                                ? null
                                : therapy.id
                            )
                          }
                          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          {isExpanded
                            ? 'Nascondi somministrazioni'
                            : `Vedi somministrazioni (${scheduledEvents.length})`}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <h4 className="font-semibold text-slate-900">
                                Somministrazioni
                              </h4>

                              <p className="mt-1 text-xs text-slate-400">
                                Gestisci lo stato delle
                                somministrazioni programmate.
                              </p>
                            </div>

                            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">
                              {therapyEvents.length} eventi
                            </span>
                          </div>

                          {therapyEvents.length === 0 ? (
                            <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center">
                              <p className="text-sm text-slate-500">
                                Nessuna somministrazione
                                programmata.
                              </p>
                            </div>
                          ) : (
                            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
                              <div className="divide-y divide-slate-100">
                                {therapyEvents.map((event) => (
                                  <div
                                    key={event.id}
                                    className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                                  >
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-slate-800">
                                        {formatDateTime(
                                          event.scheduled_at
                                        )}
                                      </p>

                                      {event.status ===
                                        'completed' &&
                                        event.administered_at && (
                                          <p className="mt-1 text-xs text-slate-400">
                                            Registrata:{' '}
                                            {formatDateTime(
                                              event.administered_at
                                            )}
                                          </p>
                                        )}

                                      {event.status !==
                                        'scheduled' &&
                                        event.administrator && (
                                          <p className="mt-1 text-xs text-slate-400">
                                            {event.status ===
                                            'completed'
                                              ? 'Somministrata da:'
                                              : 'Saltata da:'}{' '}
                                            <Link
                                              to={`/profilo/${event.administrator.id}`}
                                              className="font-medium text-slate-500 transition hover:text-slate-900 hover:underline"
                                            >
                                              {
                                                event
                                                  .administrator
                                                  .first_name
                                              }{' '}
                                              {
                                                event
                                                  .administrator
                                                  .last_name
                                              }
                                            </Link>
                                          </p>
                                        )}

                                      {event.notes && (
                                        <p className="mt-1 text-xs text-slate-400">
                                          {event.notes}
                                        </p>
                                      )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                      <span
                                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${getEventStatusClass(
                                          event.status
                                        )}`}
                                      >
                                        {getEventStatusLabel(
                                          event.status
                                        )}
                                      </span>

                                      {event.status ===
                                        'scheduled' && (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleEventStatusChange(
                                                event,
                                                'completed'
                                              )
                                            }
                                            disabled={
                                              updatingEventId ===
                                              event.id
                                            }
                                            className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                          >
                                            {updatingEventId ===
                                            event.id
                                              ? 'Salvataggio...'
                                              : 'Somministrata'}
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleEventStatusChange(
                                                event,
                                                'skipped'
                                              )
                                            }
                                            disabled={
                                              updatingEventId ===
                                              event.id
                                            }
                                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                          >
                                            Saltata
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}