import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

type Patient = {
  id: string
  first_name: string
  last_name: string
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
  created_at: string
}

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [placeOfBirth, setPlaceOfBirth] = useState('')
  const [taxCode, setTaxCode] = useState('')
  const [gender, setGender] = useState('')
  const [citizenship, setCitizenship] = useState('')
  const [residenceAddress, setResidenceAddress] = useState('')
  const [residenceCity, setResidenceCity] = useState('')
  const [residenceCap, setResidenceCap] = useState('')
  const [residenceProvince, setResidenceProvince] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  async function loadPatients() {
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('patients')
      .select(`
        id,
        first_name,
        last_name,
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
        created_at
      `)
      .order('last_name', { ascending: true })

    if (error) {
      console.error('Errore caricamento pazienti:', error)
      setError('Impossibile caricare i pazienti.')
      setLoading(false)
      return
    }

    setPatients(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadPatients()
  }, [])

  function resetCreateForm() {
    setFirstName('')
    setLastName('')
    setDateOfBirth('')
    setPlaceOfBirth('')
    setTaxCode('')
    setGender('')
    setCitizenship('')
    setResidenceAddress('')
    setResidenceCity('')
    setResidenceCap('')
    setResidenceProvince('')
    setPhone('')
    setEmail('')
    setCreateError('')
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

  async function handleCreatePatient() {
    const cleanFirstName = firstName.trim()
    const cleanLastName = lastName.trim()
    const cleanPlaceOfBirth = placeOfBirth.trim()
    const cleanTaxCode = taxCode.trim().toUpperCase()

    if (
      !cleanFirstName ||
      !cleanLastName ||
      !dateOfBirth ||
      !cleanPlaceOfBirth ||
      !cleanTaxCode ||
      !gender
    ) {
      setCreateError(
        'Compila tutti i campi obbligatori.'
      )
      return
    }

    setCreating(true)
    setCreateError('')

    const { data, error } = await supabase
      .from('patients')
      .insert({
        first_name: cleanFirstName,
        last_name: cleanLastName,
        date_of_birth: dateOfBirth,
        place_of_birth: cleanPlaceOfBirth,
        tax_code: cleanTaxCode,
        gender,
        citizenship: citizenship.trim() || null,
        residence_address: residenceAddress.trim() || null,
        residence_city: residenceCity.trim() || null,
        residence_cap: residenceCap.trim() || null,
        residence_province:
          residenceProvince.trim().toUpperCase() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
      })
      .select(`
        id,
        first_name,
        last_name,
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
        created_at
      `)
      .single()

    if (error) {
      console.error('Errore creazione paziente:', error)
      setCreateError('Impossibile creare il paziente.')
      setCreating(false)
      return
    }

    if (data) {
      setPatients((currentPatients) =>
        [...currentPatients, data].sort((a, b) =>
          a.last_name.localeCompare(b.last_name)
        )
      )
    }

    setCreating(false)
    setShowCreateModal(false)
    resetCreateForm()
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Pazienti
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Gestisci i pazienti presenti nel gestionale.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          + Nuovo paziente
        </button>
      </div>

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">
            Caricamento pazienti...
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-red-700">
            {error}
          </p>
        </div>
      )}

      {!loading && !error && patients.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">
            Nessun paziente presente.
          </p>
        </div>
      )}

      {!loading && !error && patients.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {patients.map((patient) => (
            <Link
              key={patient.id}
              to={`/admin/pazienti/${patient.id}`}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-lg font-semibold text-slate-700">
                {patient.first_name.charAt(0)}
                {patient.last_name.charAt(0)}
              </div>

              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                {patient.first_name} {patient.last_name}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Paziente
              </p>
            </Link>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 px-4 py-8"
          onClick={closeCreateModal}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">
                  Nuovo paziente
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Inserisci i dati anagrafici del nuovo paziente.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCreateModal}
                disabled={creating}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Chiudi"
              >
                ×
              </button>
            </div>

            <div className="mt-6 space-y-6">
              <section>
                <h4 className="text-sm font-semibold text-slate-900">
                  Dati anagrafici
                </h4>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="first_name"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Nome *
                    </label>

                    <input
                      id="first_name"
                      type="text"
                      value={firstName}
                      onChange={(event) =>
                        setFirstName(event.target.value)
                      }
                      disabled={creating}
                      autoFocus
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="last_name"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Cognome *
                    </label>

                    <input
                      id="last_name"
                      type="text"
                      value={lastName}
                      onChange={(event) =>
                        setLastName(event.target.value)
                      }
                      disabled={creating}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="date_of_birth"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Data di nascita *
                    </label>

                    <input
                      id="date_of_birth"
                      type="date"
                      value={dateOfBirth}
                      onChange={(event) =>
                        setDateOfBirth(event.target.value)
                      }
                      disabled={creating}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="place_of_birth"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Luogo di nascita *
                    </label>

                    <input
                      id="place_of_birth"
                      type="text"
                      value={placeOfBirth}
                      onChange={(event) =>
                        setPlaceOfBirth(event.target.value)
                      }
                      disabled={creating}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="tax_code"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Codice fiscale *
                    </label>

                    <input
                      id="tax_code"
                      type="text"
                      value={taxCode}
                      onChange={(event) =>
                        setTaxCode(event.target.value.toUpperCase())
                      }
                      disabled={creating}
                      maxLength={16}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 uppercase text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="gender"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Sesso *
                    </label>

                    <select
                      id="gender"
                      value={gender}
                      onChange={(event) =>
                        setGender(event.target.value)
                      }
                      disabled={creating}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                    >
                      <option value="">
                        Seleziona
                      </option>
                      <option value="M">
                        Maschio
                      </option>
                      <option value="F">
                        Femmina
                      </option>
                      <option value="Altro">
                        Altro
                      </option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="citizenship"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Cittadinanza
                    </label>

                    <input
                      id="citizenship"
                      type="text"
                      value={citizenship}
                      onChange={(event) =>
                        setCitizenship(event.target.value)
                      }
                      disabled={creating}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                    />
                  </div>
                </div>
              </section>

              <section>
                <h4 className="text-sm font-semibold text-slate-900">
                  Residenza
                </h4>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="residence_address"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Indirizzo di residenza
                    </label>

                    <input
                      id="residence_address"
                      type="text"
                      value={residenceAddress}
                      onChange={(event) =>
                        setResidenceAddress(event.target.value)
                      }
                      disabled={creating}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="residence_city"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Comune
                    </label>

                    <input
                      id="residence_city"
                      type="text"
                      value={residenceCity}
                      onChange={(event) =>
                        setResidenceCity(event.target.value)
                      }
                      disabled={creating}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="residence_cap"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      CAP
                    </label>

                    <input
                      id="residence_cap"
                      type="text"
                      value={residenceCap}
                      onChange={(event) =>
                        setResidenceCap(event.target.value)
                      }
                      disabled={creating}
                      maxLength={5}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="residence_province"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Provincia
                    </label>

                    <input
                      id="residence_province"
                      type="text"
                      value={residenceProvince}
                      onChange={(event) =>
                        setResidenceProvince(event.target.value.toUpperCase())
                      }
                      disabled={creating}
                      maxLength={2}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 uppercase text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                    />
                  </div>
                </div>
              </section>

              <section>
                <h4 className="text-sm font-semibold text-slate-900">
                  Contatti
                </h4>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Telefono
                    </label>

                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(event) =>
                        setPhone(event.target.value)
                      }
                      disabled={creating}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Email
                    </label>

                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) =>
                        setEmail(event.target.value)
                      }
                      disabled={creating}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                    />
                  </div>
                </div>
              </section>

              {createError && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {createError}
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeCreateModal}
                disabled={creating}
                className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Annulla
              </button>

              <button
                type="button"
                onClick={handleCreatePatient}
                disabled={creating}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating ? 'Creazione...' : 'Crea paziente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}