/**
 * useBarcodeScanner
 *
 * Listens for USB/Bluetooth HID barcode scanners, which enumerate as
 * keyboard devices and send the barcode string followed by Enter very rapidly
 * (typically < 50ms per character, total < 300ms for a full code).
 *
 * Usage:
 *   useBarcodeScanner((code) => handleScan(code), { enabled: isScannerOpen });
 */
import { useEffect, useRef } from 'react';

interface BarcodeScannerOptions {
  /** Minimum characters to accept as a valid barcode (default: 3) */
  minLength?: number;
  /** Maximum time between characters in ms — faster = scanner, slower = human (default: 60ms) */
  maxCharInterval?: number;
  /** Total max time for full barcode (default: 1500ms) */
  maxTotalDuration?: number;
  /** Only fire when this is true (default: true) */
  enabled?: boolean;
  /** Prevent default browser handling of characters during scan (default: false) */
  preventDefault?: boolean;
}

export function useBarcodeScanner(
  onScan: (barcode: string) => void,
  options: BarcodeScannerOptions = {}
) {
  const {
    minLength = 3,
    maxCharInterval = 60,
    maxTotalDuration = 1500,
    enabled = true,
    preventDefault = false,
  } = options;

  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      const timeSinceLast = now - lastKeyTimeRef.current;

      // If gap too large, it's human typing — reset buffer
      if (bufferRef.current.length > 0 && timeSinceLast > maxCharInterval) {
        bufferRef.current = '';
      }

      lastKeyTimeRef.current = now;

      if (e.key === 'Enter') {
        const code = bufferRef.current.trim();
        if (code.length >= minLength) {
          if (preventDefault) e.preventDefault();
          onScan(code);
        }
        bufferRef.current = '';
        if (timerRef.current) clearTimeout(timerRef.current);
        return;
      }

      // Ignore modifier/function keys
      if (e.key.length !== 1) return;

      // Ignore events where a normal text input/textarea is focused
      const tag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
      const isTypingField = tag === 'input' || tag === 'textarea' || tag === 'select';
      
      // Allow scanner input even in text fields — scanner chars arrive too fast for human typing
      // We only block if the character interval is slow (human typing speed > 150ms between keys)
      if (isTypingField && timeSinceLast > 150) {
        bufferRef.current = '';
        return;
      }

      if (preventDefault) e.preventDefault();

      bufferRef.current += e.key;

      // Auto-flush if no Enter received within maxTotalDuration
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        bufferRef.current = '';
      }, maxTotalDuration);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, minLength, maxCharInterval, maxTotalDuration, onScan, preventDefault]);
}
