
import React, { useState, useEffect } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { BR_STATES } from '../data/geoBrasil';

interface StateCitySelectProps {
  uf: string;
  cidade: string;
  onChangeUf: (uf: string) => void;
  onChangeCidade: (cidade: string) => void;
  disabled?: boolean;
  required?: boolean;
}

const StateCitySelect: React.FC<StateCitySelectProps> = ({
  uf,
  cidade,
  onChangeUf,
  onChangeCidade,
  disabled,
  required
}) => {
  const [municipios, setMunicipios] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    
    const fetchCidades = async () => {
      if (!uf) {
        setMunicipios([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`,
          { signal: controller.signal }
        );
        const data = await response.json();
        const names = data.map((m: any) => m.nome);
        setMunicipios(names);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error("Erro ao carregar cidades do IBGE:", err);
          setMunicipios([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCidades();
    
    return () => controller.abort();
  }, [uf]);

  const handleUfChange = (newUf: string) => {
    onChangeUf(newUf);
    onChangeCidade(''); 
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
          Estado (UF) {required && '*'}
        </label>
        <div className="relative">
          <select
            required={required}
            disabled={disabled}
            value={uf}
            onChange={(e) => handleUfChange(e.target.value)}
            className="w-full bg-white border-none rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900 appearance-none disabled:opacity-50 transition-all"
          >
            <option value="">Selecione...</option>
            {BR_STATES.map((s) => (
              <option key={s.uf} value={s.uf}>
                {s.uf} — {s.nome}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
          Cidade / Município {required && '*'}
        </label>
        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 z-10" />
          <select
            required={required}
            disabled={disabled || !uf || loading}
            value={cidade}
            onChange={(e) => onChangeCidade(e.target.value)}
            className="w-full bg-white border-none rounded-2xl p-4 pl-12 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900 appearance-none disabled:opacity-50 transition-all relative z-0"
          >
            {!uf ? (
              <option value="">Escolha o estado</option>
            ) : loading ? (
              <option value="">Carregando cidades...</option>
            ) : (
              <>
                <option value="">Selecione a cidade...</option>
                {municipios.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </>
            )}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 z-10">
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StateCitySelect;
