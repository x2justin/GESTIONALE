import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Device={id:string;name:string;platform:string;status:string;last_seen_at:string|null;bridge_version:string|null}
type PlannerEvent={id:string;title:string;starts_at:string;priority:string;status:string}
type Task={id:string;capability:string;state:string;policy_level:string;created_at:string}

export default function Jarvis() {
  const [devices,setDevices]=useState<Device[]>([])
  const [events,setEvents]=useState<PlannerEvent[]>([])
  const [tasks,setTasks]=useState<Task[]>([])
  const [loading,setLoading]=useState(true)
  const [pairing,setPairing]=useState<string|null>(null)
  const [pairingExpiry,setPairingExpiry]=useState<string|null>(null)
  const [error,setError]=useState<string|null>(null)

  async function load() {
    setLoading(true); setError(null)
    const [d,e,t]=await Promise.all([
      supabase.from('jarvis_devices').select('id,name,platform,status,last_seen_at,bridge_version').order('created_at',{ascending:false}),
      supabase.from('jarvis_planner_events').select('id,title,starts_at,priority,status').eq('status','scheduled').order('starts_at',{ascending:true}).limit(8),
      supabase.from('jarvis_tasks').select('id,capability,state,policy_level,created_at').in('state',['queued','leased','running']).order('created_at',{ascending:true}).limit(8),
    ])
    if(d.error||e.error||t.error){setError(d.error?.message||e.error?.message||t.error?.message||'Errore di caricamento')}
    setDevices(d.data??[]); setEvents(e.data??[]); setTasks(t.data??[]); setLoading(false)
  }

  useEffect(()=>{load()},[])

  async function createPairing() {
    setError(null); setPairing(null)
    const {data,error}=await supabase.functions.invoke('jarvis-create-pairing',{body:{}})
    if(error){setError(error.message);return}
    setPairing(data?.pairingToken??null); setPairingExpiry(data?.expiresAt??null)
  }

  async function copyPairing() {
    if(pairing) await navigator.clipboard.writeText(pairing)
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">JARVIS</h1>
            <p className="mt-2 text-slate-500">Control plane personale, planner e dispositivi locali.</p>
          </div>
          <button onClick={load} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Aggiorna</button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Collega questo PC</h2>
        <p className="mt-1 text-sm text-slate-500">Genera un codice monouso valido 10 minuti. Non viene salvato in chiaro nel database.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button onClick={createPairing} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Genera codice di pairing</button>
          {pairing && <button onClick={copyPairing} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Copia codice</button>}
        </div>
        {pairing && (
          <div className="mt-4 rounded-xl bg-slate-950 p-4">
            <p className="break-all font-mono text-xs text-white">{pairing}</p>
            <p className="mt-2 text-xs text-slate-400">Scade: {pairingExpiry ? new Date(pairingExpiry).toLocaleString('it-IT') : '—'}</p>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5"><h2 className="font-semibold text-slate-900">Dispositivi</h2></div>
          <div className="space-y-3 p-6">
            {!devices.length && !loading && <p className="text-sm text-slate-400">Nessun dispositivo collegato.</p>}
            {devices.map(d=><div key={d.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-3"><p className="font-semibold text-slate-900">{d.name}</p><span className="text-xs font-medium text-slate-500">{d.status}</span></div>
              <p className="mt-1 text-xs text-slate-500">{d.platform} · bridge {d.bridge_version??'—'}</p>
              <p className="mt-2 text-xs text-slate-400">{d.last_seen_at ? 'Ultimo contatto '+new Date(d.last_seen_at).toLocaleString('it-IT') : 'Mai visto'}</p>
            </div>)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5"><h2 className="font-semibold text-slate-900">Planner</h2></div>
          <div className="space-y-3 p-6">
            {!events.length && !loading && <p className="text-sm text-slate-400">Nessun impegno programmato.</p>}
            {events.map(e=><div key={e.id} className="rounded-xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-900">{e.title}</p>
              <p className="mt-1 text-xs text-slate-500">{new Date(e.starts_at).toLocaleString('it-IT')} · {e.priority}</p>
            </div>)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5"><h2 className="font-semibold text-slate-900">Coda</h2></div>
          <div className="space-y-3 p-6">
            {!tasks.length && !loading && <p className="text-sm text-slate-400">Coda vuota.</p>}
            {tasks.map(t=><div key={t.id} className="rounded-xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-900">{t.capability}</p>
              <p className="mt-1 text-xs text-slate-500">{t.state} · {t.policy_level}</p>
            </div>)}
          </div>
        </div>
      </section>
    </div>
  )
}
