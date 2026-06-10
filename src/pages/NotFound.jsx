import { useState, useEffect } from "react";
import { Box, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { FONT_FAMILIES } from "../theme/tokens";
import RefreshIcon from "@mui/icons-material/Refresh";

export default function NotFound() {
  const navigate = useNavigate();
  const [animationKey, setAnimationKey] = useState(0);

  // Interactive controls
  const [headlightMode, setHeadlightMode] = useState("normal"); // "normal", "high", "off"

  // Synthesize brief engine start/revving sound when the simulation initializes
  const playEngineStartSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(80, ctx.currentTime);
      osc1.frequency.linearRampToValueAtTime(140, ctx.currentTime + 0.3);
      osc1.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.8);

      osc2.type = "sawtooth";
      osc2.frequency.setValueAtTime(40, ctx.currentTime);
      osc2.frequency.linearRampToValueAtTime(70, ctx.currentTime + 0.3);
      osc2.frequency.linearRampToValueAtTime(50, ctx.currentTime + 0.8);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.8);
      osc2.stop(ctx.currentTime + 0.8);
    } catch (e) {
      console.error(e);
    }
  };

  const playHornSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(220, ctx.currentTime);
      osc2.type = "sawtooth";
      osc2.frequency.setValueAtTime(277, ctx.currentTime);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.5);
      osc2.stop(ctx.currentTime + 0.5);
    } catch (e) { }
  };

  // Play startup engine hum and reset headlight settings on page initialization or reset
  useEffect(() => {
    setHeadlightMode("normal");
    playEngineStartSound();
  }, [animationKey]);

  const handleReRun = () => {
    setAnimationKey((prev) => prev + 1);
  };

  const cycleHeadlight = (e) => {
    e.stopPropagation();
    setHeadlightMode((prev) => {
      if (prev === "normal") return "high";
      if (prev === "high") return "off";
      return "normal";
    });
  };

  return (
    <Box
      key={animationKey}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        bgcolor: "#f4f6fb", // Matches global application background
        color: "#0f172a",
        textAlign: "center",
        p: 3,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <style>{`
        /* Shifting color gradient background */
        @keyframes bgGradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        /* Truck driving across the screen from right (460px) to left (-100px) over 8s with subtle engine shake at bottom of card */
        @keyframes truckDriveLeft {
          0% { transform: translate(460px, 110px) rotate(0deg); }
          10% { transform: translate(376px, 109.2px) rotate(0.3deg); }
          20% { transform: translate(292px, 110.4px) rotate(-0.2deg); }
          30% { transform: translate(208px, 109.6px) rotate(0.1deg); }
          40% { transform: translate(124px, 110px) rotate(0deg); }
          50% { transform: translate(40px, 109.2px) rotate(0.3deg); }
          65% { transform: translate(40px, 110.4px) rotate(-0.2deg); }
          80% { transform: translate(-100px, 110px) rotate(0deg); }
          100% { transform: translate(-100px, 110px) rotate(0deg); }
        }

        /* Spinning wheels counter-clockwise for left-cruising */
        @keyframes spinWheelLeft {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }

        /* Exhaust smoke puffing from the tailpipe */
        @keyframes exhaustSmoke {
          0% { transform: translate(0px, 0px) scale(0.4); opacity: 0; }
          30% { opacity: 0.6; }
          100% { transform: translate(16px, 6px) scale(2.0); opacity: 0; }
        }

        /* Digit 4 (Rightmost - drops first at t=4.0s / 50%, bounces and rolls at road speed x=76 to 330) */
        @keyframes spillFourRight {
          0% { transform: translate(496px, 137px) rotate(0deg); opacity: 1; }
          10% { transform: translate(412px, 136.2px) rotate(0.3deg); }
          20% { transform: translate(328px, 137.4px) rotate(-0.2deg); }
          30% { transform: translate(244px, 136.6px) rotate(0.1deg); }
          40% { transform: translate(160px, 137px) rotate(0deg); }
          50% { transform: translate(76px, 136.2px) rotate(0.3deg); }
          55% { transform: translate(110px, 158px) rotate(45deg) scale(1.15, 0.85); }
          60% { transform: translate(140px, 145px) rotate(100deg) scale(0.9, 1.1); }
          65% { transform: translate(170px, 158px) rotate(160deg) scale(1.1, 0.9); }
          70% { transform: translate(200px, 158px) rotate(220deg); }
          80% { transform: translate(260px, 158px) rotate(340deg); }
          90% { transform: translate(310px, 158px) rotate(440deg); opacity: 1; }
          100% { transform: translate(330px, 158px) rotate(480deg); opacity: 0; }
        }

        /* Digit 0 (Middle - drops second at t=4.32s / 54%, bounces and rolls at road speed x=60 to 290) */
        @keyframes spillZero {
          0% { transform: translate(484px, 137px) rotate(0deg); opacity: 1; }
          10% { transform: translate(400px, 136.2px) rotate(0.3deg); }
          20% { transform: translate(316px, 137.4px) rotate(-0.2deg); }
          30% { transform: translate(232px, 136.6px) rotate(0.1deg); }
          40% { transform: translate(148px, 137px) rotate(0deg); }
          50% { transform: translate(64px, 136.2px) rotate(0.3deg); }
          54% { transform: translate(60px, 137px) rotate(0deg); }
          59% { transform: translate(90px, 158px) rotate(45deg) scale(1.15, 0.85); }
          64% { transform: translate(120px, 145px) rotate(100deg) scale(0.9, 1.1); }
          69% { transform: translate(150px, 158px) rotate(160deg) scale(1.1, 0.9); }
          74% { transform: translate(180px, 158px) rotate(220deg); }
          84% { transform: translate(230px, 158px) rotate(320deg); }
          92% { transform: translate(270px, 158px) rotate(400deg); opacity: 1; }
          100% { transform: translate(290px, 158px) rotate(440deg); opacity: 0; }
        }

        /* Digit 4 (Leftmost - drops last at t=4.64s / 58%, bounces and rolls at road speed x=48 to 250) */
        @keyframes spillFourLeft {
          0% { transform: translate(472px, 137px) rotate(0deg); opacity: 1; }
          10% { transform: translate(388px, 136.2px) rotate(0.3deg); }
          20% { transform: translate(304px, 137.4px) rotate(-0.2deg); }
          30% { transform: translate(220px, 136.6px) rotate(0.1deg); }
          40% { transform: translate(136px, 137px) rotate(0deg); }
          50% { transform: translate(52px, 136.2px) rotate(0.3deg); }
          58% { transform: translate(48px, 137px) rotate(0deg); }
          63% { transform: translate(70px, 158px) rotate(45deg) scale(1.15, 0.85); }
          68% { transform: translate(100px, 145px) rotate(100deg) scale(0.9, 1.1); }
          73% { transform: translate(130px, 158px) rotate(160deg) scale(1.1, 0.9); }
          78% { transform: translate(160px, 158px) rotate(220deg); }
          88% { transform: translate(210px, 158px) rotate(320deg); }
          94% { transform: translate(240px, 158px) rotate(380deg); opacity: 1; }
          100% { transform: translate(250px, 158px) rotate(400deg); opacity: 0; }
        }

        /* Spark flashing */
        @keyframes sparkPop {
          0%, 100% { opacity: 0; transform: scale(0.6); }
          50% { opacity: 1; transform: scale(1.1); }
        }

        /* Staggered text reveal */
        @keyframes fadeReveal {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        /* Speed line translate */
        @keyframes speedLineRun {
          0% { transform: translateX(0px); opacity: 0.7; }
          100% { transform: translateX(350px); opacity: 0; }
        }

        /* Scrolling background dashes inside the card */
        @keyframes scrollDashes {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: 35px; }
        }

        /* Scenery parallax scrolls inside the card (moving right) */
        @keyframes mountainScroll {
          0% { transform: translateX(-400px); }
          100% { transform: translateX(0px); }
        }

        @keyframes treeScroll {
          0% { transform: translateX(-400px); }
          100% { transform: translateX(0px); }
        }

        @keyframes poleScroll {
          0% { transform: translateX(-400px); }
          100% { transform: translateX(0px); }
        }

        @keyframes cloudFloat {
          0% { transform: translateX(-250px); }
          100% { transform: translateX(450px); }
        }

        @keyframes birdsFly {
          0% { transform: translate(-150px, 15px); }
          100% { transform: translate(450px, 35px); }
        }

        @keyframes birdFlap {
          0% { transform: scaleY(0.4); }
          100% { transform: scaleY(1.1); }
        }

        @keyframes leavesDrift {
          0% { transform: translate(-50px, 15px) rotate(0deg); }
          100% { transform: translate(420px, 130px) rotate(360deg); }
        }

        @keyframes mountainFarScroll {
          0% { transform: translateX(-400px); }
          100% { transform: translateX(0px); }
        }

        @keyframes sunRaysRotate {
          0% { transform: translate(200px, 65px) rotate(0deg); }
          100% { transform: translate(200px, 65px) rotate(360deg); }
        }

        /* Gentle dust trailing from tires (moving right) */
        @keyframes dustRight {
          0% { transform: translate(0px, 0px) scale(0.4); opacity: 0; }
          20% { opacity: 0.8; }
          100% { transform: translate(40px, -15px) scale(2.2); opacity: 0; }
        }

        /* Seamless scrolling road dash lines */
        @keyframes scrollDashes {
          0% { stroke-dashoffset: 22; }
          100% { stroke-dashoffset: 0; }
        }
      `}</style>

      {/* PARALLAX HORIZONTAL LANDSCAPE BACKGROUND */}
      <Box
        sx={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "38vh",
          pointerEvents: "none",
          zIndex: 1,
          opacity: 0.12, // Subtle blend into the light background
          overflow: "hidden",
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1440 300"
          preserveAspectRatio="none"
          style={{ overflow: "visible" }}
        >
          {/* Far Layer: Mountains / distant hills */}
          <g style={{ animation: "parallaxFar 2.5s cubic-bezier(0.25, 1, 0.5, 1) forwards" }}>
            <path
              d="M-600,240 L-400,180 L-150,220 L150,150 L400,190 L650,130 L900,170 L1150,140 L1400,200 L1650,160 L1900,180 L2200,240 L2200,300 L-600,300 Z"
              fill="#3b82f6"
            />
          </g>

          {/* Near Layer: Closer warehouses, industrial structures */}
          <g style={{ animation: "parallaxNear 2.5s cubic-bezier(0.25, 1, 0.5, 1) forwards" }}>
            <path
              d="M-500,300 L-500,230 L-420,230 L-390,260 L-200,260 L-180,215 L-80,215 L-20,260 L120,260 L145,205 L280,205 L310,260 L480,260 L505,215 L600,215 L660,260 L820,260 L845,205 L980,205 L1010,260 L1180,260 L1205,215 L1300,215 L1360,260 L1520,260 L1545,205 L1680,205 L1710,260 L1900,260 L1900,300 Z"
              fill="#1e3a8a"
            />
          </g>
        </svg>
      </Box>

      {/* Grid overlay for detailed surface depth */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "linear-gradient(rgba(37, 99, 235, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(37, 99, 235, 0.02) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          opacity: 0.7,
          zIndex: 1,
        }}
      />

      <Box
        sx={{
          zIndex: 2,
          maxWidth: 500,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          animation: "containerImpactShake 2.5s ease-out forwards" /* Applied Camera Shake */
        }}
      >

        {/* SVG Container holding the entire truck crash sequence */}
        <Box
          sx={{
            width: 400,
            height: 180,
            background: "linear-gradient(to bottom, #bae6fd 0%, #e0f2fe 60%, #f0f9ff 100%)", // Morning sky background
            borderRadius: "16px",
            border: "1px solid #bae6fd",
            boxShadow: "0 10px 25px -5px rgba(2, 132, 199, 0.1), 0 8px 16px -6px rgba(2, 132, 199, 0.05)",
            position: "relative",
            overflow: "hidden",
            mb: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Blueprint backdrop overlay (Soft white vignette style for day sky) */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "radial-gradient(circle, transparent 50%, rgba(255, 255, 255, 0.4) 100%)",
              opacity: 0.6,
              pointerEvents: "none",
            }}
          />

          <svg width="100%" height="100%" viewBox="0 0 400 180" style={{ overflow: "hidden", zIndex: 2 }}>
            <defs>
              <linearGradient id="headlightNormalGrad" x1="1" y1="0.5" x2="0" y2="0.5">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="headlightHighGrad" x1="1" y1="0.5" x2="0" y2="0.5">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
              </linearGradient>
              <radialGradient id="sunRayGrad" cx="0%" cy="0%" r="100%">
                <stop offset="0%" stopColor="#fffbeb" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#fffbeb" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="chromeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="30%" stopColor="#cbd5e1" />
                <stop offset="50%" stopColor="#94a3b8" />
                <stop offset="70%" stopColor="#cbd5e1" />
                <stop offset="100%" stopColor="#64748b" />
              </linearGradient>
              <linearGradient id="woodGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#b45309" />
                <stop offset="50%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>

              {/* Seamless Pine Tree Models */}
              <g id="treeTall">
                <rect x="-1" y="0" width="2" height="8" fill="#78350f" opacity="0.8" />
                <path d="M-9,0 L-6,-6 L-7,-6 L-4,-12 L-5,-12 L0,-20 L5,-12 L4,-12 L7,-6 L6,-6 L9,0 Z" fill="rgba(3, 105, 161, 0.25)" />
              </g>
              <g id="treeMedium">
                <rect x="-1" y="0" width="2" height="6" fill="#78350f" opacity="0.8" />
                <path d="M-7.5,0 L-5,-5 L-6,-5 L-3.5,-10 L-4,-10 L0,-17 L4,-10 L3.5,-10 L6,-5 L5,-5 L7.5,0 Z" fill="rgba(3, 105, 161, 0.23)" />
              </g>
              <g id="treeShort">
                <rect x="-1" y="0" width="2" height="4" fill="#78350f" opacity="0.8" />
                <path d="M-6,0 L-4,-4 L-5,-4 L-2.5,-8 L-3,-8 L0,-14 L3,-8 L2.5,-8 L5,-4 L4,-4 L6,0 Z" fill="rgba(3, 105, 161, 0.21)" />
              </g>
            </defs>

            {/* Glowing Morning Sun */}
            <circle cx="200" cy="65" r="13" fill="#ffedd5" opacity="0.9" filter="drop-shadow(0 0 5px #fdba74)" />

            {/* Sun Rays (rotating slowly) */}
            <g transform="translate(200, 65)" style={{ animation: "sunRaysRotate 20s linear infinite" }}>
              <polygon points="0,0 -80,-80 -120,-30" fill="url(#sunRayGrad)" opacity="0.15" />
              <polygon points="0,0 80,-80 120,-30" fill="url(#sunRayGrad)" opacity="0.15" />
              <polygon points="0,0 -80,80 -30,120" fill="url(#sunRayGrad)" opacity="0.15" />
              <polygon points="0,0 80,80 30,120" fill="url(#sunRayGrad)" opacity="0.15" />
            </g>

            {/* Drifting Cloud Layer */}
            <g style={{ animation: "cloudFloat 12s infinite linear" }}>
              <path d="M40 32 Q45 28 51 30 Q56 25 62 29 Q68 28 70 33 L38 33 Z" fill="rgba(255, 255, 255, 0.7)" />
              <path d="M240 26 Q244 22 250 24 Q255 20 261 23 Q267 22 269 27 L238 27 Z" fill="rgba(255, 255, 255, 0.6)" />
            </g>

            {/* Migrating Birds Layer */}
            <g style={{ animation: "birdsFly 8s infinite linear" }}>
              <path d="M 0 0 Q 3 -4 6 0 Q 9 -4 12 0 Q 6 -2 0 0" fill="#0369a1" opacity="0.6" style={{ animation: "birdFlap 0.4s infinite alternate" }} />
              <path d="M 15 -8 Q 18 -12 21 -8 Q 24 -12 27 -8 Q 21 -10 15 -8" fill="#0369a1" opacity="0.5" style={{ animation: "birdFlap 0.4s infinite alternate 0.1s" }} />
              <path d="M -12 -5 Q -9 -9 -6 -5 Q -3 -9 0 -5 Q -6 -7 -12 -5" fill="#0369a1" opacity="0.55" style={{ animation: "birdFlap 0.4s infinite alternate 0.2s" }} />
            </g>

            {/* Drifting Breeze Leaves */}
            <g style={{ animation: "leavesDrift 6s infinite linear" }}>
              <path d="M0,0 C2,-3 6,-3 8,0 C6,3 2,3 0,0 Z" fill="#10b981" opacity="0.7" transform="rotate(15)" />
              <path d="M30,-15 C32,-18 36,-18 38,-15 C36,-12 32,-12 30,-15 Z" fill="#34d399" opacity="0.65" transform="rotate(-10)" />
            </g>

            {/* Parallax Layer 0: Deep Distant Mountains (scrolling slowly) */}
            <g style={{ animation: "mountainFarScroll 24s infinite linear" }}>
              <path d="M0,80 L50,60 L100,75 L150,50 L200,70 L250,55 L300,80 L350,65 L400,80 L450,60 L500,75 L550,50 L600,70 L650,55 L700,80 L750,65 L800,80 L800,180 L0,180 Z" fill="rgba(2, 132, 199, 0.08)" />
            </g>

            {/* Parallax Layer 1: Distant Mountains (scrolling medium) */}
            <g style={{ animation: "mountainScroll 16s infinite linear" }}>
              <path d="M0,105 L40,85 L100,95 L150,75 L200,90 L250,80 L300,95 L350,85 L400,105 L440,85 L500,95 L550,75 L600,90 L650,80 L700,95 L750,85 L800,105 L800,180 L0,180 Z" fill="rgba(2, 132, 199, 0.15)" />
            </g>

            {/* Parallax Layer 2: Midground Pine Trees Row (scrolling faster) */}
            <g style={{ animation: "treeScroll 8s infinite linear" }}>
              {/* Segment 1 */}
              <use href="#treeShort" x="20" y="140" />
              <use href="#treeTall" x="60" y="140" />
              <use href="#treeMedium" x="100" y="140" />
              <use href="#treeShort" x="140" y="140" />
              <use href="#treeTall" x="180" y="140" />
              <use href="#treeMedium" x="220" y="140" />
              <use href="#treeShort" x="260" y="140" />
              <use href="#treeTall" x="300" y="140" />
              <use href="#treeMedium" x="340" y="140" />
              <use href="#treeShort" x="380" y="140" />

              {/* Segment 2 (Shifted +400px for seamless repeating loop) */}
              <use href="#treeShort" x="420" y="140" />
              <use href="#treeTall" x="460" y="140" />
              <use href="#treeMedium" x="500" y="140" />
              <use href="#treeShort" x="540" y="140" />
              <use href="#treeTall" x="580" y="140" />
              <use href="#treeMedium" x="620" y="140" />
              <use href="#treeShort" x="660" y="140" />
              <use href="#treeTall" x="700" y="140" />
              <use href="#treeMedium" x="740" y="140" />
              <use href="#treeShort" x="780" y="140" />
            </g>

            {/* Parallax Layer 3: Foreground Utility Poles & Road Signs (scrolling fastest) */}
            <g style={{ animation: "poleScroll 4s infinite linear" }}>
              {/* Utility Poles copy 1 */}
              <line x1="0" y1="60" x2="0" y2="140" stroke="rgba(3, 105, 161, 0.35)" strokeWidth="1.2" />
              <line x1="-8" y1="70" x2="8" y2="70" stroke="rgba(3, 105, 161, 0.35)" strokeWidth="1.2" />
              <line x1="200" y1="60" x2="200" y2="140" stroke="rgba(3, 105, 161, 0.35)" strokeWidth="1.2" />
              <line x1="192" y1="70" x2="208" y2="70" stroke="rgba(3, 105, 161, 0.35)" strokeWidth="1.2" />

              {/* Utility Poles copy 2 (Shifted +400px) */}
              <line x1="400" y1="60" x2="400" y2="140" stroke="rgba(3, 105, 161, 0.35)" strokeWidth="1.2" />
              <line x1="392" y1="70" x2="408" y2="70" stroke="rgba(3, 105, 161, 0.35)" strokeWidth="1.2" />
              <line x1="600" y1="60" x2="600" y2="140" stroke="rgba(3, 105, 161, 0.35)" strokeWidth="1.2" />
              <line x1="592" y1="70" x2="608" y2="70" stroke="rgba(3, 105, 161, 0.35)" strokeWidth="1.2" />

            </g>

            {/* Ground Border / Asphalt Road Bed (Bottom of the card acting as road divider) */}
            <rect x="-100" y="172" width="600" height="8" fill="#334155" opacity="0.95" />
            <line x1="-100" y1="172" x2="500" y2="172" stroke="#475569" strokeWidth="1" />
            <line x1="-100" y1="176" x2="500" y2="176" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="10 12" style={{ animation: "scrollDashes 0.5s infinite linear" }} />

            {/* DIGITS SHEDDING WHILE MOVING */}
            {/* Digit 4 (Rightmost - drops first with 3D depth layer) */}
            <g style={{ animation: "spillFourRight 8s infinite linear" }}>
              <circle cx="1.5" cy="1.5" r="14" fill="#1e40af" />
              <circle cx="0" cy="0" r="14" fill="#2563eb" />
              <text x="0" y="5.5" fontSize="16" fontWeight="900" fill="#ffffff" textAnchor="middle">4</text>
            </g>

            {/* Digit 0 (Middle - drops second with 3D depth layer) */}
            <g style={{ animation: "spillZero 8s infinite linear" }}>
              <circle cx="1.5" cy="1.5" r="14" fill="#0891b2" />
              <circle cx="0" cy="0" r="14" fill="#06b6d4" />
              <text x="0" y="5.5" fontSize="16" fontWeight="900" fill="#ffffff" textAnchor="middle">0</text>
            </g>

            {/* Digit 4 (Leftmost - drops last with 3D depth layer) */}
            <g style={{ animation: "spillFourLeft 8s infinite linear" }}>
              <circle cx="1.5" cy="1.5" r="14" fill="#1e40af" />
              <circle cx="0" cy="0" r="14" fill="#2563eb" />
              <text x="0" y="5.5" fontSize="16" fontWeight="900" fill="#ffffff" textAnchor="middle">4</text>
            </g>

            {/* VINTAGE RETRO TEAL PICKUP TRUCK WITH WOODEN STAKE SIDES (Clickable to Honk Horn) */}
            <g style={{ animation: "truckDriveLeft 8s infinite linear" }}>

              {/* Local dust trailing behind the rear wheels (moves with truck) */}
              <circle cx="46" cy="53" r="1.5" fill="#e2e8f0" opacity="0.8" style={{ animation: "dustRight 1.2s infinite linear" }} />
              <circle cx="52" cy="54" r="2.2" fill="#cbd5e1" opacity="0.6" style={{ animation: "dustRight 1.2s infinite linear 0.4s" }} />
              <circle cx="60" cy="52" r="1.8" fill="#e2e8f0" opacity="0.5" style={{ animation: "dustRight 1.2s infinite linear 0.8s" }} />

              {/* Undercarriage Chassis Rail */}
              <rect x="-56" y="47" width="108" height="3" fill="#334155" rx="1" />

              {/* Front Chrome Bumper */}
              <rect x="-58" y="43" width="4.5" height="4.5" fill="url(#chromeGrad)" rx="1.5" stroke="#1d7680" strokeWidth="0.5" />

              {/* Rear Chrome Bumper */}
              <rect x="52" y="43" width="4.5" height="4.5" fill="url(#chromeGrad)" rx="1.5" stroke="#1d7680" strokeWidth="0.5" />

              {/* Main Teal Body Path (rounded fenders, step-side bed, and classic curves) */}
              <path
                d="M -56 42 L -56 46 L -47 46 A 11 11 0 0 1 -25 46 L -25 48.5 L 23 48.5 L 23 46 A 11 11 0 0 1 45 46 L 52 46 L 52 35 L 6 35 L 6 19 C 6 19 3 19 -17 19 C -25 19 -27 22 -27 34.5 L -56 35.5 Z"
                fill="#35b0bb"
                stroke="#1d7680"
                strokeWidth="1.2"
                style={{ cursor: "pointer" }}
                onClick={playHornSound}
              />

              {/* Rounded Vintage Fender Bulges (3D depth layers, re-arched to sit cleanly above wheel cutouts) */}
              <path d="M -55 35 C -48 30 -30 30 -24 35 L -24 46 A 11 11 0 0 0 -46 46 Z" fill="#2ca5b0" stroke="#1d7680" strokeWidth="0.8" />
              <path d="M 22 42 C 25 31 43 31 46 42 L 46 46 A 11 11 0 0 0 24 46 Z" fill="#2ca5b0" stroke="#1d7680" strokeWidth="0.8" />

              {/* Front fender character line/bulge */}
              <path d="M -54 34 Q -48 31 -40 31" fill="none" stroke="#1d7680" strokeWidth="0.8" opacity="0.6" />

              {/* Door Panel line */}
              <path d="M -24 34.5 L -24 48.5 M 5 21 L 5 48.5" stroke="#1d7680" strokeWidth="0.8" fill="none" />

              {/* Steering wheel inside cab */}
              <circle cx="-13" cy="28.5" r="3" fill="none" stroke="#1e293b" strokeWidth="0.8" opacity="0.55" />
              <line x1="-12" y1="30" x2="-9" y2="33" stroke="#1e293b" strokeWidth="0.6" opacity="0.55" />

              {/* Cab Side Window */}
              <path d="M -22 33 L -16 21 L 3 21 L 3 33 Z" fill="rgba(239, 246, 255, 0.85)" stroke="#1d7680" strokeWidth="0.8" />
              {/* Triangular vent window divider line */}
              <line x1="-16" y1="21" x2="-19" y2="33" stroke="#1d7680" strokeWidth="0.8" />
              {/* White window shine */}
              <line x1="-10" y1="23" x2="-17" y2="31" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" />

              {/* Side Mirror */}
              <rect x="-24" y="27" width="1.5" height="4" fill="url(#chromeGrad)" rx="0.2" />
              <line x1="-22.5" y1="29" x2="-20" y2="29" stroke="#1d7680" strokeWidth="0.8" />

              {/* Door Handle */}
              <rect x="-3" y="36.5" width="3.5" height="0.8" fill="url(#chromeGrad)" rx="0.2" stroke="#1d7680" strokeWidth="0.4" />

              {/* Hood Side Vents (3 horizontal slats) */}
              <rect x="-42" y="27" width="5" height="0.8" fill="#1d7680" opacity="0.5" rx="0.4" />
              <rect x="-42" y="29.5" width="5" height="0.8" fill="#1d7680" opacity="0.5" rx="0.4" />
              <rect x="-42" y="32" width="5" height="0.8" fill="#1d7680" opacity="0.5" rx="0.4" />

              {/* Vintage Front Grille (Chrome horizontal bars on front nose) */}
              <line x1="-57.5" y1="38" x2="-54.5" y2="38" stroke="url(#chromeGrad)" strokeWidth="0.7" />
              <line x1="-57.5" y1="40" x2="-54.5" y2="40" stroke="url(#chromeGrad)" strokeWidth="0.7" />
              <line x1="-57.5" y1="42" x2="-54.5" y2="42" stroke="url(#chromeGrad)" strokeWidth="0.7" />

              {/* Round Chrome Headlight Bezel */}
              <circle cx="-54" cy="39" r="2.5" fill="url(#chromeGrad)" stroke="#1d7680" strokeWidth="0.5" />

              {/* Headlight & Beams (Clickable to Cycle) */}
              <g style={{ cursor: "pointer" }} onClick={cycleHeadlight}>
                <circle cx="-54.5" cy="39" r="1.8" fill={headlightMode === "off" ? "#475569" : "#fbbf24"} />
                {headlightMode === "normal" && (
                  <polygon points="-54,39 -160,20 -160,70" fill="url(#headlightNormalGrad)" opacity="0.25" style={{ pointerEvents: "none" }} />
                )}
                {headlightMode === "high" && (
                  <polygon points="-54,39 -240,10 -240,100" fill="url(#headlightHighGrad)" opacity="0.45" style={{ pointerEvents: "none" }} />
                )}
              </g>

              {/* Wooden Stake Sides (Vertical Posts) */}
              <rect x="8" y="20" width="1.8" height="15" fill="#ca8a04" stroke="#854d0e" strokeWidth="0.5" />
              <rect x="28" y="20" width="1.8" height="15" fill="#ca8a04" stroke="#854d0e" strokeWidth="0.5" />
              <rect x="48" y="20" width="1.8" height="15" fill="#ca8a04" stroke="#854d0e" strokeWidth="0.5" />

              {/* Wooden Stake Sides (3 Horizontal Planks) */}
              <rect x="6" y="20" width="46" height="3.5" fill="url(#woodGrad)" stroke="#854d0e" strokeWidth="0.5" rx="0.5" />
              <rect x="6" y="25.5" width="46" height="3.5" fill="url(#woodGrad)" stroke="#854d0e" strokeWidth="0.5" rx="0.5" />
              <rect x="6" y="31" width="46" height="3.5" fill="url(#woodGrad)" stroke="#854d0e" strokeWidth="0.5" rx="0.5" />

              {/* Running board step-side panel under door */}
              <rect x="-27" y="45.5" width="52" height="2.2" fill="#1e293b" rx="0.5" />
              <rect x="-27" y="47.7" width="52" height="0.8" fill="url(#chromeGrad)" />

              {/* Chrome Tailpipe Tip */}
              <path d="M 52 47 Q 56 47 60 50" fill="none" stroke="url(#chromeGrad)" strokeWidth="1.2" strokeLinecap="round" />

              {/* Engine smoke puffing from the tailpipe */}
              <circle cx="60" cy="50" r="1.5" fill="#cbd5e1" opacity="0.8" style={{ animation: "exhaustSmoke 1.5s infinite" }} />
              <circle cx="60" cy="50" r="2.5" fill="#cbd5e1" opacity="0.6" style={{ animation: "exhaustSmoke 1.5s infinite 0.5s" }} />

              {/* Detailed Whitewall wheels (Front wheel with chrome hubcap & 4 lug nuts) */}
              <g style={{ animation: "spinWheelLeft 0.4s infinite linear", transformOrigin: "-36px 53px" }}>
                <circle cx="-36" cy="53" r="8" fill="#1e293b" />
                <circle cx="-36" cy="53" r="5.6" fill="#ffffff" />
                <circle cx="-36" cy="53" r="4" fill="url(#chromeGrad)" stroke="#1d7680" strokeWidth="0.5" />
                <circle cx="-37.5" cy="51.5" r="0.4" fill="#334155" />
                <circle cx="-34.5" cy="51.5" r="0.4" fill="#334155" />
                <circle cx="-34.5" cy="54.5" r="0.4" fill="#334155" />
                <circle cx="-37.5" cy="54.5" r="0.4" fill="#334155" />
                <circle cx="-36" cy="53" r="1.2" fill="url(#chromeGrad)" stroke="#1d7680" strokeWidth="0.3" />
              </g>

              {/* Detailed Whitewall wheels (Rear wheel with chrome hubcap & 4 lug nuts) */}
              <g style={{ animation: "spinWheelLeft 0.4s infinite linear", transformOrigin: "34px 53px" }}>
                <circle cx="34" cy="53" r="8" fill="#1e293b" />
                <circle cx="34" cy="53" r="5.6" fill="#ffffff" />
                <circle cx="34" cy="53" r="4" fill="url(#chromeGrad)" stroke="#1d7680" strokeWidth="0.5" />
                <circle cx="32.5" cy="51.5" r="0.4" fill="#334155" />
                <circle cx="35.5" cy="51.5" r="0.4" fill="#334155" />
                <circle cx="35.5" cy="54.5" r="0.4" fill="#334155" />
                <circle cx="32.5" cy="54.5" r="0.4" fill="#334155" />
                <circle cx="34" cy="53" r="1.2" fill="url(#chromeGrad)" stroke="#1d7680" strokeWidth="0.3" />
              </g>
            </g>
          </svg>
        </Box>

        {/* Text descriptions fade in after the crash animation completes */}
        <Box sx={{ animation: "fadeReveal 2.5s ease-out forwards" }}>
          <Typography
            sx={{
              fontSize: "16px",
              fontWeight: 800,
              color: "#1e293b",
              fontFamily: FONT_FAMILIES.header,
              mb: 1,
              letterSpacing: "0.5px",
            }}
          >
            Asset Delivery Interrupted
          </Typography>

          <Typography
            sx={{
              fontSize: "11px",
              color: "#64748b",
              mb: 4,
              lineHeight: 1.6,
              maxWidth: 380,
            }}
          >
            The transport vehicle carrying the requested coordinates broke down.
            The destination registry could not be resolved.
          </Typography>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: "flex", gap: 2, animation: "fadeReveal 2.5s ease-out forwards" }}>
          <Button
            variant="contained"
            onClick={() => navigate("/home")}
            sx={{
              bgcolor: "#2563eb",
              color: "#ffffff",
              fontWeight: 700,
              px: 3.5,
              py: 1,
              borderRadius: "8px",
              fontSize: "11px",
              height: "auto",
              boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)",
              "&:hover": {
                bgcolor: "#1d4ed8",
                boxShadow: "0 6px 20px rgba(37, 99, 235, 0.4)",
              },
            }}
          >
            Back to Headquarters
          </Button>

          <Button
            variant="outlined"
            onClick={handleReRun}
            startIcon={<RefreshIcon sx={{ fontSize: 13 }} />}
            sx={{
              borderColor: "#cbd5e1",
              color: "#475569",
              fontWeight: 700,
              fontSize: "11px",
              borderRadius: "8px",
              px: 3.5,
              py: 1,
              "&:hover": {
                borderColor: "#94a3b8",
                bgcolor: "rgba(15, 23, 42, 0.02)",
              },
            }}
          >
            Re-run Delivery
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
