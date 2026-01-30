/**
 * Score Display Component
 * Shows exam score with badge, category, normalized percentage, progress bar, suggestion, and CTAs
 */

import React from "react";
import { formatScoreDisplay } from "../utils/examCategoryUtils";
import "./ScoreDisplay.css";

interface ScoreDisplayProps {
  examName: string;
  score: number;
  maxScore: number;
  onRetakeTest?: () => void;
  onViewStudyPlan?: () => void;
  onDownloadReport?: () => void;
  showRawScore?: boolean;
  compact?: boolean;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  examName,
  score,
  maxScore,
  onRetakeTest,
  onViewStudyPlan,
  onDownloadReport,
  showRawScore = true,
  compact = false,
}) => {
  const displayData = formatScoreDisplay(score, maxScore);

  if (compact) {
    // Compact display for lists
    return (
      <div className="score-display-compact">
        <div className="score-header">
          <h4>{examName}</h4>
          <span className="badge-inline" style={{ backgroundColor: displayData.bgColor }}>
            <span style={{ color: displayData.color }}>{displayData.category}</span>
          </span>
        </div>

        <div className="score-main">
          <div className="score-value">
            <strong>{displayData.displayScore}</strong>
            {showRawScore && (
              <small className="text-muted ms-2">({displayData.raw})</small>
            )}
          </div>

          <div className="progress-container-compact">
            <div className="progress" style={{ height: "4px" }}>
              <div
                className="progress-bar"
                style={{
                  width: `${displayData.progressPercent}%`,
                  backgroundColor: displayData.color,
                }}
                role="progressbar"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full display
  return (
    <div className="score-display-card">
      {/* Header with exam name and badge */}
      <div className="score-header-full">
        <div>
          <h3>{examName}</h3>
          <p className="score-suggestion">{displayData.suggestion}</p>
        </div>
        <div
          className="badge-large"
          style={{ backgroundColor: displayData.bgColor }}
        >
          <span style={{ color: displayData.color }}>
            <strong>{displayData.category}</strong>
          </span>
          <small style={{ color: displayData.color, opacity: 0.8 }}>
            {displayData.shortCode}
          </small>
        </div>
      </div>

      {/* Main score display */}
      <div className="score-main-full">
        <div className="score-value-display">
          <div className="score-large" style={{ color: displayData.color }}>
            {displayData.displayScore}
          </div>
          {showRawScore && (
            <div className="score-raw">Raw: {displayData.raw}</div>
          )}
        </div>

        {/* Progress bar */}
        <div className="progress-container">
          <div className="progress-label">
            <span>Progress</span>
            <span>{displayData.progressPercent.toFixed(0)}%</span>
          </div>
          <div className="progress">
            <div
              className="progress-bar"
              style={{
                width: `${displayData.progressPercent}%`,
                backgroundColor: displayData.color,
              }}
              role="progressbar"
              aria-valuenow={displayData.progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {(onRetakeTest || onViewStudyPlan || onDownloadReport) && (
        <div className="score-actions">
          {onRetakeTest && (
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={onRetakeTest}
              title="Take this exam again"
            >
              📝 Retake Test
            </button>
          )}
          {onViewStudyPlan && (
            <button
              className="btn btn-outline-success btn-sm"
              onClick={onViewStudyPlan}
              title="View personalized study plan"
            >
              📚 Study Plan
            </button>
          )}
          {onDownloadReport && (
            <button
              className="btn btn-outline-info btn-sm"
              onClick={onDownloadReport}
              title="Download detailed report"
            >
              📄 Download
            </button>
          )}
        </div>
      )}

      {/* Additional insights */}
      <div className="score-insights">
        <div className="insight-item">
          <small className="insight-label">Your Category</small>
          <strong style={{ color: displayData.color }}>
            {displayData.category}
          </strong>
        </div>
        <div className="insight-item">
          <small className="insight-label">Normalized Score</small>
          <strong>{displayData.normalized}</strong>
        </div>
        <div className="insight-item">
          <small className="insight-label">Raw Score</small>
          <strong>{displayData.raw}</strong>
        </div>
      </div>
    </div>
  );
};

export default ScoreDisplay;
