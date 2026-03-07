import { Home, TrendingUp, CreditCard, Brain, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/dashboard' },
    { icon: TrendingUp, label: 'Simulation', path: '/simulation' },
    { icon: CreditCard, label: 'Expenses', path: '/expenses' },
    { icon: Brain, label: 'AI Insights', path: '/ai-assistant' },
    { icon: User, label: 'Profile', path: '/setup' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-around py-3 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'text-blue-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
