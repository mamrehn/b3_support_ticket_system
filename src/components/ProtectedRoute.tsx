import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';

// Schützt Routen vor nicht angemeldeten Nutzern. `teacherOnly` zusätzlich
// nur für die Lehrkraft (z. B. der Druck-/Export-View).
export function ProtectedRoute({
  children,
  teacherOnly = false,
}: {
  children: ReactNode;
  teacherOnly?: boolean;
}) {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
  if (teacherOnly && session.role !== 'teacher') return <Navigate to="/" replace />;
  return <>{children}</>;
}
