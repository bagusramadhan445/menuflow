import React, { useState, useEffect, useRef } from "react";
import AdminNavbar from "../../components/AdminNavbar";
import { QrCode, Download, Printer, Plus, Minus, Info } from "lucide-react";
import QRCode from "qrcode";
import { useToast } from "../../context/ToastContext";

// Nested Component to Render Individual QR codes with canvas
const TableQrCard = ({ tableNum }) => {
  const canvasRef = useRef(null);
  const [qrUrl, setQrUrl] = useState("");

  const menuUrl = `${window.location.origin}/menu?table=${tableNum}`;

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        menuUrl,
        {
          width: 220,
          margin: 1.5,
          color: {
            dark: "#0a0a0a", // brand-dark / black
            light: "#ffffff" // white background
          }
        },
        (error) => {
          if (error) console.error("Error generating QR", error);
        }
      );
    }
  }, [menuUrl]);

  const handleDownload = () => {
    try {
      const canvas = canvasRef.current;
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `QR_MEJA_${tableNum}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-5 rounded-3xl bg-brand-card border border-zinc-900 flex flex-col items-center gap-4.5 shadow-md hover:border-zinc-800 transition-all group">
      {/* Title */}
      <div className="text-center">
        <h4 className="font-extrabold text-base text-white tracking-tight">Meja Nomor {tableNum}</h4>
        <p className="text-[10px] text-zinc-550 font-semibold font-mono mt-0.5 line-clamp-1 max-w-[180px]" title={menuUrl}>
          /menu?table={tableNum}
        </p>
      </div>

      {/* QR Canvas Wrapper */}
      <div className="p-3 bg-white rounded-2xl border border-zinc-850 shadow-inner flex items-center justify-center">
        <canvas ref={canvasRef} className="w-40 h-40 object-contain" />
      </div>

      <div className="h-px bg-zinc-950 w-full" />

      {/* Action Download */}
      <button
        onClick={handleDownload}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-xs font-bold text-zinc-350 hover:text-white transition-all cursor-pointer"
      >
        <Download className="w-4 h-4 text-brand-amber" />
        <span>Unduh PNG</span>
      </button>
    </div>
  );
};

const QrGenerator = () => {
  const { addToast } = useToast();
  const [tableCount, setTableCount] = useState(10);
  const [tablesList, setTablesList] = useState([]);

  // Generate numbers array
  useEffect(() => {
    const list = [];
    const max = Math.min(100, Math.max(1, tableCount)); // Cap between 1 and 100
    for (let i = 1; i <= max; i++) {
      list.push(i);
    }
    setTablesList(list);
  }, [tableCount]);

  const handlePrintAll = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-brand-dark pb-12 text-zinc-100 font-sans print:bg-white print:text-black">
      {/* Hide navigation on printing */}
      <div className="print:hidden">
        <AdminNavbar />
      </div>

      <main className="max-w-7xl mx-auto px-6 mt-8 flex flex-col gap-6">
        
        {/* Header toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <QrCode className="w-6 h-6 text-brand-amber" />
              <span>Generator QR Meja</span>
            </h2>
            <p className="text-zinc-500 text-xs md:text-sm mt-0.5 font-medium">Buat barcode tautan meja untuk diletakkan di dudukan meja.</p>
          </div>

          <button
            onClick={handlePrintAll}
            className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-brand-amber hover:bg-brand-gold text-brand-dark text-xs font-extrabold tracking-wider uppercase transition-all shadow-md cursor-pointer"
          >
            <Printer className="w-4 h-4 stroke-[3]" />
            <span>Cetak Semua Meja</span>
          </button>
        </div>

        {/* Input Settings Control Card */}
        <div className="p-5 rounded-3xl bg-brand-card border border-zinc-900/60 shadow-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 print:hidden">
          <div className="flex items-start gap-3 text-xs leading-relaxed max-w-lg text-zinc-400">
            <Info className="w-5 h-5 text-brand-amber flex-shrink-0 mt-0.5" />
            <p>
              Masukkan total meja di outlet Anda. QR code akan ter-generate otomatis untuk masing-masing nomor meja dan mengarahkan pembeli langsung ke menu digital.
            </p>
          </div>

          {/* Numeric Quantity Controls */}
          <div className="flex items-center bg-zinc-950 border border-zinc-900 rounded-2xl p-1.5 self-center">
            <button
              onClick={() => setTableCount(prev => Math.max(1, prev - 1))}
              className="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 active:scale-95 transition-all"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="flex flex-col items-center justify-center px-4 w-20">
              <input
                type="number"
                min="1"
                max="100"
                value={tableCount}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) setTableCount(Math.min(100, Math.max(1, val)));
                }}
                className="w-full bg-transparent border-none focus:outline-none text-center font-black text-lg text-white"
              />
              <span className="text-[8px] font-bold text-zinc-550 uppercase tracking-widest leading-none mt-0.5">Meja</span>
            </div>
            <button
              onClick={() => setTableCount(prev => Math.min(100, prev + 1))}
              className="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* QR Grid section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 print:grid-cols-3 print:gap-4">
          {tablesList.map((num) => (
            <TableQrCard key={num} tableNum={num} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default QrGenerator;
