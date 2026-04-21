import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AuthProvider } from '@/contexts/AuthContext';
import { PortalLayout } from '@/layouts/PortalLayout';
import { InfoPage } from '@/pages/InfoPage';
import { BlanketPage } from '@/pages/BlanketPage';
import { DebugPage } from '@/pages/DebugPage';
import { LoggingPage } from '@/pages/LoggingPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/portal" element={<PortalLayout />}>
            <Route index element={<Navigate to="info" replace />} />
            <Route path="info" element={<InfoPage />} />
            <Route path="blanket" element={<BlanketPage />} />
            <Route path="debug" element={<DebugPage />} />
            <Route path="logging" element={<LoggingPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/portal" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
