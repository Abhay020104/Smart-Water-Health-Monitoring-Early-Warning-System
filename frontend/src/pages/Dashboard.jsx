import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiDroplet, FiActivity, FiDatabase, FiAlertCircle, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { getHealth } from '../api';

const features = [
  {
    icon: <FiDroplet className="text-3xl text-cyan-400" />,
    title: 'Water Quality Prediction',
    description: 'Classify water as Low, Medium, or High quality using WHO/BIS IS 10500 standards with 12 chemical parameters.',
    link: '/predict',
    linkText: 'Analyze Water →',
  },
  {
    icon: <FiAlertCircle className="text-3xl text-purple-400" />,
    title: 'Disease Risk Prediction',
    description: 'Identify potential waterborne diseases (Cholera, Typhoid, Dysentery, etc.) based on water quality and patient symptoms.',
    link: '/predict',
    linkText: 'Check Risk →',
  },
  {
    icon: <FiDatabase className="text-3xl text-emerald-400" />,
    title: 'ML Model Comparison',
    description: '10 classification models compared across Accuracy, Precision, Recall, and F1-Score for both prediction tasks.',
    link: '/models',
    linkText: 'View Models →',
  },
  {
    icon: <FiActivity className="text-3xl text-amber-400" />,
    title: 'Early Warning System',
    description: 'Real-time alerts with actionable recommendations when water quality parameters breach safety thresholds.',
    link: '/predict',
    linkText: 'Get Alerts →',
  },
];

const stats = [
  { label: 'Water Parameters', value: '12', color: 'text-cyan-400' },
  { label: 'ML Models Evaluated', value: '10', color: 'text-purple-400' },
  { label: 'Diseases Tracked', value: '8', color: 'text-amber-400' },
  { label: 'Training Samples', value: '200K', color: 'text-emerald-400' },
];

export default function Dashboard() {
  const [serverStatus, setServerStatus] = useState('checking');

  useEffect(() => {
    getHealth()
      .then(() => setServerStatus('online'))
      .catch(() => setServerStatus('offline'));
  }, []);

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <div className="text-center py-10">
        <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
          {serverStatus === 'online' ? (
            <><FiCheckCircle className="text-emerald-400" /> <span className="text-xs text-emerald-400 font-medium">API Server Online</span></>
          ) : serverStatus === 'offline' ? (
            <><FiXCircle className="text-red-400" /> <span className="text-xs text-red-400 font-medium">API Server Offline — Start the backend</span></>
          ) : (
            <><span className="animate-spin text-cyan-400">⟳</span> <span className="text-xs text-slate-400 font-medium">Checking server...</span></>
          )}
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
          Smart Water Health
          <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"> Monitoring</span>
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
          AI-powered water quality assessment and waterborne disease early warning system built with Machine Learning and WHO/BIS environmental health standards.
        </p>
        <Link
          to="/predict"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-lg shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105 transition-all duration-200"
        >
          <FiDroplet /> Start Analysis
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card p-5 text-center">
            <p className={`text-3xl font-extrabold ${stat.color}`}>{stat.value}</p>
            <p className="text-sm text-slate-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {features.map((f) => (
          <div key={f.title} className="glass-card p-6">
            <div className="mb-4">{f.icon}</div>
            <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
            <p className="text-sm text-slate-400 mb-4">{f.description}</p>
            <Link to={f.link} className="text-sm text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
              {f.linkText}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
