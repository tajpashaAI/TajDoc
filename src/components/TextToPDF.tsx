import React, { useState } from 'react';

interface TextToPDFProps {
  authToken?: string | null;
  onSuccess?: () => void;
  onAuthError?: () => void;
}

export default function TextToPDF({ authToken, onSuccess, onAuthError }: TextToPDFProps) {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>('document.pdf');

  const handleGenerate = async () => {
    setError(null);

    if (!text.trim()) {
      setError('Please enter some text.');
      return;
    }

    setLoading(true);
    setDownloadUrl(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch('/text-to-pdf', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: title.trim(),
          text: text.trim(),
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          if (onAuthError) onAuthError();
          throw new Error('Session expired or authentication required. Please log in.');
        }

        let errorMsg = 'Unable to create PDF.';
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            errorMsg = errData.error;
          }
        } catch {
          // Response is not JSON
        }
        throw new Error(errorMsg);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setDownloadUrl(url);
      setDownloadFilename('document.pdf');
      if (onSuccess) onSuccess();

      // Automatically trigger browser download
      const link = document.createElement('a');
      link.href = url;
      link.download = 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Unable to create PDF.');
      } else {
        setError('Unable to create PDF.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setTitle('');
    setText('');
    setError(null);
    setDownloadUrl(null);
  };

  return (
    <section id="text-to-pdf-section" className="border-2 border-black p-6 flex flex-col justify-between bg-white text-black">
      <div className="flex flex-col flex-grow">
        <div className="flex justify-between items-center border-b border-black pb-2 mb-6">
          <h2 className="text-xl font-bold tracking-tight">TEXT TO PDF</h2>
          {(title || text) && (
            <button
              id="clear-text-btn"
              type="button"
              onClick={handleReset}
              className="text-xs uppercase font-mono tracking-wider underline hover:text-gray-600"
            >
              Reset
            </button>
          )}
        </div>

        <div className="space-y-4 flex flex-col flex-grow">
          <div>
            <label htmlFor="doc-title-input" className="block text-xs font-bold uppercase tracking-wider mb-2">
              Document Title
            </label>
            <input
              id="doc-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title..."
              className="w-full border border-black p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black transition-all"
            />
          </div>

          <div className="flex flex-col flex-grow">
            <label htmlFor="doc-text-input" className="block text-xs font-bold uppercase tracking-wider mb-2">
              Text Content
            </label>
            <textarea
              id="doc-text-input"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (error) setError(null);
              }}
              rows={8}
              placeholder="Enter or paste your text here..."
              className="w-full flex-grow border border-black p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-black min-h-[160px] transition-all font-mono"
            />
          </div>
        </div>

        {error && (
          <div id="text-error-msg" className="mt-4 p-3 bg-red-50 border border-black text-xs font-mono font-bold text-red-700">
            {error}
          </div>
        )}
      </div>

      <div>
        <button
          id="generate-pdf-btn"
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-black text-white py-4 font-bold uppercase tracking-widest mt-8 hover:bg-gray-800 disabled:opacity-50 transition-colors cursor-pointer"
        >
          {loading ? 'Generating PDF...' : 'Generate PDF'}
        </button>

        {downloadUrl && (
          <div id="download-text-container" className="mt-4 p-3 bg-gray-100 border border-black text-center">
            <a
              id="download-text-link"
              href={downloadUrl}
              download={downloadFilename}
              className="text-sm font-bold uppercase tracking-wider underline block hover:text-gray-700"
            >
              Download PDF
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
