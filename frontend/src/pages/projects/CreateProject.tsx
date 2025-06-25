import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';

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
      const res = await fetch('/api/project/create-project', {
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
    <div className="min-h-screen w-full flex flex-col bg-dark-blue">
      <main className="flex-1  p-5 md:p-10 flex flex-col items-center justify-center px-2 md:px-8 py-8 bg-dark-blue/90">
        <section className="w-full max-w-2xl mx-auto">
          <div className="rounded-3xl p-6 md:p-10 shadow-2xl border border-white/10 backdrop-blur-xl flex flex-col gap-6 min-w-0"
            style={{
              background: 'linear-gradient(135deg, var(--color-dark-blue) 60%, var(--color-medium-blue) 100%)',
            }}
          >
            <div className="mb-2">
              <div className="text-2xl md:text-3xl font-bold text-white mb-2">Create New Project</div>
              <div className="text-light-gray text-sm md:text-base">Set up your SEO project to start tracking performance</div>
            </div>
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-500/20 border border-green-500/50 rounded text-green-400 text-sm">
                {success}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-light-gray mb-2 text-sm font-medium">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full p-3 rounded-lg bg-dark-blue text-white border border-light-gray/20 focus:border-accent-blue focus:outline-none transition-colors"
                  placeholder="Enter project name"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-light-gray mb-2 text-sm font-medium">
                  Website URL *
                </label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={e => setWebsiteUrl(e.target.value)}
                  required
                  className="w-full p-3 rounded-lg bg-dark-blue text-white border border-light-gray/20 focus:border-accent-blue focus:outline-none transition-colors"
                  placeholder="https://example.com"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-light-gray mb-2 text-sm font-medium">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                  className="w-full p-3 rounded-lg bg-dark-blue text-white border border-light-gray/20 focus:border-accent-blue focus:outline-none transition-colors resize-none"
                  placeholder="Describe your project (optional)"
                  disabled={loading}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1 bg-dark-blue text-white py-3 rounded-lg hover:bg-dark-blue/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium border border-light-gray/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-accent-blue text-white py-3 rounded-lg hover:bg-light-purple transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Creating Project...' : 'Create Project'}
                </button>
              </div>
            </form>
            <div className="mt-8 p-4 bg-dark-blue/50 rounded-lg">
              <h3 className="text-white font-semibold mb-2">What happens next?</h3>
              <ul className="text-light-gray text-sm space-y-1">
                <li>• Your project will be created and added to your dashboard</li>
                <li>• You can start adding keywords and tracking SEO performance</li>
                <li>• Set up automated audits and competitor analysis</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default CreateProject; 