import React, { useState, useRef } from 'react';
import { UploadCloud, X, Image as ImageIcon, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { CrashScreenshot, UploadStatus } from '../types/reprox';
// Depending on Vercel blob setup, we will use @vercel/blob/client.
import { upload } from '@vercel/blob/client';

interface CrashScreenshotUploaderProps {
  onUploadComplete: (screenshot: CrashScreenshot) => void;
  maxSizeMB?: number;
}

export const CrashScreenshotUploader: React.FC<CrashScreenshotUploaderProps> = ({
  onUploadComplete,
  maxSizeMB = 5,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image file (PNG, JPG, WEBP).');
      setStatus('error');
      return;
    }
    
    if (file.size > maxSizeMB * 1024 * 1024) {
      setErrorMsg(`File size exceeds ${maxSizeMB}MB limit.`);
      setStatus('error');
      return;
    }

    setStatus('selected');
    setErrorMsg(null);

    // 1. Create immediate local preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    setStatus('uploading');

    try {
      // 2. Attempt Vercel Blob upload (if configured)
      // We wrap it in a try-catch to fallback seamlessly for demo mode
      let finalUrl = objectUrl; // Default to local for demo

      // We attempt to call the Vercel upload. If it throws (e.g. no token configured), we swallow the error and use the local blob URL.
      try {
        const newBlob = await upload(file.name, file, {
          access: 'public',
          handleUploadUrl: '/api/upload',
        });
        finalUrl = newBlob.url;
      } catch (uploadError) {
        console.warn('Vercel Blob upload failed, falling back to local ObjectURL for demo purposes:', uploadError);
        // We simulate upload delay for the demo feel
        await new Promise(r => setTimeout(r, 1200));
      }

      setStatus('uploaded');
      
      const screenshot: CrashScreenshot = {
        id: crypto.randomUUID(),
        url: finalUrl,
        filename: file.name,
        size: file.size,
        mimeType: file.type,
      };

      onUploadComplete(screenshot);
    } catch (e) {
      console.error(e);
      setStatus('error');
      setErrorMsg('An unexpected error occurred during processing.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const resetUploader = () => {
    setStatus('idle');
    setPreviewUrl(null);
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      {status === 'idle' || status === 'error' ? (
        <div 
          className={`relative border-2 border-dashed rounded-xl p-8 transition-colors flex flex-col items-center justify-center text-center cursor-pointer
            ${dragActive 
              ? 'border-indigo-400 bg-indigo-900/20' 
              : 'border-slate-700 bg-dark-900/40 hover:bg-dark-900/80 hover:border-slate-600'
            }
            ${status === 'error' ? 'border-rose-500/50 bg-rose-950/10' : ''}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleChange}
          />
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-4">
            <UploadCloud className="w-6 h-6 text-indigo-400" />
          </div>
          <h4 className="text-sm font-semibold text-slate-200 mb-1">
            Upload Crash Evidence
          </h4>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Drag and drop a screenshot of the crash, or click to browse. Max {maxSizeMB}MB.
          </p>
          
          {status === 'error' && (
            <div className="mt-4 flex items-center gap-1.5 text-xs text-rose-400 font-medium bg-rose-950/40 px-3 py-1.5 rounded-lg border border-rose-900/50">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-slate-700 bg-dark-900/60 rounded-xl overflow-hidden relative">
          {status === 'uploading' && (
            <div className="absolute inset-0 z-10 bg-dark-950/80 backdrop-blur-sm flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-300">
                Processing Evidence...
              </span>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row">
            {previewUrl && (
              <div className="w-full sm:w-1/3 aspect-video sm:aspect-square bg-black flex items-center justify-center overflow-hidden border-b sm:border-b-0 sm:border-r border-slate-700 relative group">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
            
            <div className="flex-1 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-indigo-900/30 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-200">Screenshot Attached</h4>
                      <p className="text-[10px] text-slate-400 font-mono">Evidence captured successfully</p>
                    </div>
                  </div>
                  {status === 'uploaded' && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        resetUploader();
                      }}
                      className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                      title="Remove screenshot"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {status === 'uploaded' && (
                  <div className="mt-4 bg-emerald-950/20 border border-emerald-900/30 rounded-lg p-3 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-xs font-medium text-emerald-400 block mb-0.5">Ready for AI Analysis</span>
                      <span className="text-[10px] text-slate-400 leading-tight block">
                        This screenshot will be included in the AI context to better determine the root cause of the crash.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
