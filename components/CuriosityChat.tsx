import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { X, Mic, MicOff, Camera, Loader2, Volume2, Sparkles, Image as ImageIcon, Send } from 'lucide-react';

// --- UTILS ENCODING/DECODING ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) { binary += String.fromCharCode(bytes[i]); }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) { bytes[i] = binaryString.charCodeAt(i); }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) { channelData[i] = dataInt16[i * numChannels + channel] / 32768.0; }
  }
  return buffer;
}

function createBlob(data: Float32Array): { data: string, mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) { int16[i] = data[i] * 32768; }
  return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
}

import { getGenAIClient } from '../services/geminiService';

interface CuriosityChatProps {
  onClose: () => void;
  t: any;
}

export const CuriosityChat: React.FC<CuriosityChatProps> = ({ onClose, t }) => {
  const [isActive, setIsActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startSession = async () => {
    try {
      const ai = getGenAIClient();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioContextInRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextOutRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            if (!audioContextInRef.current) return;
            const source = audioContextInRef.current.createMediaStreamSource(stream);
            const scriptProcessor = audioContextInRef.current.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              // Use ref to avoid closure staleness and reference errors
              sessionPromiseRef.current?.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextInRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts[0]?.inlineData) {
              setIsSpeaking(true);
              const base64Audio = message.serverContent.modelTurn.parts[0].inlineData.data;
              const ctx = audioContextOutRef.current;
              if (ctx) {
                  nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                  const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
                  const source = ctx.createBufferSource();
                  source.buffer = audioBuffer;
                  source.connect(ctx.destination);
                  source.onended = () => {
                    sourcesRef.current.delete(source);
                    if (sourcesRef.current.size === 0) setIsSpeaking(false);
                  };
                  source.start(nextStartTimeRef.current);
                  nextStartTimeRef.current += audioBuffer.duration;
                  sourcesRef.current.add(source);
              }
            }
            if (message.serverContent?.outputTranscription) {
              setTranscription(prev => prev + " " + message.serverContent?.outputTranscription?.text);
            }
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => setIsActive(false),
          onerror: (e) => { console.error(e); setError("Errore connessione vocale."); }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          systemInstruction: "Sei un assistente per famiglie esperto e curioso. Rispondi a voce in modo magico e divertente. Se ti inviano una foto, spiega cosa vedi e aggiungi una curiosità per bambini.",
        }
      });
      sessionPromiseRef.current = sessionPromise;
      sessionRef.current = await sessionPromise;
    } catch (e) {
      setError("Assicurati di aver concesso i permessi al microfono.");
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
        sessionRef.current.close();
    } else if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then(s => s.close());
    }
    audioContextInRef.current?.close();
    audioContextOutRef.current?.close();
    setIsActive(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !sessionPromiseRef.current) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = (ev.target?.result as string).split(',')[1];
      setPhotoPreview(ev.target?.result as string);
      sessionPromiseRef.current?.then(s => s.sendRealtimeInput({
        media: { data: base64, mimeType: file.type }
      }));
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    startSession();
    return () => stopSession();
  }, []);

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-900/95 backdrop-blur-xl flex flex-col p-6 animate-fade-in-up">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-white font-black text-xl leading-none">Curiosità Hub</h2>
            <span className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest">AI Vocal Guide</span>
          </div>
        </div>
        <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative">
        <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
          <div className={`w-64 h-64 bg-indigo-500 rounded-full blur-[100px] transition-all duration-1000 ${isSpeaking ? 'scale-150 opacity-40' : 'scale-100'}`}></div>
        </div>

        {/* MASCOT ANIMATION */}
        <div className="relative mb-12">
            <div className={`w-48 h-48 rounded-full border-8 border-white/10 flex items-center justify-center bg-white/5 relative overflow-hidden transition-all duration-500 ${isSpeaking ? 'scale-110 shadow-[0_0_50px_rgba(99,102,241,0.3)]' : ''}`}>
                {photoPreview ? (
                    <img src={photoPreview} className="w-full h-full object-cover animate-fade-in" />
                ) : (
                    <div className="flex flex-col items-center gap-3 text-white/40">
                         {isSpeaking ? <Volume2 className="w-16 h-16 animate-pulse text-indigo-400" /> : <Mic className="w-16 h-16" />}
                    </div>
                )}
            </div>
            
            {isActive && (
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-1 items-center bg-indigo-600 px-4 py-2 rounded-full shadow-xl">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    <span className="text-[10px] font-black text-white uppercase ml-2 tracking-widest">In ascolto</span>
                </div>
            )}
        </div>

        <div className="max-w-md w-full text-center">
          <p className="text-white/60 font-medium italic mb-4 leading-relaxed">
            {isSpeaking ? "L'assistente sta parlando..." : "Chiedimi qualsiasi cosa sul posto dove sei o scatta una foto!"}
          </p>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 min-h-[100px] flex items-center justify-center">
             <span className="text-white font-bold text-lg leading-tight">
               {transcription || "..."}
             </span>
          </div>
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handlePhotoUpload} />
        <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-5 bg-white text-slate-900 rounded-[2rem] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-slate-50 transition-all active:scale-95">
          <Camera className="w-6 h-6 text-indigo-600" /> Foto Curiosità
        </button>
        <button onClick={onClose} className="px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-500 transition-all active:scale-95">
          Fatto
        </button>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-200 text-sm font-bold text-center">
          {error}
        </div>
      )}
    </div>
  );
};