import { useState, useEffect } from 'react';
import { Listing, ListingEnrichment } from '@/types';
import { generateEnrichmentData } from '@/lib/gemini';
import {
  X,
  MapPin,
  BedDouble,
  Bath,
  Square,
  Car,
  TrendingUp,
  DollarSign,
  Sparkles
} from 'lucide-react';
import './ListingDetailModal.css';

interface ListingDetailModalProps {
  listing: Listing;
  onClose: () => void;
}

export function ListingDetailModal({ listing, onClose }: ListingDetailModalProps) {
  const [enrichment, setEnrichment] = useState<ListingEnrichment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEnrichment() {
      setLoading(true);
      try {
        const data = await generateEnrichmentData(listing);
        setEnrichment(data);
      } catch (error) {
        console.error('Error loading enrichment:', error);
      } finally {
        setLoading(false);
      }
    }

    loadEnrichment();
  }, [listing]);

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-container">
        <div className="modal-content">
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>

          <div className="modal-header">
            <img src={listing.images[0]} alt={listing.title} className="modal-image" />
          </div>

          <div className="modal-body">
            <div className="listing-detail-header">
              <div>
                <h2>{listing.title}</h2>
                <div className="listing-detail-location">
                  <MapPin size={18} />
                  <span>{listing.address || listing.city}</span>
                </div>
              </div>
              <div className="listing-detail-price">
                {listing.price.toLocaleString('fr-FR')} €
              </div>
            </div>

            <div className="listing-stats">
              <div className="stat">
                <BedDouble size={20} />
                <div>
                  <div className="stat-value">{listing.bedrooms}</div>
                  <div className="stat-label">Chambres</div>
                </div>
              </div>
              <div className="stat">
                <Bath size={20} />
                <div>
                  <div className="stat-value">{listing.bathrooms}</div>
                  <div className="stat-label">Salles de bain</div>
                </div>
              </div>
              <div className="stat">
                <Square size={20} />
                <div>
                  <div className="stat-value">{listing.surface}m²</div>
                  <div className="stat-label">Surface</div>
                </div>
              </div>
              {listing.hasParking && (
                <div className="stat">
                  <Car size={20} />
                  <div>
                    <div className="stat-value">✓</div>
                    <div className="stat-label">Parking</div>
                  </div>
                </div>
              )}
            </div>

            <div className="section">
              <h3>Description</h3>
              <p>{listing.description}</p>
            </div>

            {loading ? (
              <div className="ai-loading">
                <div className="spinner" style={{ width: 32, height: 32 }}></div>
                <p>Analyse IA en cours...</p>
              </div>
            ) : enrichment ? (
              <>
                <div className="section ai-section">
                  <div className="section-header">
                    <Sparkles size={20} />
                    <h3>Analyse IA</h3>
                  </div>
                  <p className="ai-summary">{enrichment.aiSummary}</p>
                </div>

                <div className="section">
                  <div className="section-header">
                    <DollarSign size={20} />
                    <h3>Analyse Financière</h3>
                  </div>
                  <div className="financial-grid">
                    <div className="financial-item">
                      <span className="label">Mensualité estimée</span>
                      <span className="value">
                        {enrichment.financialAnalysis.monthlyPayment.toLocaleString('fr-FR')} €
                      </span>
                    </div>
                    <div className="financial-item">
                      <span className="label">Apport (20%)</span>
                      <span className="value">
                        {enrichment.financialAnalysis.downPayment.toLocaleString('fr-FR')} €
                      </span>
                    </div>
                    <div className="financial-item">
                      <span className="label">Taxe foncière</span>
                      <span className="value">
                        {enrichment.financialAnalysis.propertyTax.toLocaleString('fr-FR')} €/an
                      </span>
                    </div>
                    {enrichment.financialAnalysis.condoFees && (
                      <div className="financial-item">
                        <span className="label">Charges</span>
                        <span className="value">
                          {enrichment.financialAnalysis.condoFees} €/mois
                        </span>
                      </div>
                    )}
                    <div className="financial-item highlight">
                      <span className="label">Coût mensuel total</span>
                      <span className="value">
                        {enrichment.financialAnalysis.totalMonthlyCost.toLocaleString('fr-FR')} €
                      </span>
                    </div>
                  </div>
                  <p className="financial-note">
                    Calcul basé sur un taux de {enrichment.financialAnalysis.assumptions.interestRate}%
                    sur {enrichment.financialAnalysis.assumptions.loanTerm} ans
                  </p>
                </div>

                <div className="section">
                  <div className="section-header">
                    <TrendingUp size={20} />
                    <h3>Comparaison Marché</h3>
                  </div>
                  <div className="market-stats">
                    <div className="market-stat">
                      <div className="market-label">Prix moyen au m²</div>
                      <div className="market-value">
                        {enrichment.marketComparison.averagePricePerSqm.toLocaleString('fr-FR')} €
                      </div>
                    </div>
                    <div className="market-stat">
                      <div className="market-label">Position</div>
                      <div className="market-value">
                        <span className={`badge badge-${enrichment.marketComparison.pricePositioning}`}>
                          {enrichment.marketComparison.pricePositioning === 'below' ? 'Sous le marché' :
                           enrichment.marketComparison.pricePositioning === 'above' ? 'Au-dessus' : 'Dans la moyenne'}
                        </span>
                      </div>
                    </div>
                    <div className="market-stat">
                      <div className="market-label">Tendance</div>
                      <div className="market-value">
                        <span className={`badge badge-${enrichment.marketComparison.marketTrend}`}>
                          {enrichment.marketComparison.marketTrend === 'rising' ? '📈 Hausse' :
                           enrichment.marketComparison.marketTrend === 'falling' ? '📉 Baisse' : '➡️ Stable'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="section">
                  <div className="section-header">
                    <MapPin size={20} />
                    <h3>Commodités à Proximité</h3>
                  </div>
                  <div className="amenities-list">
                    {enrichment.amenities.map((amenity, index) => (
                      <div key={index} className="amenity-item">
                        <div className="amenity-icon">
                          {amenity.type === 'transport' && '🚇'}
                          {amenity.type === 'commerce' && '🛒'}
                          {amenity.type === 'school' && '🏫'}
                          {amenity.type === 'health' && '💊'}
                        </div>
                        <div className="amenity-info">
                          <div className="amenity-name">{amenity.name}</div>
                          <div className="amenity-distance">
                            {amenity.distance}m · {amenity.walkTime} min à pied
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : null}

            <div className="modal-actions">
              <button className="btn btn-secondary btn-large">
                Contacter l'agent
              </button>
              <button className="btn btn-primary btn-large">
                Ajouter aux favoris
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
