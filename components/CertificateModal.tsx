
import React, { useRef } from 'react';
import { X, Download, Award } from 'lucide-react';
import { User, Box } from '../types';
import Logo from './Logo';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  box: Box;
}

const CertificateModal: React.FC<CertificateModalProps> = ({ isOpen, onClose, user, box }) => {
  const certificateRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    const printContent = certificateRef.current;
    if (printContent) {
      // Create a hidden iframe to print just the certificate
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.width = '0px';
      iframe.style.height = '0px';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(`
          <html>
            <head>
              <title>Certificate - ${box.title}</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;600&display=swap');
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                @page { size: landscape; margin: 0; }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        doc.close();
        iframe.contentWindow?.focus();
        setTimeout(() => {
            iframe.contentWindow?.print();
            document.body.removeChild(iframe);
        }, 500);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative flex flex-col items-center gap-4 w-full max-w-5xl animate-in fade-in zoom-in duration-300">
        
        {/* Actions Bar */}
        <div className="flex gap-3 justify-end w-full max-w-[850px]">
            <button 
                onClick={handlePrint}
                className="bg-white text-slate-900 px-4 py-2 rounded-full font-bold shadow-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
                <Download size={18} /> Download PDF
            </button>
            <button 
                onClick={onClose}
                className="bg-slate-900/50 text-white p-2 rounded-full hover:bg-slate-900 transition-colors"
            >
                <X size={24} />
            </button>
        </div>

        {/* Certificate Container */}
        <div ref={certificateRef} className="bg-white p-1 shadow-2xl w-[850px] h-[600px] text-center relative mx-auto overflow-hidden">
            {/* Inner Border Design */}
            <div className="w-full h-full border-[12px] border-double border-slate-900 p-8 flex flex-col items-center justify-between bg-[#fffcf5] relative">
                
                {/* Corner Decorations */}
                <div className="absolute top-4 left-4 w-16 h-16 border-t-2 border-l-2 border-amber-500"></div>
                <div className="absolute top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-amber-500"></div>
                <div className="absolute bottom-4 left-4 w-16 h-16 border-b-2 border-l-2 border-amber-500"></div>
                <div className="absolute bottom-4 right-4 w-16 h-16 border-b-2 border-r-2 border-amber-500"></div>

                {/* Header */}
                <div className="mt-8 flex flex-col items-center">
                    <div className="opacity-80 scale-75 mb-2">
                        <Logo size="lg" theme="light" />
                    </div>
                    <h1 className="text-5xl font-serif text-slate-900 font-bold tracking-wide uppercase" style={{ fontFamily: 'Playfair Display, serif' }}>
                        Certificate of Completion
                    </h1>
                    <div className="h-1 w-32 bg-amber-500 mt-4"></div>
                </div>

                {/* Body */}
                <div className="flex-1 flex flex-col justify-center gap-4 w-full max-w-2xl">
                    <p className="text-slate-500 text-lg italic" style={{ fontFamily: 'Playfair Display, serif' }}>This certifies that</p>
                    
                    <h2 className="text-4xl font-bold text-slate-800 border-b border-slate-300 pb-2 mx-10">
                        {user.name}
                    </h2>

                    <p className="text-slate-500 text-lg italic mt-2" style={{ fontFamily: 'Playfair Display, serif' }}>has successfully completed the course</p>
                    
                    <h3 className="text-3xl font-bold text-indigo-900 mt-1">
                        {box.title}
                    </h3>
                    
                    <p className="text-slate-500 text-sm mt-2">
                        Demonstrating proficiency in {box.category} and mastery of the curriculum.
                    </p>
                </div>

                {/* Footer / Signatures */}
                <div className="w-full flex justify-between items-end px-16 pb-8 mt-8">
                    <div className="flex flex-col items-center">
                        <div className="text-2xl font-signature text-slate-800 mb-2 font-serif italic">
                            {new Date().toLocaleDateString()}
                        </div>
                        <div className="w-48 h-px bg-slate-400"></div>
                        <p className="text-xs font-bold text-slate-500 uppercase mt-2 tracking-widest">Date</p>
                    </div>

                    <div className="flex flex-col items-center -mb-4">
                        <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center border-4 border-amber-300 shadow-inner mb-4 relative">
                            <div className="absolute inset-0 border-2 border-amber-500 rounded-full border-dashed m-1"></div>
                            <Award size={48} className="text-amber-600" />
                        </div>
                    </div>

                    <div className="flex flex-col items-center">
                        <div className="text-2xl font-signature text-slate-800 mb-2 font-serif italic">
                            {box.creatorName}
                        </div>
                        <div className="w-48 h-px bg-slate-400"></div>
                        <p className="text-xs font-bold text-slate-500 uppercase mt-2 tracking-widest">Instructor</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateModal;
