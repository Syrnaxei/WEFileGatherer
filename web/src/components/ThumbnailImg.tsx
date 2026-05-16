import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:3000/api';

export interface ThumbnailImgProps {
  videoHash?: string;
  index: number;
  thumbnailCount: number;
  onClick?: () => void;
}

export default function ThumbnailImg({ videoHash, index, onClick }: ThumbnailImgProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const src = videoHash
    ? `${API_BASE.replace('/api', '')}/api/thumbnail-files/${videoHash}/${index + 1}.jpg`
    : '';

  useEffect(() => {
    if (!src) return;
    setLoaded(false);
    setError(false);
  }, [src]);

  useEffect(() => {
    if (!src || loaded || error) return;
    if (retryCount >= 20) return;
    const timer = setTimeout(() => {
      setRetryCount((prev) => prev + 1);
    }, 1000 + retryCount * 500);
    return () => clearTimeout(timer);
  }, [src, loaded, error, retryCount]);

  if (!src) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-surface-3)',
        borderRadius: 'var(--radius-sm)',
      }}>
        <div style={{
          width: '16px',
          height: '16px',
          border: '2px solid var(--border-default)',
          borderTopColor: 'var(--accent)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-surface-3)',
        borderRadius: 'var(--radius-sm)',
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      borderRadius: 'var(--radius-sm)',
      overflow: 'hidden',
      background: 'var(--bg-surface-3)',
      cursor: onClick ? 'pointer' : 'default',
    }} onClick={onClick}>
      {!loaded && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            width: '16px',
            height: '16px',
            border: '2px solid var(--border-default)',
            borderTopColor: 'var(--accent)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
        </div>
      )}
      <img
        key={`${videoHash}-${index}-${retryCount}`}
        src={src}
        loading="eager"
        onLoad={() => { setLoaded(true); setError(false); }}
        onError={() => {
          if (retryCount < 20) {
            setError(false);
          } else {
            setError(true);
          }
        }}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: loaded ? 'block' : 'none',
          borderRadius: 'var(--radius-sm)',
        }}
      />
    </div>
  );
}
