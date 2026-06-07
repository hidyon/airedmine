import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import DeveloperChatView from './views/DeveloperChatView'
import DeveloperDashboardView from './views/DeveloperDashboardView'
import PMView from './views/PMView'
import AuditView from './views/AuditView'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/developer/chat" replace />} />
        <Route element={<Layout />}>
          <Route path="/developer/chat" element={<DeveloperChatView />} />
          <Route path="/developer/dashboard" element={<DeveloperDashboardView />} />
          <Route path="/pm" element={<PMView />} />
          <Route path="/audit" element={<AuditView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
