import React, { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import { Download, Loader2, RotateCw, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { User } from '../types';
import idNorteFrente from '@/assets/id-norte/id-norte-frente.png';
import idNorteVerso from '@/assets/id-norte/id-norte-verso.png';

interface IdNorteCardProps {
  user: User;
}

const IdNorteCard: React.FC<IdNorteCardProps> = ({ user }) => {
  const barcodeRef = useRef<SVGSVGElement>(null);
  const [side, setSide] = useState<'front' | 'back'>('front');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    // Generate Barcode on Bottom - FIXED AND CENTERED
    if (side === 'front' && barcodeRef.current && user.id_norte_numero) {
      try {
        JsBarcode(barcodeRef.current, user.id_norte_numero, {
          format: "CODE128",
          width: 1.6, // Preenchimento total da largura da foto
          height: 22, // Altura institucional
          displayValue: false,
          margin: 0,
          background: "transparent",
          lineColor: "#FFFFFF"
        });
      } catch (err) {
        console.error("Barcode Error:", err);
      }
    }
  }, [user.id_norte_numero, side]);

  const handleDownloadPDF = async () => {
    setDownloading(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const width = 85.6;
      const height = 53.98;

      const hiddenContainer = document.getElementById('pdf-generation-container');
      if (!hiddenContainer) throw new Error("PDF container not found");

      const frontEl = hiddenContainer.querySelector('#hidden-front') as HTMLElement;
      const backEl = hiddenContainer.querySelector('#hidden-back') as HTMLElement;

      if (frontEl && backEl) {
        const hiddenBarcode = frontEl.querySelector('svg');
        if (hiddenBarcode && user.id_norte_numero) {
          JsBarcode(hiddenBarcode, user.id_norte_numero, {
            format: "CODE128",
            width: 1.6,
            height: 22,
            displayValue: false,
            margin: 0,
            background: "transparent",
            lineColor: "#FFFFFF"
          });
        }

        await new Promise(resolve => setTimeout(resolve, 300));

        // Renderizar com escala 6x para alta resolução (300+ DPI para impressão)
        const frontCanvas = await html2canvas(frontEl, {
          scale: 6,
          useCORS: true,
          backgroundColor: null,
          logging: false,
          imageTimeout: 0
        });

        const backCanvas = await html2canvas(backEl, {
          scale: 6,
          useCORS: true,
          backgroundColor: null,
          logging: false,
          imageTimeout: 0
        });

        const frontImg = frontCanvas.toDataURL('image/png', 1.0);
        const backImg = backCanvas.toDataURL('image/png', 1.0);

        // Página 1: Frente (Centralizada)
        pdf.addImage(frontImg, 'PNG', (210 - width) / 2, 20, width, height, undefined, 'FAST');

        pdf.addPage();

        // Página 2: Verso (Centralizada)
        pdf.addImage(backImg, 'PNG', (210 - width) / 2, 20, width, height, undefined, 'FAST');

        pdf.save(`ID_Norte_${user.nome_completo.replace(/\s+/g, '_')}.pdf`);
      }
    } catch (err) {
      console.error("PDF Generation Error:", err);
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return '00/00/0000';
    try {
      const date = new Date(isoStr);
      return date.toLocaleDateString('pt-BR');
    } catch { return '00/00/0000'; }
  };

  const renderFrontContent = () => (
    <div className="relative w-full h-full select-none">
      <img src={idNorteFrente} alt="Base ID Norte" className="absolute inset-0 w-full h-full object-cover z-0" crossOrigin="anonymous" />

      {/* GRADE FIXA DE DADOS - MODELO OFICIAL */}
      <div className="absolute inset-0 z-10 font-sans text-white font-bold drop-shadow-md">

        {/* MOLDURA VERDE ESCURA TRANSPARENTE (62% Canva Reference) */}
        <div
          className="absolute top-[33%] left-[7%] w-[27.5%] h-[62%] rounded-md border border-white/5 shadow-2xl"
          style={{ backgroundColor: 'rgba(2, 48, 18, 0.62)', backdropFilter: 'blur(1px)' }}
        ></div>

        {/* BLOCO TÉCNICO LATERAL - REGRA ABSOLUTA (FOTO > BARCODE > NÚMERO) */}
        <div className="absolute top-[36%] left-[9%] w-[23.5%] flex flex-col items-center z-30">

          {/* 1. Foto do Atleta (Proporção 3x4) */}
          <div className="w-full aspect-[3/4.1] overflow-hidden rounded-[2px] bg-black border border-white/10 shadow-lg mb-1">
            {user.foto_url ? (
              <img src={user.foto_url} className="w-full h-full object-cover" crossOrigin="anonymous" alt="Atleta" />
            ) : (
              <div className="flex items-center justify-center h-full w-full bg-slate-800 text-[6px]">FOTO</div>
            )}
          </div>

          {/* 2. Número da ID Norte (Logo abaixo da foto, discreto e institucional) */}
          <div className="w-full flex justify-between text-[5.5px] text-white font-mono font-normal uppercase whitespace-nowrap px-[2px] drop-shadow-none opacity-90">
            {"ID-NORTE-2026-".split('').map((char, i) => <span key={i}>{char}</span>)}
            {user.id_norte_numero?.split('-').pop()?.split('').map((char, i) => <span key={i}>{char}</span>) || "0000".split('').map((char, i) => <span key={i}>{char}</span>)}
          </div>
        </div>

        {/* Nome Atleta */}
        <div className="absolute top-[35%] left-[53%] w-[44%] h-[12%] flex items-center overflow-visible">
          <p className="text-[11px] uppercase truncate leading-none font-black text-white">{user.nome_completo}</p>
        </div>

        {/* BLOCO ALINHADO À DIREITA (A partir de 64% para alinhar com rótulos fixos) */}

        {/* Data de Nasc */}
        <div className="absolute top-[46%] left-[64%] w-[33%] h-[12%] flex items-center overflow-visible">
          <p className="text-[10px] uppercase whitespace-nowrap leading-none">{formatDate(user.data_nascimento)}</p>
        </div>

        {/* Cidade / UF */}
        <div className="absolute top-[56.5%] left-[64%] w-[33%] h-[12%] flex items-center overflow-visible">
          <p className="text-[10px] uppercase truncate leading-none">{user.cidade} - {user.uf}</p>
        </div>

        {/* Data Adesão */}
        <div className="absolute top-[67%] left-[64%] w-[33%] h-[12%] flex items-center overflow-visible">
          <p className="text-[10px] uppercase whitespace-nowrap leading-none">{formatDate(user.id_norte_adesao || user.criado_em)}</p>
        </div>

        {/* Validade */}
        <div className="absolute top-[77.5%] left-[64%] w-[33%] h-[12%] flex items-center overflow-visible">
          <p className="text-[10px] uppercase whitespace-nowrap leading-none text-yellow-300 font-extrabold">{formatDate(user.id_norte_validade)}</p>
        </div>
      </div>
    </div>
  );

  // Helper to render Back content - CLEAN
  const renderBackContent = () => (
    <div className="relative w-full h-full">
      <img src={idNorteVerso} alt="ID Verso" className="absolute inset-0 w-full h-full object-cover z-0" crossOrigin="anonymous" />
    </div>
  );

  return (
    <div className="flex flex-col items-center w-full max-w-[400px] mx-auto">
      <div className="relative w-full aspect-[1.586] rounded-xl shadow-2xl overflow-hidden bg-black border border-white/10">
        {side === 'front' ? renderFrontContent() : renderBackContent()}

        {side === 'back' && (
          <button
            onClick={() => setSide('front')}
            className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/80 transition"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Hidden Container for PDF */}
      <div id="pdf-generation-container" className="fixed top-0 left-0 pointer-events-none opacity-0 -z-50 flex">
        <div id="hidden-front" className="w-[85.6mm] h-[53.98mm] relative overflow-hidden">
          {renderFrontContent()}
        </div>
        <div id="hidden-back" className="w-[85.6mm] h-[53.98mm] relative overflow-hidden">
          <div className="relative w-full h-full">
            <img src={idNorteVerso} alt="ID Verso Hidden" className="absolute inset-0 w-full h-full object-cover z-0" crossOrigin="anonymous" />
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 mt-6 w-full px-4">
        {side === 'front' && (
          <button
            onClick={() => setSide('back')}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-6 py-3 rounded-full text-sm font-bold shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            <RotateCw size={16} />
            👉 Ver verso da ID Norte
          </button>
        )}

        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="flex items-center gap-2 text-emerald-600 hover:text-emerald-500 font-bold text-xs mt-2 disabled:opacity-50"
        >
          {downloading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Download className="w-3 h-3" />
          )}
          {downloading ? 'Gerando PDF...' : 'Baixar Documento (PDF)'}
        </button>
      </div>
    </div>
  );
};

export default IdNorteCard;
