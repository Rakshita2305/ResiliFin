import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Shield } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message = (data && data.error) || 'Login failed';
        setError(message);
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (data.token) {
        localStorage.setItem('authToken', data.token);
        navigate('/dashboard');
      } else {
        setError('Invalid response from server');
      }
    } catch (err) {
      console.error(err);
      setError('Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50/30 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">ResiliFin</h1>
          <p className="text-gray-600">Measure Risk. Build Resilience.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg shadow-blue-100/50 p-8 border border-gray-100">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <Label htmlFor="email" className="text-sm text-gray-700 mb-2 block">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-sm text-gray-700 mb-2 block">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/30 transition-all disabled:opacity-60"
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/register')}
              className="text-blue-500 hover:text-blue-600 transition-colors"
            >
              Create Account
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          Built for financial safety, not speculation
        </p>
      </div>
    </div>
  );
}
