import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Shield } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data && data.error) || 'Registration failed');
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
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Join ResiliFin</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg shadow-blue-100/50 p-8 border border-gray-100">
          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <Label htmlFor="fullName" className="text-sm text-gray-700 mb-2 block">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Your name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-12 rounded-xl border-gray-200"
                required
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-sm text-gray-700 mb-2 block">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl border-gray-200"
                required
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-sm text-gray-700 mb-2 block">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl border-gray-200"
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/30 disabled:opacity-60"
            >
              {loading ? 'Creating...' : 'Create Account'}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <button type="button" onClick={() => navigate('/')} className="text-blue-500 hover:text-blue-600 font-medium">
              Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
