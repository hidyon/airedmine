import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import LoginView from './views/LoginView'
import DeveloperChatView from './views/DeveloperChatView'
import DeveloperDashboardView from './views/DeveloperDashboardView'
import PMView from './views/PMView'
import AuditView from './views/AuditView'
import { isLoggedIn, getUser } from './auth'

function DefaultRedirect() {
  if (!isLoggedIn()) return <Navigate to="/login" replace />
  const user = getUser()
  const dest = user?.role === 'pm' ? '/pm' : '/developer/chat'
  return <Navigate to={dest} replace />
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginView />} />
        <Route path="/" element={<DefaultRedirect />} />
        <Route
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route path="/developer/chat" element={<DeveloperChatView />} />
          <Route path="/developer/dashboard" element={<DeveloperDashboardView />} />
          <Route path="/pm" element={<PMView />} />
          <Route path="/audit" element={<AuditView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
