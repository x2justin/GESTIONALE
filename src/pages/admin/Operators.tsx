import { useEffect, useState } from 'react'
import {
  FunctionsHttpError,
  FunctionsRelayError,
  FunctionsFetchError,
} from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'

type Operator = {
  id: string
  first_name: string
  last_name: string
  is_active: boolean
  created_at: string
}

type FunctionErrorResponse = {
  error?: string | {
    message?: string
  }
}

export default function Operators() {
  const [operators, setOperators] = useState<Operator[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')

  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function loadOperators() {
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, is_active, created_at')
      .eq('role', 'operator')
      .order('last_name', { ascending: true })

    if (error) {
      console.error(error)
      setError('Impossibile caricare gli operatori.')
      setLoading(false)
      return
    }

    setOperators(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadOperators()
  }, [])

  async function getFunctionErrorMessage(
    functionError: unknown
  ): Promise<string> {
    if (functionError instanceof FunctionsHttpError) {
      try {
        const response =
          (await functionError.context.json()) as FunctionErrorResponse

        if (typeof response.error === 'string') {
          return response.error
        }

        if (
          response.error &&
          typeof response.error === 'object' &&
          typeof response.error.message === 'string'
        ) {
          return response.error.message
        }
      } catch (parseError) {
        console.error(
          'Impossibile leggere la risposta della Edge Function:',
          parseError
        )
      }

      return functionError.message
    }

    if (functionError instanceof FunctionsRelayError) {
      return `Errore di comunicazione con Supabase: ${functionError.message}`
    }

    if (functionError instanceof FunctionsFetchError) {
      return `Impossibile raggiungere la Edge Function: ${functionError.message}`
    }

    if (
      functionError &&
      typeof functionError === 'object' &&
      'message' in functionError &&
      typeof functionError.message === 'string'
    ) {
      return functionError.message
    }

    return 'Errore durante la comunicazione con la Edge Function.'
  }

  async function createOperator(e: React.FormEvent) {
    e.preventDefault()

    setError('')

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim()
    ) {
      setError('Compila tutti i campi.')
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
          role: 'operator',
        },
      }
    )

    if (error) {
      console.error('CREATE-USER ERROR:', error)

      const errorMessage =
        await getFunctionErrorMessage(error)

      setError(`Errore: ${errorMessage}`)
      setCreating(false)
      return
    }

    if (!data?.success) {
      setError(
        data?.error ??
          'Impossibile creare l’operatore.'
      )
      setCreating(false)
      return
    }

    setFirstName('')
    setLastName('')
    setEmail('')
    setShowForm(false)
    setCreating(false)

    await loadOperators()
  }

  async function deleteOperator(operator: Operator) {
    const confirmed = window.confirm(
      `Sei sicuro di voler eliminare ${operator.first_name} ${operator.last_name}?\n\nL'operatore perderà l'accesso al gestionale e le sue associazioni ai pazienti verranno rimosse. Lo storico delle consegne rimarrà conservato.`
    )

    if (!confirmed) {
      return
    }

    setError('')
    setDeletingId(operator.id)

    const { data, error } =
      await supabase.functions.invoke(
        'delete-user',
        {
          body: {
            user_id: operator.id,
          },
        }
      )

    if (error) {
      console.error(
        'DELETE-USER ERROR:',
        error
      )

      const errorMessage =
        await getFunctionErrorMessage(error)

      setError(
        `Errore durante l'eliminazione: ${errorMessage}`
      )

      setDeletingId(null)
      return
    }

    if (!data?.success) {
      setError(
        data?.error ??
          'Impossibile eliminare l’operatore.'
      )
      setDeletingId(null)
      return
    }

    setOperators((current) =>
      current.filter(
        (item) => item.id !== operator.id
      )
    )

    setDeletingId(null)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Operatori
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Gestisci gli operatori che possono
            utilizzare il gestionale.
          </p>
        </div>

        <button
          onClick={() => {
            setShowForm(true)
            setError('')
          }}
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          + Nuovo operatore
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Caricamento operatori...
        </div>
      ) : operators.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="font-medium text-slate-900">
            Nessun operatore presente
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Crea il primo operatore utilizzando il
            pulsante in alto.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="divide-y divide-slate-100">
            {operators.map((operator) => (
              <div
                key={operator.id}
                className="flex items-center justify-between gap-4 px-6 py-5"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-700">
                    {operator.first_name?.[0]}
                    {operator.last_name?.[0]}
                  </div>

                  <div>
                    <p className="font-semibold text-slate-900">
                      {operator.first_name}{' '}
                      {operator.last_name}
                    </p>

                    <p className="text-sm text-slate-500">
                      Operatore
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      operator.is_active
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {operator.is_active
                      ? 'Attivo'
                      : 'Disattivo'}
                  </span>

                  <button
                    onClick={() =>
                      deleteOperator(operator)
                    }
                    disabled={
                      deletingId === operator.id
                    }
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingId === operator.id
                      ? 'Eliminazione...'
                      : 'Elimina'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">
                  Nuovo operatore
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Inserisci i dati dell'operatore.
                </p>
              </div>

              <button
                onClick={() => setShowForm(false)}
                className="text-2xl leading-none text-slate-400 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={createOperator}
              className="mt-6 space-y-4"
            >
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nome
                </label>

                <input
                  type="text"
                  value={firstName}
                  onChange={(e) =>
                    setFirstName(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                  placeholder="Mario"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Cognome
                </label>

                <input
                  type="text"
                  value={lastName}
                  onChange={(e) =>
                    setLastName(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                  placeholder="Rossi"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                  placeholder="mario.rossi@example.com"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Annulla
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating
                    ? 'Creazione...'
                    : 'Crea operatore'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}