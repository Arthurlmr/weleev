import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface EnrichmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  result?: {
    nouvelles_informations: Array<{
      categorie: string;
      information: string;
    }>;
    informations_confirmees: string[];
    informations_manquantes: string[];
  } | null;
  error?: string | null;
}

export function EnrichmentModal({ isOpen, onClose, isLoading, result, error }: EnrichmentModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-lumine-primary to-lumine-primary-dark text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles size={24} className="text-lumine-accent" />
                <h2 className="text-xl font-bold">
                  Enrichissement depuis la description
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Loading State */}
              {isLoading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 border-4 border-lumine-accent/30 border-t-lumine-accent rounded-full animate-spin mb-4" />
                  <p className="text-lumine-primary font-medium text-lg mb-2">
                    Analyse en cours...
                  </p>
                  <p className="text-lumine-neutral-700 text-sm text-center max-w-md">
                    Je suis en train d'extraire de la description les informations clés qui manquaient à l'annonce.
                  </p>
                </div>
              )}

              {/* Error State */}
              {error && !isLoading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="text-red-600" size={32} />
                  </div>
                  <p className="text-red-600 font-medium text-lg mb-2">Erreur</p>
                  <p className="text-lumine-neutral-700 text-sm text-center max-w-md">
                    {error}
                  </p>
                </div>
              )}

              {/* Results */}
              {result && !isLoading && !error && (
                <div className="space-y-6">
                  {/* Nouvelles informations */}
                  {result.nouvelles_informations && result.nouvelles_informations.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-lumine-primary font-semibold">
                        <Sparkles className="text-lumine-accent" size={20} />
                        Nouvelles informations trouvées
                      </div>
                      <div className="space-y-2">
                        {result.nouvelles_informations.map((info, index) => (
                          <div
                            key={index}
                            className="bg-lumine-neutral-100 rounded-lg p-4 border-l-4 border-lumine-accent"
                          >
                            <div className="text-sm font-semibold text-lumine-accent mb-1">
                              {info.categorie}
                            </div>
                            <div className="text-sm text-lumine-neutral-700">
                              {info.information}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Informations confirmées */}
                  {result.informations_confirmees && result.informations_confirmees.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-green-700 font-semibold">
                        <CheckCircle size={20} />
                        Informations confirmées
                      </div>
                      <ul className="space-y-2">
                        {result.informations_confirmees.map((info, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 text-sm text-lumine-neutral-700"
                          >
                            <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={16} />
                            {info}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Informations manquantes */}
                  {result.informations_manquantes && result.informations_manquantes.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-orange-700 font-semibold">
                        <Info size={20} />
                        Informations toujours manquantes
                      </div>
                      <ul className="space-y-2">
                        {result.informations_manquantes.map((info, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 text-sm text-lumine-neutral-700"
                          >
                            <Info className="text-orange-600 flex-shrink-0 mt-0.5" size={16} />
                            {info}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* No new info */}
                  {result.nouvelles_informations?.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Info className="text-lumine-neutral-400 mb-4" size={48} />
                      <p className="text-lumine-neutral-700 text-center">
                        Aucune nouvelle information trouvée dans la description.<br />
                        Toutes les informations importantes sont déjà renseignées.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {!isLoading && (
              <div className="p-6 border-t border-lumine-neutral-400/20 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-lumine-accent hover:bg-lumine-accent-dark text-lumine-primary rounded-lg font-medium transition-colors"
                >
                  Fermer
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
