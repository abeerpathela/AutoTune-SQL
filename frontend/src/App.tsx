import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Shell } from './components/layout/Shell';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { Studio } from './pages/Studio';
import { History } from './pages/History';
import { MLStats } from './pages/MLStats';
import { Connections } from './pages/Connections';
import { InteractionLayer } from './components/ui/InteractionLayer';

function App() {
  return (
    <Router>
      <InteractionLayer />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/*" element={
          <Shell>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/studio" element={<Studio />} />
              <Route path="/history" element={<History />} />
              <Route path="/ml-stats" element={<MLStats />} />
              <Route path="/connections" element={<Connections />} />
            </Routes>
          </Shell>
        } />
      </Routes>
      <Toaster richColors />
    </Router>
  );
}

export default App;
