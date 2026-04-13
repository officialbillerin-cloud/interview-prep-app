import { useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).href;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_TEXT_CHARS = 6000;

export type CVParserStatus = 'idle' | 'parsing' | 'done' | 'error';

export interface UseCVParserResult {
  status: CVParserStatus;
  error: string | null;
  parse: (file: File) => Promise<string | null>;
}

export function useCVParser(): UseCVParserResult {
  const [status, setStatus] = useState<CVParserStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const parse = useCallback(async (file: File): Promise<string | null> => {
    if (file.type !== 'application/pdf' && file.type !== 'text/plain') {
      setStatus('error');
      setError('Only PDF and TXT files are accepted.');
      return null;
    }
    if (file.size > MAX_FILE_SIZE) {
      setStatus('error');
      setError('File exceeds the 5 MB size limit.');
      return null;
    }

    setStatus('parsing');
    setError(null);

    try {
      let text: string;
      if (file.type === 'text/plain') {
        text = await readAsText(file);
      } else {
        text = await extractPdfText(file);
      }
      setStatus('done');
      return text.slice(0, MAX_TEXT_CHARS);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to parse file.';
      setStatus('error');
      setError(message);
      return null;
    }
  }, []);

  return { status, error, parse };
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read text file.'));
    reader.readAsText(file, 'UTF-8');
  });
}

async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pageTexts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    pageTexts.push(pageText);
  }
  return pageTexts.join('\n');
}
