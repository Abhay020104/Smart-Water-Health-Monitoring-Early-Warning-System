import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Predict from './pages/Predict';
import ModelResults from './pages/ModelResults';
import Diseases from './pages/Diseases';
import './index.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-animated">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/predict" element={<Predict />} />
            <Route path="/models" element={<ModelResults />} />
            <Route path="/diseases" element={<Diseases />} />
          </Routes>
        </main>
        <footer className="text-center text-slate-500 text-sm py-6 border-t border-slate-800">
          Smart Water Health Monitoring &amp; Early Warning System &copy; {new Date().getFullYear()} — 7th Semester Minor Project
        </footer>
      </div>
    </Router>
  );
}

export default App;
