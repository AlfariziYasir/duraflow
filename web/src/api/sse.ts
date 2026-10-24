import { useEffect, useRef } from 'react';
import type { HistoryEvent } from './types';

export function useWorkflowEventStream(
  runId: string | undefined,
  onEvent: (event: HistoryEvent) => void,
  onError?: (error: Event) => void
) {
  const onEventRef = useRef(onEvent);
  const onErrorRef = useRef(onError);
  onEventRef.current = onEvent;
  onErrorRef.current = onError;

  useEffect(() => {
    if (!runId) return;

    const eventSource = new EventSource(`/api/v1/workflows/${runId}/stream`);

    eventSource.onmessage = (e) => {
      try {
        const parsed: HistoryEvent = JSON.parse(e.data);
        onEventRef.current(parsed);
      } catch (err) {
        console.error('Failed to parse SSE event payload:', err);
      }
    };

    eventSource.onerror = (err) => {
      if (onErrorRef.current) onErrorRef.current(err);
    };

    return () => {
      eventSource.close();
    };
  }, [runId]);
}
