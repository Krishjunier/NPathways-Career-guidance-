import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Download, FileText, Lock, CheckCircle, Zap } from 'lucide-react';

type ExportFile = {
    id: string;
    name: string;
    type: "pdf" | "excel" | "other";
    url?: string;
    createdAt?: string;
};

interface Props {
    userId: string;
}

export default function BasicDownloadsPage({ userId }: Props) {
    const [loading, setLoading] = useState(true);
    const [files, setFiles] = useState<ExportFile[]>([]);
    const [downloading, setDownloading] = useState<string | null>(null);

    useEffect(() => {
        async function loadFiles() {
            setLoading(true);
            try {
                const encodedUserId = encodeURIComponent(userId);
                const res = await fetch(`http://localhost:5000/api/export/files/${encodedUserId}`);
                if (res.ok) {
                    const data = await res.json();
                    setFiles(Array.isArray(data) ? data : data.files ?? []);
                } else {
                    setFiles([]);
                }
            } catch (err) {
                setFiles([]);
            } finally {
                setLoading(false);
            }
        }
        loadFiles();
    }, [userId]);

    async function handleDownload(file: ExportFile) {
        setDownloading(file.id);
        try {
            const res = await fetch(`http://localhost:5000/api/export/file/${encodeURIComponent(file.id)}`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = file.name;
                a.click();
            } else {
                alert("Download failed. Please try again.");
            }
        } catch (e) {
            alert("Error downloading file.");
        } finally {
            setDownloading(null);
        }
    }

    // Basic users might only be allowed to generate PDF
    async function handleGeneratePDF() {
        setDownloading('generate');
        try {
            window.open(`http://localhost:5000/api/portfolio/generate/${userId}`, "_blank");
            setTimeout(() => setDownloading(null), 3000);
        } catch (e) {
            setDownloading(null);
        }
    }

    return (
        <div className="min-vh-100 bg-surface font-sans">
            <div className="container py-5" style={{ maxWidth: '900px' }}>

                {/* Header */}
                <div className="d-flex align-items-center mb-5 gap-3">
                    <Link to={`/profile/${userId}`} className="btn btn-outline-secondary rounded-circle p-2">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="h3 fw-bold text-dark mb-0">My Downloads</h1>
                </div>

                <div className="row g-5">
                    <div className="col-lg-8">
                        {/* Basic Section */}
                        <div className="glass-card p-4 mb-4 bg-white border">
                            <div className="d-flex align-items-center justify-content-between mb-4">
                                <h4 className="fw-bold fs-5 mb-0">Free Report</h4>
                                <span className="badge bg-secondary bg-opacity-10 text-dark">Basic Access</span>
                            </div>

                            <p className="text-secondary small mb-4">Your standard career summary report.</p>

                            <div className="d-flex gap-3">
                                <button
                                    onClick={handleGeneratePDF}
                                    disabled={downloading === 'generate'}
                                    className="btn btn-dark rounded-3 px-4 py-2 fw-bold d-flex align-items-center gap-2"
                                >
                                    {downloading === 'generate' ? 'Generating...' : <><Download size={18} /> Download Summary PDF</>}
                                </button>
                            </div>

                            {/* Existing Files List */}
                            <div className="mt-4 pt-4 border-top">
                                <h5 className="h6 fw-bold mb-3">Recent Files</h5>
                                {loading && <div className="spinner-border spinner-border-sm" />}
                                {!loading && files.length === 0 && <p className="small text-muted">No files generated.</p>}
                                {!loading && files.map(f => (
                                    <div key={f.id} className="d-flex justify-content-between align-items-center p-3 rounded-3 bg-light mb-2">
                                        <div className="d-flex align-items-center gap-3">
                                            <FileText size={20} className="text-secondary" />
                                            <span className="fw-medium small">{f.name}</span>
                                        </div>
                                        <button
                                            onClick={() => handleDownload(f)}
                                            className="btn btn-sm btn-link text-primary text-decoration-none fw-bold"
                                            disabled={downloading === f.id}
                                        >
                                            Download
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Upgrade / Premium Lock Section */}
                    <div className="col-lg-4">
                        <div className="p-4 rounded-4 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 text-white h-100 position-relative overflow-hidden" style={{ background: '#1e293b' }}>
                            <div className="position-absolute top-0 end-0 p-3 opacity-10">
                                <Lock size={100} />
                            </div>

                            <div className="position-relative z-1">
                                <div className="d-flex align-items-center gap-2 mb-3">
                                    <Zap className="text-warning" fill="currentColor" size={20} />
                                    <span className="fw-bold tracking-wide small text-uppercase text-warning">Premium Features</span>
                                </div>

                                <h3 className="h5 fw-bold mb-3">Unlock Detailed Analysis</h3>
                                <p className="small text-white-50 mb-4">Upgrade to Premium to access comprehensive Excel exports, detailed psychometric breakdowns, and expert video guides.</p>

                                <ul className="list-unstyled d-flex flex-column gap-3 mb-4 small text-white-50">
                                    <li className="d-flex gap-2 align-items-center"><Lock size={14} /> Full 20-page Career Report</li>
                                    <li className="d-flex gap-2 align-items-center"><Lock size={14} /> Spreadsheet Data Export</li>
                                    <li className="d-flex gap-2 align-items-center"><Lock size={14} /> 1-on-1 Counselling Recording</li>
                                </ul>

                                <button className="btn btn-white text-dark w-100 fw-bold rounded-3">Upgrade for ₹499</button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
