import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Shell } from './components/layout/Shell';
import { Dashboard } from './pages/Dashboard';
import { Studio } from './pages/Studio';
import { History } from './pages/History';
import { MLStats } from './pages/MLStats';

function App() {
  return (
    <Router>
      <Shell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/history" element={<History />} />
          <Route path="/ml-stats" element={<MLStats />} />
        </Routes>
      </Shell>
      <Toaster richColors />
    </Router>
  );
}

export default App;
