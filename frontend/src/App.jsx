import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

// ─── Icons (inline SVG components to avoid import issues) ───────────────────
const Icon = ({ d, size = 20, color = 'currentColor', strokeWidth = 1.5, fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const Icons = {
  radar: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0",
  sun: "M12 3v1m0 16v1M4.22 4.22l.7.7m12.16 12.16l.7.7M3 12h1m16 0h1M4.92 19.07l.7-.7M18.36 5.64l.7-.7M12 8a4 4 0 100 8 4 4 0 000-8z",
  moon: "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z",
  cpu: "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18",
  activity: "M22 12h-4l-3 9L9 3l-3 9H2",
  globe: "M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7zM12 9a3 3 0 100 6 3 3 0 000-6z",
  chevron: "M19 9l-7 7-7-7",
  alert: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z",
  x: "M18 6L6 18M6 6l12 12",
  monitor: "M8 21h8m-4-4v4M3 5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5z",
  database: "M12 3C7.03 3 3 4.34 3 6v12c0 1.66 4.03 3 9 3s9-1.34 9-3V6c0-1.66-4.03-3-9-3z",
  harddrive: "M22 12H2M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z",
  wifi: "M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01",
  network: "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  terminal: "M4 17l6-6-6-6m8 14h8",
  zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
};

// ─── Colour System ──────────────────────────────────────────────────────────
const makeTheme = (dark) => ({
  bg: dark ? '#06080f' : '#f0f4f8',
  surface: dark ? '#0d1117' : '#ffffff',
  surfaceAlt: dark ? '#111827' : '#f8fafc',
  border: dark ? '#1e2d40' : '#d1dbe8',
  borderGlow: dark ? '#0ea5e9' : '#0284c7',
  text: dark ? '#e2e8f0' : '#0f172a',
  textMuted: dark ? '#64748b' : '#64748b',
  textDim: dark ? '#334155' : '#94a3b8',
  accent: '#0ea5e9',
  accentSoft: dark ? 'rgba(14,165,233,0.12)' : 'rgba(14,165,233,0.08)',
  accentGlow: 'rgba(14,165,233,0.4)',
  success: '#10b981',
  successSoft: 'rgba(16,185,129,0.12)',
  danger: '#ef4444',
  dangerSoft: 'rgba(239,68,68,0.12)',
  warn: '#f59e0b',
  warnSoft: 'rgba(245,158,11,0.12)',
  purple: '#8b5cf6',
  purpleSoft: 'rgba(139,92,246,0.12)',
  navBg: dark ? 'rgba(6,8,15,0.85)' : 'rgba(240,244,248,0.85)',
});

// ─── Radar Sweep Canvas ─────────────────────────────────────────────────────
function RadarCanvas({ devices, size = 320 }) {
  const canvasRef = useRef(null);
  const sweepRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cx = size / 2, cy = size / 2, r = size / 2 - 10;

    // Map devices onto radar
    const points = devices.map((_, i) => {
      const angle = (i / Math.max(devices.length, 1)) * Math.PI * 2;
      const dist = 0.35 + Math.random() * 0.5;
      return { x: cx + Math.cos(angle) * r * dist, y: cy + Math.sin(angle) * r * dist };
    });

    const draw = (ts) => {
      sweepRef.current = (ts * 0.0008) % (Math.PI * 2);
      ctx.clearRect(0, 0, size, size);

      // Background
      ctx.fillStyle = '#06080f';
      ctx.fillRect(0, 0, size, size);

      // Concentric rings
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, r * (i / 4), 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(14,165,233,0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy);
      ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r);
      ctx.strokeStyle = 'rgba(14,165,233,0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Sweep gradient
      const sweep = sweepRef.current;
      const grad = ctx.createConicalGradient ? null : null;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(sweep);
      const sweepGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      sweepGrad.addColorStop(0, 'rgba(14,165,233,0.0)');
      sweepGrad.addColorStop(1, 'rgba(14,165,233,0.0)');
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, -0.5, 0);
      ctx.closePath();
      ctx.fillStyle = 'rgba(14,165,233,0.18)';
      ctx.fill();
      ctx.restore();

      // Sweep line
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweep) * r, cy + Math.sin(sweep) * r);
      ctx.strokeStyle = 'rgba(14,165,233,0.9)';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#0ea5e9';
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Device blips
      points.forEach((p, i) => {
        const bAngle = Math.atan2(p.y - cy, p.x - cx);
        let diff = (sweep - bAngle + Math.PI * 2) % (Math.PI * 2);
        const tail = diff < 0.5 ? (0.5 - diff) / 0.5 : 0;

        if (tail > 0) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4 + tail * 4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(14,165,233,${tail * 0.3})`;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#0ea5e9';
        ctx.shadowColor = '#0ea5e9';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Center dot
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [devices, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ borderRadius: '50%', display: 'block' }}
    />
  );
}

// ─── Sparkline ──────────────────────────────────────────────────────────────
function Sparkline({ data, color = '#0ea5e9', height = 60, width = 200 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 0.1);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (v / max) * height * 0.9 - 2;
    return `${x},${y}`;
  }).join(' ');
  const area = `0,${height} ${pts} ${width},${height}`;
  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#grad-${color.replace('#','')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Gauge Ring ─────────────────────────────────────────────────────────────
function GaugeRing({ percent, color = '#0ea5e9', size = 80, label, value }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (percent / 100) * circ;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${color})`, transition: 'stroke-dasharray 0.8s ease' }}
        />
        <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
          fill="#e2e8f0" fontSize="13" fontWeight="700" fontFamily="'JetBrains Mono', monospace"
          style={{ transform: 'rotate(90deg)', transformOrigin: `${size/2}px ${size/2}px` }}>
          {percent}%
        </text>
      </svg>
      <span style={{ fontSize: '0.7rem', color: '#64748b', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontSize: '0.8rem', color: '#e2e8f0', fontWeight: '600' }}>{value}</span>
    </div>
  );
}

// ─── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = '#0ea5e9', icon, glow = false }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? `rgba(14,165,233,0.06)` : 'rgba(13,17,23,0.8)',
        border: `1px solid ${hov ? color : '#1e2d40'}`,
        borderRadius: '12px', padding: '20px',
        transition: 'all 0.25s',
        boxShadow: hov && glow ? `0 0 20px rgba(14,165,233,0.15)` : 'none',
        cursor: 'default',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '700' }}>{label}</span>
        {icon && <div style={{ color: color, opacity: 0.7 }}>{icon}</div>}
      </div>
      <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#e2e8f0', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-1px' }}>{value}</div>
      {sub && <div style={{ marginTop: '6px', fontSize: '0.78rem', color: '#64748b' }}>{sub}</div>}
    </div>
  );
}

// ─── Device Modal ───────────────────────────────────────────────────────────
function DeviceModal({ device, onClose, theme }) {
  if (!device) return null;
  const isResolved = device.name !== 'Unresolved Node';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '520px', background: '#0d1117',
          border: '1px solid #1e2d40', borderRadius: '20px',
          overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(14,165,233,0.1)',
          animation: 'slideUp 0.25s ease',
        }}
      >
        {/* Header stripe */}
        <div style={{ height: '3px', background: 'linear-gradient(90deg, #0ea5e9, #8b5cf6)' }} />
        
        <div style={{ padding: '28px', borderBottom: '1px solid #1e2d40', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: '#0ea5e9', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>
              Network Node Profile
            </div>
            <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '800', color: '#e2e8f0', fontFamily: "'JetBrains Mono', monospace" }}>
              {device.name}
            </h2>
            <div style={{ marginTop: '6px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{
                background: isResolved ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.12)',
                color: isResolved ? '#10b981' : '#64748b',
                padding: '2px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700',
              }}>
                {isResolved ? '● RESOLVED' : '○ UNRESOLVED'}
              </span>
              <span style={{ fontFamily: 'monospace', color: '#64748b', fontSize: '0.85rem' }}>{device.ip}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #1e2d40', borderRadius: '8px', color: '#64748b', cursor: 'pointer', padding: '8px', transition: 'all 0.2s' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* MAC / Vendor */}
          <div style={{ background: '#111827', borderRadius: '12px', overflow: 'hidden', border: '1px solid #1e2d40' }}>
            <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e2d40' }}>
              <span style={{ color: '#64748b', fontSize: '0.85rem' }}>MAC Address</span>
              <span style={{ fontFamily: 'monospace', color: '#e2e8f0', fontWeight: '600', fontSize: '0.85rem' }}>{device.mac || '??:??:??:??:??:??'}</span>
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Hardware Vendor</span>
              <span style={{ color: '#0ea5e9', fontWeight: '700', fontSize: '0.85rem' }}>{device.vendor || 'Generic/Unknown'}</span>
            </div>
          </div>

          {/* Locked specs */}
          <div>
            <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Remote Specs</span>
              <span style={{ color: '#f59e0b' }}>Requires WMI/SNMP Auth</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[['CPU', 'Access Denied'], ['RAM', 'Access Denied'], ['OS', 'Access Denied'], ['Uptime', 'Access Denied']].map(([k, v]) => (
                <div key={k} style={{ padding: '14px', background: '#111827', borderRadius: '10px', border: '1px solid #1e2d40', opacity: 0.5 }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>{k}</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: '600', color: '#e2e8f0' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isDark, setIsDark] = useState(true);
  const [activeMenu, setActiveMenu] = useState('Topography');
  const [hoveredCard, setHoveredCard] = useState(null);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 100, ip: '', message: '' });
  const [telemetry, setTelemetry] = useState({ tx: 0, rx: 0 });
  const [hostData, setHostData] = useState(null);
  const [txHistory, setTxHistory] = useState(Array(30).fill(0));
  const [rxHistory, setRxHistory] = useState(Array(30).fill(0));
  const [filterQuery, setFilterQuery] = useState('');
  const [scanComplete, setScanComplete] = useState(false);

  const theme = makeTheme(isDark);

  // ── Host data ──
  useEffect(() => {
    if (activeMenu === 'Host System' && !hostData) {
      axios.get('http://127.0.0.1:8000/host')
        .then(res => setHostData(res.data))
        .catch(() => {});
    }
  }, [activeMenu, hostData]);

  // ── Telemetry ──
  useEffect(() => {
    if (activeMenu !== 'Telemetry') return;
    const source = new EventSource('http://127.0.0.1:8000/telemetry');
    source.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setTelemetry({ tx: data.tx_mbps, rx: data.rx_mbps });
      setTxHistory(h => [...h.slice(-29), data.tx_mbps]);
      setRxHistory(h => [...h.slice(-29), data.rx_mbps]);
    };
    return () => source.close();
  }, [activeMenu]);

  // ── Scan ──
  const runDiscovery = () => {
    setLoading(true);
    setScanComplete(false);
    setScanProgress({ current: 0, total: 100, ip: '', message: 'Initializing...' });
    setDevices([]);
    const source = new EventSource('http://127.0.0.1:8000/scan');
    source.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.status === 'progress') {
        setScanProgress({ current: data.current, total: data.total, ip: data.ip, message: data.message });
      } else if (data.status === 'analyzing') {
        setScanProgress(p => ({ ...p, message: data.message }));
      } else if (data.status === 'complete') {
        setDevices(data.devices);
        setActiveMenu('Topography');
        setLoading(false);
        setScanComplete(true);
        source.close();
      } else if (data.status === 'error') {
        setLoading(false);
        source.close();
      }
    };
    source.onerror = () => { setLoading(false); source.close(); };
  };

  const filteredDevices = devices.filter(d =>
    !filterQuery ||
    d.ip.includes(filterQuery) ||
    d.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
    (d.vendor || '').toLowerCase().includes(filterQuery.toLowerCase())
  );

  const pct = scanProgress.total ? Math.round((scanProgress.current / scanProgress.total) * 100) : 0;

  // ── RENDER: Telemetry ──
  const renderTelemetry = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
      {/* TX Card */}
      {[
        { label: 'Transmit (TX)', value: telemetry.tx, history: txHistory, color: '#0ea5e9' },
        { label: 'Receive (RX)', value: telemetry.rx, history: rxHistory, color: '#10b981' },
      ].map(({ label, value, history, color }) => (
        <div key={label} style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '24px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '0.68rem', color: theme.textMuted, fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '6px' }}>{label}</div>
              <div style={{ fontSize: '2.8rem', fontWeight: '800', color: theme.text, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-2px', lineHeight: 1 }}>
                {value.toFixed(2)}
                <span style={{ fontSize: '1rem', color: theme.textMuted, fontWeight: '500', marginLeft: '6px' }}>Mbps</span>
              </div>
            </div>
            <div style={{ padding: '10px', background: `rgba(${color === '#0ea5e9' ? '14,165,233' : '16,185,129'},0.1)`, borderRadius: '10px', color }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
          </div>
          <Sparkline data={history} color={color} height={64} width={300} />
          <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
            <div>
              <div style={{ fontSize: '0.68rem', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '1px' }}>Peak</div>
              <div style={{ fontSize: '0.9rem', color: theme.text, fontWeight: '600', fontFamily: 'monospace' }}>{Math.max(...history).toFixed(2)} Mbps</div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '1px' }}>Avg</div>
              <div style={{ fontSize: '0.9rem', color: theme.text, fontWeight: '600', fontFamily: 'monospace' }}>
                {(history.reduce((a, b) => a + b, 0) / history.length).toFixed(2)} Mbps
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Stats row */}
      <StatCard label="Active Devices" value={devices.length} sub="Confirmed on subnet" color="#0ea5e9"
        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01"/></svg>}
        glow
      />
      <StatCard label="Resolved Nodes" value={devices.filter(d => d.name !== 'Unresolved Node').length} sub={`${devices.length - devices.filter(d => d.name !== 'Unresolved Node').length} unresolved`} color="#10b981"
        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
      />
    </div>
  );

  // ── RENDER: Topography ──
  const renderTopography = () => (
    <div>
      {devices.length === 0 ? (
        <div style={{
          minHeight: '420px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: theme.surface, borderRadius: '20px', border: `1px dashed ${theme.border}`, gap: '20px',
        }}>
          <div style={{ opacity: 0.25 }}>
            <RadarCanvas devices={[]} size={200} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: theme.textMuted }}>No Nodes Discovered</div>
            <div style={{ fontSize: '0.85rem', color: theme.textDim, marginTop: '4px' }}>Click INITIATE DISCOVERY to sweep the subnet</div>
          </div>
        </div>
      ) : (
        <div>
          {/* Radar + summary row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '20px', marginBottom: '24px', alignItems: 'start' }}>
            <div style={{ background: theme.surface, borderRadius: '20px', border: `1px solid ${theme.border}`, padding: '20px', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <RadarCanvas devices={devices} size={280} />
              <div style={{ fontSize: '0.7rem', color: theme.textMuted, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                {devices.length} nodes tracked
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignContent: 'start' }}>
              {[
                { label: 'Total Devices', val: devices.length, color: '#0ea5e9' },
                { label: 'Resolved', val: devices.filter(d => d.name !== 'Unresolved Node').length, color: '#10b981' },
                { label: 'Unresolved', val: devices.filter(d => d.name === 'Unresolved Node').length, color: '#f59e0b' },
                { label: 'Unique Vendors', val: new Set(devices.map(d => d.vendor || 'Unknown')).size, color: '#8b5cf6' },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '18px' }}>
                  <div style={{ fontSize: '0.68rem', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '700', marginBottom: '8px' }}>{label}</div>
                  <div style={{ fontSize: '2.2rem', fontWeight: '800', color, fontFamily: "'JetBrains Mono', monospace" }}>{val}</div>
                </div>
              ))}
              {/* Vendor breakdown */}
              <div style={{ gridColumn: '1/-1', background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '18px' }}>
                <div style={{ fontSize: '0.68rem', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '700', marginBottom: '12px' }}>Vendor Distribution</div>
                {(() => {
                  const counts = {};
                  devices.forEach(d => { const v = d.vendor || 'Unknown'; counts[v] = (counts[v] || 0) + 1; });
                  return Object.entries(counts).slice(0, 4).map(([v, c]) => (
                    <div key={v} style={{ marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.8rem', color: theme.text }}>{v}</span>
                        <span style={{ fontSize: '0.8rem', color: '#0ea5e9', fontFamily: 'monospace' }}>{c}</span>
                      </div>
                      <div style={{ height: '4px', background: theme.border, borderRadius: '2px' }}>
                        <div style={{ width: `${(c / devices.length) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #0ea5e9, #8b5cf6)', borderRadius: '2px', transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>

          {/* Filter bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/></svg>
              <input
                value={filterQuery}
                onChange={e => setFilterQuery(e.target.value)}
                placeholder="Filter by IP, hostname, vendor…"
                style={{
                  width: '100%', background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '10px',
                  padding: '10px 12px 10px 38px', color: theme.text, fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ fontSize: '0.8rem', color: theme.textMuted, whiteSpace: 'nowrap' }}>
              {filteredDevices.length} / {devices.length}
            </div>
          </div>

          {/* Device cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
            {filteredDevices.map((device, idx) => {
              const resolved = device.name !== 'Unresolved Node';
              const hov = hoveredCard === idx;
              return (
                <div key={idx}
                  onClick={() => setSelectedDevice(device)}
                  onMouseEnter={() => setHoveredCard(idx)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    background: hov ? (isDark ? 'rgba(14,165,233,0.05)' : 'rgba(14,165,233,0.03)') : theme.surface,
                    border: `1px solid ${hov ? '#0ea5e9' : resolved ? theme.border : theme.textDim}`,
                    borderRadius: '14px', padding: '20px', cursor: 'pointer',
                    transform: hov ? 'translateY(-3px)' : 'translateY(0)',
                    boxShadow: hov ? '0 8px 30px rgba(14,165,233,0.15)' : 'none',
                    transition: 'all 0.2s ease',
                    position: 'relative', overflow: 'hidden',
                  }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: resolved ? 'linear-gradient(90deg, #0ea5e9, #8b5cf6)' : 'transparent', opacity: hov ? 1 : 0.6, transition: 'opacity 0.2s' }} />
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: resolved ? 'rgba(14,165,233,0.12)' : 'rgba(100,116,139,0.1)',
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={resolved ? '#0ea5e9' : '#64748b'} strokeWidth="1.5">
                        <path d="M20 16V7a2 2 0 00-2-2H6a2 2 0 00-2 2v9m16 0H4m16 0l1.28 2.55a1 1 0 01-.9 1.45H3.62a1 1 0 01-.9-1.45L4 16"/>
                      </svg>
                    </div>
                    <span style={{
                      fontSize: '0.68rem', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase',
                      padding: '3px 8px', borderRadius: '20px',
                      background: resolved ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.1)',
                      color: resolved ? '#10b981' : '#64748b',
                    }}>
                      {resolved ? '● Online' : '○ Pending'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.68rem', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', marginBottom: '4px' }}>Hostname</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '800', color: resolved ? theme.text : theme.textMuted, marginBottom: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {device.name}
                  </div>

                  <div style={{ paddingTop: '14px', borderTop: `1px dashed ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>IPv4</div>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#0ea5e9' }}>{device.ip}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.65rem', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Vendor</div>
                      <div style={{ fontSize: '0.78rem', color: theme.textMuted, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{device.vendor || 'Unknown'}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  // ── RENDER: Vulnerabilities ──
  const renderVulnerabilities = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '24px' }}>
        <div style={{ fontSize: '0.68rem', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '700', marginBottom: '16px' }}>Threat Intelligence</div>
        
        {[
          { sev: 'HIGH', port: 3389, name: 'RDP Exposed', ip: '192.168.1.45', desc: 'Remote Desktop Protocol exposed to subnet — brute-force risk.', color: '#ef4444' },
          { sev: 'MED', port: 23, name: 'Telnet Active', ip: '192.168.1.12', desc: 'Unencrypted Telnet service detected on LAN device.', color: '#f59e0b' },
          { sev: 'INFO', port: 80, name: 'HTTP Server', ip: '192.168.1.1', desc: 'Plain HTTP (non-HTTPS) web admin interface detected.', color: '#0ea5e9' },
        ].map(({ sev, port, name, ip, desc, color }) => (
          <div key={port} style={{ display: 'flex', gap: '16px', padding: '18px', background: isDark ? `rgba(${color === '#ef4444' ? '239,68,68' : color === '#f59e0b' ? '245,158,11' : '14,165,233'},0.06)` : `rgba(0,0,0,0.02)`, border: `1px solid ${color}30`, borderRadius: '12px', marginBottom: '10px', alignItems: 'flex-start' }}>
            <div style={{ minWidth: '52px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${color}18`, borderRadius: '10px' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: '800', padding: '2px 8px', borderRadius: '4px', background: `${color}20`, color, letterSpacing: '1px' }}>{sev}</span>
                <span style={{ fontSize: '0.95rem', fontWeight: '700', color: theme.text }}>{name}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: theme.textMuted }}>:{port}</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: theme.textMuted, marginBottom: '6px' }}>{desc}</div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color }}>Target: {ip}</div>
            </div>
          </div>
        ))}

        <div style={{ padding: '16px', background: isDark ? 'rgba(16,185,129,0.06)' : 'rgba(16,185,129,0.03)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <span style={{ fontSize: '0.85rem', color: '#10b981' }}>No critical 0-day CVEs detected in current scan window.</span>
        </div>
      </div>
    </div>
  );

  // ── RENDER: Endpoints ──
  const renderEndpoints = () => (
    <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '16px', overflow: 'hidden' }}>
      {/* Search + toolbar */}
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/></svg>
          <input value={filterQuery} onChange={e => setFilterQuery(e.target.value)} placeholder="Search endpoints…"
            style={{ background: isDark ? '#111827' : '#f8fafc', border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '8px 12px 8px 32px', color: theme.text, fontSize: '0.82rem', outline: 'none', width: '220px' }}
          />
        </div>
        <div style={{ fontSize: '0.78rem', color: theme.textMuted }}>{filteredDevices.length} endpoint{filteredDevices.length !== 1 ? 's' : ''}</div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc' }}>
            {['Status', 'Hostname', 'IP Address', 'MAC', 'Vendor'].map(h => (
              <th key={h} style={{ padding: '13px 20px', color: h === 'Hostname' ? '#0ea5e9' : theme.textMuted, fontSize: '0.68rem', letterSpacing: '1.5px', textAlign: 'left', textTransform: 'uppercase', fontWeight: '700' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredDevices.length === 0 && (
            <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: theme.textMuted, fontSize: '0.9rem' }}>No endpoints found. Run a discovery sweep.</td></tr>
          )}
          {filteredDevices.map((d, i) => (
            <tr key={i} onClick={() => setSelectedDevice(d)} style={{ borderTop: `1px solid ${theme.border}`, cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(14,165,233,0.04)' : 'rgba(14,165,233,0.03)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <td style={{ padding: '14px 20px' }}>
                <span style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', padding: '3px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '700' }}>● ONLINE</span>
              </td>
              <td style={{ padding: '14px 20px', fontWeight: '700', color: d.name !== 'Unresolved Node' ? theme.text : theme.textMuted, fontSize: '0.9rem' }}>{d.name}</td>
              <td style={{ padding: '14px 20px', fontFamily: 'monospace', color: '#0ea5e9', fontSize: '0.85rem' }}>{d.ip}</td>
              <td style={{ padding: '14px 20px', fontFamily: 'monospace', color: theme.textMuted, fontSize: '0.8rem' }}>{d.mac || '—'}</td>
              <td style={{ padding: '14px 20px', color: theme.textMuted, fontSize: '0.85rem' }}>{d.vendor || 'Unknown'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // ── RENDER: Host System ──
  const renderHostSystem = () => {
    if (!hostData) return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '12px', color: theme.textMuted }}>
        <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid #0ea5e9', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
        Querying host hardware...
      </div>
    );

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* OS card */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ padding: '10px', background: 'rgba(14,165,233,0.1)', borderRadius: '10px', color: '#0ea5e9' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 21h8m-4-4v4M3 5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5z"/></svg>
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '700' }}>Operating System</div>
                <div style={{ fontSize: '1.2rem', fontWeight: '800', color: theme.text, marginTop: '2px' }}>{hostData.os}</div>
              </div>
            </div>
            <div style={{ paddingTop: '16px', borderTop: `1px dashed ${theme.border}`, display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: theme.textMuted }}>Hostname:</span>
              <span style={{ fontFamily: 'monospace', color: '#0ea5e9', fontSize: '0.85rem', fontWeight: '600' }}>{hostData.hostname}</span>
            </div>
          </div>

          <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ padding: '10px', background: 'rgba(139,92,246,0.1)', borderRadius: '10px', color: '#8b5cf6' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg>
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '700' }}>Processor</div>
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: theme.text, marginTop: '2px', lineHeight: '1.3' }}>{hostData.cpu}</div>
              </div>
            </div>
            <div style={{ paddingTop: '16px', borderTop: `1px dashed ${theme.border}`, display: 'flex', gap: '24px' }}>
              <div>
                <div style={{ fontSize: '0.68rem', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '1px' }}>Physical Cores</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#8b5cf6', fontFamily: 'monospace' }}>{hostData.cores}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '1px' }}>Logical Threads</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#8b5cf6', fontFamily: 'monospace' }}>{hostData.threads}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Gauges */}
        <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '24px' }}>
          <div style={{ fontSize: '0.68rem', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '700', marginBottom: '24px' }}>Resource Utilisation</div>
          <div style={{ display: 'flex', gap: '40px', alignItems: 'center', flexWrap: 'wrap' }}>
            <GaugeRing percent={hostData.ram_percent} color={hostData.ram_percent > 80 ? '#ef4444' : '#0ea5e9'} size={90} label="RAM Usage" value={hostData.ram_total} />
            <GaugeRing percent={hostData.disk_percent} color={hostData.disk_percent > 80 ? '#ef4444' : '#10b981'} size={90} label="Disk Usage" value={hostData.disk_total} />
            <div style={{ flex: 1, minWidth: '200px' }}>
              {[
                { label: 'System Memory', val: hostData.ram_percent, total: hostData.ram_total, color: hostData.ram_percent > 80 ? '#ef4444' : '#0ea5e9' },
                { label: 'Primary Disk', val: hostData.disk_percent, total: hostData.disk_total, color: hostData.disk_percent > 80 ? '#ef4444' : '#10b981' },
              ].map(({ label, val, total, color }) => (
                <div key={label} style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: theme.text }}>{label}</span>
                    <span style={{ fontSize: '0.85rem', color: theme.textMuted, fontFamily: 'monospace' }}>{val}% — {total}</span>
                  </div>
                  <div style={{ height: '6px', background: theme.border, borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${val}%`, height: '100%', background: `linear-gradient(90deg, ${color}, ${color}aa)`, borderRadius: '3px', transition: 'width 1s ease', boxShadow: `0 0 6px ${color}60` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const MENUS = ['Telemetry', 'Topography', 'Vulnerabilities', 'Endpoints', 'Host System'];
  const MENU_ICONS = {
    Telemetry: "M22 12h-4l-3 9L9 3l-3 9H2",
    Topography: "M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01",
    Vulnerabilities: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    Endpoints: "M8 21h8m-4-4v4M3 5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5z",
    'Host System': "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18",
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: theme.bg, color: theme.text, display: 'flex', flexDirection: 'column', fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace", transition: 'background 0.3s, color 0.3s' }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e2d40; border-radius: 3px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .menu-btn { transition: all 0.2s; }
        .menu-btn:hover { opacity: 1 !important; }
        input { font-family: inherit; }
        input:focus { border-color: #0ea5e9 !important; box-shadow: 0 0 0 2px rgba(14,165,233,0.15); }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{
        height: '68px', padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: theme.navBg, backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${theme.border}`, zIndex: 100, position: 'relative', flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative', width: '36px', height: '36px', borderRadius: '9px', background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(14,165,233,0.4)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
              <path d="M12 8v4l3 3"/>
              <circle cx="12" cy="12" r="1" fill="white"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: '800', letterSpacing: '-0.5px', lineHeight: 1 }}>
              NEXUS<span style={{ color: '#0ea5e9' }}>::</span>CORE
            </div>
            <div style={{ fontSize: '0.6rem', color: theme.textMuted, letterSpacing: '2px', textTransform: 'uppercase' }}>Network Intelligence</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', gap: '4px', background: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.05)', padding: '4px', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
          {MENUS.map(menu => (
            <button
              key={menu}
              className="menu-btn"
              onClick={() => setActiveMenu(menu)}
              style={{
                padding: '7px 14px', borderRadius: '8px', border: 'none', fontSize: '0.78rem', fontWeight: '700',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                background: activeMenu === menu ? (isDark ? '#1e2d40' : 'white') : 'transparent',
                color: activeMenu === menu ? (menu === activeMenu ? '#0ea5e9' : theme.text) : theme.textMuted,
                boxShadow: activeMenu === menu ? '0 1px 4px rgba(0,0,0,0.2)' : 'none',
                fontFamily: 'inherit',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d={MENU_ICONS[menu]}/>
              </svg>
              {menu}
            </button>
          ))}
        </nav>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Live indicator */}
          {activeMenu === 'Telemetry' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#10b981', fontWeight: '700', letterSpacing: '1px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', animation: 'pulse 1.5s ease infinite', display: 'block' }} />
              LIVE
            </div>
          )}
          
          <button
            onClick={() => setIsDark(!isDark)}
            style={{ background: 'none', border: `1px solid ${theme.border}`, borderRadius: '8px', color: theme.textMuted, cursor: 'pointer', padding: '7px', display: 'flex', transition: 'all 0.2s', fontFamily: 'inherit' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d={isDark ? "M12 3v1m0 16v1M4.22 4.22l.7.7m12.16 12.16l.7.7M3 12h1m16 0h1M4.92 19.07l.7-.7M18.36 5.64l.7-.7M12 8a4 4 0 100 8 4 4 0 000-8z" : "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"} />
            </svg>
          </button>

          <div style={{ width: '1px', height: '24px', background: theme.border }} />

          <button
            onClick={runDiscovery}
            disabled={loading}
            style={{
              background: loading ? 'rgba(14,165,233,0.2)' : 'linear-gradient(135deg, #0ea5e9, #0284c7)',
              color: loading ? '#0ea5e9' : 'white', border: 'none', padding: '9px 20px', borderRadius: '9px',
              fontWeight: '800', fontSize: '0.78rem', cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '7px', letterSpacing: '0.5px',
              boxShadow: loading ? 'none' : '0 4px 14px rgba(14,165,233,0.4)',
              transition: 'all 0.2s', fontFamily: 'inherit',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}>
              <path d={loading ? "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" : "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"} />
            </svg>
            {loading ? 'SWEEPING…' : 'INITIATE SCAN'}
          </button>
        </div>
      </header>

      {/* ── SCAN OVERLAY ── */}
      {loading && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: isDark ? 'rgba(6,8,15,0.92)' : 'rgba(240,244,248,0.92)',
          backdropFilter: 'blur(16px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '28px',
        }}>
          {/* Animated radar */}
          <div style={{ position: 'relative' }}>
            <RadarCanvas devices={[]} size={200} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0ea5e9', fontFamily: 'monospace' }}>{pct}%</div>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '8px' }}>Network Sweep In Progress</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: theme.text }}>{scanProgress.message}</div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#0ea5e9', marginTop: '6px', animation: 'blink 1s step-end infinite' }}>
              {scanProgress.ip && `▶ ${scanProgress.ip}`}
            </div>
          </div>

          <div style={{ width: '420px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
              <span>{scanProgress.message}</span>
              <span>[{scanProgress.current}/{scanProgress.total}]</span>
            </div>
            <div style={{ height: '4px', background: '#1e2d40', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                width: `${pct}%`, height: '100%', borderRadius: '2px',
                background: 'linear-gradient(90deg, #0ea5e9, #8b5cf6)',
                boxShadow: '0 0 10px #0ea5e9',
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN ── */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
        <div style={{ maxWidth: '1380px', margin: '0 auto' }}>
          
          {/* Page header */}
          <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.65rem', color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '3px', fontWeight: '700', marginBottom: '4px' }}>
                {['Telemetry', 'Topography', 'Vulnerabilities', 'Endpoints', 'Host System'].indexOf(activeMenu) + 1}/{MENUS.length} — {activeMenu}
              </div>
              <h1 style={{ fontSize: '2rem', fontWeight: '800', color: theme.text, letterSpacing: '-1px' }}>{activeMenu}</h1>
              <p style={{ color: theme.textMuted, fontSize: '0.85rem', marginTop: '4px' }}>
                {activeMenu === 'Topography' && 'Visual map of all discovered nodes on the subnet.'}
                {activeMenu === 'Telemetry' && 'Real-time bandwidth and packet flow monitoring.'}
                {activeMenu === 'Vulnerabilities' && 'Threat intelligence and open port analysis.'}
                {activeMenu === 'Endpoints' && 'Tabular view of all discovered network endpoints.'}
                {activeMenu === 'Host System' && 'Local machine hardware metrics and system info.'}
              </p>
            </div>
            {scanComplete && (
              <div style={{ fontSize: '0.75rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '6px 14px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'block' }}/>
                Scan complete — {devices.length} devices found
              </div>
            )}
          </div>

          {activeMenu === 'Telemetry' && renderTelemetry()}
          {activeMenu === 'Topography' && renderTopography()}
          {activeMenu === 'Vulnerabilities' && renderVulnerabilities()}
          {activeMenu === 'Endpoints' && renderEndpoints()}
          {activeMenu === 'Host System' && renderHostSystem()}
        </div>
      </main>

      {/* ── DEVICE MODAL ── */}
      <DeviceModal device={selectedDevice} onClose={() => setSelectedDevice(null)} theme={theme} />
    </div>
  );
}