/**
 * OTP Troubleshooting UI Component
 * Shows "Didn't get code?" section with action buttons and delivery status
 */

import React, { useEffect, useState } from "react";
import "./OTPTroubleshootingUI.css";

interface OTPTroubleshootingProps {
  phone: string;
  lastSentTime: Date;
  resendCooldownSeconds?: number;
  deliveryStatus?: "pending" | "sent" | "delivered" | "failed";
  onResendOTP?: () => Promise<void>;
  onCallMe?: () => Promise<void>;
  onChangeNumber?: () => void;
  onContactSupport?: () => void;
  onReportIssue?: () => void;
  loading?: boolean;
  error?: string;
}

const OTPTroubleshootingUI: React.FC<OTPTroubleshootingProps> = ({
  phone,
  lastSentTime,
  resendCooldownSeconds = 60,
  deliveryStatus = "pending",
  onResendOTP,
  onCallMe,
  onChangeNumber,
  onContactSupport,
  onReportIssue,
  loading = false,
  error,
}) => {
  const [cooldownRemaining, setCooldownRemaining] = useState(resendCooldownSeconds);
  const [isResending, setIsResending] = useState(false);
  const [isCallingMe, setIsCallingMe] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timePassed = Math.floor((now.getTime() - lastSentTime.getTime()) / 1000);
      const remaining = Math.max(0, resendCooldownSeconds - timePassed);

      setCooldownRemaining(remaining);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastSentTime, resendCooldownSeconds]);

  const handleResend = async () => {
    if (cooldownRemaining > 0) return;
    setIsResending(true);
    try {
      await onResendOTP?.();
    } finally {
      setIsResending(false);
    }
  };

  const handleCallMe = async () => {
    setIsCallingMe(true);
    try {
      await onCallMe?.();
    } finally {
      setIsCallingMe(false);
    }
  };

  const canResend = cooldownRemaining === 0;

  return (
    <div className="otp-troubleshooting">
      {/* Delivery Status Alert */}
      {deliveryStatus === "failed" && (
        <div className="alert alert-warning alert-dismissible fade show" role="alert">
          <strong>⚠️ Delivery Issue</strong>
          <p className="mb-0">
            SMS failed to deliver to {phone}. Try <strong>Call me</strong> or{" "}
            <strong>Change number</strong>.
          </p>
        </div>
      )}

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <strong>❌ Error:</strong> {error}
        </div>
      )}

      {/* Didn't Get Code Section */}
      <div className="troubleshooting-section">
        <h5>Didn't get your code?</h5>
        <p className="text-muted small">
          Try one of the options below to receive your verification code
        </p>

        {/* Last Sent Time */}
        <div className="last-sent-info">
          <small className="text-muted">
            📨 Last sent to <strong>{phone}</strong>
          </small>
          <small className="text-muted ms-2">
            • Sent{" "}
            {Math.floor((new Date().getTime() - lastSentTime.getTime()) / 1000)}s ago
          </small>
        </div>

        {/* Action Buttons Grid */}
        <div className="action-buttons">
          {/* Resend SMS */}
          <button
            className="action-btn resend-btn"
            onClick={handleResend}
            disabled={!canResend || isResending || loading}
            title={
              canResend
                ? "Request OTP via SMS again"
                : `Wait ${cooldownRemaining}s before resending`
            }
          >
            <div className="btn-icon">📱</div>
            <div className="btn-content">
              <div className="btn-label">Resend SMS</div>
              {!canResend && (
                <div className="btn-cooldown">in {cooldownRemaining}s</div>
              )}
            </div>
            {!canResend && <div className="cooldown-badge">{cooldownRemaining}</div>}
          </button>

          {/* Call Me */}
          <button
            className="action-btn call-btn"
            onClick={handleCallMe}
            disabled={isCallingMe || loading}
            title="Receive verification code via voice call"
          >
            <div className="btn-icon">☎️</div>
            <div className="btn-content">
              <div className="btn-label">Call me</div>
              <div className="btn-hint">Voice call</div>
            </div>
          </button>

          {/* Change Number */}
          <button
            className="action-btn change-btn"
            onClick={onChangeNumber}
            disabled={loading}
            title="Change phone number and restart"
          >
            <div className="btn-icon">✏️</div>
            <div className="btn-content">
              <div className="btn-label">Change number</div>
              <div className="btn-hint">Edit phone</div>
            </div>
          </button>

          {/* Contact Support */}
          <button
            className="action-btn support-btn"
            onClick={onContactSupport}
            disabled={loading}
            title="Get help from support team"
          >
            <div className="btn-icon">💬</div>
            <div className="btn-content">
              <div className="btn-label">Contact support</div>
              <div className="btn-hint">Get help</div>
            </div>
          </button>
        </div>

        {/* Report Issue Link */}
        <div className="report-issue-link">
          <button
            className="btn-link"
            onClick={() => setShowReportForm(!showReportForm)}
          >
            {showReportForm ? "Hide" : "Report an issue"}
          </button>
        </div>

        {/* Report Issue Form */}
        {showReportForm && (
          <div className="report-form">
            <h6>Report Issue</h6>
            <p className="small text-muted">
              Help us improve by reporting what went wrong
            </p>

            <div className="form-group">
              <label className="form-label">
                <input type="checkbox" /> Phone: {phone}
              </label>
            </div>

            <div className="form-group">
              <label className="form-label small">Issue Details</label>
              <textarea
                className="form-control form-control-sm"
                rows={3}
                placeholder="What happened? (e.g., 'SMS never arrived', 'Wrong code received')"
              />
            </div>

            <div className="form-group">
              <label className="form-label small">
                <input type="checkbox" /> Attach screenshot
              </label>
            </div>

            <button
              className="btn btn-sm btn-primary"
              onClick={onReportIssue}
              disabled={loading}
            >
              Send Report
            </button>
          </div>
        )}
      </div>

      {/* SMS Delivery Status Indicator */}
      <div className="delivery-status-indicator">
        <div className={`status-badge status-${deliveryStatus}`}>
          {deliveryStatus === "pending" && (
            <>
              <span className="status-spinner"></span>
              Sending...
            </>
          )}
          {deliveryStatus === "sent" && (
            <>
              <span className="status-icon">✓</span>
              SMS Sent
            </>
          )}
          {deliveryStatus === "delivered" && (
            <>
              <span className="status-icon">✓✓</span>
              Delivered
            </>
          )}
          {deliveryStatus === "failed" && (
            <>
              <span className="status-icon">✗</span>
              Failed
            </>
          )}
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="loading-overlay">
          <div className="spinner-border spinner-border-sm" role="status">
            <span className="visually-hidden">Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OTPTroubleshootingUI;
