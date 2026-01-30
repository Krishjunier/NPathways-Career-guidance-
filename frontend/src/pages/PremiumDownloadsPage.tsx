import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, RefreshCw, FileText, Trash2, Crown, ShieldCheck, Eye, Star } from 'lucide-react';

type ExportFile = {
    id: string;
    name: string;
    type: "pdf" | "excel" | "other";
    url?: string;
    createdAt?: string;
    size?: number;
};

// Props to receive common data/handlers from the parent wrapper
interface Props {
    userId: string;
}

export default function PremiumDownloadsPage({ userId }: Props) {
    const [loading, setLoading] = useState(true);
    const [files, setFiles] = useState<ExportFile[]>([]);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [downloading, setDownloading] = useState<string | null>(null);

    useEffect(() => {
        async function loadFiles() {
            setLoading(true);
            try {
                const encodedUserId = encodeURIComponent(userId ?? "");
                const res = await fetch(`https://npathways-career-guidance.onrender.com/api/export/files/${encodedUserId}`);

                if (!res.ok) {
                    if (res.status === 404) {
                        setFiles([]);
                        return;
                    }
                    throw new Error(`Server error (${res.status})`);
                }

                const data = await res.json();
                setFiles(Array.isArray(data) ? data : data.files ?? []);
            } catch (err: any) {
                console.error("DownloadsPage load error:", err);
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
            if (file.url) {
                window.open(file.url, "_blank");
                return;
            }
            const res = await fetch(`https://npathways-career-guidance.onrender.com/api/export/file/${encodeURIComponent(file.id)}`);
            if (!res.ok) throw new Error(`Download failed (${res.status})`);
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = file.name || `download.${file.type === "excel" ? "xlsx" : "pdf"}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(blobUrl);
        } catch (err: any) {
            console.error("Download error:", err);
            alert("Failed to download file.");
        } finally {
            setDownloading(null);
        }
    }

    async function handleDelete(fileId: string) {
        if (!window.confirm("Delete this file permanently?")) return;
        setDeletingId(fileId);
        try {
            const res = await fetch(`https://npathways-career-guidance.onrender.com/api/export/files/${encodeURIComponent(fileId)}`, {
                method: "DELETE"
            });
            if (!res.ok) throw new Error(`Delete failed (${res.status})`);
            setFiles((prev) => prev.filter((f) => f.id !== fileId));
        } catch (err: any) {
            console.error("Delete error:", err);
            alert("Failed to delete file.");
        } finally {
            setDeletingId(null);
        }
    }

    async function handleGeneratePDF() {
        if (!userId) return;
        setDownloading("generate-pdf");
        try {
            window.open(`https://npathways-career-guidance.onrender.com/api/portfolio/generate/${userId}`, "_blank");
            setTimeout(() => {
                setDownloading(null);
            }, 3000);
        } catch (err: any) {
            console.error("PDF generation error:", err);
            alert("Failed to generate PDF. Please try again.");
            setDownloading(null);
        }
    }

    async function handleRefreshPortfolio() {
        if (!userId) return;
        setDownloading("refresh");
        try {
            await fetch(`https://npathways-career-guidance.onrender.com/api/portfolio/refresh/${userId}`, { method: "POST" });
            window.location.reload();
        } catch (err) {
            console.error("Refresh error:", err);
        } finally {
            setDownloading(null);
        }
    }

    return (
        <div className="min-vh-100 font-sans" style={{ background: '#0f172a', color: '#e2e8f0' }}>
            {/* Premium Dark Theme Background */}

            <div className="container py-5" style={{ maxWidth: '1000px' }}>

                {/* Header */}
                <div className="d-flex align-items-center justify-content-between mb-5">
                    <Link to={`/profile/${userId}`} className="btn btn-outline-light rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: 40, height: 40, opacity: 0.7 }}>
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="text-center">
                        <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                            <Crown size={24} className="text-warning" fill="currentColor" />
                            <span className="text-warning fw-bold small tracking-widest text-uppercase">Premium Access</span>
                        </div>
                        <h1 className="h3 fw-bold text-white mb-0">Resource Library</h1>
                    </div>
                    <button onClick={handleRefreshPortfolio} className="btn btn-outline-light rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: 40, height: 40, opacity: 0.7 }}>
                        <RefreshCw size={18} className={downloading === "refresh" ? "spin" : ""} />
                    </button>
                </div>

                {/* Hero Section */}
                <div className="position-relative overflow-hidden rounded-4 p-5 mb-5" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="position-absolute top-0 end-0 opacity-10 p-4">
                        <FileText size={200} />
                    </div>
                    <div className="position-relative z-1">
                        <h2 className="display-6 fw-bold text-white mb-3">Your Career Portfolio</h2>
                        <p className="lead text-secondary mb-4" style={{ maxWidth: '500px' }}>
                            Access your personalized career reports, analysis data, and expert recommendations in high-quality formats.
                        </p>
                        <div className="d-flex gap-3">
                            <button
                                onClick={handleGeneratePDF}
                                disabled={downloading === 'generate-pdf'}
                                className="btn btn-warning text-dark px-4 py-3 rounded-3 fw-bold d-flex align-items-center gap-2 hover-scale shadow-lg"
                            >
                                {downloading === 'generate-pdf' ? (
                                    <>Generating...</>
                                ) : (
                                    <><Download size={20} /> Download PDF Report</>
                                )}
                            </button>
                            <button className="btn btn-outline-light px-4 py-3 rounded-3 fw-bold d-flex align-items-center gap-2">
                                <Eye size={20} /> Preview
                            </button>
                        </div>
                    </div>
                </div>

                {/* Files Grid */}
                <div className="row g-4">
                    <div className="col-12">
                        <div className="d-flex align-items-center justify-content-between mb-4">
                            <h3 className="h5 fw-bold text-white mb-0">Your Files</h3>
                            <div className="d-flex align-items-center gap-2 text-success small">
                                <ShieldCheck size={16} />
                                <span>Secure & Verified</span>
                            </div>
                        </div>

                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status" />
                            </div>
                        ) : files.length === 0 ? (
                            <div className="p-5 rounded-4 text-center" style={{ border: '2px dashed rgba(255,255,255,0.1)' }}>
                                <p className="text-secondary mb-0">No generated files yet. Click "Download PDF Report" to create one.</p>
                            </div>
                        ) : (
                            <div className="d-flex flex-column gap-3">
                                {files.map(file => (
                                    <div key={file.id} className="p-4 rounded-3 d-flex align-items-center justify-content-between transition-all hover-bg-light-opacity"
                                        style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div className="d-flex align-items-center gap-4">
                                            <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: 50, height: 50, background: 'rgba(255,255,255,0.05)' }}>
                                                <FileText size={24} className="text-info" />
                                            </div>
                                            <div>
                                                <h5 className="h6 fw-bold text-white mb-1">{file.name}</h5>
                                                <div className="d-flex gap-3 small text-secondary">
                                                    <span>{file.type ? file.type.toUpperCase() : 'PDF'}</span>
                                                    <span>•</span>
                                                    <span>{file.createdAt ? new Date(file.createdAt).toLocaleDateString() : 'Just now'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="d-flex align-items-center gap-3">
                                            <button
                                                onClick={() => handleDownload(file)}
                                                className="btn btn-sm btn-light rounded-pill px-3 fw-bold"
                                                disabled={downloading === file.id}
                                            >
                                                Download
                                            </button>
                                            <button
                                                onClick={() => handleDelete(file.id)}
                                                className="btn btn-sm btn-ghost text-danger opacity-50 hover-opacity-100"
                                                disabled={deletingId === file.id}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Suggested Resources (Upsell) */}
                <div className="mt-5 pt-5 border-top border-white border-opacity-10">
                    <h4 className="h5 fw-bold text-white mb-4">Recommended Resources</h4>
                    <div className="row g-4">
                        {[
                            { title: "Ivy League Roadmap", price: "₹499", tag: "Guide" },
                            { title: "Scholarship Database 2026", price: "₹299", tag: "Tool" },
                            { title: "Visa Interview Cheatsheet", price: "₹199", tag: "PDF" }
                        ].map((item, idx) => (
                            <div key={idx} className="col-md-4">
                                <div className="p-3 rounded-3 h-100 d-flex flex-column justify-content-between" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div>
                                        <div className="d-flex justify-content-between mb-3">
                                            <span className="badge bg-secondary bg-opacity-25 text-white-50">{item.tag}</span>
                                            <Star size={16} className="text-warning" fill="currentColor" />
                                        </div>
                                        <h5 className="fw-bold text-white mb-2">{item.title}</h5>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top border-white border-opacity-10">
                                        <span className="text-warning fw-bold">{item.price}</span>
                                        <button className="btn btn-sm btn-outline-light rounded-pill px-3">View</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            <style>{`
        .hover-scale:hover { transform: scale(1.02); }
        .hover-bg-light-opacity:hover { background: rgba(30, 41, 59, 0.8) !important; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
        </div>
    );
}
