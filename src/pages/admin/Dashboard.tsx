
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Stats = {
  patients: number | null
  operators: number | null
  parents: number | null
  deliveries: number | null
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    patients: null,
    operators: null,
    parents: null,
    deliveries: null,
  })

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      setLoading(true)

      const [
        patientsResult,
        operatorsResult,
        parentsResult,
        deliveriesResult,
      ] = await Promise.all([
        supabase
          .from('patients')
          .select('*', { count: 'exact', head: true }),

        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'operator')
          .eq('is_active', true),

        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'parent'),

        supabase
          .from('deliveries')
          .select('*', { count: 'exact', head: true }),
      ])

      setStats({
        patients: patientsResult.error
          ? null
          : patientsResult.count ?? 0,

        operators: operatorsResult.error
          ? null
          : operatorsResult.count ?? 0,

        parents: parentsResult.error
          ? null
          : parentsResult.count ?? 0,

        deliveries: deliveriesResult.error
          ? null
          : deliveriesResult.count ?? 0,
      })

      setLoading(false)
    }

    loadStats()
  }, [])

  const statsCards = [
    {
      label: 'Pazienti',
      value: loading
        ? '…'
        : stats.patients !== null
          ? stats.patients
          : '—',
      description: 'Pazienti presenti nel gestionale',
    },
    {
      label: 'Operatori',
      value: loading
        ? '…'
        : stats.operators !== null
          ? stats.operators
          : '—',
      description: 'Operatori attivi',
    },
    {
      label: 'Genitori',
      value: loading
        ? '…'
        : stats.parents !== null
          ? stats.parents
          : '—',
      description: 'Genitori presenti nel sistema',
    },
    {
      label: 'Consegne',
      value: loading
        ? '…'
        : stats.deliveries !== null
          ? stats.deliveries
          : '—',
      description: 'Consegne registrate',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Dashboard
        </h1>

        <p className="mt-2 text-slate-500">
          Panoramica generale del gestionale ANFAS.
        </p>
      </div>

      {/* Statistiche */}
      <section>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {statsCards.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <p className="text-sm font-medium text-slate-500">
                {stat.label}
              </p>

              <p className="mt-3 text-3xl font-bold text-slate-900">
                {stat.value}
              </p>

              <p className="mt-2 text-sm text-slate-400">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Sezioni principali */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Attività recenti */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Attività recenti
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Le ultime attività registrate nel gestionale.
            </p>
          </div>

          <div className="flex min-h-56 items-center justify-center px-6 py-8">
            <p className="text-sm text-slate-400">
              Nessuna attività recente.
            </p>
          </div>
        </div>

        {/* Accesso rapido */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Accesso rapido
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Gestisci rapidamente le principali sezioni.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-2">
            <a
              href="/admin/pazienti"
              className="rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <p className="font-semibold text-slate-900">
                Pazienti
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Gestisci pazienti e associazioni.
              </p>
            </a>

            <a
              href="/admin/operatori"
              className="rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <p className="font-semibold text-slate-900">
                Operatori
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Gestisci gli operatori del sistema.
              </p>
            </a>

            <a
              href="/admin/consegne"
              className="rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <p className="font-semibold text-slate-900">
                Consegne
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Visualizza e gestisci le consegne.
              </p>
            </a>

            <a
              href="/admin/somministrazioni"
              className="rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <p className="font-semibold text-slate-900">
                Somministrazioni
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Visualizza e gestisci le somministrazioni.
              </p>
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}