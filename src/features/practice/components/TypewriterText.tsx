/**
 * TypewriterText
 *
 * Render teks dengan animasi ketikan per-token (kata). Dipakai untuk balasan
 * AI agar muncul bertahap bersamaan dengan audio yang diputar.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Text } from '@/ui/components/Text';

export interface TypewriterTextProps {
  readonly text: string;
  /** Interval antar-token (ms). */
  readonly intervalMs?: number;
  /** Nonaktifkan animasi; tampilkan penuh seketika. */
  readonly instant?: boolean;
  readonly className?: string;
  readonly onDone?: () => void;
}

const tokenize = (text: string): string[] => text.split(/(\s+)/).filter((t) => t.length > 0);

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  intervalMs = 40,
  instant = false,
  className,
  onDone,
}) => {
  const [count, setCount] = useState(0);
  const tokens = useRef<string[]>([]);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    tokens.current = tokenize(text);
    if (instant) {
      setCount(tokens.current.length);
      return;
    }
    setCount(0);
    const timer = setInterval(() => {
      setCount((c) => {
        if (c >= tokens.current.length) {
          clearInterval(timer);
          onDoneRef.current?.();
          return c;
        }
        return c + 1;
      });
    }, intervalMs);
    return () => clearInterval(timer);
  }, [text, instant, intervalMs]);

  const shown = instant ? text : tokens.current.slice(0, count).join('');

  return (
    <Text variant="body" weight="regular" className={`text-[17px] leading-[24px] ${className ?? ''}`}>
      {shown}
    </Text>
  );
};
