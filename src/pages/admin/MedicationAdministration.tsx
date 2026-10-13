
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Patient = {
  id: string
  first_name: string
  last_name: string
}

type Scheduler = {
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
  const [patients, setPatients] = useState<Patient[]>([])
  const [events, setEvents] = useState<MedicationEvent[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [endingTherapyId, setEndingTherapyId] = useState<string | null>(null)
  const [updatingEventId, setUpdatingEventId] = useState<string | null>(null)
  const [expandedTherapyId, setExpandedTherapyId] = useState<string | null>(
    null
  )

  const [patientId, setPatientId] = useState('')
  const [medicationName, setMedicationName] = useState('')
  const [dose, setDose] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [frequencyType, setFrequencyType] =
    useState<Therapy['frequency_type']>('daily')

  const [frequencyValue, setFrequencyValue] = useState('')

  const [scheduledTimes, setScheduledTimes] = useState<string[]>([''])

  const [weekdays, setWeekdays] = useState<number[]>([])

  const [notes, setNotes] = useState('')

  async function loadData() {
    setLoading(true)
    setError('')

    const [therapiesResult, patientsResult, eventsResult] =
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
              first_name,
              last_name
            )
          `)
          .order('start_date', { ascending: true }),

        supabase
          .from('patients')
          .select('id, first_name, last_name')
          .eq('is_active', true)
          .order('last_name', { ascending: true }),

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
            created_at
          `)
          .order('scheduled_at', { ascending: true }),
      ])

    if (therapiesResult.error) {
      console.error(
        'Errore caricamento terapie:',
        therapiesResult.error
      )

      setError('Impossibile caricare le terapie.')
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

    if (eventsResult.error) {
      console.error(
        'Errore caricamento somministrazioni:',
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
              first_name: scheduler.first_name,
              last_name: scheduler.last_name,
            }
          : null,
      }
    })

    setTherapies(formattedTherapies)
    setPatients(patientsResult.data ?? [])
    setEvents((eventsResult.data ?? []) as MedicationEvent[])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  function resetCreateForm() {
    setPatientId('')
    setMedicationName('')
    setDose('')
    setStartDate('')
    setEndDate('')
    setFrequencyType('daily')
    setFrequencyValue('')
    setScheduledTimes([''])
    setWeekdays([])
    setNotes('')
  }

  function openCreateModal() {
    resetCreateForm()
    setShowCreateModal(true)
  }

  function closeCreateModal() {
    if (creating) return

    setShowCreateModal(false)
    resetCreateForm()
  }

  function addTime() {
    setScheduledTimes((currentTimes) => [
      ...currentTimes,
      '',
    ])
  }

  function removeTime(index: number) {
    setScheduledTimes((currentTimes) =>
      currentTimes.filter((_, currentIndex) => currentIndex !== index)
    )
  }

  function updateTime(index: number, value: string) {
    setScheduledTimes((currentTimes) =>
      currentTimes.map((time, currentIndex) =>
        currentIndex === index ? value : time
      )
    )
  }

  function toggleWeekday(day: number) {
    setWeekdays((currentDays) => {
      if (currentDays.includes(day)) {
        return currentDays.filter((item) => item !== day)
      }

      return [...currentDays, day].sort((a, b) => a - b)
    })
  }

  async function handleCreateTherapy() {
    if (!patientId) {
      alert('Seleziona un paziente.')
      return
    }

    if (!medicationName.trim()) {
      alert('Inserisci il nome del farmaco.')
      return
    }

    if (!dose.trim()) {
      alert('Inserisci la dose.')
      return
    }

    if (!startDate) {
      alert('Inserisci la data di inizio.')
      return
    }

    if (endDate && endDate < startDate) {
      alert(
        'La data di fine non può essere precedente alla data di inizio.'
      )
      return
    }

    const validTimes = scheduledTimes
      .map((time) => time.trim())
      .filter(Boolean)

    if (validTimes.length === 0) {
      alert('Inserisci almeno un orario.')
      return
    }

    if (
      frequencyType === 'weekly' &&
      weekdays.length === 0
    ) {
      alert('Seleziona almeno un giorno della settimana.')
      return
    }

    if (frequencyType === 'every_n_days') {
      const parsedValue = Number(frequencyValue)

      if (
        !frequencyValue ||
        !Number.isInteger(parsedValue) ||
        parsedValue <= 0
      ) {
        alert('Inserisci un numero di giorni valido.')
        return
      }
    }

    setCreating(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      alert('Sessione non valida.')
      setCreating(false)
      return
    }

    const { data: createdTherapy, error: createError } =
      await supabase
        .from('therapies')
        .insert({
          patient_id: patientId,
          medication_name: medicationName.trim(),
          dose: dose.trim(),
          start_date: startDate,
          end_date: endDate || null,
          frequency_type: frequencyType,
          frequency_value:
            frequencyType === 'every_n_days'
              ? Number(frequencyValue)
              : null,
          scheduled_times: validTimes,
          weekdays:
            frequencyType === 'weekly'
              ? weekdays
              : null,
          notes: notes.trim() || null,
          scheduled_by: user.id,
        })
        .select('id')
        .single()

    if (createError) {
      console.error(
        'Errore creazione terapia:',
        createError
      )

      alert('Impossibile creare la terapia.')
      setCreating(false)
      return
    }

    if (!createdTherapy) {
      console.error(
        'Terapia creata ma ID non disponibile.'
      )

      alert(
        'La terapia è stata creata, ma non è stato possibile recuperare il suo ID.'
      )
      setCreating(false)
      return
    }

    const { data: generatedCount, error: generationError } =
      await supabase.rpc(
        'generate_medication_events_for_therapy',
        {
          p_therapy_id: createdTherapy.id,
        }
      )

    if (generationError) {
      console.error(
        'Errore generazione eventi terapia:',
        generationError
      )

      alert(
        'La terapia è stata creata, ma non è stato possibile programmare le somministrazioni.'
      )

      setCreating(false)
      await loadData()
      return
    }

    console.log(
      'Eventi di somministrazione generati:',
      generatedCount
    )

    closeCreateModal()
    await loadData()

    setCreating(false)
  }

  async function handleEndTherapy(therapy: Therapy) {
    if (therapy.status !== 'active') {
      return
    }

    const confirmed = window.confirm(
      `Sei sicuro di voler interrompere la terapia "${therapy.medication_name}" per ${
        therapy.patient
          ? `${therapy.patient.first_name} ${therapy.patient.last_name}`
          : 'questo paziente'
      }?\n\nLa terapia non verrà eliminata e rimarrà nello storico.`
    )

    if (!confirmed) {
      return
    }

    setEndingTherapyId(therapy.id)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      alert('Sessione non valida.')
      setEndingTherapyId(null)
      return
    }

    const { error } = await supabase
      .from('therapies')
      .update({
        status: 'cancelled',
        ended_at: new Date().toISOString(),
        ended_by: user.id,
      })
      .eq('id', therapy.id)
      .eq('status', 'active')

    if (error) {
      console.error(
        'Errore interruzione terapia:',
        error
      )

      alert('Impossibile interrompere la terapia.')
      setEndingTherapyId(null)
      return
    }

    const { error: cancelEventsError } =
      await supabase.rpc(
        'cancel_future_medication_events',
        {
          p_therapy_id: therapy.id,
        }
      )

    if (cancelEventsError) {
      console.error(
        'Errore annullamento eventi futuri:',
        cancelEventsError
      )

      alert(
        'La terapia è stata interrotta, ma non è stato possibile aggiornare le somministrazioni future.'
      )

      await loadData()
      setEndingTherapyId(null)
      return
    }

    await loadData()
    setEndingTherapyId(null)
  }

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
            administered_by: null,
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
        created_at
      `)
      .single()

    if (error) {
      console.error(
        'Errore aggiornamento somministrazione:',
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

    setEvents((currentEvents) =>
      currentEvents.map((currentEvent) =>
        currentEvent.id === event.id
          ? (updatedEvent as MedicationEvent)
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Somministrazioni
          </h2>

          <p className="mt-2 text-slate-500">
            Gestione delle terapie e delle somministrazioni.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          + Nuova terapia
        </button>
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
          </div>
        ) : therapies.length === 0 ? (
          <div className="flex min-h-48 items-center justify-center p-6">
            <div className="text-center">
              <p className="font-medium text-slate-700">
                Nessuna terapia programmata.
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Crea la prima terapia per iniziare.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {therapies.map((therapy) => {
              const therapyEvents = getTherapyEvents(therapy.id)
              const isExpanded =
                expandedTherapyId === therapy.id

              return (
                <div
                  key={therapy.id}
                  className="p-5 sm:p-6"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
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
                          {therapy.scheduled_by
                            ? `${therapy.scheduled_by.first_name} ${therapy.scheduled_by.last_name}`
                            : 'Utente non disponibile'}
                        </div>

                        <div className="flex flex-wrap gap-2">
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
                              : `Vedi somministrazioni (${
                                  therapyEvents.filter(
                                    (event) => event.status === 'scheduled'
                                  ).length
                                })`}
                          </button>

                          {therapy.status === 'active' && (
                            <button
                              type="button"
                              onClick={() =>
                                handleEndTherapy(therapy)
                              }
                              disabled={
                                endingTherapyId ===
                                therapy.id
                              }
                              className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {endingTherapyId ===
                              therapy.id
                                ? 'Interruzione...'
                                : 'Interrompi terapia'}
                            </button>
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <h4 className="font-semibold text-slate-900">
                                Somministrazioni programmate
                              </h4>

                              <p className="mt-1 text-xs text-slate-400">
                                Gli eventi vengono generati
                                automaticamente dalla terapia.
                              </p>
                            </div>

                            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">
                              {therapyEvents.length}{' '}
                              eventi
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
                                {therapyEvents.map(
                                  (event) => (
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
                                  )
                                )}
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

      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 px-4 py-8"
          onClick={closeCreateModal}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Nuova terapia
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Programma una nuova terapia per un paziente.
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
              <div>
                <label
                  htmlFor="therapy-patient"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Paziente
                </label>

                <select
                  id="therapy-patient"
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

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="therapy-medication"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Farmaco
                  </label>

                  <input
                    id="therapy-medication"
                    type="text"
                    value={medicationName}
                    onChange={(event) =>
                      setMedicationName(event.target.value)
                    }
                    disabled={creating}
                    placeholder="Nome del farmaco"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="therapy-dose"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Dose
                  </label>

                  <input
                    id="therapy-dose"
                    type="text"
                    value={dose}
                    onChange={(event) =>
                      setDose(event.target.value)
                    }
                    disabled={creating}
                    placeholder="Es. 1 compressa"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="therapy-start-date"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Data di inizio
                  </label>

                  <input
                    id="therapy-start-date"
                    type="date"
                    value={startDate}
                    onChange={(event) =>
                      setStartDate(event.target.value)
                    }
                    disabled={creating}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="therapy-end-date"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Data di fine
                  </label>

                  <input
                    id="therapy-end-date"
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(event) =>
                      setEndDate(event.target.value)
                    }
                    disabled={creating}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 disabled:bg-slate-100"
                  />

                  <p className="mt-1 text-xs text-slate-400">
                    Lascia vuoto se non è prevista una data di fine.
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="therapy-frequency"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Frequenza
                </label>

                <select
                  id="therapy-frequency"
                  value={frequencyType}
                  onChange={(event) => {
                    const value =
                      event.target.value as Therapy['frequency_type']

                    setFrequencyType(value)

                    if (value !== 'weekly') {
                      setWeekdays([])
                    }

                    if (value !== 'every_n_days') {
                      setFrequencyValue('')
                    }
                  }}
                  disabled={creating}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 disabled:bg-slate-100"
                >
                  <option value="once">
                    Una volta
                  </option>

                  <option value="daily">
                    Ogni giorno
                  </option>

                  <option value="weekly">
                    Ogni settimana
                  </option>

                  <option value="every_n_days">
                    Ogni N giorni
                  </option>
                </select>
              </div>

              {frequencyType === 'weekly' && (
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700">
                    Giorni della settimana
                  </p>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {weekdaysOptions.map((day) => {
                      const selected = weekdays.includes(
                        day.value
                      )

                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() =>
                            toggleWeekday(day.value)
                          }
                          disabled={creating}
                          className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                            selected
                              ? 'border-slate-900 bg-slate-900 text-white'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {day.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {frequencyType === 'every_n_days' && (
                <div>
                  <label
                    htmlFor="therapy-frequency-value"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Ogni quanti giorni?
                  </label>

                  <input
                    id="therapy-frequency-value"
                    type="number"
                    min="1"
                    step="1"
                    value={frequencyValue}
                    onChange={(event) =>
                      setFrequencyValue(event.target.value)
                    }
                    disabled={creating}
                    placeholder="Es. 2"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 disabled:bg-slate-100"
                  />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between gap-4">
                  <label className="block text-sm font-medium text-slate-700">
                    Orari di somministrazione
                  </label>

                  <button
                    type="button"
                    onClick={addTime}
                    disabled={creating}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
                  >
                    + Aggiungi orario
                  </button>
                </div>

                <div className="mt-2 space-y-2">
                  {scheduledTimes.map((time, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="time"
                        value={time}
                        onChange={(event) =>
                          updateTime(
                            index,
                            event.target.value
                          )
                        }
                        disabled={creating}
                        className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 disabled:bg-slate-100"
                      />

                      {scheduledTimes.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            removeTime(index)
                          }
                          disabled={creating}
                          className="rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          Rimuovi
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="therapy-notes"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Note
                </label>

                <textarea
                  id="therapy-notes"
                  value={notes}
                  onChange={(event) =>
                    setNotes(event.target.value)
                  }
                  disabled={creating}
                  rows={4}
                  placeholder="Eventuali note sulla terapia..."
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
                onClick={handleCreateTherapy}
                disabled={creating}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating
                  ? 'Creazione...'
                  : 'Crea terapia'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}