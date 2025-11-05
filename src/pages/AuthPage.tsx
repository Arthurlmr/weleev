import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, AlertCircle } from 'lucide-react';
import './AuthPage.css';

export function AuthPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email) {
      setError('Veuillez entrer votre adresse email');
      return;
    }

    setLoading(true);

    try {
      // Always redirect to /onboarding
      // OnboardingPage will check if user is already onboarded and redirect to /feed if needed
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/onboarding`,
        },
      });

      if (error) throw error;

      setMessage('Un lien de connexion a été envoyé à votre adresse email. Vérifiez votre boîte de réception.');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi du lien');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-background">
        <div className="abstract-shape shape-1"></div>
        <div className="abstract-shape shape-2"></div>
        <div className="abstract-shape shape-3"></div>
      </div>

      <div className="auth-content">
        <div className="auth-logo">
          <h1>Weleev</h1>
          <p>Trouvez votre bien idéal</p>
        </div>

        <div className="auth-form-container">
          <form onSubmit={handleSubmit} className="auth-form slide-up">
            <p className="auth-subtitle">
              Entrez votre email pour recevoir un lien de connexion sécurisé.
            </p>

            <div className="form-group">
              <label htmlFor="email">Adresse email</label>
              <div className="input-wrapper">
                <Mail size={20} />
                <input
                  id="email"
                  type="email"
                  className="input"
                  placeholder="vous@exemple.fr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="alert alert-error">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="alert alert-success">
                <span>{message}</span>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-large" disabled={loading}>
              {loading ? <div className="spinner" /> : 'Continuer'}
            </button>

            <p className="auth-info">
              Un lien magique sera envoyé à votre adresse email. Pas de mot de passe à retenir !
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
