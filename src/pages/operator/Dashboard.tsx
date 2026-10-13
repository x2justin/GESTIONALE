
export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">
          Bentornato
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Ecco una panoramica delle attività di oggi.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-500">
            Pazienti assegnati
          </p>

          <p className="mt-2 text-3xl font-semibold text-slate-900">
            —
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-500">
            Consegne
          </p>

          <p className="mt-2 text-3xl font-semibold text-slate-900">
            —
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-500">
            Somministrazioni oggi
          </p>

          <p className="mt-2 text-3xl font-semibold text-slate-900">
            —
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-500">
            Attività completate
          </p>

          <p className="mt-2 text-3xl font-semibold text-slate-900">
            —
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Attività di oggi
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Qui compariranno le attività previste per la giornata.
            </p>
          </div>

          <div className="mt-6 rounded-xl bg-slate-50 px-4 py-8 text-center">
            <p className="text-sm text-slate-500">
              Nessuna attività da mostrare.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              I tuoi pazienti
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Accesso rapido ai pazienti che ti sono stati assegnati.
            </p>
          </div>

          <div className="mt-6 rounded-xl bg-slate-50 px-4 py-8 text-center">
            <p className="text-sm text-slate-500">
              Nessun paziente da mostrare.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}