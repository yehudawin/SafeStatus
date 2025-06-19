import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-dark text-white flex flex-col items-center justify-center text-center p-6">
      <h1 className="text-6xl font-bold text-blue-500 mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-2">אופס, הלכת לאיבוד.</h2>
      <p className="text-gray-400 mb-8">העמוד שחיפשת לא קיים או שהועבר למקום אחר.</p>
      <button
        onClick={() => navigate('/')}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2 transition-colors"
      >
        <Home size={20} />
        חזור לדף הבית
      </button>
    </div>
  );
} 