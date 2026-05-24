import { useState } from "react";
import { 
  TrendingUp, 
  DollarSign, 
  Percent, 
  CheckCircle,
  Clock,
} from "lucide-react";
import { Transaction, Project } from "../types";

interface AnalyticsPanelProps {
  transactions: Transaction[];
  projects: Project[];
}

export default function AnalyticsPanel({ transactions }: AnalyticsPanelProps) {
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [hoveredDotIndex, setHoveredDotIndex] = useState<number | null>(null);

  // Metrics calculations
  const totalVolume = transactions
    .filter(t => t.status === "COMPLETED")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalFee = transactions
    .filter(t => t.status === "COMPLETED")
    .reduce((sum, t) => sum + t.fee, 0);

  const netVolume = totalVolume - totalFee;

  const successCount = transactions.filter(t => t.status === "COMPLETED").length;
  const pendingCount = transactions.filter(t => t.status === "PENDING").length;
  const failedCount = transactions.filter(t => t.status === "CANCELLED" || t.status === "EXPIRED").length;
  const totalCount = transactions.length;

  const successRate = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0;

  // Last 7 Days chart
  const last7DaysData = [
    { day: "Senin", value: 120000 },
    { day: "Selasa", value: 450000 },
    { day: "Rabu", value: 250000 },
    { day: "Kamis", value: 75000 },
    { day: "Jumat", value: 950000 },
    { day: "Sabtu", value: 1200000 },
    { day: "Minggu", value: totalVolume },
  ];

  // Scale calculations for Bar Chart
  const maxBarValue = Math.max(...last7DaysData.map(d => d.value), 200000) * 1.1;

  // Scale calculations for Line Chart (transactions growth mockup)
  const lineData = [
    { label: "MG-1", value: 250000 },
    { label: "MG-2", value: 850000 },
    { label: "MG-3", value: 1450000 },
    { label: "MG-4", value: 2100000 },
    { label: "MG-5", value: 3450000 },
    { label: "MG-6", value: 3450000 + totalVolume } // Cumulative standard active ones
  ];
  const maxLineValue = Math.max(...lineData.map(d => d.value), 500000) * 1.15;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      
      {/* Title */}
      <div>
        <h2 className="text-3xl font-black text-ink tracking-tight uppercase">Analisis & Statistik Transaksi</h2>
        <p className="text-sm text-slate-500 font-bold">Ikhtisar volume transaksi, total potongan Gosir, pendapatan bersih, dan grafik performa bisnis.</p>
      </div>

      {/* Grid Metrics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Metric 1 */}
        <div className="bg-white border-4 border-ink p-5 shadow-brutal flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">// Volume Grosir (GTV)</span>
            <div className="text-2xl font-black font-mono text-ink">
              Rp {totalVolume.toLocaleString('id-ID')}
            </div>
            <p className="text-[10px] text-slate-550 font-bold">Total pembayaran sukses diterima</p>
          </div>
          <div className="w-12 h-12 bg-neon border-3 border-ink flex items-center justify-center text-ink shrink-0 shadow-[2px_2px_0px_#000]">
            <TrendingUp className="w-5 h-5 font-bold" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border-4 border-ink p-5 shadow-brutal flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">// Potongan Biaya Gosir</span>
            <div className="text-2xl font-black font-mono text-red-600">
              Rp {totalFee.toLocaleString('id-ID')}
            </div>
            <p className="text-[10px] text-slate-550 font-bold">Diakumulasikan per transaksi</p>
          </div>
          <div className="w-12 h-12 bg-paper border-3 border-ink flex items-center justify-center text-ink shrink-0 shadow-[2px_2px_0px_#000]">
            <Percent className="w-5 h-5 font-bold" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border-4 border-ink p-5 shadow-brutal flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">// Pendapatan Bersih</span>
            <div className="text-2xl font-black font-mono text-emerald-800">
              Rp {netVolume.toLocaleString('id-ID')}
            </div>
            <p className="text-[10px] text-slate-550 font-bold">Siap cair ke rekening bank Anda</p>
          </div>
          <div className="w-12 h-12 bg-neon border-3 border-ink flex items-center justify-center text-ink shrink-0 shadow-[2px_2px_0px_#000]">
            <DollarSign className="w-5 h-5 font-bold" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border-4 border-ink p-5 shadow-brutal flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">// Success Rate</span>
            <div className="text-2xl font-black font-mono text-ink">
              {successRate}%
            </div>
            <p className="text-[10px] text-slate-550 font-bold">{successCount} dari {totalCount} transaksi tuntas</p>
          </div>
          <div className="w-12 h-12 bg-paper border-3 border-ink flex items-center justify-center text-ink shrink-0 shadow-[2px_2px_0px_#000]">
            <CheckCircle className="w-5 h-5 font-bold" />
          </div>
        </div>

      </div>

      {/* Transaction status subpanels */}
      <div className="grid sm:grid-cols-3 gap-6">
        <div className="bg-neon text-ink border-3 border-ink p-4 shadow-brutal-sm flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black uppercase tracking-wider">// Pembayaran Sukses</span>
            <div className="text-xl font-black uppercase">{successCount} Transaksi</div>
          </div>
          <div className="w-3.5 h-3.5 bg-black rounded-full animate-pulse border-2 border-neon"></div>
        </div>
        
        <div className="bg-white text-ink border-3 border-ink p-4 shadow-brutal-sm flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black uppercase tracking-wider">// Menunggu Pembayaran</span>
            <div className="text-xl font-black uppercase text-amber-700">{pendingCount} Transaksi</div>
          </div>
          <Clock className="w-5 h-5 text-ink shrink-0" />
        </div>

        <div className="bg-white text-ink border-3 border-ink p-4 shadow-brutal-sm flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black uppercase tracking-wider">// Transaksi Terhenti</span>
            <div className="text-xl font-black uppercase text-slate-500">{failedCount} Gagal</div>
          </div>
          <span className="text-[9px] font-black uppercase bg-black text-white px-2 py-0.5 border-2 border-black rotate-3">TERMINATED</span>
        </div>
      </div>

      {/* Interactive Custom SVG Charting Section */}
      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Chart 1: Last 7 Days Volume (Bar Chart) */}
        <div className="bg-white border-4 border-ink p-6 shadow-brutal space-y-4">
          <div className="flex justify-between items-center border-b-2 border-ink pb-3">
            <div>
              <h3 className="font-extrabold uppercase text-ink text-sm">Volume Transaksi Mingguan</h3>
              <p className="text-[10px] text-slate-500 font-bold">Distribusi nominal transaksi per hari</p>
            </div>
            <span className="text-[10px] font-mono font-black bg-neon text-ink border-2 border-ink px-2 py-0.5 shadow-[1px_1px_0px_#000]">GTV MIG-1</span>
          </div>

          {/* SVG Bar Chart container */}
          <div className="relative pt-4">
            <svg viewBox="0 0 500 220" className="w-full h-auto overflow-visible select-none">
              
              {/* Horizontal Help Lines */}
              <line x1="30" y1="30" x2="480" y2="30" stroke="#0A0A0A" strokeWidth="1" strokeDasharray="3" />
              <line x1="30" y1="80" x2="480" y2="80" stroke="#0A0A0A" strokeWidth="1" strokeDasharray="3" />
              <line x1="30" y1="130" x2="480" y2="130" stroke="#0A0A0A" strokeWidth="1" strokeDasharray="3" />
              <line x1="30" y1="180" x2="480" y2="180" stroke="#0A0A0A" strokeWidth="2.5" />

              {/* Day Labels & Bars */}
              {last7DaysData.map((d, index) => {
                const barWidth = 32;
                const gap = 34;
                const startX = 50 + index * (barWidth + gap);
                const chartHeight = 150; // max chart height (draw within 30 to 180)
                const pct = d.value / maxBarValue;
                const barHeight = Math.max(pct * chartHeight, 4); // minimum 4px height
                const barY = 180 - barHeight;

                const isHovered = hoveredBarIndex === index;

                return (
                  <g key={index} className="transition-all">
                    {/* Hover Trigger Box */}
                    <rect
                      x={startX - 10}
                      y="15"
                      width={barWidth + 20}
                      height="185"
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredBarIndex(index)}
                      onMouseLeave={() => setHoveredBarIndex(null)}
                    />

                    {/* True Bar */}
                    <rect
                      x={startX}
                      y={barY}
                      width={barWidth}
                      height={barHeight}
                      stroke="#0A0A0A"
                      strokeWidth="2.5"
                      fill={isHovered ? "#00FF5F" : "#ffffff"}
                      className="transition-all duration-150"
                    />

                    {/* Day text */}
                    <text
                      x={startX + barWidth / 2}
                      y="200"
                      textAnchor="middle"
                      className="text-[10px] font-black text-ink fill-current"
                    >
                      {d.day}
                    </text>

                    {/* Hover Tooltip inside SVG */}
                    {isHovered && (
                      <g className="animate-fade-in z-20 pointer-events-none">
                        <rect
                          x={startX - 28}
                          y={barY - 36}
                          width="88"
                          height="26"
                          fill="#ffffff"
                          stroke="#0A0A0A"
                          strokeWidth="2"
                        />
                        <text
                          x={startX + barWidth / 2}
                          y={barY - 19}
                          textAnchor="middle"
                          className="text-[9px] font-mono font-black text-ink fill-current"
                        >
                          Rp {d.value >= 1000 ? `${(d.value / 1000).toLocaleString('id-ID')}k` : d.value}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="text-[10px] text-slate-500 font-bold text-center">
            *Arahkan kursor atau sentuh bar untuk melihat nilai transaksi nominal hari ini.
          </div>
        </div>

        {/* Chart 2: Cumulative Revenue growth (Line Chart) */}
        <div className="bg-white border-4 border-ink p-6 shadow-brutal space-y-4">
          <div className="flex justify-between items-center border-b-2 border-ink pb-3">
            <div>
              <h3 className="font-extrabold uppercase text-ink text-sm">Akumulasi GTV Bulanan</h3>
              <p className="text-[10px] text-slate-500 font-bold">Grafik pertumbuhan komparatif omset transaksi</p>
            </div>
            <span className="text-[10px] font-mono font-black bg-neon text-ink border-2 border-ink px-2 py-0.5 shadow-[1px_1px_0px_#000]">VOLUME</span>
          </div>

          {/* SVG Line Chart container */}
          <div className="relative pt-4">
            <svg viewBox="0 0 500 220" className="w-full h-auto overflow-visible select-none">
              
              {/* Horizontal Grid lines */}
              <line x1="35" y1="30" x2="475" y2="30" stroke="#0a0a0a" strokeWidth="1" strokeDasharray="3" />
              <line x1="35" y1="80" x2="475" y2="80" stroke="#0a0a0a" strokeWidth="1" strokeDasharray="3" />
              <line x1="35" y1="130" x2="475" y2="130" stroke="#0a0a0a" strokeWidth="1" strokeDasharray="3" />
              <line x1="35" y1="180" x2="475" y2="180" stroke="#0a0a0a" strokeWidth="2.5" />

              {/* Build coordinates path */}
              {(() => {
                const points = lineData.map((d, index) => {
                  const paddingX = 45;
                  const stepX = (500 - paddingX * 2) / (lineData.length - 1);
                  const x = paddingX + index * stepX;
                  const chartHeight = 150;
                  const pct = d.value / maxLineValue;
                  const y = 180 - pct * chartHeight;
                  return { x, y, label: d.label, val: d.value };
                });

                // Smooth cubic vector paths generator
                const pathString = points.reduce((path, p, i) => {
                  return i === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`;
                }, "");

                const areaPathString = `${pathString} L ${points[points.length-1].x} 180 L ${points[0].x} 180 Z`;

                return (
                  <>
                    {/* Underlay area gradient */}
                    <path
                      d={areaPathString}
                      fill="#00FF5F"
                      className="opacity-15"
                    />

                    {/* The stroke line path */}
                    <path
                      d={pathString}
                      fill="transparent"
                      stroke="#0A0A0A"
                      strokeWidth="3.5"
                      strokeLinecap="square"
                    />

                    {/* Interactive dots */}
                    {points.map((p, idx) => {
                      const isHovered = hoveredDotIndex === idx;
                      return (
                        <g key={idx}>
                          {/* Sizing box */}
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="12"
                            fill="transparent"
                            className="cursor-pointer z-10"
                            onMouseEnter={() => setHoveredDotIndex(idx)}
                            onMouseLeave={() => setHoveredDotIndex(null)}
                          />
                          
                          {/* Real indicator dot */}
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r={isHovered ? "7" : "5"}
                            fill={isHovered ? "#00FF5F" : "#ffffff"}
                            stroke="#0A0A0A"
                            strokeWidth="2.5"
                            className="transition-all duration-150 pointer-events-none"
                          />

                          {/* Label under coordinate */}
                          <text
                            x={p.x}
                            y="200"
                            textAnchor="middle"
                            className="text-[10px] font-black text-ink fill-current"
                          >
                            {p.label}
                          </text>

                          {/* Tooltip banner */}
                          {isHovered && (
                            <g className="animate-fade-in z-25 pointer-events-none">
                              <rect
                                x={p.x - 38}
                                y={p.y - 36}
                                width="76"
                                height="26"
                                fill="#ffffff"
                                stroke="#0A0A0A"
                                strokeWidth="2"
                              />
                              <text
                                x={p.x}
                                y={p.y - 19}
                                textAnchor="middle"
                                className="text-[9px] font-mono font-black text-ink fill-current"
                              >
                                {p.val >= 1000000 ? `${(p.val / 1000000).toFixed(1)}jt` : `Rp${(p.val / 1000).toFixed(0)}k`}
                              </text>
                            </g>
                          )}
                        </g>
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          </div>

          <div className="text-[10px] text-slate-550 font-bold text-center">
            *Menggambarkan pertumbuhan transaksi secara dinamis di server live produksi.
          </div>
        </div>

      </div>

    </div>
  );
}
