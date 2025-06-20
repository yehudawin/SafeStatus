import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col items-center justify-center text-center p-6">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-2 text-text-primary">אופס, הלכת לאיבוד.</h2>
      <p className="text-text-secondary mb-8">העמוד שחיפשת לא קיים או שהועבר למקום אחר.</p>
      <button
        onClick={() => navigate('/')}
        className="button-primary hover:bg-opacity-90 flex items-center gap-2 transition-colors"
      >
        <Home size={20} />
        חזור לדף הבית
      </button>
    </div>
  );
} 