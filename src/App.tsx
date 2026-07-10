import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TicketsProvider } from './context/TicketsContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Credentials } from './pages/Credentials';
import { Board } from './pages/Board';
import { TicketDetail } from './pages/TicketDetail';
import { PrintView } from './pages/PrintView';

export default function App() {
  return (
    <AuthProvider>
      <TicketsProvider>
        {/* HashRouter: refresh- und deeplink-fest unter dem GitHub-Pages-Basispfad. */}
        <HashRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            {/* Selbstbedienung für Lehrkräfte: eigenes Klassen-Set erstellen. */}
            <Route path="/register" element={<Register />} />
            <Route
              path="/credentials"
              element={
                <ProtectedRoute teacherOnly>
                  <Credentials />
                </ProtectedRoute>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Board />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ticket/:id"
              element={
                <ProtectedRoute>
                  <TicketDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/print"
              element={
                <ProtectedRoute teacherOnly>
                  <PrintView />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </TicketsProvider>
    </AuthProvider>
  );
}
