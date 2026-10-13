
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/auth/Login'
import SetPassword from './pages/auth/SetPassword'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './layouts/AdminLayout'
import OperatorLayout from './layouts/OperatorLayout'
import Patients from './pages/admin/Patients'
import PatientDetail from './pages/admin/PatientDetail'
import Operators from './pages/admin/Operators'
import Parents from './pages/admin/Parents'
import Dashboard from './pages/admin/Dashboard'
import Jarvis from './pages/admin/Jarvis'
import Deliveries from './pages/admin/Deliveries'
import MedicationAdministration from './pages/admin/MedicationAdministration'
import OperatorDashboard from './pages/operator/Dashboard'
import OperatorPatients from './pages/operator/Patients'
import OperatorPatientDetail from './pages/operator/PatientDetail'
import OperatorDeliveries from './pages/operator/Deliveries'
import OperatorMedicationAdministration from './pages/operator/MedicationAdministration'
import ParentDashboard from './pages/parent/Dashboard'
import ParentPatientDetail from './pages/parent/PatientDetail'
import Profile from './pages/profiles/profile'
import PublicProfile from './pages/profiles/PublicProfile'
import { supabase } from './lib/supabase'

function Unauthorized() {
  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">
          Accesso non autorizzato
        </h1>

        <p className="mt-2 text-slate-400">
          Non hai i permessi per visualizzare questa pagina.
        </p>
      </div>
    </main>
  )
}

function TestCreateUserFunction() {
  async function testFunction() {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      alert('Sessione non trovata.')
      return
    }

    const { data, error } = await supabase.functions.invoke(
      'reset-test-password',
      {
        body: {
          user_id:
            'e7edddc0-5b76-419b-8d9d-b6b9ba8d3723',
        },
      }
    )

    console.log('DATA:', data)
    console.log('ERROR:', error)

    if (error) {
      alert(`Errore: ${error.message}`)
      return
    }

    alert(`Risposta: ${JSON.stringify(data)}`)
  }

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center">
      <button
        onClick={testFunction}
        className="rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-800"
      >
        Test reset password
      </button>
    </main>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/set-password" element={<SetPassword />} />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route
          element={
            <ProtectedRoute
              allowedRoles={['admin', 'operator', 'parent']}
            />
          }
        >
          <Route path="/profilo" element={<Profile />} />

          <Route
            path="/profilo/:id"
            element={<PublicProfile />}
          />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route
            path="/test-create-user"
            element={<TestCreateUserFunction />}
          />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<Dashboard />} />

            <Route path="/admin/jarvis" element={<Jarvis />} />

            <Route
              path="/admin/operatori"
              element={<Operators />}
            />

            <Route
              path="/admin/genitori"
              element={<Parents />}
            />

            <Route
              path="/admin/pazienti"
              element={<Patients />}
            />

            <Route
              path="/admin/pazienti/:id"
              element={<PatientDetail />}
            />

            <Route
              path="/admin/consegne"
              element={<Deliveries />}
            />

            <Route
              path="/admin/somministrazioni"
              element={<MedicationAdministration />}
            />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['operator']} />}>
          <Route element={<OperatorLayout />}>
            <Route
              path="/operator"
              element={<OperatorDashboard />}
            />

            <Route
              path="/operator/pazienti"
              element={<OperatorPatients />}
            />

            <Route
              path="/operator/pazienti/:id"
              element={<OperatorPatientDetail />}
            />

            <Route
              path="/operator/consegne"
              element={<OperatorDeliveries />}
            />

            <Route
              path="/operator/somministrazioni"
              element={<OperatorMedicationAdministration />}
            />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['parent']} />}>
          <Route
            path="/parent"
            element={<ParentDashboard />}
          />

          <Route
            path="/parent/pazienti/:id"
            element={<ParentPatientDetail />}
          />
        </Route>

        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  )
}