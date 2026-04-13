import React, { useRef, useState } from 'react';
import { useCVParser } from '../hooks/useCVParser';
import { useTailoredMode } from '../context/TailoredModeContext';
import { useTailoredQuestions } from '../hooks/useTailoredQuestions';

export function CVUploadScreen() {
  const { cvText, setCvText, jobPostingText, setJobPostingText } = useTailoredMode();
  const { status: parseStatus, error: parseError, parse } = useCVParser();
  const { generate, isGenerating, error: genError } = useTailoredQuestions();

  const [fileName, setFileName] = useState<string | null>(null);
  const [jobUrl, setJobUrl] = useState('');
  const [jobFetchError, setJobFetchError] = useState<string | null>(null);
  const [isFetchingJob, setIsFetchingJob] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setFileName(file.name);
    const text = await parse(file);
    if (text !== null) setCvText(text);
  }

  async function handleFetchJob() {
    if (!jobUrl.trim()) return;
    setIsFetchingJob(true);
    setJobFetchError(null);
    try {
      const res = await fetch('/api/fetch-job-posting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: jobUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setJobFetchError(data.error ?? 'Failed to fetch job posting.');
      } else {
        setJobPostingText(data.text ?? null);
      }
    } catch {
      setJobFetchError('Network error — could not reach the job posting URL.');
    } finally {
      setIsFetchingJob(false);
    }
  }

  async function handleStart() {
    if (!cvText) return;
    await generate(cvText, jobPostingText);
  }

  const canStart = cvText !== null && !isGenerating;

  return (
    <div className="flex flex-col gap-5 max-w-lg mx-auto w-full py-4">
      {/* CV Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
        onClick={() => inputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed
          cursor-pointer transition-all duration-200
          ${isDragOver ? 'border-blue-400 bg-blue-400/10' : 'border-white/20 hover:border-blue-400/60 hover:bg-white/5'}
          ${parseStatus === 'done' ? 'border-emerald-400/60 bg-emerald-400/5' : ''}
          ${parseStatus === 'error' ? 'border-red-400/60 bg-red-400/5' : ''}
        `}
      >
        <input ref={inputRef} type="file" accept=".pdf,.txt,application/pdf,text/plain"
          className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

        {parseStatus === 'done' && fileName ? (
          <>
            <span className="text-2xl">✅</span>
            <p className="text-sm font-bold text-emerald-300">{fileName}</p>
            <p className="text-xs text-white/40">CV parsed ({cvText?.length ?? 0} chars). Click to replace.</p>
          </>
        ) : parseStatus === 'parsing' ? (
          <>
            <span className="text-xl animate-spin">⏳</span>
            <p className="text-sm text-white/60">Parsing CV…</p>
          </>
        ) : (
          <>
            <svg className="w-10 h-10 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm font-semibold text-white/70">Drop your CV here or click to upload</p>
            <p className="text-xs text-white/30">PDF or TXT · max 5 MB</p>
          </>
        )}
      </div>

      {parseStatus === 'error' && parseError && (
        <p className="text-xs text-red-400 font-medium -mt-2">{parseError}</p>
      )}

      {/* Job posting URL */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-black uppercase tracking-widest text-white/40">
          Job Posting URL <span className="text-white/20 normal-case font-normal">(optional)</span>
        </label>
        <div className="flex gap-2">
          <input type="url" value={jobUrl} onChange={(e) => setJobUrl(e.target.value)}
            placeholder="https://linkedin.com/jobs/... or company careers page"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-blue-400/60" />
          <button onClick={handleFetchJob} disabled={!jobUrl.trim() || isFetchingJob}
            className="px-4 py-2.5 rounded-xl text-sm font-bold bg-blue-500/20 border border-blue-400/30 text-blue-200 hover:bg-blue-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            {isFetchingJob ? '…' : 'Fetch'}
          </button>
        </div>
        {jobFetchError && <p className="text-xs text-amber-400 font-medium">{jobFetchError} You can still proceed without it.</p>}
        {jobPostingText && !jobFetchError && <p className="text-xs text-emerald-400 font-medium">✓ Job posting loaded ({jobPostingText.length} chars)</p>}
      </div>

      {/* CTA */}
      <button onClick={handleStart} disabled={!canStart}
        className="w-full py-3.5 rounded-2xl font-black text-sm tracking-wide transition-all duration-200
          bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/20
          hover:shadow-blue-500/40 hover:-translate-y-0.5
          disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none">
        {isGenerating ? 'Generating tailored questions…' : 'Start Tailored Session'}
      </button>

      {isGenerating && (
        <p className="text-xs text-cyan-300/70 text-center animate-pulse">
          Analyzing your profile and generating personalized questions — ~15 seconds…
        </p>
      )}

      {genError && (
        <p className="text-xs text-amber-400 font-medium text-center">⚠ {genError} — showing fallback questions.</p>
      )}
    </div>
  );
}
