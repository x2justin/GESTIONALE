
import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function AdminLayout() {
  const { profile } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const menuRef = useRef<HTMLDivElement>(null)

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  function handleProfile() {
    setMenuOpen(false)
    navigate('/profilo')
  }

  function handleMobileNavigation(path: string) {
    setMobileMenuOpen(false)
    navigate(path)
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

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  const pageInfo = (() => {
    if (location.pathname === '/admin/jarvis') {
      return { title: 'JARVIS', description: 'Control plane personale e dispositivi locali' }
    }

    if (location.pathname === '/admin') {
      return {
        title: 'Dashboard',
        description: 'Panoramica del gestionale',
      }
    }

    if (location.pathname === '/admin/pazienti') {
      return {
        title: 'Pazienti',
        description: 'Gestione dei pazienti',
      }
    }

    if (location.pathname.startsWith('/admin/pazienti/')) {
      return {
        title: 'Paziente',
        description: 'Informazioni e gestione del paziente',
      }
    }

    if (location.pathname === '/admin/operatori') {
      return {
        title: 'Operatori',
        description: 'Gestione degli operatori',
      }
    }

    if (location.pathname === '/admin/genitori') {
      return {
        title: 'Genitori',
        description: 'Gestione dei genitori',
      }
    }

    if (location.pathname === '/admin/consegne') {
      return {
        title: 'Consegne',
        description: 'Gestione delle consegne',
      }
    }

    if (location.pathname === '/admin/somministrazioni') {
      return {
        title: 'Somministrazioni',
        description: 'Gestione delle somministrazioni',
      }
    }

    return {
      title: 'Gestionale',
      description: 'Amministrazione',
    }
  })()

  const navigationItems = [
    { label: 'JARVIS', path: '/admin/jarvis' },
    {
      label: 'Dashboard',
      path: '/admin',
    },
    {
      label: 'Pazienti',
      path: '/admin/pazienti',
    },
    {
      label: 'Operatori',
      path: '/admin/operatori',
    },
    {
      label: 'Genitori',
      path: '/admin/genitori',
    },
    {
      label: 'Consegne',
      path: '/admin/consegne',
    },
    {
      label: 'Somministrazioni',
      path: '/admin/somministrazioni',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        {/* Sidebar desktop */}
        <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
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
                  Amministrazione
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {navigationItems.map((item) => {
              const isActive =
                item.path === '/admin'
                  ? location.pathname === '/admin'
                  : location.pathname.startsWith(item.path)

              return (
                <a
                  key={item.path}
                  href={item.path}
                  className={`flex items-center rounded-xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </a>
              )
            })}
          </nav>

          <div className="border-t border-slate-200 p-4">
            <div className="mb-3 rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-sm font-medium text-slate-900">
                {profile?.first_name} {profile?.last_name}
              </p>

              <p className="text-xs text-slate-500">
                Amministratore
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

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="relative flex min-h-20 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-slate-900 sm:text-xl">
                {pageInfo.title}
              </h1>

              <p className="truncate text-sm text-slate-500">
                {pageInfo.description}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              {/* Mobile menu button */}
              <button
                type="button"
                onClick={() =>
                  setMobileMenuOpen((open) => !open)
                }
                aria-label="Apri menu di navigazione"
                aria-expanded={mobileMenuOpen}
                className="flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 lg:hidden"
              >
                <span className="mr-2">
                  {mobileMenuOpen ? '×' : '☰'}
                </span>

                <span className="hidden xs:inline">
                  Menu
                </span>
              </button>

              {/* Profile menu */}
              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  aria-label="Apri menu profilo"
                  aria-expanded={menuOpen}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  {profile?.first_name
                    ?.charAt(0)
                    .toUpperCase()}
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-12 z-50 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {profile?.first_name}{' '}
                        {profile?.last_name}
                      </p>

                      <p className="text-xs text-slate-500">
                        Amministratore
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
            </div>

            {/* Mobile navigation */}
            {mobileMenuOpen && (
              <div className="absolute left-4 right-4 top-[calc(100%-1px)] z-40 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg sm:left-6 sm:right-6 lg:hidden">
                {navigationItems.map((item) => {
                  const isActive =
                    item.path === '/admin'
                      ? location.pathname === '/admin'
                      : location.pathname.startsWith(item.path)

                  return (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() =>
                        handleMobileNavigation(item.path)
                      }
                      className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                        isActive
                          ? 'bg-slate-100 text-slate-900'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      {item.label}
                    </button>
                  )
                })}
              </div>
            )}
          </header>

          <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}