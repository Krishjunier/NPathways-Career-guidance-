import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Lock, CheckCircle, ArrowLeft } from 'lucide-react';

import { apiService } from '../services/api';

const PaymentPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { amount, item, userId } = (location.state as any) || { amount: 0, item: 'Unknown', userId: null };

    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);

    const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
    const [expiry, setExpiry] = useState('12/28');
    const [cvv, setCvv] = useState('123');
    const [name, setName] = useState('Test User');

    const handlePay = async () => {
        setProcessing(true);
        // Simulate Payment Gateway Delay
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Record success on backend
            if (userId) {
                await apiService.recordPayment(userId, item, amount);

                const key = `premium_${userId}`;
                localStorage.setItem(key, 'true');
                localStorage.setItem(`premium_plan_${userId}`, item);
            }

            setProcessing(false);
            setSuccess(true);

            setTimeout(() => {
                navigate('/dashboard', { state: { paymentSuccess: true, item, userId } });
            }, 2000);

        } catch (err) {
            console.error("Payment Error:", err);
            setProcessing(false);
            alert("Payment processing failed. Please try again.");
        }
    };

    if (success) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
                <div className="text-center p-5 bg-white rounded-4 shadow">
                    <div className="d-flex align-items-center justify-content-center mb-4">
                        <div className="rounded-circle bg-success text-white p-3">
                            <CheckCircle size={48} />
                        </div>
                    </div>
                    <h2 className="mb-2">Payment Successful!</h2>
                    <p className="text-secondary mb-4">Thank you for purchasing the {item}.</p>
                    <p className="small text-muted">Redirecting you back to dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-vh-100 bg-light py-5">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-6 col-lg-5">
                        <button onClick={() => navigate(-1)} className="btn btn-link text-decoration-none text-secondary mb-3 pl-0 d-flex align-items-center gap-2">
                            <ArrowLeft size={18} /> Back
                        </button>

                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                            <div className="card-header bg-white border-bottom p-4">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <h5 className="mb-0 fw-bold">Order Summary</h5>
                                    <span className="badge bg-primary bg-opacity-10 text-primary">{item}</span>
                                </div>
                                <div className="d-flex justify-content-between align-items-baseline">
                                    <span className="text-secondary">Total Amount</span>
                                    <span className="h3 fw-bold mb-0">₹{amount}</span>
                                </div>
                            </div>

                            <div className="card-body p-4">
                                <div className="alert alert-info py-2 small mb-4">
                                    <i className="bi bi-info-circle me-2"></i>
                                    Test Mode: Form pre-filled with dummy data.
                                </div>
                                <p className="text-secondary small mb-3">
                                    <Lock size={14} className="me-1" />
                                    Payments are secure and encrypted.
                                </p>

                                <form onSubmit={(e) => { e.preventDefault(); handlePay(); }}>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-secondary">Card Number</label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-white border-end-0 text-secondary">
                                                <CreditCard size={18} />
                                            </span>
                                            <input
                                                type="text"
                                                className="form-control border-start-0 ps-0"
                                                value={cardNumber}
                                                onChange={e => setCardNumber(e.target.value)}
                                                disabled={processing}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="row g-3 mb-4">
                                        <div className="col-6">
                                            <label className="form-label small fw-bold text-secondary">Expiry Date</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={expiry}
                                                onChange={e => setExpiry(e.target.value)}
                                                disabled={processing}
                                                required
                                            />
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label small fw-bold text-secondary">CVV</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={cvv}
                                                onChange={e => setCvv(e.target.value)}
                                                disabled={processing}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label small fw-bold text-secondary">Cardholder Name</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            disabled={processing}
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn btn-primary w-100 py-3 rounded-3 fw-bold d-flex align-items-center justify-content-center gap-2"
                                        disabled={processing}
                                    >
                                        {processing ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                Processing...
                                            </>
                                        ) : (
                                            <>Pay ₹{amount}</>
                                        )}
                                    </button>
                                </form>
                            </div>
                            <div className="card-footer bg-light p-3 text-center">
                                <small className="text-secondary" style={{ fontSize: '0.75rem' }}>
                                    This is a secure mock payment page for demonstration purposes.
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;
