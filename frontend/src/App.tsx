import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { MouseFollower } from './components/ui/MouseFollower';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { AuthProvider } from './contexts/AuthContext';
import { ProgressProvider } from './contexts/ProgressContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AuthSuccess } from './pages/auth/AuthSuccess';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { Optimizer } from './pages/Optimizer';
import { History } from './pages/History';
import { MLStats } from './pages/MLStats';
import { Connections } from './pages/Connections';
import { Academy } from './pages/Academy';
import { ChapterPage } from './pages/ChapterPage';
import { QuizResult } from './pages/QuizResult';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Certificates } from './pages/Certificates';
import { CertificateView } from './pages/CertificateView';
import { motion } from 'framer-motion';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <ProgressProvider>
            <div className="relative flex min-h-screen flex-col bg-base text-muted transition-colors duration-300">
              <MouseFollower />
              <Navbar />
              <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 pb-8 pt-14 text-base sm:px-6 sm:pt-28">
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/auth-success" element={<AuthSuccess />} />

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
                      path="/learn/chapter/:order/quiz-result"
                      element={
                        <ProtectedRoute>
                          <QuizResult />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/learn/chapter/:order"
                      element={
                        <ProtectedRoute>
                          <ChapterPage />
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
                    <Route path="/certificate/:certId" element={<CertificateView />} />
                    <Route path="/verify/:certId" element={<CertificateView />} />
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
              <Footer />
              <Toaster position="top-right" theme="system" />
            </div>
          </ProgressProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
