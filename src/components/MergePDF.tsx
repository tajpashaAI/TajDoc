import React, { useState, useRef } from 'react';

interface MergePDFProps {
  authToken?: string | null;
  onSuccess?: () => void;
  onAuthError?: () => void;
}

export default function MergePDF({ authToken, onSuccess, onAuthError }: MergePDFProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>('merged.pdf');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = (newFilesList: FileList | File[]) => {
    setError(null);
    setDownloadUrl(null);

    const validNewFiles: File[] = [];
    let hasNonPdf = false;

    for (let i = 0; i < newFilesList.length; i++) {
      const file = newFilesList[i];
      if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
        validNewFiles.push(file);
      } else {
        hasNonPdf = true;
      }
    }

    if (hasNonPdf) {
      setError('Only PDF files are supported.');
      if (validNewFiles.length === 0) return;
    }

    setFiles((prev) => {
      const combined = [...prev, ...validNewFiles];
      if (combined.length > 5) {
        setError('Maximum of 5 PDF files allowed. Kept the first 5 files.');
        return combined.slice(0, 5);
      }
      return combined;
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const removeFile = (indexToRemove: number) => {
    setError(null);
    setDownloadUrl(null);
    setFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    setFiles((prev) => {
      const next = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  const handleMerge = async () => {
    setError(null);

    if (files.length < 2) {
      setError('Please select at least 2 PDF files to merge.');
      return;
    }

    if (files.length > 5) {
      setError('You can merge a maximum of 5 PDF files at a time.');
      return;
    }

    setLoading(true);
    setDownloadUrl(null);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const headers: Record<string, string> = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch('/merge-pdf', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 401) {
          if (onAuthError) onAuthError();
          throw new Error('Session expired or authentication required. Please log in.');
        }

        let errorMsg = 'Unable to merge the PDFs.';
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
      setDownloadFilename('merged.pdf');
      if (onSuccess) onSuccess();

      // Automatically trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = 'merged.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Unable to merge the PDFs.');
      } else {
        setError('Unable to merge the PDFs.');
      }
    } finally {
      setLoading(false);
    }
  };

  const clearFiles = () => {
    setFiles([]);
    setError(null);
    setDownloadUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <section id="merge-pdf-section" className="border-2 border-black p-6 flex flex-col justify-between bg-white text-black">
      <div>
        <div className="flex justify-between items-center border-b border-black pb-2 mb-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight">MERGE PDF FILES</h2>
            <p className="text-[11px] uppercase tracking-wider text-gray-500 mt-0.5">
              Select 2 to 5 PDFs in merge order
            </p>
          </div>
          {files.length > 0 && (
            <button
              id="clear-files-btn"
              type="button"
              onClick={clearFiles}
              className="text-xs uppercase font-mono tracking-wider underline hover:text-gray-600 cursor-pointer"
            >
              Reset All
            </button>
          )}
        </div>

        {/* Hidden Multi-file input */}
        <input
          ref={fileInputRef}
          id="multi-pdf-input"
          type="file"
          accept=".pdf,application/pdf"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
          }}
        />

        {/* Status Count Tracker */}
        <div className="flex justify-between items-center mb-4 text-xs font-mono">
          <span className="font-bold uppercase tracking-wider">Selected Files:</span>
          <span className={`px-2 py-0.5 border ${files.length >= 2 ? 'border-black bg-black text-white' : 'border-gray-400 text-gray-600'}`}>
            {files.length} / 5 (MIN 2)
          </span>
        </div>

        {/* Dropzone / File Picker */}
        {files.length < 5 && (
          <div
            id="dropzone-multi-pdf"
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border border-dashed border-gray-400 p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors mb-6"
          >
            <span className="text-sm text-gray-600 font-medium block">
              {files.length === 0
                ? '+ Choose or drag & drop 2 to 5 PDF files'
                : `+ Add another PDF (${5 - files.length} remaining)`}
            </span>
            <span className="text-[10px] text-gray-400 uppercase tracking-widest block mt-1">
              Supports selecting multiple files at once
            </span>
          </div>
        )}

        {/* Selected Files List with Order & Controls */}
        {files.length > 0 && (
          <div className="space-y-2 mb-6">
            <label className="block text-xs font-bold uppercase tracking-wider mb-2">
              Merge Sequence (top to bottom):
            </label>
            {files.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="border border-black p-2.5 bg-gray-50 flex items-center justify-between gap-2 text-sm"
              >
                <div className="flex items-center gap-2 min-w-0 flex-grow">
                  <span className="font-mono font-bold bg-black text-white text-xs px-2 py-0.5 shrink-0">
                    {idx + 1}
                  </span>
                  <div className="truncate">
                    <span className="font-medium text-black truncate block">{file.name}</span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>

                {/* Reorder and Delete controls */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    title="Move up in merge sequence"
                    disabled={idx === 0}
                    onClick={() => moveFile(idx, 'up')}
                    className="px-1.5 py-0.5 border border-black text-xs font-mono hover:bg-black hover:text-white disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-black cursor-pointer"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    title="Move down in merge sequence"
                    disabled={idx === files.length - 1}
                    onClick={() => moveFile(idx, 'down')}
                    className="px-1.5 py-0.5 border border-black text-xs font-mono hover:bg-black hover:text-white disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-black cursor-pointer"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    title="Remove file"
                    onClick={() => removeFile(idx)}
                    className="px-2 py-0.5 bg-black text-white text-xs font-mono hover:bg-gray-700 cursor-pointer ml-1"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div id="merge-error-msg" className="mt-4 p-3 bg-red-50 border border-black text-xs font-mono font-bold text-red-700">
            {error}
          </div>
        )}
      </div>

      <div>
        <button
          id="merge-pdfs-btn"
          type="button"
          onClick={handleMerge}
          disabled={loading || files.length < 2}
          className="w-full bg-black text-white py-4 font-bold uppercase tracking-widest mt-6 hover:bg-gray-800 disabled:opacity-50 transition-colors cursor-pointer"
        >
          {loading
            ? 'Merging PDFs...'
            : files.length < 2
            ? 'Select at least 2 PDFs'
            : `Merge ${files.length} PDFs`}
        </button>

        {downloadUrl && (
          <div id="download-merged-container" className="mt-4 p-3 bg-gray-100 border border-black text-center">
            <a
              id="download-merged-link"
              href={downloadUrl}
              download={downloadFilename}
              className="text-sm font-bold uppercase tracking-wider underline block hover:text-gray-700"
            >
              Download Merged PDF
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
