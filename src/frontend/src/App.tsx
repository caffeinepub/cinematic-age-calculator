import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface AgeResult {
  years: number;
  months: number;
  weeks: number;
  days: number;
}

interface Particle {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  opacity: number;
  color: string;
}

// ─── Canvas Background ───────────────────────────────────────────────────────
function StarCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const STAR_COLORS = ["#ffffff", "#dde8ff", "#b0c8ff", "#34E0C6", "#3B82F6"];
    const BOKEH_COLORS = [
      "#34E0C6",
      "#3B82F6",
      "#D46BFF",
      "#E3C27A",
      "#7A4CFF",
    ];

    const initParticles = () => {
      const w = canvas.width;
      const h = canvas.height;
      const particles: Particle[] = [];
      // Stars
      for (let i = 0; i < 220; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.5 + 0.3,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.1,
          opacity: Math.random() * 0.8 + 0.2,
          color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
        });
      }
      // Bokeh
      for (let i = 0; i < 35; i++) {
        particles.push({
          x: Math.random() * w,
          y: h * 0.45 + Math.random() * h * 0.55,
          r: Math.random() * 18 + 6,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.2,
          opacity: Math.random() * 0.25 + 0.05,
          color: BOKEH_COLORS[Math.floor(Math.random() * BOKEH_COLORS.length)],
        });
      }
      particlesRef.current = particles;
    };

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Deep space gradient
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, "#050912");
      bg.addColorStop(0.4, "#071022");
      bg.addColorStop(1, "#0A1020");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Aurora top-left cyan
      const aur1 = ctx.createRadialGradient(
        w * 0.1,
        h * 0.05,
        0,
        w * 0.1,
        h * 0.05,
        w * 0.5,
      );
      aur1.addColorStop(0, "rgba(47,230,192,0.18)");
      aur1.addColorStop(0.5, "rgba(58,166,255,0.08)");
      aur1.addColorStop(1, "transparent");
      ctx.fillStyle = aur1;
      ctx.fillRect(0, 0, w, h);

      // Aurora top-right purple
      const aur2 = ctx.createRadialGradient(
        w * 0.9,
        h * 0.08,
        0,
        w * 0.9,
        h * 0.08,
        w * 0.45,
      );
      aur2.addColorStop(0, "rgba(122,76,255,0.15)");
      aur2.addColorStop(0.5, "rgba(58,166,255,0.07)");
      aur2.addColorStop(1, "transparent");
      ctx.fillStyle = aur2;
      ctx.fillRect(0, 0, w, h);

      // Particles
      for (const p of particlesRef.current) {
        ctx.save();
        ctx.globalAlpha = p.opacity;
        if (p.r > 4) {
          // Bokeh blur effect
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
          grad.addColorStop(0, p.color);
          grad.addColorStop(1, "transparent");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Star
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -p.r) p.x = canvas.width + p.r;
        if (p.x > canvas.width + p.r) p.x = -p.r;
        if (p.y < -p.r) p.y = canvas.height + p.r;
        if (p.y > canvas.height + p.r) p.y = -p.r;
      }

      animRef.current = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  );
}

// ─── Count-Up Hook ────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1800, active = false) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active || target === 0) {
      setValue(target);
      return;
    }
    let start: number | null = null;
    let raf: number;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, active]);

  return value;
}

// ─── Result Card ──────────────────────────────────────────────────────────────
interface ResultCardProps {
  icon: string;
  labelEn: string;
  labelHi: string;
  value: number;
  description: string;
  delay: number;
  active: boolean;
  ocid: string;
}

function ResultCard({
  icon,
  labelEn,
  labelHi,
  value,
  description,
  delay,
  active,
  ocid,
}: ResultCardProps) {
  const displayed = useCountUp(value, 1800, active);

  return (
    <motion.div
      data-ocid={ocid}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex flex-col items-center gap-3 p-6 rounded-2xl border border-gold/50 bg-card-space glow-gold"
      style={{ background: "rgba(10, 16, 32, 0.8)" }}
    >
      <div className="text-4xl mb-1 animate-shimmer">{icon}</div>
      <div className="text-xs font-semibold tracking-widest uppercase text-muted-foreground/80">
        {labelEn} <span className="text-gold-dim">|</span> {labelHi}
      </div>
      <div
        className="text-gold number-glow font-black leading-none"
        style={{
          fontSize: "clamp(2.8rem, 7vw, 5rem)",
          fontFamily: "Poppins, sans-serif",
        }}
      >
        {displayed.toLocaleString("en-IN")}
      </div>
      <p className="text-xs text-muted-foreground text-center mt-1">
        {description}
      </p>
    </motion.div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-3"
      style={{
        background: "rgba(5, 9, 18, 0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(214,179,106,0.15)",
      }}
    >
      <a
        href="#home"
        data-ocid="nav.link"
        className="flex items-center gap-2 text-foreground no-underline"
      >
        <span className="text-2xl">🪐</span>
        <span className="font-black text-sm tracking-widest uppercase text-gold">
          Cinematic Age
        </span>
      </a>

      <div className="hidden md:flex items-center gap-6 text-xs font-semibold tracking-wider text-muted-foreground">
        {["Home", "Calculations", "About", "संपर्क"].map((item) => (
          <a
            key={item}
            href="#home"
            data-ocid="nav.link"
            className="hover:text-gold transition-colors duration-300"
          >
            {item}
          </a>
        ))}
      </div>

      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <span>🌐</span>
        <span className="hidden sm:inline">Hindi / English</span>
      </div>
    </nav>
  );
}

// ─── Months data ─────────────────────────────────────────────────────────────
const MONTHS = [
  { value: "1", label: "January - जनवरी" },
  { value: "2", label: "February - फ़रवरी" },
  { value: "3", label: "March - मार्च" },
  { value: "4", label: "April - अप्रैल" },
  { value: "5", label: "May - मई" },
  { value: "6", label: "June - जून" },
  { value: "7", label: "July - जुलाई" },
  { value: "8", label: "August - अगस्त" },
  { value: "9", label: "September - सितंबर" },
  { value: "10", label: "October - अक्टूबर" },
  { value: "11", label: "November - नवंबर" },
  { value: "12", label: "December - दिसंबर" },
];

// ─── Bokeh Band ───────────────────────────────────────────────────────────────
function BokehBand() {
  const circles = [
    {
      id: "teal-1",
      color: "#34E0C6",
      size: 80,
      left: "8%",
      delay: 0,
      dur: 4.0,
    },
    {
      id: "blue-1",
      color: "#3B82F6",
      size: 55,
      left: "20%",
      delay: 0.5,
      dur: 4.7,
    },
    {
      id: "purple-1",
      color: "#D46BFF",
      size: 100,
      left: "35%",
      delay: 1.0,
      dur: 5.4,
    },
    {
      id: "gold-1",
      color: "#E3C27A",
      size: 40,
      left: "50%",
      delay: 1.5,
      dur: 6.1,
    },
    {
      id: "indigo-1",
      color: "#7A4CFF",
      size: 70,
      left: "65%",
      delay: 0.8,
      dur: 6.8,
    },
    {
      id: "teal-2",
      color: "#34E0C6",
      size: 90,
      left: "80%",
      delay: 0.3,
      dur: 7.5,
    },
    {
      id: "blue-2",
      color: "#3B82F6",
      size: 45,
      left: "92%",
      delay: 1.2,
      dur: 8.2,
    },
  ];

  return (
    <section
      className="relative w-full py-16 overflow-hidden"
      style={{ background: "rgba(7, 10, 22, 0.6)" }}
    >
      {/* Bokeh circles */}
      {circles.map((c) => (
        <div
          key={c.id}
          className="absolute rounded-full animate-bokeh"
          style={{
            width: c.size,
            height: c.size,
            left: c.left,
            top: "50%",
            transform: "translate(-50%, -50%)",
            background: c.color,
            filter: "blur(25px)",
            opacity: 0.35,
            animationDelay: `${c.delay}s`,
            animationDuration: `${c.dur}s`,
          }}
        />
      ))}

      <div className="relative z-10 flex flex-col items-center gap-3 text-center px-4">
        <div className="text-3xl">✨</div>
        <h3 className="text-xl md:text-2xl font-bold text-foreground">
          Powered by the Stars
        </h3>
        <p className="text-gold font-semibold tracking-widest text-sm uppercase">
          सितारों द्वारा संचालित
        </p>
        <p className="text-muted-foreground text-sm max-w-md mt-2">
          Every second of your life is written in the cosmos. अपनी ब्रह्मांडीय
          यात्रा की गणना करें।
        </p>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  const year = new Date().getFullYear();
  const hostname = encodeURIComponent(
    typeof window !== "undefined" ? window.location.hostname : "",
  );

  return (
    <footer
      className="relative z-10 w-full px-6 py-10"
      style={{
        background: "rgba(4, 7, 16, 0.95)",
        borderTop: "1px solid rgba(214,179,106,0.15)",
      }}
    >
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Logo */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🪐</span>
            <span className="font-black text-sm tracking-widest uppercase text-gold">
              Cinematic Age
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            अपनी उम्र को ब्रह्मांडीय पैमाने पर जानें।
            <br />
            Discover your age on a cosmic scale.
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold tracking-widest uppercase text-gold">
            Quick Links
          </h4>
          <ul className="flex flex-col gap-2 text-xs text-muted-foreground">
            {[
              "Home | होम",
              "Calculator | कैलकुलेटर",
              "About | के बारे में",
              "Contact | संपर्क",
            ].map((link) => (
              <li key={link}>
                <a
                  href="#home"
                  data-ocid="footer.link"
                  className="hover:text-gold transition-colors"
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Social */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold tracking-widest uppercase text-gold">
            Social Media
          </h4>
          <div className="flex gap-4">
            {["𝕏", "📸", "▶️", "💼"].map((icon) => (
              <button
                key={icon}
                type="button"
                data-ocid="footer.button"
                className="w-9 h-9 rounded-full border border-gold/30 flex items-center justify-center text-sm hover:border-gold hover:bg-gold/10 transition-all"
              >
                {icon}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            © {year}. Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${hostname}`}
              className="text-gold hover:text-gold/80 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [result, setResult] = useState<AgeResult | null>(null);
  const [error, setError] = useState("");
  const [calculated, setCalculated] = useState(false);

  const calculate = useCallback(() => {
    setError("");
    setResult(null);
    setCalculated(false);

    const year = Number.parseInt(birthYear, 10);
    const month = Number.parseInt(birthMonth, 10);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (!birthYear || Number.isNaN(year)) {
      setError("कृपया एक वैध जन्म वर्ष दर्ज करें | Please enter a valid birth year.");
      return;
    }
    if (year < 1900) {
      setError(
        "जन्म वर्ष 1900 से पहले नहीं हो सकता | Birth year cannot be before 1900.",
      );
      return;
    }
    if (year > currentYear || (year === currentYear && month > currentMonth)) {
      setError(
        "जन्म तिथि भविष्य में नहीं हो सकती | Birth date cannot be in the future.",
      );
      return;
    }
    if (!birthMonth) {
      setError("कृपया जन्म माह चुनें | Please select a birth month.");
      return;
    }

    const totalMonths = (currentYear - year) * 12 + (currentMonth - month);
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths;
    const days = Math.floor(totalMonths * 30.44);
    const weeks = Math.floor(days / 7);

    setResult({ years, months, weeks, days });
    setTimeout(() => setCalculated(true), 50);
  }, [birthYear, birthMonth]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") calculate();
  };

  const CARDS = result
    ? [
        {
          icon: "🌟",
          labelEn: "Years",
          labelHi: "वर्ष",
          value: result.years,
          description: "पूर्ण वर्ष | Complete years lived",
          delay: 0,
          ocid: "results.years.card",
        },
        {
          icon: "🌙",
          labelEn: "Months",
          labelHi: "माह",
          value: result.months,
          description: "कुल महीने | Total months elapsed",
          delay: 0.12,
          ocid: "results.months.card",
        },
        {
          icon: "⭐",
          labelEn: "Weeks",
          labelHi: "सप्ताह",
          value: result.weeks,
          description: "कुल सप्ताह | Total weeks journeyed",
          delay: 0.24,
          ocid: "results.weeks.card",
        },
        {
          icon: "☀️",
          labelEn: "Days",
          labelHi: "दिन",
          value: result.days,
          description: "कुल दिन | Total days on this earth",
          delay: 0.36,
          ocid: "results.days.card",
        },
      ]
    : [];

  return (
    <div className="relative min-h-screen font-poppins" id="home">
      {/* Animated canvas background */}
      <StarCanvas />

      {/* Content layer */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        {/* ── Hero ── */}
        <main className="flex-1">
          <section className="flex flex-col items-center justify-center px-4 pt-32 pb-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center gap-4"
            >
              <div className="text-xs font-semibold tracking-[0.35em] uppercase text-teal/80 mb-2">
                ✦ ब्रह्मांडीय यात्रा ✦
              </div>
              <h1
                className="font-black leading-tight"
                style={{ fontSize: "clamp(2.2rem, 7vw, 5.5rem)" }}
              >
                <span className="text-foreground">अपनी उम्र </span>
                <span className="text-gold number-glow">जानें</span>
              </h1>
              <h2
                className="font-bold text-muted-foreground"
                style={{ fontSize: "clamp(1rem, 3vw, 1.6rem)" }}
              >
                Discover Your <span className="text-teal">Cosmic</span> Age
              </h2>
              <p className="text-muted-foreground text-sm max-w-lg mt-2 leading-relaxed">
                Enter your birth details and uncover how many years, months,
                weeks, and days you&apos;ve traveled through the cosmos.
                &nbsp;अपनी ब्रह्मांडीय यात्रा की गणना करें।
              </p>
            </motion.div>

            {/* ── Form Card ── */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.2,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="w-full max-w-lg mt-10 p-8 rounded-2xl border border-gold/40 glow-gold"
              style={{
                background: "rgba(10, 16, 32, 0.85)",
                backdropFilter: "blur(16px)",
              }}
            >
              <h3 className="text-sm font-bold tracking-wide text-center mb-6">
                <span className="text-gold">Enter Your Birthdate</span>{" "}
                <span className="text-muted-foreground">|</span>{" "}
                <span className="text-teal">अपनी जन्म तिथि दर्ज करें</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {/* Year input */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="birth-year"
                    className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    Birth Year | जन्म वर्ष
                  </label>
                  <input
                    id="birth-year"
                    data-ocid="form.input"
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="जन्म वर्ष / Birth Year"
                    className="w-full px-4 py-3 rounded-xl text-foreground font-semibold text-sm focus:outline-none focus:ring-2 placeholder:text-muted-foreground/50"
                    style={{
                      background: "rgba(20, 30, 55, 0.7)",
                      border: "1px solid rgba(214, 179, 106, 0.4)",
                      color: "oklch(0.97 0.01 260)",
                    }}
                  />
                </div>

                {/* Month select */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="birth-month"
                    className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    Birth Month | जन्म माह
                  </label>
                  <select
                    id="birth-month"
                    data-ocid="form.select"
                    value={birthMonth}
                    onChange={(e) => setBirthMonth(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 cursor-pointer"
                    style={{
                      background: "rgba(20, 30, 55, 0.7)",
                      border: "1px solid rgba(214, 179, 106, 0.4)",
                      color: birthMonth
                        ? "oklch(0.97 0.01 260)"
                        : "rgba(170,179,197,0.5)",
                    }}
                  >
                    <option
                      value=""
                      disabled
                      style={{ background: "#071022", color: "#aab3c5" }}
                    >
                      माह चुनें / Select Month
                    </option>
                    {MONTHS.map((m) => (
                      <option
                        key={m.value}
                        value={m.value}
                        style={{ background: "#071022", color: "#f3f6ff" }}
                      >
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    data-ocid="form.error_state"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mb-4 px-4 py-3 rounded-xl text-xs font-medium text-red-300"
                    style={{
                      background: "rgba(220, 50, 50, 0.15)",
                      border: "1px solid rgba(220, 50, 50, 0.3)",
                    }}
                    role="alert"
                    aria-live="polite"
                  >
                    ⚠️ {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <button
                type="button"
                data-ocid="form.submit_button"
                onClick={calculate}
                className="w-full py-4 rounded-xl font-bold text-sm tracking-widest uppercase transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(214,179,106,0.9) 0%, rgba(227,194,122,0.95) 50%, rgba(200,160,85,0.9) 100%)",
                  color: "#050912",
                  boxShadow:
                    "0 0 25px rgba(214,179,106,0.35), 0 4px 20px rgba(0,0,0,0.4)",
                }}
              >
                ✨ Calculate Age | उम्र की गणना करें
              </button>
            </motion.div>
          </section>

          {/* ── Results ── */}
          <AnimatePresence>
            {result && (
              <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="px-4 pb-16"
                data-ocid="results.section"
              >
                <div className="text-center mb-10">
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="font-black"
                    style={{ fontSize: "clamp(1.4rem, 4vw, 2.4rem)" }}
                  >
                    <span className="text-foreground">Your Cosmic Journey</span>{" "}
                    <span className="text-muted-foreground text-2xl">|</span>{" "}
                    <span className="text-gold">आपकी ब्रह्मांडीय यात्रा</span>
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-muted-foreground text-sm mt-3"
                  >
                    आपने अब तक यह समय ब्रह्मांड में बिताया है
                  </motion.p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
                  {CARDS.map((card) => (
                    <ResultCard
                      key={card.labelEn}
                      icon={card.icon}
                      labelEn={card.labelEn}
                      labelHi={card.labelHi}
                      value={card.value}
                      description={card.description}
                      delay={card.delay}
                      active={calculated}
                      ocid={card.ocid}
                    />
                  ))}
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* ── Bokeh Feature Band ── */}
          <BokehBand />
        </main>

        {/* ── Footer ── */}
        <Footer />
      </div>
    </div>
  );
}
