import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import './AuthPage.css';

export function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [userExists, setUserExists] = useState<boolean | null>(null);
  const navigate = useNavigate();

  const checkUserExists = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    } catch (err) {
      console.error('Error checking user:', err);
      return false;
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email) {
      setError('Veuillez entrer votre adresse email');
      return;
    }

    setLoading(true);
    const exists = await checkUserExists(email);
    setUserExists(exists);
    setShowPassword(true);
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      navigate('/feed');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    setError(null);
    setLoading(true);

    try {
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
          {!showPassword ? (
            <form onSubmit={handleEmailSubmit} className="auth-form slide-up">
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
            </form>
          ) : (
            <div className="auth-form slide-up">
              <button
                onClick={() => {
                  setShowPassword(false);
                  setUserExists(null);
                  setPassword('');
                }}
                className="btn btn-ghost btn-back"
              >
                ← Retour
              </button>

              {userExists ? (
                <form onSubmit={handleSignIn}>
                  <p className="auth-subtitle">Bon retour ! Connectez-vous pour continuer.</p>

                  <div className="form-group">
                    <label htmlFor="password">Mot de passe</label>
                    <div className="input-wrapper">
                      <Lock size={20} />
                      <input
                        id="password"
                        type="password"
                        className="input"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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

                  <button type="submit" className="btn btn-primary btn-large" disabled={loading}>
                    {loading ? <div className="spinner" /> : 'Se connecter'}
                  </button>

                  <div className="auth-divider">ou</div>

                  <button
                    type="button"
                    onClick={handleMagicLink}
                    className="btn btn-secondary btn-large"
                    disabled={loading}
                  >
                    Recevoir un lien de connexion
                  </button>
                </form>
              ) : (
                <div>
                  <p className="auth-subtitle">Bienvenue ! Créez votre compte pour commencer.</p>

                  {message && (
                    <div className="alert alert-success">
                      <span>{message}</span>
                    </div>
                  )}

                  {error && (
                    <div className="alert alert-error">
                      <AlertCircle size={20} />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    onClick={handleMagicLink}
                    className="btn btn-primary btn-large"
                    disabled={loading}
                  >
                    {loading ? <div className="spinner" /> : 'Créer mon compte'}
                  </button>

                  <p className="auth-info">
                    Un lien de connexion sécurisé sera envoyé à votre adresse email.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
