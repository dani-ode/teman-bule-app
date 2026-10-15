/**
 * SSE Client for React Native
 * Lightweight wrapper around react-native-sse for chat streaming.
 */
import EventSource, { CustomEvent } from 'react-native-sse';
import { envConfig } from '@/config/env.config';

export type SseEventType =
  | 'started'
  | 'transcript'
  | 'text_delta'
  | 'usage_updated'
  | 'completed'
  | 'failed';

export interface SseStartedData {
  readonly request_id: string;
  readonly session_id: string;
  readonly schema_version: string;
  readonly user_message_id?: string;
}

export interface SseTranscriptData {
  readonly text: string;
}

export interface SseTextDeltaData {
  readonly text: string;
}

export interface SseUsageData {
  readonly usage: {
    readonly input_tokens: number;
    readonly output_tokens: number;
  };
}

export interface SseCompletedData {
  readonly message_id: string;
  readonly session_id: string;
  readonly audio_url?: string | null;
  readonly audio_duration_ms?: number | null;
  readonly [key: string]: unknown;
}

export interface SseFailedData {
  readonly code: string;
  readonly message: string;
  readonly status_code?: number;
}

export interface SseStreamCallbacks {
  readonly onStarted?: (data: SseStartedData) => void;
  readonly onTranscript?: (data: SseTranscriptData) => void;
  readonly onTextDelta?: (data: SseTextDeltaData) => void;
  readonly onUsageUpdated?: (data: SseUsageData) => void;
  readonly onCompleted?: (data: SseCompletedData) => void;
  readonly onFailed?: (data: SseFailedData) => void;
  readonly onError?: (error: Error) => void;
}

export interface SseStreamConfig {
  readonly path: string;
  readonly method?: 'POST' | 'GET';
  readonly headers?: Record<string, string>;
  readonly body?: unknown;
  readonly accessToken: string;
}

export interface SseStreamHandle {
  readonly close: () => void;
}

export class SseStream {
  private eventSource: EventSource<SseEventType> | null = null;
  private callbacks: SseStreamCallbacks = {};
  private closed = false;

  constructor(private readonly config: SseStreamConfig) {}

  public on<K extends keyof SseStreamCallbacks>(
    event: K,
    callback: NonNullable<SseStreamCallbacks[K]>,
  ): this {
    this.callbacks[event] = callback;
    return this;
  }

  public start(): SseStreamHandle {
    if (this.eventSource) {
      throw new Error('SSE stream already started');
    }

    const url = `${envConfig.apiBaseUrl}${this.config.path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      Authorization: `Bearer ${this.config.accessToken}`,
      ...this.config.headers,
    };

    this.eventSource = new EventSource<SseEventType>(url, {
      method: this.config.method ?? 'POST',
      headers,
      body: this.config.body ? JSON.stringify(this.config.body) : undefined,
      debug: __DEV__,
    });

    const handleEvent = <T>(eventType: SseEventType, callback?: (data: T) => void) => {
      this.eventSource?.addEventListener(eventType, (event) => {
        if (this.closed || !callback) return;
        try {
          const data = JSON.parse((event as CustomEvent<typeof eventType>).data ?? '{}') as T;
          callback(data);
          if (eventType === 'completed' || eventType === 'failed') this.close();
        } catch (err) {
          this.callbacks.onError?.(err instanceof Error ? err : new Error(`Parse error: ${eventType}`));
          this.close();
        }
      });
    };

    handleEvent<SseStartedData>('started', this.callbacks.onStarted);
    handleEvent<SseTranscriptData>('transcript', this.callbacks.onTranscript);
    handleEvent<SseTextDeltaData>('text_delta', this.callbacks.onTextDelta);
    handleEvent<SseUsageData>('usage_updated', this.callbacks.onUsageUpdated);
    handleEvent<SseCompletedData>('completed', this.callbacks.onCompleted);
    handleEvent<SseFailedData>('failed', this.callbacks.onFailed);

    this.eventSource.addEventListener('error', (event) => {
      if (this.closed) return;
      const msg = event.type === 'timeout' ? 'timeout' : event.type === 'exception' ? event.error?.message : 'connection error';
      this.callbacks.onError?.(new Error(`SSE: ${msg}`));
      this.close();
    });

    return { close: () => this.close() };
  }

  public close(): void {
    if (this.closed) return;
    this.closed = true;
    this.eventSource?.close();
    this.eventSource = null;
  }
}

export const createSseStream = (config: SseStreamConfig): SseStream => new SseStream(config);
