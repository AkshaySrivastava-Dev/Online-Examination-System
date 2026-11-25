import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Badge } from '../common/Badge.jsx';
import { Button } from '../common/Button.jsx';
import { formatTime } from '../../utils/formatters.js';

export function ExamReplayViewer({ timeline = [], totalDuration = 0, examTitle = 'Examination' }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x, 2x, 4x
  const timerRef = useRef(null);

  const totalSteps = timeline.length;
  const currentFrame = timeline[currentStepIndex] || timeline[0] || null;

  // Auto-play timer
  useEffect(() => {
    if (isPlaying) {
      const delay = Math.max(300, 1500 / playbackSpeed);
      timerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, delay);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, totalSteps]);

  if (!currentFrame) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        No timeline events recorded for this examination session.
      </div>
    );
  }

  const handleSeek = (e) => {
    const newIdx = parseInt(e.target.value, 10);
    setCurrentStepIndex(newIdx);
  };

  const handlePrev = () => {
    setIsPlaying(false);
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setIsPlaying(false);
    setCurrentStepIndex((prev) => Math.min(totalSteps - 1, prev + 1));
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Replay Header & Stats */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1rem 1.25rem',
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(255, 161, 22, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary)',
            }}
          >
            <Sparkles size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              ExamReplay™ Session Reconstruction
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Step {currentStepIndex + 1} of {totalSteps} • Simulated Elapsed Time: {formatTime(currentFrame.timestampSec)}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Badge variant={currentFrame.action === 'ANSWER_REVISED' ? 'warning' : 'outline'} size="md">
            {currentFrame.actionDescription}
          </Badge>
          {currentFrame.changesCount > 0 && (
            <Badge variant="warning" size="sm">
              {currentFrame.changesCount} answer revision{currentFrame.changesCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      {/* Replay Screen: Current Question State */}
      <div
        style={{
          padding: '1.5rem',
          backgroundColor: 'var(--color-surface-subtle)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-primary)' }}>
            Question {currentFrame.questionNumber}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            <Clock size={13} />
            <span>Dwell: {currentFrame.timeSpentSeconds}s</span>
            {currentFrame.confidence && (
              <Badge variant="outline" size="sm">
                Confidence: {currentFrame.confidence}
              </Badge>
            )}
          </div>
        </div>

        <div style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#FFFFFF', lineHeight: 1.5, marginBottom: '1.25rem' }}>
          {currentFrame.questionText}
        </div>

        {/* Options State at this Step */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {currentFrame.options.map((opt) => {
            const isCurrentChoice = currentFrame.currentChoice === opt.id;
            const isOriginalChoice = currentFrame.originalAnswer === opt.id;
            const isFinalChoice = currentFrame.selectedAnswer === opt.id;

            let borderCol = 'var(--color-border)';
            let bgCol = 'var(--color-surface)';
            if (isCurrentChoice) {
              borderCol = 'var(--color-primary)';
              bgCol = 'rgba(255, 161, 22, 0.08)';
            }

            return (
              <div
                key={opt.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.875rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${borderCol}`,
                  backgroundColor: bgCol,
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                    backgroundColor: isCurrentChoice ? 'var(--color-primary)' : 'var(--color-surface-hover)',
                    color: isCurrentChoice ? '#000000' : 'var(--color-text-secondary)',
                  }}
                >
                  {opt.id}
                </div>
                <div style={{ flex: 1, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                  {opt.text}
                </div>
                {isCurrentChoice && (
                  <Badge variant="primary" size="sm">
                    Candidate Selection
                  </Badge>
                )}
                {isOriginalChoice && !isCurrentChoice && (
                  <Badge variant="outline" size="sm">
                    First Choice
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Controls & Scrub Bar */}
      <div
        style={{
          padding: '1.25rem',
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {/* Timeline Range Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', minWidth: '40px' }}>
            {formatTime(currentFrame.timestampSec)}
          </span>
          <input
            type="range"
            min={0}
            max={totalSteps - 1}
            value={currentStepIndex}
            onChange={handleSeek}
            style={{
              flex: 1,
              accentColor: 'var(--color-primary)',
              cursor: 'pointer',
            }}
          />
          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', minWidth: '40px' }}>
            {formatTime(totalDuration)}
          </span>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Button variant="ghost" size="sm" onClick={handleReset} title="Reset to start">
              <RotateCcw size={15} />
            </Button>
            <Button variant="ghost" size="sm" onClick={handlePrev} disabled={currentStepIndex === 0} title="Previous step">
              <SkipBack size={15} />
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              iconLeft={isPlaying ? <Pause size={15} /> : <Play size={15} />}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleNext} disabled={currentStepIndex >= totalSteps - 1} title="Next step">
              <SkipForward size={15} />
            </Button>
          </div>

          {/* Speed Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginRight: '0.25rem' }}>Speed:</span>
            {[1, 2, 4].map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => setPlaybackSpeed(spd)}
                style={{
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${playbackSpeed === spd ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  backgroundColor: playbackSpeed === spd ? 'rgba(255, 161, 22, 0.15)' : 'transparent',
                  color: playbackSpeed === spd ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                }}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExamReplayViewer;
