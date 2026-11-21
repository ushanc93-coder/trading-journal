"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Volume2, 
  VolumeX, 
  Maximize2, 
  X, 
  Clock, 
  ArrowRight, 
  Minus,
  Flame,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  Radio
} from "lucide-react";
import { format, parseISO } from "date-fns";
import EconomicEventDetailModal from "./EconomicEventDetailModal";
import { CalendarEvent } from "./EconomicCalendarCard";

export interface SessionInfo {
  id: string;
  name: string;
  badge: string;
  startH: number;
  startM: number;
  endH: number;
  endM: number;
  sbStartH: number;
  sbStartM: number;
  sbEndH: number;
  sbEndM: number;
  icon: string;
}

export const ICT_SESSIONS: SessionInfo[] = [
  {
    id: "asian",
    name: "Asian Session",
    badge: "Tokyo / Sydney",
    startH: 20, startM: 0,
    endH: 24, endM: 0,
    sbStartH: 20, sbStartM: 0,
    sbEndH: 21, sbEndM: 0,
    icon: "🌏"
  },
  {
    id: "london",
    name: "London Open",
    badge: "London Killzone",
    startH: 2, startM: 0,
    endH: 5, endM: 0,
    sbStartH: 3, sbStartM: 0,
    sbEndH: 4, sbEndM: 0,
    icon: "🏛️"
  },
  {
    id: "ny-am",
    name: "New York AM",
    badge: "NY Open Killzone",
    startH: 7, startM: 0,
    endH: 12, endM: 0,
    sbStartH: 10, sbStartM: 0,
    sbEndH: 11, sbEndM: 0,
    icon: "🗽"
  },
  {
    id: "ny-pm",
    name: "New York PM",
    badge: "NY Afternoon / Close",
    startH: 13, startM: 0,
    endH: 16, endM: 0,
    sbStartH: 14, sbStartM: 0,
    sbEndH: 15, sbEndM: 0,
    icon: "🏙️"
  }
];

export function formatTimeForZone(date: Date, nyH: number, nyM: number, useNy: boolean): string {
  if (useNy) {
    const hh = String(nyH % 24).padStart(2, "0");
    const mm = String(nyM).padStart(2, "0");
    return `${hh}:${mm}`;
  }
  const nyTimeMs = new Date(date.toLocaleString("en-US", { timeZone: "America/New_York" })).getTime();
  const localTimeMs = date.getTime();
  const diffMs = localTimeMs - nyTimeMs;

  const targetNy = new Date(date.toLocaleString("en-US", { timeZone: "America/New_York" }));
  targetNy.setHours(nyH, nyM, 0, 0);
  const targetLocal = new Date(targetNy.getTime() + diffMs);

  const lh = String(targetLocal.getHours()).padStart(2, "0");
  const lm = String(targetLocal.getMinutes()).padStart(2, "0");
  return `${lh}:${lm}`;
}

export interface SessionScheduleItem {
  id: string;
  name: string;
  isSb: boolean;
  startH: number;
  startM: number;
  endH: number;
  endM: number;
}

export const ALL_7_ICT_SESSIONS: SessionScheduleItem[] = [
  { id: "asian", name: "1. Asian Session", isSb: false, startH: 20, startM: 0, endH: 24, endM: 0 },
  { id: "london", name: "2. London Open", isSb: false, startH: 2, startM: 0, endH: 5, endM: 0 },
  { id: "london-sb", name: "3. London Silver Bullet", isSb: true, startH: 3, startM: 0, endH: 4, endM: 0 },
  { id: "ny-am", name: "4. New York AM", isSb: false, startH: 7, startM: 0, endH: 12, endM: 0 },
  { id: "ny-am-sb", name: "5. NY AM Silver Bullet", isSb: true, startH: 10, startM: 0, endH: 11, endM: 0 },
  { id: "ny-pm", name: "6. New York PM", isSb: false, startH: 13, startM: 0, endH: 16, endM: 0 },
  { id: "ny-pm-sb", name: "7. NY PM Silver Bullet", isSb: true, startH: 14, startM: 0, endH: 15, endM: 0 },
];

export function getSessionCountdownInfo(nowNyTotalSec: number, startH: number, endH: number) {
  const startSec = startH * 3600;
  const endSec = endH * 3600;
  const isCurrentlyActive = nowNyTotalSec >= startSec && nowNyTotalSec < endSec;

  const fmt = (secs: number) => {
    if (secs < 0) secs = 0;
    const hh = Math.floor(secs / 3600);
    const mm = Math.floor((secs % 3600) / 60);
    const ss = Math.floor(secs % 60);
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  };

  if (isCurrentlyActive) {
    const remaining = endSec - nowNyTotalSec;
    return {
      isActive: true,
      text: `Ends in: ${fmt(remaining)}`
    };
  } else if (nowNyTotalSec < startSec) {
    const diff = startSec - nowNyTotalSec;
    return {
      isActive: false,
      text: `Starts in: ${fmt(diff)}`
    };
  } else {
    const diff = (86400 - nowNyTotalSec) + startSec;
    return {
      isActive: false,
      text: `Starts in: ${fmt(diff)}`
    };
  }
}

export interface DetailedSessionState {
  activeName: string;
  isLive: boolean;
  isSilverBullet: boolean;
  bulletName: string;
  activeEndsIn: string;
  activeTime: string;
  nextName: string;
  nextStartsIn: string;
  nextTime: string;
  remainingSec: number;
  nowNyTotalSec: number;
}

// Gentle Web Audio Synthesizer Chime
export function playChime(type: "sb" | "session" = "sb") {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    const now = ctx.currentTime;
    if (type === "sb") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.14);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.18);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    }
  } catch {}
}

// Trader High-Impact Warning Beep (distinctive, non-intrusive double alert tone)
export function playNewsAlert() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(1174.66, now + 0.12);
    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.26);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sawtooth";
    osc2.frequency.setValueAtTime(880, now + 0.16);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.28);
    gain2.gain.setValueAtTime(0.08, now + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.16);
    osc2.stop(now + 0.42);
  } catch {}
}

export function formatNewsCountdown(targetDate: Date | string, now: Date = new Date()): {
  text: string;
  isPast: boolean;
  isLive: boolean;
  isImminent: boolean;
  diffMin: number;
} {
  const d = typeof targetDate === "string" ? new Date(targetDate) : targetDate;
  const diffMs = d.getTime() - now.getTime();
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin < -15) {
    const absMin = Math.abs(diffMin);
    if (absMin < 60) {
      return { text: `${absMin}m ago`, isPast: true, isLive: false, isImminent: false, diffMin };
    }
    const h = Math.floor(absMin / 60);
    const m = absMin % 60;
    return { text: m > 0 ? `${h}h ${m}m ago` : `${h}h ago`, isPast: true, isLive: false, isImminent: false, diffMin };
  } else if (diffMin <= 1 && diffMin >= -15) {
    // Active release window (from 1 min before release up to 15 min after)
    const absMin = Math.abs(diffMin);
    const text = diffMin <= 0 ? (absMin === 0 ? "LIVE NOW" : `${absMin}m ago (LIVE)`) : "DUE < 1m";
    return { text, isPast: diffMin < 0, isLive: true, isImminent: false, diffMin };
  } else if (diffMin <= 30) {
    // Imminent warning window
    return { text: `in ${diffMin}m`, isPast: false, isLive: false, isImminent: true, diffMin };
  } else if (diffMin < 60) {
    return { text: `in ${diffMin}m`, isPast: false, isLive: false, isImminent: false, diffMin };
  } else if (diffMin < 1440) {
    const h = Math.floor(diffMin / 60);
    const m = diffMin % 60;
    return { text: m > 0 ? `in ${h}h ${m}m` : `in ${h}h`, isPast: false, isLive: false, isImminent: false, diffMin };
  } else {
    const days = Math.floor(diffMin / 1440);
    const h = Math.floor((diffMin % 1440) / 60);
    return { text: h > 0 ? `in ${days}d ${h}h` : `in ${days}d`, isPast: false, isLive: false, isImminent: false, diffMin };
  }
}

export interface NewsAlertEvaluation {
  alertEvent: CalendarEvent | null;
  alertType: "live" | "imminent" | null;
  alertInfo: { text: string; isPast: boolean; isLive: boolean; isImminent: boolean; diffMin: number } | null;
  upcomingEvent: CalendarEvent | null;
  upcomingInfo: { text: string; isPast: boolean; isLive: boolean; isImminent: boolean; diffMin: number } | null;
}

export function evaluateNewsAlert(events: CalendarEvent[], now: Date = new Date()): NewsAlertEvaluation {
  if (!events || events.length === 0) {
    return { alertEvent: null, alertType: null, alertInfo: null, upcomingEvent: null, upcomingInfo: null };
  }

  const highImpactEvents = events.filter((e) => e.impact === "High");
  const mediumImpactEvents = events.filter((e) => e.impact === "Medium");

  // 1. High Impact: Live (-15m to +1m) or Imminent (+2m to +30m)
  for (const ev of highImpactEvents) {
    const info = formatNewsCountdown(ev.date, now);
    if (info.isLive || info.isImminent) {
      return {
        alertEvent: ev,
        alertType: info.isLive ? "live" : "imminent",
        alertInfo: info,
        upcomingEvent: null,
        upcomingInfo: null
      };
    }
  }

  // 2. Medium Impact: Live or Imminent (-10m to +15m)
  for (const ev of mediumImpactEvents) {
    const info = formatNewsCountdown(ev.date, now);
    if (info.diffMin >= -10 && info.diffMin <= 15) {
      return {
        alertEvent: ev,
        alertType: info.isLive ? "live" : "imminent",
        alertInfo: info,
        upcomingEvent: null,
        upcomingInfo: null
      };
    }
  }

  // 3. Upcoming High Impact (future)
  const futureHigh = highImpactEvents
    .map((ev) => ({ ev, info: formatNewsCountdown(ev.date, now) }))
    .filter((item) => item.info.diffMin > 0)
    .sort((a, b) => a.info.diffMin - b.info.diffMin);

  if (futureHigh.length > 0) {
    return {
      alertEvent: null,
      alertType: null,
      alertInfo: null,
      upcomingEvent: futureHigh[0].ev,
      upcomingInfo: futureHigh[0].info
    };
  }

  // 4. Upcoming Medium Impact (future)
  const futureMed = mediumImpactEvents
    .map((ev) => ({ ev, info: formatNewsCountdown(ev.date, now) }))
    .filter((item) => item.info.diffMin > 0)
    .sort((a, b) => a.info.diffMin - b.info.diffMin);

  if (futureMed.length > 0) {
    return {
      alertEvent: null,
      alertType: null,
      alertInfo: null,
      upcomingEvent: futureMed[0].ev,
      upcomingInfo: futureMed[0].info
    };
  }

  return {
    alertEvent: null,
    alertType: null,
    alertInfo: null,
    upcomingEvent: null,
    upcomingInfo: null
  };
}

// Calculate 60 ticks around rounded rectangle of width W, height H, radius R
function getRoundedRectTicks(W: number, H: number, R: number, tickLen: number) {
  const topEdge = W - 2 * R;
  const rightEdge = H - 2 * R;
  const bottomEdge = W - 2 * R;
  const leftEdge = H - 2 * R;
  const cornerLen = (Math.PI / 2) * R;
  const totalPerim = topEdge + rightEdge + bottomEdge + leftEdge + 4 * cornerLen;

  const getPointAndNormal = (dist: number) => {
    let d = ((dist % totalPerim) + totalPerim) % totalPerim;

    if (d < topEdge / 2) {
      return { x: W / 2 + d, y: 0, nx: 0, ny: 1 };
    }
    d -= topEdge / 2;

    if (d < cornerLen) {
      const angle = -Math.PI / 2 + (d / cornerLen) * (Math.PI / 2);
      return {
        x: W - R + R * Math.cos(angle),
        y: R + R * Math.sin(angle),
        nx: -Math.cos(angle),
        ny: -Math.sin(angle)
      };
    }
    d -= cornerLen;

    if (d < rightEdge) {
      return { x: W, y: R + d, nx: -1, ny: 0 };
    }
    d -= rightEdge;

    if (d < cornerLen) {
      const angle = (d / cornerLen) * (Math.PI / 2);
      return {
        x: W - R + R * Math.cos(angle),
        y: H - R + R * Math.sin(angle),
        nx: -Math.cos(angle),
        ny: -Math.sin(angle)
      };
    }
    d -= cornerLen;

    if (d < bottomEdge) {
      return { x: W - R - d, y: H, nx: 0, ny: -1 };
    }
    d -= bottomEdge;

    if (d < cornerLen) {
      const angle = Math.PI / 2 + (d / cornerLen) * (Math.PI / 2);
      return {
        x: R + R * Math.cos(angle),
        y: H - R + R * Math.sin(angle),
        nx: -Math.cos(angle),
        ny: -Math.sin(angle)
      };
    }
    d -= cornerLen;

    if (d < leftEdge) {
      return { x: 0, y: H - R - d, nx: 1, ny: 0 };
    }
    d -= leftEdge;

    if (d < cornerLen) {
      const angle = Math.PI + (d / cornerLen) * (Math.PI / 2);
      return {
        x: R + R * Math.cos(angle),
        y: R + R * Math.sin(angle),
        nx: -Math.cos(angle),
        ny: -Math.sin(angle)
      };
    }
    d -= cornerLen;

    return { x: R + d, y: 0, nx: 0, ny: 1 };
  };

  const ticks = [];
  for (let i = 0; i < 60; i++) {
    const dist = (i / 60) * totalPerim;
    const pt = getPointAndNormal(dist);
    ticks.push({
      i,
      x1: Math.round(pt.x * 10) / 10,
      y1: Math.round(pt.y * 10) / 10,
      x2: Math.round((pt.x + pt.nx * tickLen) * 10) / 10,
      y2: Math.round((pt.y + pt.ny * tickLen) * 10) / 10
    });
  }
  return ticks;
}

// 60 Tick marks around 160x160 square with corner radius 32
const PERIMETER_TICKS = getRoundedRectTicks(160, 160, 32, 7);

// Individual Rolling Digit Slot with zero clipping
export function DigitSlot({ digit, isDark = false }: { digit: string; isDark?: boolean }) {
  return (
    <div className="relative h-[28px] w-[16px] overflow-hidden flex items-center justify-center select-none font-mono">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={digit}
          initial={{ y: "65%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-65%", opacity: 0 }}
          transition={{
            y: { type: "spring", stiffness: 450, damping: 30 },
            opacity: { duration: 0.12 }
          }}
          className={`absolute inset-0 flex items-center justify-center text-[19px] font-black tabular-nums tracking-tight ${
            isDark 
              ? "text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]" 
              : "text-[#1E1B4B] dark:text-white"
          }`}
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

export function ClockSegment({ 
  value, 
  label, 
  variant = "dark" 
}: { 
  value: string; 
  label: string; 
  variant?: "dark" | "theme";
}) {
  const tens = value.charAt(0) || "0";
  const ones = value.charAt(1) || "0";

  if (variant === "theme") {
    return (
      <div className="flex flex-col items-center">
        <div className="w-[52px] h-[36px] rounded-xl bg-white dark:bg-[#151E2E] border border-indigo-200/90 dark:border-indigo-500/30 shadow-[0_2px_8px_rgba(67,56,202,0.08),inset_0_1px_1.5px_rgba(255,255,255,1)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex items-center justify-center gap-0.5 transition-all">
          <DigitSlot digit={tens} isDark={false} />
          <DigitSlot digit={ones} isDark={false} />
        </div>
        <span className="text-[7.5px] font-extrabold tracking-widest text-indigo-600 dark:text-indigo-400 uppercase text-center mt-1 select-none">
          {label}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="w-[52px] h-[36px] rounded-lg bg-white/[0.14] border border-white/25 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.4),0_3px_8px_rgba(0,0,0,0.25)] backdrop-blur-md flex items-center justify-center gap-0.5 transition-all">
        <DigitSlot digit={tens} isDark={true} />
        <DigitSlot digit={ones} isDark={true} />
      </div>
      <span className="text-[7px] font-bold tracking-widest text-indigo-200/85 uppercase text-center mt-1 select-none">
        {label}
      </span>
    </div>
  );
}

interface ForexClockWidgetProps {
  isCollapsed?: boolean;
  isStandalone?: boolean;
  isPip?: boolean;
  showSessionsList?: boolean;
  className?: string;
  onClose?: () => void;
}

export default function ForexClockWidget({
  isCollapsed = false,
  isStandalone = false,
  isPip = false,
  className = "",
  onClose
}: ForexClockWidgetProps) {
  const [timeStr, setTimeStr] = useState<string>("");
  const [useNyTime, setUseNyTime] = useState(false);
  const [nowDate, setNowDate] = useState<Date>(new Date());
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [sessionState, setSessionState] = useState<DetailedSessionState | null>(null);
  const [isSessionsExpanded, setIsSessionsExpanded] = useState(false);

  // Live News & Economic Calendar Alert States
  const [economicEvents, setEconomicEvents] = useState<CalendarEvent[]>([]);
  const [selectedDetailEvent, setSelectedDetailEvent] = useState<CalendarEvent | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [showStandaloneNewsDrawer, setShowStandaloneNewsDrawer] = useState(false);
  const lastAlertChimedKeyRef = useRef<string>("");

  const prevSbRef = useRef(false);
  const prevLiveRef = useRef(false);

  // Fetch economic calendar catalysts (refresh every 3 minutes)
  useEffect(() => {
    let isMounted = true;
    const fetchCalendar = async () => {
      try {
        const res = await fetch("/api/economic-calendar");
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.events && Array.isArray(data.events)) {
          setEconomicEvents(data.events);
        }
      } catch (err) {
        console.warn("Failed to fetch economic calendar in ForexClockWidget:", err);
      }
    };

    fetchCalendar();
    const pollInterval = setInterval(fetchCalendar, 180000);
    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, []);

  // Time & Session Update Loop
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setNowDate(now);
      setTimeStr(now.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }));

      // Accurate New York (EST/EDT) time
      const nyStr = now.toLocaleString("en-US", { timeZone: "America/New_York" });
      const nyDate = new Date(nyStr);
      const nyH = nyDate.getHours();
      const nyM = nyDate.getMinutes();
      const nyS = nyDate.getSeconds();
      const totalSec = nyH * 3600 + nyM * 60 + nyS;

      const toSec = (h: number, m: number) => h * 3600 + m * 60;
      const fmtTimer = (secs: number) => {
        if (secs < 0) secs = 0;
        const hh = Math.floor(secs / 3600);
        const mm = Math.floor((secs % 3600) / 60);
        const ss = Math.floor(secs % 60);
        return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
      };

      // Accurate Session States (accounting for Silver Bullets chronologically)
      let activeName = "Off-Hours";
      let isLive = false;
      let isSilverBullet = false;
      let bulletName = "";
      let activeEndsInSec = 0;
      let activeTime = "";

      let nextName = "London Open";
      let nextStartsInSec = 0;
      let nextTime = "";

      if (totalSec >= toSec(0, 0) && totalSec < toSec(2, 0)) {
        activeName = "Off-Hours (Pre-London)";
        activeEndsInSec = toSec(2, 0) - totalSec;
        activeTime = "Pre-London Gap";
        nextName = "London Open";
        nextStartsInSec = toSec(2, 0) - totalSec;
        nextTime = `${formatTimeForZone(now, 2, 0, useNyTime)} - ${formatTimeForZone(now, 5, 0, useNyTime)}`;
      } else if (totalSec >= toSec(2, 0) && totalSec < toSec(3, 0)) {
        activeName = "London Open";
        isLive = true;
        activeEndsInSec = toSec(5, 0) - totalSec;
        activeTime = `${formatTimeForZone(now, 2, 0, useNyTime)} - ${formatTimeForZone(now, 5, 0, useNyTime)}`;
        nextName = "London Silver Bullet";
        nextStartsInSec = toSec(3, 0) - totalSec;
        nextTime = `${formatTimeForZone(now, 3, 0, useNyTime)} - ${formatTimeForZone(now, 4, 0, useNyTime)}`;
      } else if (totalSec >= toSec(3, 0) && totalSec < toSec(4, 0)) {
        activeName = "London Silver Bullet";
        isLive = true;
        isSilverBullet = true;
        bulletName = "London Silver Bullet";
        activeEndsInSec = toSec(4, 0) - totalSec;
        activeTime = `${formatTimeForZone(now, 3, 0, useNyTime)} - ${formatTimeForZone(now, 4, 0, useNyTime)}`;
        nextName = "New York AM";
        nextStartsInSec = toSec(7, 0) - totalSec;
        nextTime = `${formatTimeForZone(now, 7, 0, useNyTime)} - ${formatTimeForZone(now, 12, 0, useNyTime)}`;
      } else if (totalSec >= toSec(4, 0) && totalSec < toSec(5, 0)) {
        activeName = "London Open";
        isLive = true;
        activeEndsInSec = toSec(5, 0) - totalSec;
        activeTime = `${formatTimeForZone(now, 2, 0, useNyTime)} - ${formatTimeForZone(now, 5, 0, useNyTime)}`;
        nextName = "New York AM";
        nextStartsInSec = toSec(7, 0) - totalSec;
        nextTime = `${formatTimeForZone(now, 7, 0, useNyTime)} - ${formatTimeForZone(now, 12, 0, useNyTime)}`;
      } else if (totalSec >= toSec(5, 0) && totalSec < toSec(7, 0)) {
        activeName = "Off-Hours (Pre-NY)";
        activeEndsInSec = toSec(7, 0) - totalSec;
        activeTime = "London / NY Gap";
        nextName = "New York AM";
        nextStartsInSec = toSec(7, 0) - totalSec;
        nextTime = `${formatTimeForZone(now, 7, 0, useNyTime)} - ${formatTimeForZone(now, 12, 0, useNyTime)}`;
      } else if (totalSec >= toSec(7, 0) && totalSec < toSec(10, 0)) {
        activeName = "New York AM";
        isLive = true;
        activeEndsInSec = toSec(12, 0) - totalSec;
        activeTime = `${formatTimeForZone(now, 7, 0, useNyTime)} - ${formatTimeForZone(now, 12, 0, useNyTime)}`;
        nextName = "NY AM Silver Bullet";
        nextStartsInSec = toSec(10, 0) - totalSec;
        nextTime = `${formatTimeForZone(now, 10, 0, useNyTime)} - ${formatTimeForZone(now, 11, 0, useNyTime)}`;
      } else if (totalSec >= toSec(10, 0) && totalSec < toSec(11, 0)) {
        activeName = "NY AM Silver Bullet";
        isLive = true;
        isSilverBullet = true;
        bulletName = "NY AM Silver Bullet";
        activeEndsInSec = toSec(11, 0) - totalSec;
        activeTime = `${formatTimeForZone(now, 10, 0, useNyTime)} - ${formatTimeForZone(now, 11, 0, useNyTime)}`;
        nextName = "NY PM Silver Bullet";
        nextStartsInSec = toSec(14, 0) - totalSec;
        nextTime = `${formatTimeForZone(now, 14, 0, useNyTime)} - ${formatTimeForZone(now, 15, 0, useNyTime)}`;
      } else if (totalSec >= toSec(11, 0) && totalSec < toSec(12, 0)) {
        activeName = "New York AM";
        isLive = true;
        activeEndsInSec = toSec(12, 0) - totalSec;
        activeTime = `${formatTimeForZone(now, 7, 0, useNyTime)} - ${formatTimeForZone(now, 12, 0, useNyTime)}`;
        nextName = "NY PM Silver Bullet";
        nextStartsInSec = toSec(14, 0) - totalSec;
        nextTime = `${formatTimeForZone(now, 14, 0, useNyTime)} - ${formatTimeForZone(now, 15, 0, useNyTime)}`;
      } else if (totalSec >= toSec(12, 0) && totalSec < toSec(13, 0)) {
        activeName = "Off-Hours (Lunch)";
        activeEndsInSec = toSec(13, 0) - totalSec;
        activeTime = "NY Lunch Gap";
        nextName = "NY PM Silver Bullet";
        nextStartsInSec = toSec(14, 0) - totalSec;
        nextTime = `${formatTimeForZone(now, 14, 0, useNyTime)} - ${formatTimeForZone(now, 15, 0, useNyTime)}`;
      } else if (totalSec >= toSec(13, 0) && totalSec < toSec(14, 0)) {
        activeName = "New York PM";
        isLive = true;
        activeEndsInSec = toSec(16, 0) - totalSec;
        activeTime = `${formatTimeForZone(now, 13, 0, useNyTime)} - ${formatTimeForZone(now, 16, 0, useNyTime)}`;
        nextName = "NY PM Silver Bullet";
        nextStartsInSec = toSec(14, 0) - totalSec;
        nextTime = `${formatTimeForZone(now, 14, 0, useNyTime)} - ${formatTimeForZone(now, 15, 0, useNyTime)}`;
      } else if (totalSec >= toSec(14, 0) && totalSec < toSec(15, 0)) {
        activeName = "NY PM Silver Bullet";
        isLive = true;
        isSilverBullet = true;
        bulletName = "NY PM Silver Bullet";
        activeEndsInSec = toSec(15, 0) - totalSec;
        activeTime = `${formatTimeForZone(now, 14, 0, useNyTime)} - ${formatTimeForZone(now, 15, 0, useNyTime)}`;
        nextName = "Asian Session";
        nextStartsInSec = toSec(20, 0) - totalSec;
        nextTime = `${formatTimeForZone(now, 20, 0, useNyTime)} - ${formatTimeForZone(now, 24, 0, useNyTime)}`;
      } else if (totalSec >= toSec(15, 0) && totalSec < toSec(16, 0)) {
        activeName = "New York PM";
        isLive = true;
        activeEndsInSec = toSec(16, 0) - totalSec;
        activeTime = `${formatTimeForZone(now, 13, 0, useNyTime)} - ${formatTimeForZone(now, 16, 0, useNyTime)}`;
        nextName = "Asian Session";
        nextStartsInSec = toSec(20, 0) - totalSec;
        nextTime = `${formatTimeForZone(now, 20, 0, useNyTime)} - ${formatTimeForZone(now, 24, 0, useNyTime)}`;
      } else if (totalSec >= toSec(16, 0) && totalSec < toSec(20, 0)) {
        activeName = "Off-Hours (Post-NY)";
        activeEndsInSec = toSec(20, 0) - totalSec;
        activeTime = "Daily Settlement";
        nextName = "Asian Session";
        nextStartsInSec = toSec(20, 0) - totalSec;
        nextTime = `${formatTimeForZone(now, 20, 0, useNyTime)} - ${formatTimeForZone(now, 24, 0, useNyTime)}`;
      } else {
        activeName = "Asian Session";
        isLive = true;
        activeEndsInSec = toSec(24, 0) - totalSec;
        activeTime = `${formatTimeForZone(now, 20, 0, useNyTime)} - ${formatTimeForZone(now, 24, 0, useNyTime)}`;
        nextName = "London Open";
        nextStartsInSec = (toSec(24, 0) - totalSec) + toSec(2, 0);
        nextTime = `${formatTimeForZone(now, 2, 0, useNyTime)} - ${formatTimeForZone(now, 5, 0, useNyTime)}`;
      }

      if (soundEnabled) {
        if (isSilverBullet && !prevSbRef.current) {
          playChime("sb");
        } else if (isLive && !prevLiveRef.current) {
          playChime("session");
        }
      }
      prevSbRef.current = isSilverBullet;
      prevLiveRef.current = isLive;

      setSessionState({
        activeName,
        isLive,
        isSilverBullet,
        bulletName,
        activeEndsIn: fmtTimer(activeEndsInSec),
        activeTime,
        nextName,
        nextStartsIn: fmtTimer(nextStartsInSec),
        nextTime,
        remainingSec: activeEndsInSec,
        nowNyTotalSec: totalSec
      });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [soundEnabled, useNyTime]);

  // Minimize external widget to taskbar
  const handleMinimizeWidget = async () => {
    try {
      await fetch("/api/window-control?action=minimize", {
        method: "POST"
      });
    } catch (err) {
      console.warn("Minimize error:", err);
    }
  };

  // Close widget and bring main journal window to front
  const handleCloseWidget = async () => {
    try {
      await fetch("/api/window-control?action=close", {
        method: "POST"
      });
    } catch {}

    if (onClose) {
      onClose();
      return;
    }
    if (typeof window !== "undefined") {
      try {
        if (window.opener && !window.opener.closed) {
          window.opener.focus();
          window.opener.location.href = "/";
        } else {
          window.open("/", "_blank");
        }
      } catch {
        window.open("/", "_blank");
      }
      window.close();
    }
  };

  // Launch clean desktop widget (Stripped caption, fixed scale, no folder bar)
  const handleLaunchPopout = async () => {
    try {
      const res = await fetch("/api/launch-clock", { method: "POST" });
      if (res.ok) return;
    } catch {}

    const w = 600;
    const h = 305;
    const left = window.screen.width - w - 20;
    const top = window.screen.height - h - 50;
    window.open(
      "/clock",
      "ForexClockPopup",
      `width=${w},height=${h},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=no`
    );
  };

  // Evaluate Live News Catalysts & High-Impact Red Alerts
  const alertState = evaluateNewsAlert(economicEvents, nowDate);

  // Audio alert chime when High-Impact news is active or imminent
  useEffect(() => {
    if (soundEnabled && alertState.alertEvent) {
      const alertKey = `${alertState.alertEvent.title}_${alertState.alertType}`;
      if (lastAlertChimedKeyRef.current !== alertKey) {
        lastAlertChimedKeyRef.current = alertKey;
        playNewsAlert();
      }
    } else if (!alertState.alertEvent) {
      lastAlertChimedKeyRef.current = "";
    }
  }, [soundEnabled, alertState.alertEvent, alertState.alertType]);

  if (!sessionState || !timeStr) return null;

  // Breakdown for Digital StandBy Clock
  const targetDate = nowDate || new Date();
  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: useNyTime ? 'America/New_York' : undefined,
    hour12: true,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  const displayParts = timeFormatter.formatToParts(targetDate);
  const dispH = displayParts.find(p => p.type === 'hour')?.value || "12";
  const dispM = displayParts.find(p => p.type === 'minute')?.value || "00";
  const dispS = displayParts.find(p => p.type === 'second')?.value || "00";
  const rawAmpm = displayParts.find(p => p.type === 'dayPeriod')?.value;
  const dispAmpm = rawAmpm ? rawAmpm.toUpperCase() : (targetDate.getHours() >= 12 ? "PM" : "AM");
  const currentSecNum = parseInt(dispS, 10) || 0;

  // Collapsed Sidebar View (Micro icon)
  if (isCollapsed) {
    return (
      <div 
        onClick={() => setUseNyTime(!useNyTime)}
        className="w-[52px] py-2.5 px-1 rounded-2xl bg-[#4338CA] text-white shadow-md flex flex-col items-center justify-center cursor-pointer hover:opacity-90 transition-all select-none group"
        title={`${sessionState.activeName} • Active: ${sessionState.activeEndsIn}`}
      >
        <span className="font-mono font-black text-sm text-white">
          {dispH}
        </span>
        <span className="w-1 h-1 rounded-full bg-indigo-200 my-0.5 animate-pulse" />
        <span className="font-mono font-black text-sm text-white">
          {dispM}
        </span>
        <span className="text-[8px] font-black text-indigo-200 mt-1 uppercase">
          {useNyTime ? "NY" : "LOC"}
        </span>
      </div>
    );
  }

  const isFrameless = isStandalone || isPip;

  // -------------------------------------------------------------
  // BRANCH 1: STANDALONE EXTERNAL WIDGET (Compact 450x236 2-column)
  // -------------------------------------------------------------
  if (isFrameless) {
    return (
      <div 
        className={`w-[450px] h-[236px] max-w-[450px] max-h-[236px] bg-[#080C14] text-white p-2 rounded-xl border border-white/15 shadow-2xl backdrop-blur-xl flex flex-col justify-between overflow-hidden select-none relative ${className}`}
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-1 border-b border-white/10 px-0.5">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className={`relative inline-flex rounded-full h-2 w-2 ${sessionState.isLive ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)] animate-ping" : "bg-slate-500"}`} />
            </span>
            <span className="text-[9.5px] font-mono font-semibold tracking-wider uppercase text-white/90">
              FOREX &amp; ICT STANDBY
            </span>
          </div>

          <div className="flex items-center gap-1" style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
            {/* Audio Warning Toggle */}
            <button
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) playNewsAlert();
              }}
              className={`p-1 rounded border transition-all cursor-pointer ${
                soundEnabled 
                  ? "bg-amber-500/80 border-amber-400 text-white" 
                  : "bg-white/10 hover:bg-white/20 text-white/70 border-white/15"
              }`}
              title={soundEnabled ? "Audio Alerts ON" : "Audio Alerts OFF"}
            >
              {soundEnabled ? <Volume2 className="w-2.5 h-2.5" /> : <VolumeX className="w-2.5 h-2.5" />}
            </button>
            <button
              onClick={() => setUseNyTime(!useNyTime)}
              className="text-[8px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white/90 border border-white/15 transition-all cursor-pointer flex items-center gap-0.5"
              title="Toggle Timezone"
            >
              <span>{useNyTime ? "NY" : "LOC"}</span>
              <span className="text-[7px] opacity-75">⇄</span>
            </button>
            <button
              onClick={handleMinimizeWidget}
              className="p-1 rounded bg-white/10 hover:bg-white/25 active:scale-95 text-white/80 hover:text-white border border-white/15 transition-all cursor-pointer"
              title="Minimize to Taskbar"
            >
              <Minus className="w-2.5 h-2.5" />
            </button>
            <button
              onClick={handleCloseWidget}
              className="p-1 rounded bg-white/10 hover:bg-rose-500 active:scale-95 text-white/80 hover:text-white border border-white/15 transition-all cursor-pointer"
              title="Close Widget"
            >
              <X className="w-2.5 h-2.5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Live News Red Alert / Catalyst Banner */}
        <div style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
          {alertState.alertEvent ? (
            // RED ALERT BANNER (High Impact Live or Imminent)
            <div 
              onClick={() => {
                setSelectedDetailEvent(alertState.alertEvent);
                setShowStandaloneNewsDrawer(true);
              }}
              className="w-full bg-gradient-to-r from-red-950/95 via-rose-900/90 to-red-950/95 border border-rose-500/80 text-rose-100 px-2 py-0.5 rounded-lg flex items-center justify-between shadow-[0_0_12px_rgba(244,63,94,0.35)] cursor-pointer hover:border-rose-400 transition-all select-none animate-pulse"
              title="Click to view event intelligence"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-90" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,1)]" />
                </span>
                <span className="text-[8.5px] font-black uppercase tracking-wider text-rose-300 shrink-0">
                  {alertState.alertType === "live" ? "🔴 LIVE RELEASE:" : "🚨 RED ALERT:"}
                </span>
                <span className="text-[8.5px] font-bold text-white truncate max-w-[210px]">
                  [{alertState.alertEvent.country}] {alertState.alertEvent.title}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[8px] font-mono font-black bg-rose-500 text-white px-1.5 py-0.2 rounded shadow-xs">
                  {alertState.alertInfo?.text}
                </span>
                <ChevronRight className="w-2.5 h-2.5 text-rose-300" />
              </div>
            </div>
          ) : (
            // UPCOMING CATALYST STRIP
            <div 
              onClick={() => {
                if (alertState.upcomingEvent) {
                  setSelectedDetailEvent(alertState.upcomingEvent);
                  setShowStandaloneNewsDrawer(true);
                }
              }}
              className="w-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white/80 px-2 py-0.5 rounded-lg flex items-center justify-between transition-all cursor-pointer select-none"
              title={alertState.upcomingEvent ? "Click to view catalyst details" : ""}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[8px] font-black text-amber-400 shrink-0 flex items-center gap-0.5">
                  <Flame className="w-2.5 h-2.5" /> CATALYST:
                </span>
                <span className="text-[8px] text-white/80 truncate max-w-[220px]">
                  {alertState.upcomingEvent ? `[${alertState.upcomingEvent.country}] ${alertState.upcomingEvent.title}` : "No high-impact catalysts pending today"}
                </span>
              </div>
              {alertState.upcomingEvent && (
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[7.5px] font-mono text-cyan-300 bg-cyan-500/15 border border-cyan-400/25 px-1 py-0.2 rounded">
                    {alertState.upcomingInfo?.text}
                  </span>
                  <ChevronRight className="w-2 h-2 text-white/40" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content: Left Dial (134px) + Right Compact Cards */}
        <div className="grid grid-cols-[134px_1fr] gap-2 items-center">
          {/* Left Clock Dial */}
          <div className="relative aspect-square w-[134px] h-[134px] flex items-center justify-center p-1 rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden">
            <svg className="absolute inset-0 w-full h-full pointer-events-none p-1" viewBox="-5 -5 170 170">
              {PERIMETER_TICKS.map((t) => {
                const isPast = t.i <= currentSecNum;
                const isCurrent = t.i === currentSecNum;
                return (
                  <line
                    key={t.i}
                    x1={t.x1}
                    y1={t.y1}
                    x2={t.x2}
                    y2={t.y2}
                    stroke={isPast ? "#FFFFFF" : "rgba(255, 255, 255, 0.16)"}
                    strokeWidth={isCurrent ? 2.6 : isPast ? 1.8 : 1.1}
                    strokeLinecap="round"
                  />
                );
              })}
            </svg>
            <div className="relative z-10 flex flex-col items-center justify-center select-none">
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-[8px] font-semibold text-white/80 px-1 py-0.2 rounded bg-white/15 uppercase">
                  {dispAmpm}
                </span>
                <span className="text-[7.5px] font-semibold text-indigo-200 px-1 py-0.2 rounded bg-indigo-500/20 uppercase">
                  {useNyTime ? "NY" : "LOCAL"}
                </span>
              </div>
              <div className="flex items-center justify-center my-0.5">
                <span className="text-2xl font-mono font-semibold text-white tracking-tight">
                  {dispH}:{dispM}
                </span>
              </div>
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/10 border border-white/15">
                <span className="text-[9px] font-mono font-semibold text-emerald-400">
                  {dispS}
                </span>
                <span className="text-[7.5px] font-mono text-white/60 uppercase">
                  SEC
                </span>
              </div>
            </div>
          </div>

          {/* Right Compact Cards */}
          <div className="flex flex-col justify-between gap-1.5 h-full">
            {/* Card 1: Active */}
            <div className={`rounded-lg p-1.5 flex flex-col justify-between border ${
              sessionState.isSilverBullet
                ? "bg-amber-950/30 border-amber-500/40 text-amber-200"
                : sessionState.isLive
                  ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-200"
                  : "bg-white/[0.03] border-white/10 text-white/90"
            }`}>
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className={`text-[8px] font-semibold uppercase tracking-wider ${sessionState.isSilverBullet ? "text-amber-400/80" : "text-white/50"}`}>
                  CURRENT SESSION
                </span>
                <span className={`text-[7.5px] font-bold px-1.5 py-0.2 rounded uppercase ${
                  sessionState.isSilverBullet
                    ? "bg-amber-500 text-black font-black"
                    : sessionState.isLive
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                      : "bg-white/10 text-white/60"
                }`}>
                  {sessionState.isSilverBullet ? "SILVER BULLET (SB)" : sessionState.isLive ? "ACTIVE" : "OFF-HOURS"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <h4 className={`text-xs font-semibold truncate max-w-[120px] ${sessionState.isSilverBullet ? "text-amber-200" : "text-white"}`}>
                  {sessionState.isSilverBullet ? sessionState.bulletName : sessionState.activeName}
                </h4>
                <span className={`text-[9px] font-mono ${sessionState.isSilverBullet ? "text-amber-300/80" : "text-white/70"}`}>
                  {sessionState.activeTime}
                </span>
              </div>
              <div className="mt-1 pt-1 border-t border-white/10 flex items-center justify-between">
                <span className={`text-[8.5px] ${sessionState.isSilverBullet ? "text-amber-300/70" : "text-white/60"}`}>Ends in:</span>
                <span className={`font-mono font-bold text-[10.5px] px-1 py-0.2 rounded border ${
                  sessionState.isSilverBullet
                    ? "bg-amber-500/20 text-amber-400 border-amber-400/30"
                    : "bg-white/10 text-emerald-400 border-white/15"
                }`}>
                  {sessionState.activeEndsIn}
                </span>
              </div>
            </div>

            {/* Card 2: Upcoming */}
            <div className={`rounded-lg p-1.5 flex flex-col justify-between border ${
              sessionState.nextName.includes("Silver Bullet")
                ? "bg-amber-950/20 border-amber-500/30 text-amber-200"
                : "bg-white/[0.02] border-white/10 text-white/90"
            }`}>
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className={`text-[8px] font-semibold uppercase tracking-wider ${sessionState.nextName.includes("Silver Bullet") ? "text-amber-400/80" : "text-white/50"}`}>
                  NEXT UPCOMING
                </span>
                <span className={`text-[7.5px] font-bold px-1.5 py-0.2 rounded border uppercase ${
                  sessionState.nextName.includes("Silver Bullet")
                    ? "bg-amber-500/20 text-amber-300 border-amber-400/30 font-black"
                    : "bg-cyan-500/20 text-cyan-300 border-cyan-400/30"
                }`}>
                  {sessionState.nextName.includes("Silver Bullet") ? "UPCOMING (SB)" : "UPCOMING"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <h4 className={`text-xs font-semibold truncate max-w-[120px] ${sessionState.nextName.includes("Silver Bullet") ? "text-amber-200" : "text-white"}`}>
                  {sessionState.nextName}
                </h4>
                <span className={`text-[9px] font-mono ${sessionState.nextName.includes("Silver Bullet") ? "text-amber-300/80" : "text-white/70"}`}>
                  {sessionState.nextTime}
                </span>
              </div>
              <div className="mt-1 pt-1 border-t border-white/10 flex items-center justify-between">
                <span className={`text-[8.5px] ${sessionState.nextName.includes("Silver Bullet") ? "text-amber-300/70" : "text-white/60"}`}>Starts in:</span>
                <span className={`font-mono font-bold text-[10.5px] px-1 py-0.2 rounded border ${
                  sessionState.nextName.includes("Silver Bullet")
                    ? "bg-amber-500/15 text-amber-400 border-amber-400/25"
                    : "bg-cyan-500/15 text-cyan-300 border-cyan-400/25"
                }`}>
                  {sessionState.nextStartsIn}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* In-Widget News Intelligence Slide-Up Drawer */}
        <AnimatePresence>
          {showStandaloneNewsDrawer && selectedDetailEvent && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute inset-0 z-50 bg-[#080C14]/98 backdrop-blur-xl p-3 flex flex-col justify-between rounded-xl border border-white/20 select-none shadow-2xl"
              style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-1 border-b border-white/10">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    {selectedDetailEvent.country}
                  </span>
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase bg-rose-500 text-white">
                    {selectedDetailEvent.impact} IMPACT
                  </span>
                  <h4 className="text-[10px] font-bold text-white truncate max-w-[210px]">
                    {selectedDetailEvent.title}
                  </h4>
                </div>
                <button
                  onClick={() => setShowStandaloneNewsDrawer(false)}
                  className="p-1 rounded bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              {/* Grid Metrics */}
              <div className="grid grid-cols-3 gap-1.5 py-1 text-center">
                <div className="p-1 rounded-lg bg-white/[0.04] border border-white/10">
                  <span className="text-[7.5px] uppercase text-white/50 block">Forecast</span>
                  <span className="text-[9.5px] font-mono font-bold text-white">
                    {selectedDetailEvent.forecast || "N/A"}
                  </span>
                </div>
                <div className="p-1 rounded-lg bg-white/[0.04] border border-white/10">
                  <span className="text-[7.5px] uppercase text-white/50 block">Previous</span>
                  <span className="text-[9.5px] font-mono font-bold text-white/70">
                    {selectedDetailEvent.previous || "N/A"}
                  </span>
                </div>
                <div className="p-1 rounded-lg bg-white/[0.04] border border-white/10">
                  <span className="text-[7.5px] uppercase text-white/50 block">Scheduled</span>
                  <span className="text-[9.5px] font-mono font-bold text-cyan-400">
                    {format(parseISO(selectedDetailEvent.date), useNyTime ? "HH:mm 'NY'" : "HH:mm 'LOC'")}
                  </span>
                </div>
              </div>

              {/* Protocol */}
              <div className="px-2 py-1 rounded-lg bg-rose-950/40 border border-rose-500/30 text-[8px] text-rose-200/90 leading-tight flex items-start gap-1.5">
                <ShieldAlert className="w-3 h-3 text-rose-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-rose-300">ICT Trader Protocol:</strong> Volatility spike &amp; spread widening expected. Avoid entering into the pending candle; watch for liquidity sweeps.
                </span>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-1 border-t border-white/10">
                <span className="text-[8px] font-mono text-white/60">
                  Status: {formatNewsCountdown(selectedDetailEvent.date).text}
                </span>
                <button
                  onClick={() => {
                    setShowStandaloneNewsDrawer(false);
                    if (typeof window !== "undefined") {
                      try {
                        if (window.opener && !window.opener.closed) {
                          window.opener.focus();
                          window.opener.location.href = "/calendar";
                        } else {
                          window.open("/calendar", "_blank");
                        }
                      } catch {
                        window.open("/calendar", "_blank");
                      }
                    }
                  }}
                  className="text-[8px] font-bold px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 transition-all cursor-pointer"
                >
                  <span>Open Full Calendar</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // -------------------------------------------------------------
  // BRANCH 2: APP SIDEBAR WIDGET (Neumorphic Luxury Harmonized Widget)
  // -------------------------------------------------------------
  return (
    <div className={`w-full bg-[var(--card)] text-[var(--foreground)] rounded-2xl p-3 border border-indigo-100/90 dark:border-white/10 shadow-[0_4px_20px_-2px_rgba(79,70,229,0.06),0_2px_6px_-1px_rgba(0,0,0,0.02)] flex flex-col gap-2.5 select-none transition-all ${className}`}>
      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-2 border-b border-indigo-100/70 dark:border-white/5 px-0.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] dark:text-indigo-300 flex items-center justify-center border border-[var(--primary)]/20 shadow-2xs shrink-0">
            <Clock className="w-3 h-3" />
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              {sessionState.isLive ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--primary)]" />
              )}
            </span>
            <span className="text-[10px] font-extrabold tracking-wider uppercase text-[var(--foreground)] truncate">
              FOREX &amp; ICT
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Timezone Toggle */}
          <button
            onClick={() => setUseNyTime(!useNyTime)}
            className="text-[9px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 bg-white dark:bg-white/[0.05] hover:bg-indigo-50 dark:hover:bg-white/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-white/10 shadow-2xs"
            title="Toggle between LOCAL and NEW YORK time"
          >
            <span>{useNyTime ? "NY" : "LOC"}</span>
            <span className="text-[7.5px] opacity-75">⇄</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (next) playChime("sb");
            }}
            className={`w-6 h-6 flex items-center justify-center rounded-lg border transition-all cursor-pointer shadow-2xs ${
              soundEnabled 
                ? "bg-amber-500 border-amber-400 text-white" 
                : "bg-white dark:bg-white/[0.05] hover:bg-indigo-50 dark:hover:bg-white/10 border-indigo-200/80 dark:border-white/10 text-[var(--muted-foreground)] hover:text-indigo-600 dark:hover:text-indigo-300"
            }`}
            title={soundEnabled ? "Audio Alerts ON" : "Audio Alerts OFF"}
          >
            {soundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
          </button>

          {/* Pop-out to Desktop Button */}
          <button
            onClick={handleLaunchPopout}
            className="w-6 h-6 flex items-center justify-center rounded-lg bg-white dark:bg-white/[0.05] hover:bg-indigo-50 dark:hover:bg-white/10 active:scale-95 text-[var(--muted-foreground)] hover:text-indigo-600 dark:hover:text-indigo-300 border border-indigo-200/80 dark:border-white/10 transition-all cursor-pointer shadow-2xs"
            title="Pop-out Desktop StandBy Widget"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ── CLOCK FACE CARD (UC TRADE SIGNATURE) ─────────────────── */}
      <div className="w-full rounded-xl bg-gradient-to-br from-indigo-50/90 via-purple-50/30 to-white dark:from-indigo-950/35 dark:via-[#131B2B] dark:to-card p-2.5 flex flex-col gap-2 border border-indigo-100 dark:border-indigo-500/20 shadow-xs">
        {/* Session label row */}
        <div className="w-full flex items-center justify-between px-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              sessionState.isLive
                ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]"
                : "bg-indigo-400"
            }`} />
            <span className={`text-[9.5px] font-extrabold tracking-wide uppercase truncate ${
              sessionState.isSilverBullet
                ? "text-amber-700 dark:text-amber-300"
                : sessionState.isLive
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-indigo-700 dark:text-indigo-400"
            }`}>
              {sessionState.isSilverBullet ? sessionState.bulletName : sessionState.isLive ? sessionState.activeName : "ICT Market"}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[8.5px] font-extrabold px-2 py-0.5 rounded-md bg-[var(--primary)] text-white uppercase tracking-wider shadow-2xs">
              {dispAmpm} · {useNyTime ? "NY" : "LOC"}
            </span>
          </div>
        </div>

        {/* Rolling digits */}
        <div className="flex items-end justify-center gap-1.5 my-0.5">
          <ClockSegment value={dispH} label="HRS" variant="theme" />
          
          <div className="h-[36px] flex items-center justify-center pb-[10px]">
            <span className="text-lg font-mono font-black text-[var(--primary)] animate-pulse px-0.5 select-none leading-none">:</span>
          </div>

          <ClockSegment value={dispM} label="MIN" variant="theme" />

          <div className="h-[36px] flex items-center justify-center pb-[10px]">
            <span className="text-lg font-mono font-black text-[var(--primary)] animate-pulse px-0.5 select-none leading-none">:</span>
          </div>

          <ClockSegment value={dispS} label="SEC" variant="theme" />
        </div>
      </div>

      {/* ── SESSION OVERVIEW CARDS (HARMONIZED UC TRADE CARDS) ──── */}
      <div className="flex flex-col gap-2">
        {/* CURRENT SESSION CARD */}
        <div className={`rounded-xl p-2.5 flex flex-col gap-1.5 border transition-all ${
          sessionState.isSilverBullet
            ? "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200"
            : sessionState.isLive
              ? "bg-emerald-500/[0.08] border-emerald-500/25 text-emerald-950 dark:text-emerald-200"
              : "bg-white/80 dark:bg-white/[0.03] border-indigo-100/90 dark:border-white/10 shadow-2xs"
        }`}>
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className={`w-2 h-2 rounded-full shrink-0 ${
                sessionState.isSilverBullet
                  ? "bg-amber-500"
                  : sessionState.isLive
                    ? "bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.8)]"
                    : "bg-slate-400"
              }`} />
              <h4 className="text-xs font-bold text-[var(--foreground)] truncate">
                {sessionState.isSilverBullet ? sessionState.bulletName : sessionState.activeName}
              </h4>
            </div>
            <span className={`text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 shadow-2xs ${
              sessionState.isSilverBullet
                ? "bg-amber-500 text-slate-950 font-black"
                : sessionState.isLive
                  ? "bg-emerald-500 text-white font-black"
                  : "bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300"
            }`}>
              {sessionState.isSilverBullet ? "SILVER BULLET" : sessionState.isLive ? "ACTIVE" : "OFF-HOURS"}
            </span>
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <span className="font-mono text-[9.5px] text-[var(--muted-foreground)] tabular-nums">
              {sessionState.activeTime}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-[var(--muted-foreground)]">Ends in:</span>
              <span className={`font-mono font-bold text-[11px] px-1.5 py-0.5 rounded-md border tabular-nums ${
                sessionState.isSilverBullet
                  ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30"
                  : sessionState.isLive
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25"
                    : "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20"
              }`}>
                {sessionState.activeEndsIn}
              </span>
            </div>
          </div>
        </div>

        {/* NEXT UPCOMING SESSION CARD */}
        <div className="rounded-xl p-2.5 bg-indigo-50/70 dark:bg-indigo-950/25 border border-indigo-200/70 dark:border-indigo-500/25 shadow-2xs flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-[var(--primary)] shrink-0" />
              <h4 className="text-xs font-bold text-[var(--foreground)] truncate">
                {sessionState.nextName}
              </h4>
            </div>
            <span className="text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-500/15 border border-indigo-500/25 shrink-0">
              UPCOMING
            </span>
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <span className="font-mono text-[9.5px] text-[var(--muted-foreground)] tabular-nums">
              {sessionState.nextTime}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-[var(--muted-foreground)]">Starts in:</span>
              <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded-md bg-[var(--primary)]/10 text-[var(--primary)] dark:text-indigo-300 border border-[var(--primary)]/20 tabular-nums">
                {sessionState.nextStartsIn}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── EXPAND / COLLAPSE BUTTON ───────────────────────────── */}
      <button
        onClick={() => setIsSessionsExpanded(!isSessionsExpanded)}
        className="w-full py-1.5 px-3 rounded-xl text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-white/90 hover:bg-indigo-50 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-indigo-200/70 dark:border-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
      >
        <span>{isSessionsExpanded ? "▴ Hide All Sessions" : "▾ View All 7 Sessions"}</span>
      </button>

      {/* ── ALL 7 SESSIONS PANEL ────────────────────────────────── */}
      {isSessionsExpanded && (
        <div className="w-full rounded-xl p-2 bg-white/95 dark:bg-white/[0.03] border border-indigo-100 dark:border-white/10 flex flex-col gap-1 shadow-2xs">
          <span className="text-[8px] font-extrabold uppercase tracking-wider text-indigo-600/80 dark:text-indigo-400 mb-0.5 px-0.5">
            ALL 7 ICT SESSIONS · {useNyTime ? "NY TIME" : "LOCAL TIME"}
          </span>
          {ALL_7_ICT_SESSIONS.map((s) => {
            const info = getSessionCountdownInfo(sessionState.nowNyTotalSec, s.startH, s.endH);
            const timeFormatted = `${formatTimeForZone(nowDate, s.startH, s.startM, useNyTime)} - ${formatTimeForZone(nowDate, s.endH, s.endM, useNyTime)}`;
            return (
              <div 
                key={s.id}
                className={`flex items-center justify-between px-2 py-1.5 rounded-lg border transition-all ${
                  info.isActive
                    ? s.isSb 
                      ? "bg-amber-500/15 border-amber-400/40 text-amber-950 dark:text-amber-200" 
                      : "bg-emerald-500/15 border-emerald-400/40 text-emerald-950 dark:text-emerald-200"
                    : "bg-white/60 dark:bg-white/[0.02] border-indigo-100/60 dark:border-white/5 text-[var(--muted-foreground)]"
                }`}
              >
                <div className="flex flex-col min-w-0 pr-1">
                  <span className={`text-[9.5px] truncate ${info.isActive ? "font-bold text-[var(--foreground)]" : "font-medium"}`}>
                    {s.name}
                  </span>
                  <span className="text-[8px] font-mono text-[var(--muted-foreground)]">
                    {timeFormatted}
                  </span>
                </div>
                <span className={`text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded-md border whitespace-nowrap shrink-0 tabular-nums ${
                  info.isActive
                    ? s.isSb
                      ? "bg-amber-500 text-slate-950 border-amber-400/50 font-black"
                      : "bg-emerald-500 text-white border-emerald-400/50 font-black"
                    : "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20"
                }`}>
                  {info.text}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Bilingual Economic Event Detail Modal */}
      <EconomicEventDetailModal
        isOpen={isDetailModalOpen}
        event={selectedDetailEvent}
        onClose={() => setIsDetailModalOpen(false)}
      />
    </div>
  );
}

