
import React from 'react';
import Logo from './Logo';
import { Language } from '../types';

interface FooterProps {
  language?: Language;
  onLanguageChange?: (lang: Language) => void;
}

const Footer: React.FC<FooterProps> = ({ language = 'en', onLanguageChange }) => {
  
  const content = {
    en: {
      tagline: "LrnBox is the world's largest professional micro-learning community. Connect, learn, and grow with bite-sized content tailored for you.",
      sections: [
        { title: 'Product', links: ['Features', 'For Learners', 'For Creators', 'Pricing'] },
        { title: 'Company', links: ['About Us', 'Careers', 'Blog', 'Contact'] },
        { title: 'Support', links: ['Help Center', 'Community Guidelines', 'Safety', 'Privacy & Terms'] }
      ],
      rights: "LrnBox Corporation © 2025",
      built: "Built with React & Gemini AI",
      selectLang: "Select Language"
    },
    ar: {
      tagline: "LrnBox هو أكبر مجتمع احترافي للتعلم المصغر في العالم. تواصل وتعلم ونمِّ مهاراتك من خلال محتوى موجز مخصص لك.",
      sections: [
        { title: 'المنتج', links: ['الميزات', 'للمتعلمين', 'للمبدعين', 'الأسعار'] },
        { title: 'الشركة', links: ['من نحن', 'وظائف', 'المدونة', 'اتصل بنا'] },
        { title: 'الدعم', links: ['مركز المساعدة', 'إرشادات المجتمع', 'الأمان', 'الخصوصية والشروط'] }
      ],
      rights: "LrnBox Corporation © 2025",
      built: "مبني باستخدام React و Gemini AI",
      selectLang: "اختر اللغة"
    }
  };

  const t = content[language];
  const isRTL = language === 'ar';

  return (
    <footer className="bg-[#34495e] border-t border-slate-600 mt-auto py-8 shadow-lg relative z-10" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-8">
          
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
               {/* Logo with 15% size increase. Origin flips based on direction. */}
               <div className={`transform scale-[1.15] transition-transform hover:scale-[1.2] filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)] ${isRTL ? 'origin-right' : 'origin-left'}`}>
                  <Logo size="md" theme="dark" />
               </div>
               <span className="text-xl font-bold text-white tracking-tight filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)] mx-2">LrnBox</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
              {t.tagline}
            </p>
          </div>

          {t.sections.map((section, i) => (
            <div key={i} className="md:col-span-1">
              <h4 className="text-sm font-bold text-white mb-3">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map(link => (
                  <li key={link}>
                    <a href="#" className="text-xs font-semibold text-slate-400 hover:text-white hover:underline transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="md:col-span-1">
             <div className="text-xs font-semibold text-slate-400 mb-2">{t.selectLang}</div>
             <select 
                className="w-full text-sm border border-slate-600 rounded p-1 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={language}
                onChange={(e) => onLanguageChange && onLanguageChange(e.target.value as Language)}
             >
                <option value="en">English (English)</option>
                <option value="ar">العربية (Arabic)</option>
             </select>
          </div>
        </div>
        
        <div className="border-t border-slate-600 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-start">
           <p className="text-xs text-slate-400">{t.rights}</p>
           <p className="text-xs text-slate-400">{t.built}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
