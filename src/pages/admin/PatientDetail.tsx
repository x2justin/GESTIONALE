import { useEffect, useState, type ChangeEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
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
  document_type: string | null
  document_number: string | null
  document_issue_date: string | null
  document_expiry_date: string | null
  document_issuing_authority: string | null
  notes: string | null
  is_active: boolean
  created_at: string
}

type EditPatientForm = {
  first_name: string
  last_name: string
  date_of_birth: string
  place_of_birth: string
  tax_code: string
  gender: string
  citizenship: string
  residence_address: string
  residence_city: string
  residence_cap: string
  residence_province: string
  phone: string
  email: string
  document_type: string
  document_number: string
  document_issue_date: string
  document_expiry_date: string
  document_issuing_authority: string
  notes: string
}

type AccessUser = {
  user_id: string
  access_type: 'operator' | 'parent'
  first_name: string
  last_name: string
}

type Profile = {
  id: string
  first_name: string
  last_name: string
  role: 'admin' | 'operator' | 'parent'
  is_active: boolean
}

function displayValue(value: string | null) {
  return value?.trim() ? value : '—'
}

function formatDate(date: string | null) {
  if (!date) return '—'

  return new Date(`${date}T00:00:00`).toLocaleDateString('it-IT')
}

function formatGender(gender: string | null) {
  if (!gender) return '—'

  if (gender === 'M') return 'Maschio'
  if (gender === 'F') return 'Femmina'
  if (gender === 'Altro') return 'Altro'

  return gender
}

const emptyEditForm: EditPatientForm = {
  first_name: '',
  last_name: '',
  date_of_birth: '',
  place_of_birth: '',
  tax_code: '',
  gender: '',
  citizenship: '',
  residence_address: '',
  residence_city: '',
  residence_cap: '',
  residence_province: '',
  phone: '',
  email: '',
  document_type: '',
  document_number: '',
  document_issue_date: '',
  document_expiry_date: '',
  document_issuing_authority: '',
  notes: '',
}

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>()

  const [patient, setPatient] = useState<Patient | null>(null)
  const [accessUsers, setAccessUsers] = useState<AccessUser[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] =
    useState<EditPatientForm>(emptyEditForm)
  const [editError, setEditError] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  const [togglingStatus, setTogglingStatus] = useState(false)

  const [showAddModal, setShowAddModal] = useState(false)
  const [addType, setAddType] = useState<'operator' | 'parent'>('operator')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')

  const [removingUserId, setRemovingUserId] = useState<string | null>(null)
  const [patientDocuments, setPatientDocuments] = useState<Array<{ name: string; created_at?: string; metadata?: { size?: number } | null }>>([])
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<File | null>(null)
  const [documentBusy, setDocumentBusy] = useState(false)
  const [documentMessage, setDocumentMessage] = useState('')
  const [documentError, setDocumentError] = useState('')

  async function loadData() {
    if (!id) {
      setError('Paziente non trovato.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    const { data: patientData, error: patientError } = await supabase
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
        document_type,
        document_number,
        document_issue_date,
        document_expiry_date,
        document_issuing_authority,
        notes,
        is_active,
        created_at
      `)
      .eq('id', id)
      .single()

    if (patientError) {
      console.error('Errore caricamento paziente:', patientError)
      setError('Impossibile caricare il paziente.')
      setLoading(false)
      return
    }

    const { data: accessData, error: accessError } = await supabase
      .from('patient_access')
      .select(`
        user_id,
        access_type,
        profiles (
          first_name,
          last_name
        )
      `)
      .eq('patient_id', id)

    if (accessError) {
      console.error('Errore caricamento associazioni:', accessError)
      setError('Impossibile caricare le associazioni del paziente.')
      setLoading(false)
      return
    }

    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, role, is_active')
      .in('role', ['operator', 'parent'])
      .eq('is_active', true)
      .order('last_name', { ascending: true })

    if (profilesError) {
      console.error('Errore caricamento utenti:', profilesError)
      setError('Impossibile caricare gli utenti.')
      setLoading(false)
      return
    }

    const formattedAccessUsers: AccessUser[] = (accessData ?? [])
      .map((item) => {
        const profile = Array.isArray(item.profiles)
          ? item.profiles[0]
          : item.profiles

        if (!profile) {
          return null
        }

        return {
          user_id: item.user_id,
          access_type: item.access_type as 'operator' | 'parent',
          first_name: profile.first_name,
          last_name: profile.last_name,
        }
      })
      .filter((item): item is AccessUser => item !== null)

    setPatient(patientData)
    setAccessUsers(formattedAccessUsers)
    setProfiles(profilesData ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [id])

  useEffect(() => {
    loadPatientDocuments()
  }, [id])

  async function loadPatientDocuments() {
    if (!id) return
    setDocumentsLoading(true)
    const { data, error: listError } = await supabase.storage.from('patient-documents')
      .list(id, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } })
    if (listError) {
      setDocumentError('Impossibile caricare i documenti. Verifica i permessi e riprova.')
      setDocumentsLoading(false)
      return
    }
    setPatientDocuments((data ?? []).filter((item) => item.name && !item.name.endsWith('/')))
    setDocumentsLoading(false)
  }

  async function handleUploadDocument() {
    if (!id || !selectedDocument) return setDocumentError('Seleziona prima un documento.')
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(selectedDocument.type)) return setDocumentError('Formato non supportato. Usa PDF, JPG, PNG, DOC o DOCX.')
    if (selectedDocument.size > 10 * 1024 * 1024) return setDocumentError('Il file supera il limite di 10 MB.')
    const safeName = selectedDocument.name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').slice(-120)
    const objectName = `${crypto.randomUUID()}-${safeName || 'documento'}`
    setDocumentBusy(true); setDocumentError(''); setDocumentMessage('')
    const { error: uploadError } = await supabase.storage.from('patient-documents')
      .upload(`${id}/${objectName}`, selectedDocument, { upsert: false, contentType: selectedDocument.type })
    if (uploadError) {
      setDocumentError('Caricamento non riuscito. Verifica la connessione e i permessi.')
      setDocumentBusy(false); return
    }
    setSelectedDocument(null)
    const input = document.getElementById('patient-document-file') as HTMLInputElement | null
    if (input) input.value = ''
    setDocumentMessage('Documento caricato correttamente.')
    setDocumentBusy(false)
    await loadPatientDocuments()
  }

  async function handleDownloadDocument(fileName: string) {
    if (!id) return
    const { data, error: downloadError } = await supabase.storage.from('patient-documents')
      .createSignedUrl(`${id}/${fileName}`, 60)
    if (downloadError || !data?.signedUrl) {
      setDocumentError('Impossibile aprire il documento. Verifica i permessi e riprova.')
      return
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  async function handleDeleteDocument(fileName: string) {
    if (!id || !window.confirm('Vuoi eliminare definitivamente questo documento?')) return
    setDocumentBusy(true); setDocumentError('')
    const { error: deleteError } = await supabase.storage.from('patient-documents').remove([`${id}/${fileName}`])
    if (deleteError) {
      setDocumentError('Impossibile eliminare il documento.')
      setDocumentBusy(false); return
    }
    setDocumentMessage('Documento eliminato.')
    setDocumentBusy(false)
    await loadPatientDocuments()
  }



  const operators = accessUsers.filter(
    (user) => user.access_type === 'operator'
  )

  const parents = accessUsers.filter(
    (user) => user.access_type === 'parent'
  )

  const availableProfiles = profiles.filter(
    (profile) =>
      profile.role === addType &&
      !accessUsers.some(
        (accessUser) =>
          accessUser.user_id === profile.id &&
          accessUser.access_type === addType
      )
  )

  function openEditModal() {
    if (!patient) return

    setEditForm({
      first_name: patient.first_name ?? '',
      last_name: patient.last_name ?? '',
      date_of_birth: patient.date_of_birth ?? '',
      place_of_birth: patient.place_of_birth ?? '',
      tax_code: patient.tax_code ?? '',
      gender: patient.gender ?? '',
      citizenship: patient.citizenship ?? '',
      residence_address: patient.residence_address ?? '',
      residence_city: patient.residence_city ?? '',
      residence_cap: patient.residence_cap ?? '',
      residence_province: patient.residence_province ?? '',
      phone: patient.phone ?? '',
      email: patient.email ?? '',
      document_type: patient.document_type ?? '',
      document_number: patient.document_number ?? '',
      document_issue_date: patient.document_issue_date ?? '',
      document_expiry_date: patient.document_expiry_date ?? '',
      document_issuing_authority:
        patient.document_issuing_authority ?? '',
      notes: patient.notes ?? '',
    })

    setEditError('')
    setShowEditModal(true)
  }

  function closeEditModal() {
    if (savingEdit) return

    setShowEditModal(false)
    setEditError('')
  }

  function handleEditChange(
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = event.target

    setEditForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  async function handleSavePatient() {
    if (!id) {
      setEditError('Paziente non trovato.')
      return
    }

    const firstName = editForm.first_name.trim()
    const lastName = editForm.last_name.trim()
    const dateOfBirth = editForm.date_of_birth.trim()
    const placeOfBirth = editForm.place_of_birth.trim()
    const taxCode = editForm.tax_code.trim().toUpperCase()
    const gender = editForm.gender.trim()

    if (!firstName) {
      setEditError('Il nome è obbligatorio.')
      return
    }

    if (!lastName) {
      setEditError('Il cognome è obbligatorio.')
      return
    }

    if (!dateOfBirth) {
      setEditError('La data di nascita è obbligatoria.')
      return
    }

    if (!placeOfBirth) {
      setEditError('Il luogo di nascita è obbligatorio.')
      return
    }

    if (!taxCode) {
      setEditError('Il codice fiscale è obbligatorio.')
      return
    }

    if (!gender) {
      setEditError('Il sesso è obbligatorio.')
      return
    }

    if (taxCode.length !== 16) {
      setEditError(
        'Il codice fiscale deve contenere 16 caratteri.'
      )
      return
    }

    if (
      editForm.residence_cap.trim() &&
      !/^\d{5}$/.test(editForm.residence_cap.trim())
    ) {
      setEditError('Il CAP deve contenere 5 cifre.')
      return
    }

    if (
      editForm.residence_province.trim() &&
      editForm.residence_province.trim().length !== 2
    ) {
      setEditError(
        'La provincia deve contenere 2 caratteri.'
      )
      return
    }

    if (
      editForm.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email.trim())
    ) {
      setEditError('Inserisci un indirizzo email valido.')
      return
    }

    if (
      editForm.document_issue_date &&
      editForm.document_expiry_date &&
      editForm.document_expiry_date <
        editForm.document_issue_date
    ) {
      setEditError(
        'La data di scadenza del documento non può essere precedente alla data di rilascio.'
      )
      return
    }

    setSavingEdit(true)
    setEditError('')

    const { error: updateError } = await supabase
      .from('patients')
      .update({
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dateOfBirth,
        place_of_birth: placeOfBirth,
        tax_code: taxCode,
        gender,
        citizenship: editForm.citizenship.trim() || null,
        residence_address:
          editForm.residence_address.trim() || null,
        residence_city: editForm.residence_city.trim() || null,
        residence_cap: editForm.residence_cap.trim() || null,
        residence_province:
          editForm.residence_province.trim().toUpperCase() || null,
        phone: editForm.phone.trim() || null,
        email: editForm.email.trim() || null,
        document_type: editForm.document_type.trim() || null,
        document_number:
          editForm.document_number.trim() || null,
        document_issue_date:
          editForm.document_issue_date || null,
        document_expiry_date:
          editForm.document_expiry_date || null,
        document_issuing_authority:
          editForm.document_issuing_authority.trim() || null,
        notes: editForm.notes.trim() || null,
      })
      .eq('id', id)

    if (updateError) {
      console.error(
        'Errore modifica paziente:',
        updateError
      )

      setEditError(
        'Impossibile salvare le modifiche. Riprova.'
      )
      setSavingEdit(false)
      return
    }

    setShowEditModal(false)
    setEditError('')
    setSavingEdit(false)

    await loadData()
  }

  async function handleTogglePatientStatus() {
    if (!id || !patient) return

    const nextStatus = !patient.is_active

    const confirmed = window.confirm(
      nextStatus
        ? `Vuoi riattivare ${patient.first_name} ${patient.last_name}?`
        : `Vuoi disattivare ${patient.first_name} ${patient.last_name}?\n\nIl paziente non verrà eliminato e tutti i suoi dati rimarranno nello storico.`
    )

    if (!confirmed) return

    setTogglingStatus(true)

    const {
      data: updatedPatient,
      error: updateError,
    } = await supabase
      .from('patients')
      .update({
        is_active: nextStatus,
      })
      .eq('id', id)
      .select('id, is_active')
      .single()

    if (updateError) {
      console.error(
        'Errore aggiornamento stato paziente:',
        updateError
      )

      window.alert(
        'Impossibile aggiornare lo stato del paziente.'
      )

      setTogglingStatus(false)
      return
    }

    if (!updatedPatient) {
      console.error(
        'UPDATE eseguito ma nessun paziente aggiornato.'
      )

      window.alert(
        'Nessun paziente è stato aggiornato. Controlliamo i permessi del database.'
      )

      setTogglingStatus(false)
      return
    }

    setPatient((currentPatient) =>
      currentPatient
        ? {
            ...currentPatient,
            is_active: updatedPatient.is_active,
          }
        : currentPatient
    )

    setTogglingStatus(false)
  }

  function openAddModal(type: 'operator' | 'parent') {
    setAddType(type)
    setSelectedUserId('')
    setAddError('')
    setShowAddModal(true)
  }

  function closeAddModal() {
    if (adding) return

    setShowAddModal(false)
    setSelectedUserId('')
    setAddError('')
  }

  async function handleAddUser() {
    if (!id || !selectedUserId) {
      setAddError('Seleziona una persona.')
      return
    }

    setAdding(true)
    setAddError('')

    const { error } = await supabase
      .from('patient_access')
      .insert({
        user_id: selectedUserId,
        patient_id: id,
        access_type: addType,
      })

    if (error) {
      console.error('Errore associazione utente:', error)

      if (error.code === '23505') {
        setAddError('Questa persona è già associata al paziente.')
      } else {
        setAddError('Impossibile creare l’associazione.')
      }

      setAdding(false)
      return
    }

    setAdding(false)
    setShowAddModal(false)
    setSelectedUserId('')
    setAddError('')

    await loadData()
  }

  async function handleRemoveUser(
    userId: string,
    accessType: 'operator' | 'parent'
  ) {
    if (!id) return

    const confirmed = window.confirm(
      'Sei sicuro di voler rimuovere questa associazione?'
    )

    if (!confirmed) return

    setRemovingUserId(userId)

    const { error } = await supabase
      .from('patient_access')
      .delete()
      .eq('patient_id', id)
      .eq('user_id', userId)
      .eq('access_type', accessType)

    if (error) {
      console.error('Errore rimozione associazione:', error)
      window.alert('Impossibile rimuovere l’associazione.')
      setRemovingUserId(null)
      return
    }

    setAccessUsers((currentUsers) =>
      currentUsers.filter(
        (user) =>
          !(
            user.user_id === userId &&
            user.access_type === accessType
          )
      )
    )

    setRemovingUserId(null)
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">
          Caricamento paziente...
        </p>
      </div>
    )
  }

  if (error || !patient) {
    return (
      <div>
        <Link
          to="/admin/pazienti"
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          ← Torna ai pazienti
        </Link>

        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-red-700">
            {error || 'Paziente non trovato.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link
        to="/admin/pazienti"
        className="inline-flex text-sm font-medium text-slate-600 transition hover:text-slate-900"
      >
        ← Torna ai pazienti
      </Link>

      {/* INTESTAZIONE */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-2xl font-semibold text-slate-700">
              {patient.first_name.charAt(0)}
              {patient.last_name.charAt(0)}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-semibold text-slate-900">
                  {patient.first_name} {patient.last_name}
                </h2>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    patient.is_active
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {patient.is_active ? 'Attivo' : 'Non attivo'}
                </span>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Scheda completa del paziente
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={openEditModal}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Modifica paziente
            </button>

            <button
              type="button"
              onClick={handleTogglePatientStatus}
              disabled={togglingStatus}
              className={`rounded-xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                patient.is_active
                  ? 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                  : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              {togglingStatus
                ? 'Aggiornamento...'
                : patient.is_active
                  ? 'Disattiva paziente'
                  : 'Riattiva paziente'}
            </button>
          </div>
        </div>
      </div>

      {/* DATI ANAGRAFICI */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Dati anagrafici
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Informazioni anagrafiche registrate per il paziente.
          </p>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Nome
            </p>

            <p className="mt-1 text-sm font-medium text-slate-900">
              {displayValue(patient.first_name)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Cognome
            </p>

            <p className="mt-1 text-sm font-medium text-slate-900">
              {displayValue(patient.last_name)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Data di nascita
            </p>

            <p className="mt-1 text-sm font-medium text-slate-900">
              {formatDate(patient.date_of_birth)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Luogo di nascita
            </p>

            <p className="mt-1 text-sm font-medium text-slate-900">
              {displayValue(patient.place_of_birth)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Codice fiscale
            </p>

            <p className="mt-1 text-sm font-medium uppercase text-slate-900">
              {displayValue(patient.tax_code)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Sesso
            </p>

            <p className="mt-1 text-sm font-medium text-slate-900">
              {formatGender(patient.gender)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Cittadinanza
            </p>

            <p className="mt-1 text-sm font-medium text-slate-900">
              {displayValue(patient.citizenship)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Stato
            </p>

            <p className="mt-1 text-sm font-medium text-slate-900">
              {patient.is_active ? 'Attivo' : 'Non attivo'}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Inserito il
            </p>

            <p className="mt-1 text-sm font-medium text-slate-900">
              {formatDate(patient.created_at)}
            </p>
          </div>
        </div>
      </section>

      {/* RESIDENZA */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Residenza
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Informazioni relative alla residenza del paziente.
          </p>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Indirizzo
            </p>

            <p className="mt-1 text-sm font-medium text-slate-900">
              {displayValue(patient.residence_address)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Comune
            </p>

            <p className="mt-1 text-sm font-medium text-slate-900">
              {displayValue(patient.residence_city)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              CAP
            </p>

            <p className="mt-1 text-sm font-medium text-slate-900">
              {displayValue(patient.residence_cap)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Provincia
            </p>

            <p className="mt-1 text-sm font-medium text-slate-900">
              {displayValue(patient.residence_province)}
            </p>
          </div>
        </div>
      </section>

      {/* CONTATTI */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Contatti
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Recapiti del paziente o della famiglia.
          </p>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Telefono
            </p>

            <p className="mt-1 text-sm font-medium text-slate-900">
              {displayValue(patient.phone)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Email
            </p>

            <p className="mt-1 break-all text-sm font-medium text-slate-900">
              {displayValue(patient.email)}
            </p>
          </div>
        </div>
      </section>

      {/* DOCUMENTI */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Documento
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Informazioni relative al documento del paziente.
          </p>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Tipo documento
            </p>

            <p className="mt-1 text-sm font-medium text-slate-900">
              {displayValue(patient.document_type)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Numero documento
            </p>

            <p className="mt-1 text-sm font-medium text-slate-900">
              {displayValue(patient.document_number)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Ente / autorità di rilascio
            </p>

            <p className="mt-1 text-sm font-medium text-slate-900">
              {displayValue(patient.document_issuing_authority)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Data di rilascio
            </p>

            <p className="mt-1 text-sm font-medium text-slate-900">
              {formatDate(patient.document_issue_date)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Data di scadenza
            </p>

            <p className="mt-1 text-sm font-medium text-slate-900">
              {formatDate(patient.document_expiry_date)}
            </p>
          </div>
        </div>
      </section>

      {/* NOTE */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Note
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Annotazioni interne del paziente.
          </p>
        </div>

        <div className="mt-6 rounded-xl bg-slate-50 p-4">
          <p className="whitespace-pre-wrap text-sm text-slate-700">
            {displayValue(patient.notes)}
          </p>
        </div>
      </section>

      {/* DOCUMENTI ALLEGATI */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Documenti allegati</h3>
          <p className="mt-1 text-sm text-slate-500">File privati associati a questo paziente. Formati: PDF, JPG, PNG, DOC e DOCX; massimo 10 MB per file.</p>
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label htmlFor="patient-document-file" className="mb-2 block text-sm font-medium text-slate-700">Seleziona un documento</label>
            <input id="patient-document-file" type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" disabled={documentBusy} onChange={(event) => { setSelectedDocument(event.target.files?.[0] ?? null); setDocumentError(''); setDocumentMessage('') }} className="block w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium" />
          </div>
          <button type="button" onClick={handleUploadDocument} disabled={!selectedDocument || documentBusy} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">{documentBusy ? 'Attendere...' : 'Carica documento'}</button>
        </div>
        {documentError && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{documentError}</p>}
        {documentMessage && <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{documentMessage}</p>}
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-slate-900">File presenti</h4>
          {documentsLoading ? <p className="mt-3 text-sm text-slate-500">Caricamento documenti...</p> : patientDocuments.length === 0 ? <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Nessun documento caricato.</p> : <ul className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">
            {patientDocuments.map((file) => {
              const originalName = file.name.replace(/^[0-9a-f-]{36}-/i, '')
              const size = file.metadata?.size
              return <li key={file.name} className="flex min-w-0 flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0"><p className="break-all text-sm font-medium text-slate-800">{originalName}</p><p className="mt-1 text-xs text-slate-500">{size ? `${(size / (1024 * 1024)).toFixed(2)} MB · ` : ''}{file.created_at ? new Date(file.created_at).toLocaleDateString('it-IT') : ''}</p></div>
                <div className="flex shrink-0 gap-2"><button type="button" onClick={() => handleDownloadDocument(file.name)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Apri</button><button type="button" onClick={() => handleDeleteDocument(file.name)} disabled={documentBusy} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50">Elimina</button></div>
              </li>
            })}
          </ul>}
        </div>
      </section>

      {/* OPERATORI E FAMILIARI */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* OPERATORI */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-slate-900">
                Operatori
              </h3>

              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                {operators.length}
              </span>
            </div>

            <button
              type="button"
              onClick={() => openAddModal('operator')}
              className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
            >
              + Aggiungi
            </button>
          </div>

          {operators.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              Nessun operatore associato.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {operators.map((operator) => (
                <div
                  key={operator.user_id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div>
                    <Link
                      to={`/profilo/${operator.user_id}`}
                      className="text-sm font-medium text-slate-900 transition hover:text-slate-600"
                    >
                      {operator.first_name} {operator.last_name}
                    </Link>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Operatore
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleRemoveUser(operator.user_id, 'operator')
                    }
                    disabled={removingUserId === operator.user_id}
                    className="rounded-lg px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {removingUserId === operator.user_id
                      ? 'Rimozione...'
                      : 'Rimuovi'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FAMILIARI */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-slate-900">
                Familiari
              </h3>

              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                {parents.length}
              </span>
            </div>

            <button
              type="button"
              onClick={() => openAddModal('parent')}
              className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
            >
              + Aggiungi
            </button>
          </div>

          {parents.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              Nessun familiare associato.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {parents.map((parent) => (
                <div
                  key={parent.user_id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div>
                    <Link
                      to={`/profilo/${parent.user_id}`}
                      className="text-sm font-medium text-slate-900 transition hover:text-slate-600"
                    >
                      {parent.first_name} {parent.last_name}
                    </Link>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Familiare
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleRemoveUser(parent.user_id, 'parent')
                    }
                    disabled={removingUserId === parent.user_id}
                    className="rounded-lg px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {removingUserId === parent.user_id
                      ? 'Rimozione...'
                      : 'Rimuovi'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODALE MODIFICA PAZIENTE */}
      {showEditModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6"
          onClick={closeEditModal}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl lg:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">
                  Modifica paziente
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Modifica i dati di {patient.first_name}{' '}
                  {patient.last_name}.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                disabled={savingEdit}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Chiudi"
              >
                ×
              </button>
            </div>

            {editError && (
              <div
                role="alert"
                className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {editError}
              </div>
            )}

            <form
              className="mt-6 space-y-8"
              onSubmit={(event) => {
                event.preventDefault()
                handleSavePatient()
              }}
            >
              {/* DATI ANAGRAFICI */}
              <section>
                <h4 className="text-base font-semibold text-slate-900">
                  Dati anagrafici
                </h4>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="edit-first-name"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Nome *
                    </label>

                    <input
                      id="edit-first-name"
                      name="first_name"
                      type="text"
                      value={editForm.first_name}
                      onChange={handleEditChange}
                      disabled={savingEdit}
                      autoComplete="given-name"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit-last-name"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Cognome *
                    </label>

                    <input
                      id="edit-last-name"
                      name="last_name"
                      type="text"
                      value={editForm.last_name}
                      onChange={handleEditChange}
                      disabled={savingEdit}
                      autoComplete="family-name"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit-date-of-birth"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Data di nascita *
                    </label>

                    <input
                      id="edit-date-of-birth"
                      name="date_of_birth"
                      type="date"
                      value={editForm.date_of_birth}
                      onChange={handleEditChange}
                      disabled={savingEdit}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit-place-of-birth"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Luogo di nascita *
                    </label>

                    <input
                      id="edit-place-of-birth"
                      name="place_of_birth"
                      type="text"
                      value={editForm.place_of_birth}
                      onChange={handleEditChange}
                      disabled={savingEdit}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit-tax-code"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Codice fiscale *
                    </label>

                    <input
                      id="edit-tax-code"
                      name="tax_code"
                      type="text"
                      value={editForm.tax_code}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          tax_code: event.target.value
                            .toUpperCase()
                            .slice(0, 16),
                        }))
                      }
                      disabled={savingEdit}
                      maxLength={16}
                      autoComplete="off"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm uppercase text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit-gender"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Sesso *
                    </label>

                    <select
                      id="edit-gender"
                      name="gender"
                      value={editForm.gender}
                      onChange={handleEditChange}
                      disabled={savingEdit}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                    >
                      <option value="">Seleziona</option>
                      <option value="M">Maschio</option>
                      <option value="F">Femmina</option>
                      <option value="Altro">Altro</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="edit-citizenship"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Cittadinanza
                    </label>

                    <input
                      id="edit-citizenship"
                      name="citizenship"
                      type="text"
                      value={editForm.citizenship}
                      onChange={handleEditChange}
                      disabled={savingEdit}
                      autoComplete="country-name"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                    />
                  </div>
                </div>
              </section>

              {/* RESIDENZA */}
              <section>
                <h4 className="text-base font-semibold text-slate-900">
                  Residenza
                </h4>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="edit-residence-address"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Indirizzo
                    </label>

                    <input
                      id="edit-residence-address"
                      name="residence_address"
                      type="text"
                      value={editForm.residence_address}
                      onChange={handleEditChange}
                      disabled={savingEdit}
                      autoComplete="street-address"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit-residence-city"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Comune
                    </label>

                    <input
                      id="edit-residence-city"
                      name="residence_city"
                      type="text"
                      value={editForm.residence_city}
                      onChange={handleEditChange}
                      disabled={savingEdit}
                      autoComplete="address-level2"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit-residence-cap"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      CAP
                    </label>

                    <input
                      id="edit-residence-cap"
                      name="residence_cap"
                      type="text"
                      value={editForm.residence_cap}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          residence_cap: event.target.value
                            .replace(/\D/g, '')
                            .slice(0, 5),
                        }))
                      }
                      disabled={savingEdit}
                      maxLength={5}
                      inputMode="numeric"
                      autoComplete="postal-code"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit-residence-province"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Provincia
                    </label>

                    <input
                      id="edit-residence-province"
                      name="residence_province"
                      type="text"
                      value={editForm.residence_province}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          residence_province: event.target.value
                            .toUpperCase()
                            .slice(0, 2),
                        }))
                      }
                      disabled={savingEdit}
                      maxLength={2}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                    />
                  </div>
                </div>
              </section>

              {/* CONTATTI */}
              <section>
                <h4 className="text-base font-semibold text-slate-900">
                  Contatti
                </h4>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="edit-phone"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Telefono
                    </label>

                    <input
                      id="edit-phone"
                      name="phone"
                      type="tel"
                      value={editForm.phone}
                      onChange={handleEditChange}
                      disabled={savingEdit}
                      autoComplete="tel"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit-email"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Email
                    </label>

                    <input
                      id="edit-email"
                      name="email"
                      type="email"
                      value={editForm.email}
                      onChange={handleEditChange}
                      disabled={savingEdit}
                      autoComplete="email"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                    />
                  </div>
                </div>
              </section>

              {/* DOCUMENTO */}
              <section>
                <h4 className="text-base font-semibold text-slate-900">
                  Documento
                </h4>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="edit-document-type"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Tipo documento
                    </label>

                    <input
                      id="edit-document-type"
                      name="document_type"
                      type="text"
                      value={editForm.document_type}
                      onChange={handleEditChange}
                      disabled={savingEdit}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit-document-number"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Numero documento
                    </label>

                    <input
                      id="edit-document-number"
                      name="document_number"
                      type="text"
                      value={editForm.document_number}
                      onChange={handleEditChange}
                      disabled={savingEdit}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit-document-issue-date"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Data di rilascio
                    </label>

                    <input
                      id="edit-document-issue-date"
                      name="document_issue_date"
                      type="date"
                      value={editForm.document_issue_date}
                      onChange={handleEditChange}
                      disabled={savingEdit}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit-document-expiry-date"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Data di scadenza
                    </label>

                    <input
                      id="edit-document-expiry-date"
                      name="document_expiry_date"
                      type="date"
                      value={editForm.document_expiry_date}
                      onChange={handleEditChange}
                      disabled={savingEdit}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="edit-document-authority"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Ente / autorità di rilascio
                    </label>

                    <input
                      id="edit-document-authority"
                      name="document_issuing_authority"
                      type="text"
                      value={editForm.document_issuing_authority}
                      onChange={handleEditChange}
                      disabled={savingEdit}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                    />
                  </div>
                </div>
              </section>

              {/* NOTE */}
              <section>
                <h4 className="text-base font-semibold text-slate-900">
                  Note
                </h4>

                <div className="mt-4">
                  <textarea
                    name="notes"
                    value={editForm.notes}
                    onChange={handleEditChange}
                    disabled={savingEdit}
                    rows={5}
                    className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                  />
                </div>
              </section>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={savingEdit}
                  className="rounded-xl px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Annulla
                </button>

                <button
                  type="submit"
                  disabled={savingEdit}
                  className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingEdit ? 'Salvataggio...' : 'Salva modifiche'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE AGGIUNTA */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4"
          onClick={closeAddModal}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">
                  {addType === 'operator'
                    ? 'Aggiungi operatore'
                    : 'Aggiungi familiare'}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Seleziona una persona da associare a{' '}
                  {patient.first_name} {patient.last_name}.
                </p>
              </div>

              <button
                type="button"
                onClick={closeAddModal}
                disabled={adding}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Chiudi"
              >
                ×
              </button>
            </div>

            <div className="mt-6">
              <label
                htmlFor="user"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Persona
              </label>

              <select
                id="user"
                value={selectedUserId}
                onChange={(event) => setSelectedUserId(event.target.value)}
                disabled={adding}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
              >
                <option value="">
                  Seleziona una persona
                </option>

                {availableProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.first_name} {profile.last_name}
                  </option>
                ))}
              </select>

              {availableProfiles.length === 0 && (
                <p className="mt-2 text-xs text-slate-500">
                  Non ci sono altre persone disponibili da associare.
                </p>
              )}

              {addError && (
                <div
                  role="alert"
                  className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {addError}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeAddModal}
                disabled={adding}
                className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Annulla
              </button>

              <button
                type="button"
                onClick={handleAddUser}
                disabled={adding || !selectedUserId}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {adding ? 'Aggiunta...' : 'Aggiungi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}