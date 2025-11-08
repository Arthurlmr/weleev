import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Check, Sparkles, TrendingUp, Shield } from 'lucide-react'
import { LumineLogoWithTagline } from '../components/LumineLogo'
import { Button } from '../components/ui/button'

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-lumine-neutral-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-lumine-neutral-400/20 backdrop-blur-sm">
        <nav className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-lumine-primary flex items-center justify-center">
                <span className="text-white font-display text-sm font-bold">L</span>
              </div>
              <span className="font-display text-xl text-lumine-primary">
                LUMIN<span className="text-sm align-super">ᵉ</span>
              </span>
            </div>
            <div className="hidden md:flex items-center gap-12">
              <a
                href="#pourquoi"
                className="text-sm text-lumine-primary hover:text-lumine-accent transition"
              >
                Pourquoi LUMINᵉ
              </a>
              <a
                href="#comment"
                className="text-sm text-lumine-primary hover:text-lumine-accent transition"
              >
                Comment ça marche
              </a>
              <Button
                onClick={() => navigate('/auth')}
                className="bg-lumine-accent hover:bg-lumine-accent-dark text-white"
              >
                Commencer
              </Button>
            </div>
            <Button
              variant="ghost"
              className="md:hidden"
              onClick={() => navigate('/auth')}
            >
              <span className="text-lumine-primary">Menu</span>
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="w-full px-4 md:px-8 lg:px-12 py-16 md:py-24 lg:py-32">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8 md:space-y-10"
          >
            <div className="space-y-4">
              <LumineLogoWithTagline showTagline variant="dark" size="xl" />
            </div>

            <p className="text-lg md:text-xl text-lumine-primary leading-relaxed max-w-md">
              Trouvez votre propriété parfaite plus rapidement. Accédez à{' '}
              <strong>800+ plateformes immobilières</strong> via une interface
              intelligente. Notre IA enrichit chaque annonce avec des insights
              exclusifs, tandis que notre scoring personnalisé vous guide vers les
              biens vraiment adaptés à votre vie et votre budget.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                onClick={() => navigate('/auth')}
                size="lg"
                className="bg-lumine-accent hover:bg-lumine-accent-dark text-white h-14 text-base"
              >
                Commencer ma recherche
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() =>
                  document
                    .getElementById('pourquoi')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }
                className="h-14 text-base border-lumine-neutral-400"
              >
                En savoir plus
              </Button>
            </div>

            <div className="pt-8 space-y-3 text-sm text-lumine-primary">
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-lumine-accent" />
                <span>Accès immédiat à 50 000+ propriétés vérifiées</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-lumine-accent" />
                <span>Mise en place en 2 minutes</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-lumine-accent" />
                <span>Scoring personnalisé et analyses financières</span>
              </div>
            </div>
          </motion.div>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden lg:block"
          >
            <div className="aspect-[16/10] rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-lumine-neutral-300 to-lumine-neutral-400">
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Sparkles className="h-20 w-20 text-lumine-accent mx-auto opacity-30" />
                  <p className="text-lumine-neutral-700 font-medium">
                    Propriété Premium
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Value Proposition */}
      <section
        id="pourquoi"
        className="w-full bg-white px-4 md:px-8 lg:px-12 py-20 md:py-28 lg:py-36"
      >
        <div className="max-w-5xl mx-auto space-y-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-6 max-w-3xl mx-auto"
          >
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-lumine-primary">
              Voir les propriétés différemment
            </h2>
            <p className="text-lg md:text-xl text-lumine-primary leading-relaxed opacity-80">
              Au-delà des annonces standards, nous enrichissons chaque bien avec
              l'intelligence qui compte vraiment
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Feature 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-6"
            >
              <div className="space-y-3">
                <p className="font-display text-3xl md:text-4xl text-lumine-accent">
                  01
                </p>
                <h3 className="font-display text-2xl text-lumine-primary">
                  Données enrichies par l'IA
                </h3>
              </div>
              <p className="text-base md:text-lg text-lumine-primary opacity-80 leading-relaxed">
                Nos algorithmes analysent les images pour identifier l'état réel
                du bien, les besoins de rénovation et les indicateurs de qualité.
                Les détails oubliés sont extraits automatiquement.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              <div className="space-y-3">
                <p className="font-display text-3xl md:text-4xl text-lumine-accent">
                  02
                </p>
                <h3 className="font-display text-2xl text-lumine-primary">
                  Scoring personnalisé
                </h3>
              </div>
              <p className="text-base md:text-lg text-lumine-primary opacity-80 leading-relaxed">
                Chaque propriété est notée en fonction de votre profil, votre
                capacité financière et vos préférences réelles. Les biens vraiment
                adaptés remontent en priorité.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="space-y-6"
            >
              <div className="space-y-3">
                <p className="font-display text-3xl md:text-4xl text-lumine-accent">
                  03
                </p>
                <h3 className="font-display text-2xl text-lumine-primary">
                  Transparence financière
                </h3>
              </div>
              <p className="text-base md:text-lg text-lumine-primary opacity-80 leading-relaxed">
                Coûts mensuels réels, frais cachés, simulations de prêt et
                historique de prix. Tout est clair avant de vous engager.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="comment"
        className="w-full px-4 md:px-8 lg:px-12 py-20 md:py-28"
      >
        <div className="max-w-4xl mx-auto space-y-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center space-y-4"
          >
            <h2 className="font-display text-4xl md:text-5xl text-lumine-primary">
              Comment ça marche
            </h2>
            <p className="text-lg text-lumine-primary opacity-80">
              Trois étapes pour trouver votre bien idéal
            </p>
          </motion.div>

          <div className="space-y-12">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex gap-6 items-start"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-lumine-accent flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="font-display text-xl text-lumine-primary">
                  Définissez vos critères
                </h3>
                <p className="text-lumine-primary opacity-80">
                  Lieu, budget, type de bien. Affinez avec notre chatbot
                  conversationnel qui comprend vos vraies priorités.
                </p>
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex gap-6 items-start"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-lumine-accent flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="font-display text-xl text-lumine-primary">
                  Explorez les résultats enrichis
                </h3>
                <p className="text-lumine-primary opacity-80">
                  Chaque annonce est analysée par notre IA : état du bien, travaux à
                  prévoir, score personnalisé et coûts réels.
                </p>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex gap-6 items-start"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-lumine-accent flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="font-display text-xl text-lumine-primary">
                  Décidez en toute confiance
                </h3>
                <p className="text-lumine-primary opacity-80">
                  Comparez, sauvegardez, recevez des alertes et contactez
                  directement. Tout est transparent.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="w-full bg-lumine-primary px-4 md:px-8 lg:px-12 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center space-y-8"
        >
          <h2 className="font-display text-4xl md:text-5xl text-lumine-neutral-100">
            Prêt à trouver votre bien idéal ?
          </h2>
          <p className="text-xl text-lumine-neutral-100 opacity-90">
            Rejoignez LUMINᵉ et découvrez l'immobilier autrement
          </p>
          <Button
            onClick={() => navigate('/auth')}
            size="lg"
            className="bg-lumine-accent hover:bg-lumine-accent-dark text-white h-14 text-lg px-12"
          >
            Commencer gratuitement
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-lumine-neutral-400/20 px-4 md:px-8 lg:px-12 py-12">
        <div className="max-w-7xl mx-auto text-center text-sm text-lumine-neutral-700">
          <p>
            © 2025 LUMINᵉ. L'immobilier en pleine lumière.
          </p>
        </div>
      </footer>
    </div>
  )
}
