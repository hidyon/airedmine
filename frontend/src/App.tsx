import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import LoginView from './views/LoginView'
import DeveloperChatView from './views/DeveloperChatView'
import DeveloperDashboardView from './views/DeveloperDashboardView'
import PMDashboardView from './views/PMDashboardView'
import AuditView from './views/AuditView'
import { isLoggedIn } from './auth'

function DefaultRedirect() {
  if (!isLoggedIn()) return <Navigate to="/login" replace />
  return <Navigate to="/developer/chat" replace />
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
          <Route path="/pm/dashboard" element={<PMDashboardView />} />
          <Route path="/pm" element={<Navigate to="/developer/chat" replace />} />
          <Route path="/audit" element={<AuditView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
