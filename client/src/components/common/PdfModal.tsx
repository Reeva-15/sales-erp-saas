import React from 'react';
import { X, Download, Printer } from 'lucide-react';

interface PdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  pdfUrl: string;
}

export const PdfModal: React.FC<PdfModalProps> = ({ isOpen, onClose, title, pdfUrl }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-warm-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-warm-200 flex items-center justify-between bg-warm-50">
          <h3 className="font-bold text-lg text-marron-800">{title}</h3>
          <div className="flex items-center gap-2">
            <a
              href={pdfUrl}
              download
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-marron-800 bg-marron-50 hover:bg-marron-100 rounded-lg border border-marron-200 transition"
            >
              <Download className="h-3.5 w-3.5" />
              Download PDF
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* PDF Frame */}
        <div className="flex-1 bg-gray-100 p-2">
          <iframe src={pdfUrl} className="w-full h-full rounded-xl border border-warm-200" title={title} />
        </div>
      </div>
    </div>
  );
};
