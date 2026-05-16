import { useState, useRef, useEffect } from 'react';

const API_BASE = 'http://localhost:3000/api';

export interface ThumbnailLightboxProps {
  videoHash: string;
  thumbIndex: number;
  thumbnailCount: number;
  onClose: () => void;
  onNavigate: (direction: -1 | 1) => void;
}

export default function ThumbnailLightbox({ videoHash, thumbIndex, thumbnailCount, onClose, onNavigate }: ThumbnailLightboxProps) {
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const imgContainerRef = useRef<HTMLDivElement>(null);
  const zoomCache = useRef<Record<number, number>>({});

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onNavigate(-1);
      if (e.key === 'ArrowRight') onNavigate(1);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, onNavigate]);

  useEffect(() => {
    setImgLoaded(false);
    const cached = zoomCache.current[thumbIndex];
    setZoom(cached ?? 1);
  }, [videoHash, thumbIndex]);

  useEffect(() => {
    zoomCache.current[thumbIndex] = zoom;
  }, [zoom, thumbIndex]);

  useEffect(() => {
    const container = imgContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((prev) => Math.min(3, Math.max(1, Math.round((prev + delta) * 10) / 10)));
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  const src = `${API_BASE.replace('/api', '')}/api/thumbnail-files/${videoHash}/${thumbIndex + 1}.jpg`;
  const canGoLeft = thumbIndex > 0;
  const canGoRight = thumbIndex < thumbnailCount - 1;
  const maxW = window.innerWidth / 2;
  const maxH = window.innerHeight / 2;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.75)',
        animation: 'fade-in 200ms ease',
      }}
      onClick={onClose}
      onMouseMove={(e) => {
        const x = e.clientX;
        const vw = window.innerWidth;
        const edgeThreshold = vw * 0.08;
        setShowLeft(canGoLeft && x < edgeThreshold);
        setShowRight(canGoRight && x > vw - edgeThreshold);
      }}
      onMouseLeave={() => {
        setShowLeft(false);
        setShowRight(false);
      }}
    >
      <div
        ref={imgContainerRef}
        style={{
          position: 'relative',
          maxWidth: `${maxW}px`,
          maxHeight: `${maxH}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {!imgLoaded && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: '#fff',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
          </div>
        )}
        <img
          key={`${videoHash}-${thumbIndex}`}
          src={src}
          onLoad={() => setImgLoaded(true)}
          style={{
            maxWidth: `${maxW}px`,
            maxHeight: `${maxH}px`,
            objectFit: 'contain',
            opacity: imgLoaded ? 1 : 0,
            transition: 'opacity 200ms ease, transform 200ms ease',
            borderRadius: '4px',
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        />
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onNavigate(-1); }}
        style={{
          position: 'fixed',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'none',
          border: 'none',
          color: '#fff',
          fontSize: '28px',
          cursor: canGoLeft ? 'pointer' : 'default',
          opacity: showLeft ? 1 : 0,
          transition: 'opacity 200ms ease',
          outline: 'none',
          padding: 0,
          lineHeight: 1,
          fontFamily: 'var(--font-mono)',
          zIndex: 1001,
        }}
        disabled={!canGoLeft}
      >
        &lt;
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); onNavigate(1); }}
        style={{
          position: 'fixed',
          right: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'none',
          border: 'none',
          color: '#fff',
          fontSize: '28px',
          cursor: canGoRight ? 'pointer' : 'default',
          opacity: showRight ? 1 : 0,
          transition: 'opacity 200ms ease',
          outline: 'none',
          padding: 0,
          lineHeight: 1,
          fontFamily: 'var(--font-mono)',
          zIndex: 1001,
        }}
        disabled={!canGoRight}
      >
        &gt;
      </button>

      <div style={{
        position: 'absolute',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        color: 'rgba(255,255,255,0.6)',
        fontSize: '12px',
        fontFamily: 'var(--font-mono)',
      }}>
        <span>{thumbIndex + 1} / {thumbnailCount}</span>
        <span style={{
          width: '1px',
          height: '12px',
          background: 'rgba(255,255,255,0.2)',
        }} />
        <span>{Math.round(zoom * 100)}%</span>
        {zoom !== 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); setZoom(1); }}
            style={{
              background: 'none',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '3px',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '11px',
              cursor: 'pointer',
              padding: '2px 6px',
              fontFamily: 'var(--font-ui)',
              lineHeight: '16px',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
            }}
          >
            复位
          </button>
        )}
      </div>
    </div>
  );
}
