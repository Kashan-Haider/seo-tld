import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import FloatingPlanet from '../../ui/FloatingPlanet';
import FloatingAstronaut from '../../ui/FloatingAstronaut';
import Orbit from '../../ui/Orbit';
import Spotlights from '../../ui/Spotlights';

const CreateProject: React.FC = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Authentication required');
      }
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/project/create-project`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          description,
          website_url: websiteUrl,
          owner_id: user?.id
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to create project');
      }
      setSuccess('Project created successfully!');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <div className="h-full flex items-center justify-center bg-dark-blue relative overflow-hidden">
      {/* Space theme background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#0f1535] via-[#1e2a5a] to-[#232b4d] opacity-95" />
      <Spotlights />
      <Orbit />
      <FloatingPlanet />
      <FloatingAstronaut />
      {/* Glassy, 3D card for create project */}
      <div className="relative z-10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-accent-blue/30 rounded-2xl p-10 w-full max-w-2xl flex flex-col items-center" style={{boxShadow: '0 8px 40px 0 rgba(34,211,238,0.15), 0 1.5px 8px 0 #1e2a5a'}}>
        <div className="mb-8 w-full text-center">
          <div className="text-3xl md:text-4xl font-extrabold text-white mb-2 drop-shadow-[0_2px_8px_rgba(34,211,238,0.25)] tracking-wide" style={{letterSpacing: '0.04em'}}>Create New Project</div>
          <div className="text-light-gray text-base md:text-lg">Set up your SEO project to start tracking performance</div>
        </div>
        {error && (
          <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-sm shadow-md w-full text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-3 bg-green-500/20 border border-green-500/50 rounded text-green-400 text-sm shadow-md w-full text-center">
            {success}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6 w-full">
          <div>
            <label className="block text-light-gray mb-2 text-sm font-medium">Project Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full p-3 rounded-xl bg-dark-blue/80 text-white border border-light-gray/20 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue focus:outline-none transition-all shadow-inner shadow-accent-blue/10 hover:shadow-accent-blue/20"
              placeholder="Enter project name"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-light-gray mb-2 text-sm font-medium">Website URL *</label>
            <input
              type="url"
              value={websiteUrl}
              onChange={e => setWebsiteUrl(e.target.value)}
              required
              className="w-full p-3 rounded-xl bg-dark-blue/80 text-white border border-light-gray/20 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue focus:outline-none transition-all shadow-inner shadow-accent-blue/10 hover:shadow-accent-blue/20"
              placeholder="https://example.com"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-light-gray mb-2 text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              className="w-full p-3 rounded-xl bg-dark-blue/80 text-white border border-light-gray/20 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue focus:outline-none transition-all shadow-inner shadow-accent-blue/10 hover:shadow-accent-blue/20 resize-none"
              placeholder="Describe your project (optional)"
              disabled={loading}
            />
          </div>
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 bg-dark-blue text-white py-3 rounded-xl hover:bg-dark-blue/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium border border-light-gray/20"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-accent-blue via-light-purple to-accent-blue text-white py-3 rounded-xl font-bold text-lg shadow-lg shadow-accent-blue/30 hover:scale-[1.03] hover:shadow-light-purple/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-accent-blue/30"
              style={{boxShadow: '0 2px 16px 0 #22d3ee44'}}
            >
              {loading ? 'Creating Project...' : 'Create Project'}
            </button>
          </div>
        </form>
        <div className="mt-8 p-4 bg-dark-blue/50 rounded-lg w-full">
          <h3 className="text-white font-semibold mb-2">What happens next?</h3>
          <ul className="text-light-gray text-sm space-y-1">
            <li>• Your project will be created and added to your dashboard</li>
            <li>• You can start adding keywords and tracking SEO performance</li>
            <li>• Set up automated audits and competitor analysis</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreateProject; 