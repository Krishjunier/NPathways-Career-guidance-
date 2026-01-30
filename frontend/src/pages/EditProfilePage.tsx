import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiService } from '../services/api';
import { ArrowLeft, Save, User, Mail, Phone, Briefcase } from 'lucide-react';

const EditProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const userIdParam = searchParams.get('userId');

    const [userId, setUserId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        status: 'Student'
    });

    useEffect(() => {
        const init = async () => {
            let uid = userIdParam;

            // Fallback to local storage if no param
            if (!uid || uid === 'undefined') {
                try {
                    const u = JSON.parse(localStorage.getItem('cc_user') || '{}');
                    uid = u.userId || u.id || u._id;
                } catch (e) {
                    console.error("Error parsing user from storage", e);
                }
            }

            if (!uid) {
                navigate('/');
                return;
            }

            setUserId(uid);

            try {
                // Fetch current data using portfolio API as it aggregates everything
                const res = await apiService.getPortfolioData(uid);
                const info = res.portfolio?.personalInfo || {};

                setFormData({
                    name: info.name || '',
                    email: info.email || '',
                    phone: info.phone || '',
                    status: info.status || 'Student'
                });
            } catch (err) {
                console.error("Failed to fetch profile for editing", err);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [userIdParam, navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Send update to backend
            await apiService.updateProfile(userId, {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                class_status: formData.status // Backend often expects 'class_status' or 'status' in profile
            });

            // Update local storage metadata
            try {
                const stored = JSON.parse(localStorage.getItem('cc_user') || '{}');
                stored.name = formData.name;
                stored.email = formData.email;
                if (formData.phone) stored.phone = formData.phone;
                localStorage.setItem('cc_user', JSON.stringify(stored));
            } catch (e) { }

            // Navigate back to portfolio
            navigate(`/profile/${userId}`);
        } catch (err) {
            console.error("Update failed", err);
            alert("Failed to update profile. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-vh-100 bg-surface flex-center">
                <div className="spinner-border text-primary" role="status" />
            </div>
        );
    }

    return (
        <div className="min-vh-100 bg-surface d-flex flex-column font-sans text-primary">
            {/* Simple Navbar */}
            <nav className="py-4 px-5 bg-white border-bottom sticky-top z-10 d-flex justify-content-between align-items-center">
                <button onClick={() => navigate(-1)} className="btn btn-ghost d-flex align-items-center gap-2 text-dark fw-bold">
                    <ArrowLeft size={20} /> Back
                </button>
                <span className="fw-bolder h5 mb-0" style={{ fontFamily: 'Montserrat' }}>Edit Profile</span>
                <div style={{ width: 80 }}></div> {/* Spacer */}
            </nav>

            <div className="container py-5" style={{ maxWidth: '600px' }}>
                <div className="glass-card p-5 bg-white border">
                    <h1 className="h3 fw-bold mb-4">Update Your Information</h1>

                    <form onSubmit={handleSubmit} className="d-flex flex-column gap-4">

                        {/* Name */}
                        <div>
                            <label className="form-label fw-bold small text-secondary text-uppercase">Full Name</label>
                            <div className="input-group">
                                <span className="input-group-text bg-white border-end-0 text-secondary"><User size={18} /></span>
                                <input
                                    type="text"
                                    name="name"
                                    className="form-control border-start-0 ps-0 shadow-none py-2"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        {/* Email (Read Only usually, but let's allow edit if backend supports it) */}
                        <div>
                            <label className="form-label fw-bold small text-secondary text-uppercase">Email Address</label>
                            <div className="input-group">
                                <span className="input-group-text bg-white border-end-0 text-secondary"><Mail size={18} /></span>
                                <input
                                    type="email"
                                    name="email"
                                    className="form-control border-start-0 ps-0 shadow-none py-2 bg-light text-muted"
                                    value={formData.email}
                                    onChange={handleChange}
                                    readOnly title="Email cannot be changed directly"
                                />
                            </div>
                            <div className="form-text small">Email cannot be changed.</div>
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="form-label fw-bold small text-secondary text-uppercase">Phone Number</label>
                            <div className="input-group">
                                <span className="input-group-text bg-white border-end-0 text-secondary"><Phone size={18} /></span>
                                <input
                                    type="tel"
                                    name="phone"
                                    className="form-control border-start-0 ps-0 shadow-none py-2"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+91..."
                                />
                            </div>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="form-label fw-bold small text-secondary text-uppercase">Current Status</label>
                            <div className="input-group">
                                <span className="input-group-text bg-white border-end-0 text-secondary"><Briefcase size={18} /></span>
                                <select
                                    name="status"
                                    className="form-select border-start-0 ps-0 shadow-none py-2"
                                    value={formData.status}
                                    onChange={handleChange}
                                >
                                    <option value="Student">Student</option>
                                    <option value="Working Professional">Working Professional</option>
                                    <option value="Parent">Parent/Guardian</option>
                                </select>
                            </div>
                        </div>

                        <hr className="my-2 opacity-10" />

                        <div className="d-flex gap-3">
                            <button
                                type="button"
                                onClick={() => navigate(`/profile/${userId}`)}
                                className="btn btn-light flex-grow-1"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-dark flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                                disabled={saving}
                            >
                                {saving ? <span className="spinner-border spinner-border-sm" /> : <Save size={18} />}
                                Save Changes
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditProfilePage;
