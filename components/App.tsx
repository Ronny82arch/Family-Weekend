
import React from 'react';

interface LanguageSelectorProps {
    t: any;
    appLanguage: string;
    setAppLanguage: (lang: string) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ t, appLanguage, setAppLanguage }) => {
    return (
        <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">{t.app_language}</label>
            <div className="grid grid-cols-2 gap-2">
                {[{code:'it', flag:'🇮🇹'}, {code:'en', flag:'🇬🇧'}, {code:'es', flag:'🇪🇸'}, {code:'de', flag:'🇩🇪'}].map(lang => (
                    <button key={lang.code} onClick={() => { setAppLanguage(lang.code); }} className={`p-3 rounded-2xl border-2 font-black text-xs flex items-center justify-center gap-2 transition-all ${appLanguage === lang.code ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200'}`}><span>{lang.flag}</span> {lang.code.toUpperCase()}</button>
                ))}
            </div>
        </div>
    );
};

export default LanguageSelector;
