/**
 * Isolated Print Utility Service for Customer Passbook & Receipts
 */

export interface PrintOptions {
  format?: 'A4' | 'thermal' | 'auto';
  title?: string;
  onComplete?: () => void;
}

export function printElement(
  target: string | HTMLElement,
  options: PrintOptions = {}
): void {
  const { format = 'A4', title = document.title || 'Pawn Ticket', onComplete } = options;

  let element: HTMLElement | null = null;
  if (typeof target === 'string') {
    element = document.getElementById(target);
  } else {
    element = target;
  }

  if (!element) {
    console.warn(`[printService] Target element not found:`, target);
    window.print();
    return;
  }

  // Create an isolated iframe for printing
  const iframe = document.createElement('iframe');
  iframe.id = 'customer-print-frame';
  iframe.setAttribute(
    'style',
    'position: fixed; right: 0; bottom: 0; width: 0; height: 0; border: 0; opacity: 0; pointer-events: none; z-index: -9999;'
  );
  document.body.appendChild(iframe);

  const iframeWin = iframe.contentWindow;
  const iframeDoc = iframeWin?.document;

  if (!iframeDoc || !iframeWin) {
    document.body.removeChild(iframe);
    window.print();
    return;
  }

  // Collect styles
  let styleMarkup = '';
  document.querySelectorAll('style, link[rel="stylesheet"]').forEach(node => {
    styleMarkup += node.outerHTML + '\n';
  });

  const pageCss =
    format === 'thermal'
      ? `@page { size: 80mm auto; margin: 2mm 3mm; }`
      : `@page { size: A4 portrait; margin: 6mm 8mm; }`;

  const containerWidth = format === 'thermal' ? '80mm' : '100%';
  const containerMaxWidth = format === 'thermal' ? '80mm' : '194mm';

  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        ${styleMarkup}
        <style>
          ${pageCss}
          *, *::before, *::after {
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
            width: 100% !important;
            height: auto !important;
          }
          .printable-area {
            visibility: visible !important;
            display: block !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            width: ${containerWidth} !important;
            max-width: ${containerMaxWidth} !important;
            border-color: #cbd5e1 !important;
            page-break-after: avoid;
            page-break-inside: avoid;
          }
          .no-print {
            display: none !important;
          }
        </style>
      </head>
      <body>
        ${element.outerHTML}
      </body>
    </html>
  `);
  iframeDoc.close();

  const executePrint = () => {
    try {
      const images = Array.from(iframeDoc.images);
      const imagePromises = images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      });

      Promise.all(imagePromises).finally(() => {
        setTimeout(() => {
          try {
            iframeWin.focus();
            iframeWin.print();
          } catch (e) {
            console.error('[printService] Error during print:', e);
            window.print();
          } finally {
            if (onComplete) onComplete();
            setTimeout(() => {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
            }, 3000);
          }
        }, 150);
      });
    } catch (err) {
      console.error('[printService] Error in executePrint:', err);
      window.print();
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }
  };

  if (iframeDoc.readyState === 'complete') {
    executePrint();
  } else {
    iframe.onload = executePrint;
    setTimeout(executePrint, 350);
  }
}
