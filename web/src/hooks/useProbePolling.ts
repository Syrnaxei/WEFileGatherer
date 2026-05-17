import { useEffect, useRef, useCallback } from 'react';

const API_BASE = 'http://localhost:3000/api';

export function useProbePolling<T extends { id: string; fileSize?: number; duration?: number; bitrate?: number; probePending?: boolean }>(
  files: T[],
  setFiles: React.Dispatch<React.SetStateAction<T[]>>
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filesRef = useRef(files);
  filesRef.current = files;

  const startPolling = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const poll = async () => {
      const currentFiles = filesRef.current;
      const pendingIds = currentFiles
        .filter((f) => f.probePending)
        .map((f) => f.id);

      if (pendingIds.length === 0) {
        timerRef.current = null;
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/probe-results?ids=${pendingIds.join(',')}`);
        const data = await res.json();
        if (data.success && Object.keys(data.results).length > 0) {
          setFiles((prev) =>
            prev.map((f) => {
              const probe = data.results[f.id];
              if (probe && f.probePending) {
                return {
                  ...f,
                  fileSize: probe.fileSize || 0,
                  duration: probe.duration || 0,
                  bitrate: probe.bitrate || 0,
                  probePending: false,
                };
              }
              return f;
            })
          );
        }
      } catch {}

      const stillPending = filesRef.current.filter((f) => f.probePending);
      if (stillPending.length > 0) {
        timerRef.current = setTimeout(poll, 800);
      } else {
        timerRef.current = null;
      }
    };

    poll();
  }, [setFiles]);

  useEffect(() => {
    const hasPending = files.some((f) => f.probePending);
    if (hasPending && files.length > 0) {
      startPolling();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [files, startPolling]);
}
