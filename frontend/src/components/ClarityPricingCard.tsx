import React from 'react';
import { Check, Star, Lock } from 'lucide-react';

interface ClarityPricingCardProps {
    title: string;
    price: string;
    features: string[];
    recommended?: boolean;
    onSelect?: () => void;
    locked?: boolean;
}

const ClarityPricingCard: React.FC<ClarityPricingCardProps> = ({
    title,
    price,
    features,
    recommended = false,
    onSelect,
    locked = false
}) => {
    return (
        <div className={`glass-card h-100 d-flex flex-column position-relative overflow-hidden transition-transform hover-scale ${recommended ? 'border-primary' : ''}`}
            style={{
                borderColor: recommended ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                borderWidth: recommended ? '2px' : '1px'
            }}>

            {recommended && (
                <div className="position-absolute top-0 end-0 bg-primary text-white text-xs fw-bold px-3 py-1 rounded-bl-3">
                    POPULAR
                </div>
            )}

            <div className="p-4 flex-grow-1">
                <h3 className="h5 fw-bold mb-2">{title}</h3>
                <div className="d-flex align-items-baseline mb-4">
                    <span className="h2 fw-bold mb-0">{price}</span>
                    <span className="text-secondary small ms-1">/ one-time</span>
                </div>

                <ul className="list-unstyled mb-0 d-flex flex-column gap-3">
                    {features.map((feature, idx) => (
                        <li key={idx} className="d-flex align-items-start gap-2">
                            <Check size={18} className="text-success mt-1 flex-shrink-0" />
                            <span className="small">{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="p-4 pt-0 mt-auto">
                <button
                    onClick={onSelect}
                    className={`btn w-100 d-flex align-items-center justify-content-center gap-2 ${recommended ? 'btn-primary' : 'btn-secondary'}`}
                    disabled={locked}
                >
                    {locked ? <Lock size={16} /> : <Star size={16} />}
                    {locked ? 'Coming Soon' : 'Unlock Now'}
                </button>
            </div>
        </div>
    );
};

export default ClarityPricingCard;
