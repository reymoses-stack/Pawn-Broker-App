/**
 * Barcode Generator Utility
 * Generates real scannable Code128 barcodes as base64 PNG data URLs
 * using JsBarcode on an offscreen canvas.
 * 
 * The generated PNG embeds correctly in printed iframes and HTML templates.
 */
import JsBarcode from 'jsbarcode';

export interface BarcodeOptions {
  /** Width multiplier for each bar (default: 2) */
  barWidth?: number;
  /** Pixel height of the barcode bars (not total image) */
  height?: number;
  /** Show human-readable text below bars */
  displayValue?: boolean;
  /** Font size for text below barcode (px) */
  fontSize?: number;
  /** Margin on each side (px) */
  margin?: number;
  /** Bar color */
  lineColor?: string;
  /** Background color */
  background?: string;
}

/**
 * Returns a base64 PNG data URL of a real Code128 barcode.
 * Safe to use in <img src={...} /> and in print iframes.
 */
export function generateBarcodeDataUrl(
  text: string,
  options: BarcodeOptions = {}
): string {
  if (!text?.trim()) return '';

  const {
    barWidth = 2,
    height = 50,
    displayValue = true,
    fontSize = 12,
    margin = 8,
    lineColor = '#000000',
    background = '#ffffff',
  } = options;

  try {
    const canvas = document.createElement('canvas');
    // JsBarcode auto-sizes the canvas internally
    JsBarcode(canvas, text.trim(), {
      format: 'CODE128',
      lineColor,
      background,
      width: barWidth,
      height,
      displayValue,
      font: 'monospace',
      textAlign: 'center',
      textPosition: 'bottom',
      textMargin: 2,
      fontSize,
      margin,
      valid: () => true, // don't throw for unusual chars
    });
    return canvas.toDataURL('image/png');
  } catch (err) {
    console.warn('[barcodeService] JsBarcode failed for text:', text, err);
    return '';
  }
}

/**
 * Pre-generates barcode data URLs for all key IDs on a pawn ticket:
 *   - mortgageNumber (e.g. GM-2026-00001) — for loan / payment collection scanning
 *   - packetId       (e.g. PKT-2026-000001) — for vault retrieval scanning
 *   - customerId     (e.g. CUS-000001)      — for customer lookup scanning
 */
export interface PawnTicketBarcodes {
  mortgageBarcode: string;
  packetBarcode: string;
  customerBarcode: string;
}

export function generatePawnTicketBarcodes(
  mortgageNumber?: string,
  packetId?: string,
  customerId?: string
): PawnTicketBarcodes {
  return {
    mortgageBarcode: mortgageNumber ? generateBarcodeDataUrl(mortgageNumber, { barWidth: 2, height: 46, fontSize: 11 }) : '',
    packetBarcode:   packetId       ? generateBarcodeDataUrl(packetId,       { barWidth: 2, height: 40, fontSize: 10 }) : '',
    customerBarcode: customerId     ? generateBarcodeDataUrl(customerId,     { barWidth: 1.8, height: 36, fontSize: 10 }) : '',
  };
}
