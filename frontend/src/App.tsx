import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { InteractionLayer } from './components/ui/InteractionLayer';
import { Navbar } from './components/layout/Navbar';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { OAuthTokenHandler } from './components/auth/OAuthTokenHandler';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { Optimizer } from './pages/Optimizer';
import { History } from './pages/History';
import { MLStats } from './pages/MLStats';
import { Connections } from './pages/Connections';
import { Academy } from './pages/Academy';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Certificates } from './pages/Certificates';
import { motion } from 'framer-motion';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-[#030303] text-zinc-100 relative">
          <InteractionLayer />
          <Navbar />
          <main className="pt-36 px-6 pb-12 max-w-7xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/auth-success" element={<OAuthTokenHandler />} />

                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/optimizer"
                  element={
                    <ProtectedRoute>
                      <Optimizer />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/learn"
                  element={
                    <ProtectedRoute>
                      <Academy />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/academy"
                  element={
                    <ProtectedRoute>
                      <Academy />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/history"
                  element={
                    <ProtectedRoute>
                      <History />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/connections"
                  element={
                    <ProtectedRoute>
                      <Connections />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/certificates"
                  element={
                    <ProtectedRoute>
                      <Certificates />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ml-stats"
                  element={
                    <ProtectedRoute requireAdmin>
                      <MLStats />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </motion.div>
          </main>
          <Toaster position="top-right" />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
