
import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function OperatorLayout() {
  const { profile } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  function handleProfile() {
    setMenuOpen(false)
    navigate('/profilo')
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false)
      }
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      )
    }
  }, [menuOpen])

  const pageInfo = (() => {
    if (location.pathname === '/operator') {
      return {
        title: 'Dashboard',
        description: 'Panoramica delle attività',
      }
    }

    if (location.pathname === '/operator/pazienti') {
      return {
        title: 'Pazienti',
        description: 'Pazienti a te assegnati',
      }
    }

    if (location.pathname === '/operator/consegne') {
      return {
        title: 'Consegne',
        description: 'Gestione delle consegne',
      }
    }

    if (location.pathname === '/operator/somministrazioni') {
      return {
        title: 'Somministrazioni',
        description: 'Terapie e somministrazioni',
      }
    }

    return {
      title: 'Gestionale',
      description: 'Area operatore',
    }
  })()

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
          <div className="flex h-20 items-center border-b border-slate-200 px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
                G
              </div>

              <div>
                <p className="font-semibold text-slate-900">
                  Gestionale
                </p>

                <p className="text-xs text-slate-500">
                  Area operatore
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            <a
              href="/operator"
              className="flex items-center rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              Dashboard
            </a>

            <a
              href="/operator/pazienti"
              className="flex items-center rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              Pazienti
            </a>

            <a
              href="/operator/consegne"
              className="flex items-center rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              Consegne
            </a>

            <a
              href="/operator/somministrazioni"
              className="flex items-center rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              Somministrazioni
            </a>
          </nav>

          <div className="border-t border-slate-200 p-4">
            <div className="mb-3 rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-sm font-medium text-slate-900">
                {profile?.first_name} {profile?.last_name}
              </p>

              <p className="text-xs text-slate-500">
                Operatore
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              Esci
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="relative flex min-h-20 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">
                {pageInfo.title}
              </h1>

              <p className="text-sm text-slate-500">
                {pageInfo.description}
              </p>
            </div>

            <button type="button" onClick={() => setMobileMenuOpen((open) => !open)} aria-label="Apri menu di navigazione" aria-expanded={mobileMenuOpen} className="rounded-xl border border-slate-200 px-3 py-2 text-sm lg:hidden">{mobileMenuOpen ? "Chiudi" : "Menu"}</button>
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-label="Apri menu profilo"
                aria-expanded={menuOpen}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {profile?.first_name?.charAt(0).toUpperCase()}
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-12 z-50 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {profile?.first_name} {profile?.last_name}
                    </p>

                    <p className="text-xs text-slate-500">
                      Operatore
                    </p>
                  </div>

                  <div className="p-1.5">
                    <button
                      type="button"
                      onClick={handleProfile}
                      className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      Profilo
                    </button>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      Esci
                    </button>
                  </div>
                </div>
              )}
            </div>
          </header>

          <main className="flex-1 p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}