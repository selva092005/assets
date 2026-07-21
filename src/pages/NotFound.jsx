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

  // Reset headlight settings on page initialization or reset
  useEffect(() => {
    const timer = setTimeout(() => {
      setHeadlightMode("normal");
    }, 0);
    return () => clearTimeout(timer);
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

        /* Hardware layer promotion classes */
        .accelerate-layer {
          will-change: transform;
          transform: translate3d(0, 0, 0);
          backface-visibility: hidden;
          perspective: 1000px;
        }

        /* Shifting color gradient background */
        @keyframes bgGradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        /* Cartoon waddling/lurching truck drive animation */
        @keyframes truckDriveLeft {
          0% { transform: translate3d(460px, 110px, 0) rotate(0deg); }
          12% { transform: translate3d(370px, 110px, 0) rotate(-2deg); }
          24% { transform: translate3d(280px, 110px, 0) rotate(2deg); }
          36% { transform: translate3d(190px, 110px, 0) rotate(-2deg); }
          45% { transform: translate3d(120px, 110px, 0) rotate(1deg); }
          
          /* Front wheel hits the bump */
          48% { transform: translate3d(55px, 103px, 0) rotate(6deg); }
          51% { transform: translate3d(40px, 114px, 0) rotate(-8deg); }
          54% { transform: translate3d(28px, 107px, 0) rotate(3deg); }
          57% { transform: translate3d(16px, 110px, 0) rotate(-1deg); }
          
          /* Rear wheel hits the bump */
          60% { transform: translate3d(2px, 105px, 0) rotate(-5deg); }
          63% { transform: translate3d(-10px, 113px, 0) rotate(4deg); }
          66% { transform: translate3d(-22px, 109px, 0) rotate(-1deg); }
          70% { transform: translate3d(-35px, 110px, 0) rotate(0deg); }
          
          82% { transform: translate3d(-90px, 110px, 0) rotate(1deg); }
          100% { transform: translate3d(-170px, 110px, 0) rotate(0deg); }
        }

        /* Swinging loose front bumper */
        @keyframes swingBumper {
          0% { transform: rotate(0deg); }
          50% { transform: rotate(18deg); }
          100% { transform: rotate(-5deg); }
        }

        /* Wobbling CRT monitor on the roof */
        @keyframes wobbleMonitor {
          0% { transform: rotate(-7deg); }
          50% { transform: rotate(9deg); }
          100% { transform: rotate(-7deg); }
        }

        /* Googly pupil shake */
        @keyframes googlyEye {
          0%, 100% { transform: translate3d(0px, 0px, 0); }
          33% { transform: translate3d(-1.5px, 1px, 0); }
          66% { transform: translate3d(1px, -1px, 0); }
        }

        /* Spinning wheels counter-clockwise for left-cruising */
        @keyframes spinWheelLeft {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }

        /* Goofy cab bounce */
        @keyframes wobbleCab {
          0% { transform: translate3d(0, 0px, 0) rotate(0deg); }
          50% { transform: translate3d(0, -3px, 0) rotate(0.8deg); }
          100% { transform: translate3d(0, 0px, 0) rotate(-0.8deg); }
        }

        /* Goofy cargo box wobble */
        @keyframes wobbleCargo {
          0% { transform: rotate(-1.5deg); }
          50% { transform: rotate(2deg); }
          100% { transform: rotate(-2deg); }
        }

        /* Exhaust pipe wiggling */
        @keyframes exhaustWiggle {
          0% { transform: rotate(-4deg); }
          100% { transform: rotate(4deg); }
        }

        /* Puffing smoke rings drifting backwards to the right */
        @keyframes smokeRing {
          0% { transform: translate3d(0px, 0px, 0) scale(0.3); opacity: 0; }
          25% { opacity: 0.75; }
          100% { transform: translate3d(35px, -30px, 0) scale(2.6); opacity: 0; }
        }

        /* Digit 4 (Rightmost - drops first - Computer Monitor) */
        @keyframes spillFourRight {
          0% { transform: translate3d(496px, 137px, 0) rotate(0deg); opacity: 0; }
          49% { transform: translate3d(84px, 136.2px, 0) rotate(0deg); opacity: 0; }
          50% { transform: translate3d(76px, 136.2px, 0) rotate(0deg); opacity: 1; }
          55% { transform: translate3d(115px, 168px, 0) rotate(110deg); opacity: 1; }
          62% { transform: translate3d(180px, 168px, 0) rotate(260deg); opacity: 1; }
          70% { transform: translate3d(250px, 168px, 0) rotate(430deg); opacity: 1; }
          78% { transform: translate3d(320px, 168px, 0) rotate(600deg); opacity: 1; }
          83% { transform: translate3d(365px, 168px, 0) rotate(710deg); opacity: 1; }
          88% { transform: translate3d(385px, 230px, 0) rotate(790deg); opacity: 1; }
          94% { transform: translate3d(400px, 360px, 0) rotate(880deg); opacity: 1; }
          100% { transform: translate3d(410px, 500px, 0) rotate(960deg); opacity: 0; }
        }

        /* Digit 0 (Middle - drops second - Cardboard Box) */
        @keyframes spillZero {
          0% { transform: translate3d(484px, 137px, 0) rotate(0deg); opacity: 0; }
          53% { transform: translate3d(68px, 136.2px, 0) rotate(0deg); opacity: 0; }
          54% { transform: translate3d(60px, 137px, 0) rotate(0deg); opacity: 1; }
          59% { transform: translate3d(95px, 168px, 0) rotate(90deg); opacity: 1; }
          66% { transform: translate3d(160px, 168px, 0) rotate(240deg); opacity: 1; }
          74% { transform: translate3d(230px, 168px, 0) rotate(400deg); opacity: 1; }
          82% { transform: translate3d(300px, 168px, 0) rotate(560deg); opacity: 1; }
          87% { transform: translate3d(355px, 168px, 0) rotate(680deg); opacity: 1; }
          92% { transform: translate3d(375px, 240px, 0) rotate(760deg); opacity: 1; }
          97% { transform: translate3d(390px, 370px, 0) rotate(850deg); opacity: 1; }
          100% { transform: translate3d(400px, 500px, 0) rotate(920deg); opacity: 0; }
        }

        /* Digit 4 (Leftmost - drops last - Office Chair) */
        @keyframes spillFourLeft {
          0% { transform: translate3d(472px, 137px, 0) rotate(0deg); opacity: 0; }
          57% { transform: translate3d(60px, 136.2px, 0) rotate(0deg); opacity: 0; }
          58% { transform: translate3d(48px, 137px, 0) rotate(0deg); opacity: 1; }
          63% { transform: translate3d(80px, 168px, 0) rotate(80deg); opacity: 1; }
          70% { transform: translate3d(145px, 168px, 0) rotate(220deg); opacity: 1; }
          78% { transform: translate3d(215px, 168px, 0) rotate(380deg); opacity: 1; }
          85% { transform: translate3d(285px, 168px, 0) rotate(540deg); opacity: 1; }
          90% { transform: translate3d(345px, 168px, 0) rotate(660deg); opacity: 1; }
          94% { transform: translate3d(365px, 250px, 0) rotate(740deg); opacity: 1; }
          98% { transform: translate3d(380px, 380px, 0) rotate(820deg); opacity: 1; }
          100% { transform: translate3d(390px, 500px, 0) rotate(880deg); opacity: 0; }
        }

        /* Spark flashing */
        @keyframes sparkPop {
          0%, 100% { opacity: 0; transform: scale(0.6); }
          50% { opacity: 1; transform: scale(1.1); }
        }

        /* Staggered text reveal */
        @keyframes fadeReveal {
          0% { opacity: 0; transform: translate3d(0, 10px, 0); }
          100% { opacity: 1; transform: translate3d(0, 0, 0); }
        }

        /* Action buttons shake reaction to truck impact */
        @keyframes buttonImpactReaction {
          0%, 49%, 63%, 100% { transform: scale(1) translate3d(0, 0, 0); }
          50% { transform: scale(0.97) translate3d(-2px, 3px, 0); }
          52% { transform: scale(1.03) translate3d(2px, -3px, 0); }
          54% { transform: scale(0.98) translate3d(-3px, 1px, 0); }
          56% { transform: scale(1.02) translate3d(3px, -2px, 0); }
          58% { transform: scale(0.99) translate3d(-1px, 2px, 0); }
          60% { transform: scale(1.01) translate3d(1px, -1px, 0); }
        }

        /* Refresh icon spin on impact */
        @keyframes refreshSpinLoop {
          0%, 49% { transform: rotate(0deg); }
          50% { transform: rotate(0deg); }
          58% { transform: rotate(360deg); }
          59%, 100% { transform: rotate(360deg); }
        }

        /* Metallic paint shine sweep */
        @keyframes glossSweep {
          0% { left: -150%; }
          25% { left: 150%; }
          100% { left: 150%; }
        }

        /* Speed line translate */
        @keyframes speedLineRun {
          0% { transform: translate3d(0px, 0, 0); opacity: 0.7; }
          100% { transform: translate3d(350px, 0, 0); opacity: 0; }
        }

        /* Scrolling background dashes inside the card */
        @keyframes scrollDashes {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: 35px; }
        }

        /* Scenery parallax scrolls inside the card (moving right) */
        @keyframes mountainScroll {
          0% { transform: translate3d(-400px, 0, 0); }
          100% { transform: translate3d(0px, 0, 0); }
        }

        @keyframes treeScroll {
          0% { transform: translate3d(-400px, 0, 0); }
          100% { transform: translate3d(0px, 0, 0); }
        }

        @keyframes poleScroll {
          0% { transform: translate3d(-400px, 0, 0); }
          100% { transform: translate3d(0px, 0, 0); }
        }

        @keyframes cloudFloat {
          0% { transform: translate3d(-250px, 0, 0); }
          100% { transform: translate3d(450px, 0, 0); }
        }

        @keyframes birdsFly {
          0% { transform: translate3d(-150px, 15px, 0); }
          100% { transform: translate3d(450px, 35px, 0); }
        }

        @keyframes birdFlap {
          0% { transform: scaleY(0.4); }
          100% { transform: scaleY(1.1); }
        }

        @keyframes leavesDrift {
          0% { transform: translate3d(-50px, 15px, 0) rotate(0deg); }
          100% { transform: translate3d(420px, 130px, 0) rotate(360deg); }
        }

        @keyframes mountainFarScroll {
          0% { transform: translate3d(-400px, 0, 0); }
          100% { transform: translate3d(0px, 0, 0); }
        }

        @keyframes sunRaysRotate {
          0% { transform: translate3d(200px, 65px, 0) rotate(0deg); }
          100% { transform: translate3d(200px, 65px, 0) rotate(360deg); }
        }

        /* Gentle dust trailing from tires (moving right) */
        @keyframes dustRight {
          0% { transform: translate3d(0px, 0px, 0) scale(0.4); opacity: 0; }
          20% { opacity: 0.8; }
          100% { transform: translate3d(40px, -15px, 0) scale(2.2); opacity: 0; }
        }

        /* Seamless scrolling road dash lines */
        @keyframes scrollDashes {
          0% { stroke-dashoffset: 22; }
          100% { stroke-dashoffset: 0; }
        }

        /* Screen vibration/shake synchronized to the cargo spill at 50% (4.0s) */
        @keyframes containerImpactShake {
          0%, 48%, 56%, 100% { transform: translate3d(0, 0, 0); }
          49% { transform: translate3d(-4px, 3px, 0) rotate(-0.5deg); }
          50% { transform: translate3d(5px, -4px, 0) rotate(0.8deg); }
          51% { transform: translate3d(-5px, 4px, 0) rotate(-0.8deg); }
          52% { transform: translate3d(4px, -3px, 0) rotate(0.5deg); }
          53% { transform: translate3d(-3px, 2px, 0) rotate(-0.3deg); }
          54% { transform: translate3d(2px, -1px, 0) rotate(0.2deg); }
          55% { transform: translate3d(-1px, 1px, 0) rotate(-0.1deg); }
        }

        /* Speedometer needle drop on crash */
        @keyframes speedNeedle {
          0%, 47% { transform: rotate(50deg); }
          50%, 56% { transform: rotate(-80deg); } /* Drops to zero on crash */
          70%, 100% { transform: rotate(50deg); }
        }

        /* Draining cargo weight progress bar */
        @keyframes cargoWeightBar {
          0%, 49% { width: 90px; fill: #10b981; } /* Full green */
          50% { width: 60px; fill: #fb923c; } /* Box drops (66% weight) */
          54% { width: 30px; fill: #f97316; } /* Monitor drops (33% weight) */
          58%, 76% { width: 5px; fill: #ef4444; } /* Empty/Warning red */
          82%, 100% { width: 90px; fill: #10b981; } /* Loaded */
        }

        /* Staggered diagnostic text messages */
        @keyframes textNormal {
          0%, 48% { opacity: 1; }
          49%, 100% { opacity: 0; }
        }

        @keyframes textCrash {
          0%, 48% { opacity: 0; }
          49%, 76% { opacity: 1; }
          77%, 100% { opacity: 0; }
        }

        @keyframes textReroute {
          0%, 76% { opacity: 0; }
          77%, 100% { opacity: 1; }
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
          animation: "fadeReveal 1.5s ease-out forwards"
        }}
      >

        {/* SVG Container holding the entire truck crash sequence */}
        <Box
          sx={{
            width: "100%",
            maxWidth: 460,
            aspectRatio: "400/220",
            height: "auto",
            position: "relative",
            overflow: "visible", // ALLOW ELEMENTS TO FLY OUT OF THE CARD!
            mb: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "containerImpactShake 8s infinite linear",
            willChange: "transform",
            transform: "translate3d(0, 0, 0)",
          }}
        >
          {/* Inner Card Screen (with overflow: hidden and border/boxShadow) */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "linear-gradient(to bottom, #bae6fd 0%, #e0f2fe 55%, #f0f9ff 80%, #0f172a 81%)", // Morning sky + dark dashboard base
              borderRadius: "20px",
              border: "3px solid #334155",
              boxShadow: "0 20px 40px -15px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.9) inset, 0 0 25px rgba(37, 99, 235, 0.15)",
              overflow: "hidden", // CLIPS SCENERY!
              zIndex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Retro CRT Scanlines & Glass reflection overlay */}
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.12) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.02), rgba(0, 255, 0, 0.005), rgba(0, 0, 255, 0.02))",
                backgroundSize: "100% 3px, 3px 100%",
                pointerEvents: "none",
                zIndex: 10,
              }}
            />
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "radial-gradient(circle at 50% 15%, rgba(255, 255, 255, 0.15), transparent 60%)",
                pointerEvents: "none",
                zIndex: 11,
              }}
            />

            {/* Digital Status Header Overlay */}
            <Box
              sx={{
                position: "absolute",
                top: 8,
                left: 12,
                right: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                zIndex: 12,
                pointerEvents: "none",
              }}
            >
              <Typography
                sx={{
                  fontSize: "8px",
                  fontFamily: "monospace",
                  fontWeight: "bold",
                  color: "#0369a1",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                <Box
                  sx={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    bgcolor: "#ef4444",
                    animation: "sparkPop 1s infinite",
                  }}
                />
                SYSTEM LIVE // MONITOR 01
              </Typography>
              <Typography
                sx={{
                  fontSize: "8px",
                  fontFamily: "monospace",
                  fontWeight: "bold",
                  color: "#0369a1",
                }}
              >
                LOC: 404_PAGE
              </Typography>
            </Box>

            <svg width="100%" height="100%" viewBox="0 0 400 220" style={{ overflow: "hidden", zIndex: 2 }}>
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
                <linearGradient id="titaniumGrad" x1="0.2" y1="0" x2="0.8" y2="1">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="30%" stopColor="#e2e8f0" />
                  <stop offset="70%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#475569" />
                </linearGradient>
                <linearGradient id="electricCyan" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#0891b2" />
                </linearGradient>
                <linearGradient id="panoramicGlassGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0f172a" />
                  <stop offset="60%" stopColor="#020617" />
                  <stop offset="100%" stopColor="#0891b2" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="electricBeamGrad" x1="1" y1="0.5" x2="0" y2="0.5">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="electricBeamHighGrad" x1="1" y1="0.5" x2="0" y2="0.5">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="metallicBlueGrad" x1="0" y1="0" x2="0.2" y2="1">
                  <stop offset="0%" stopColor="#bae6fd" />
                  <stop offset="10%" stopColor="#ffffff" />
                  <stop offset="22%" stopColor="#38bdf8" />
                  <stop offset="55%" stopColor="#0284c7" />
                  <stop offset="85%" stopColor="#0369a1" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
                <linearGradient id="redFenderGrad" x1="0.2" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="12%" stopColor="#f87171" />
                  <stop offset="40%" stopColor="#ef4444" />
                  <stop offset="70%" stopColor="#b91c1c" />
                  <stop offset="100%" stopColor="#b91c1c" />
                </linearGradient>
                <linearGradient id="cabGlassGrad" x1="0.3" y1="0" x2="0.7" y2="1">
                  <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.95" />
                  <stop offset="40%" stopColor="#7dd3fc" stopOpacity="0.8" />
                  <stop offset="80%" stopColor="#0284c7" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#0369a1" stopOpacity="0.95" />
                </linearGradient>
                <radialGradient id="tireGrad" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
                  <stop offset="0%" stopColor="#64748b" />
                  <stop offset="50%" stopColor="#334155" />
                  <stop offset="85%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#0f172a" />
                </radialGradient>
                <linearGradient id="woodPlankGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="20%" stopColor="#d97706" />
                  <stop offset="65%" stopColor="#78350f" />
                  <stop offset="100%" stopColor="#451a03" />
                </linearGradient>
                <radialGradient id="underShadowGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(15, 23, 42, 0.7)" />
                  <stop offset="100%" stopColor="rgba(15, 23, 42, 0)" />
                </radialGradient>

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
              <circle cx="200" cy="65" r="22" fill="#fdba74" opacity="0.2" />
              <circle cx="200" cy="65" r="16" fill="#fdba74" opacity="0.4" />
              <circle cx="200" cy="65" r="13" fill="#ffedd5" opacity="0.95" />

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
              <g className="accelerate-layer" style={{ animation: "birdsFly 8s infinite linear" }}>
                <path d="M 0 0 Q 3 -4 6 0 Q 9 -4 12 0 Q 6 -2 0 0" fill="#0369a1" opacity="0.6" style={{ animation: "birdFlap 0.4s infinite alternate" }} />
                <path d="M 15 -8 Q 18 -12 21 -8 Q 24 -12 27 -8 Q 21 -10 15 -8" fill="#0369a1" opacity="0.5" style={{ animation: "birdFlap 0.4s infinite alternate 0.1s" }} />
                <path d="M -12 -5 Q -9 -9 -6 -5 Q -3 -9 0 -5 Q -6 -7 -12 -5" fill="#0369a1" opacity="0.55" style={{ animation: "birdFlap 0.4s infinite alternate 0.2s" }} />
              </g>

              {/* Drifting Breeze Leaves */}
              <g className="accelerate-layer" style={{ animation: "leavesDrift 6s infinite linear" }}>
                <path d="M0,0 C2,-3 6,-3 8,0 C6,3 2,3 0,0 Z" fill="#10b981" opacity="0.7" transform="rotate(15)" />
                <path d="M30,-15 C32,-18 36,-18 38,-15 C36,-12 32,-12 30,-15 Z" fill="#34d399" opacity="0.65" transform="rotate(-10)" />
              </g>

              {/* Parallax Layer 0: Deep Distant Mountains (scrolling slowly) */}
              <g className="accelerate-layer" style={{ animation: "mountainFarScroll 24s infinite linear" }}>
                <path d="M0,80 L50,60 L100,75 L150,50 L200,70 L250,55 L300,80 L350,65 L400,80 L450,60 L500,75 L550,50 L600,70 L650,55 L700,80 L750,65 L800,80 L800,180 L0,180 Z" fill="rgba(2, 132, 199, 0.08)" />
              </g>

              {/* Parallax Layer 1: Distant Mountains (scrolling medium) */}
              <g className="accelerate-layer" style={{ animation: "mountainScroll 16s infinite linear" }}>
                <path d="M0,105 L40,85 L100,95 L150,75 L200,90 L250,80 L300,95 L350,85 L400,105 L440,85 L500,95 L550,75 L600,90 L650,80 L700,95 L750,85 L800,105 L800,180 L0,180 Z" fill="rgba(2, 132, 199, 0.15)" />
              </g>

              {/* Parallax Layer 2: Midground Pine Trees Row (scrolling faster) */}
              <g className="accelerate-layer" style={{ animation: "treeScroll 8s infinite linear" }}>
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
              <g className="accelerate-layer" style={{ animation: "poleScroll 4s infinite linear" }}>
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

              {/* Speed Breaker (Speed Bump) with diagonal yellow/black warning stripes */}
              <g>
                <path d="M -10 172 Q 4 163 18 172 Z" fill="#1e293b" stroke="#334155" strokeWidth="0.8" />
                <path d="M -6 172 L -3 168.5 M -1 170.5 L 2 166.5 M 4 168.5 L 7 164.5 M 9 168.5 L 12 171.5" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" />
              </g>

              {/* The coordinate digits are moved to the overflow overlay SVG below the card */}

              {/* CLASSIC RETRO 1950s Flatbed Pickup Truck */}
              <g className="accelerate-layer" style={{ animation: "truckDriveLeft 8s infinite linear" }}>

                {/* Under-truck ambient drop shadows for realistic depth */}
                <ellipse cx="-36" cy="60.5" rx="10" ry="1.8" fill="url(#underShadowGrad)" />
                <ellipse cx="36" cy="60.5" rx="10" ry="1.8" fill="url(#underShadowGrad)" />
                <ellipse cx="2" cy="60.5" rx="44" ry="2.2" fill="url(#underShadowGrad)" />

                {/* SPINNING HIGH-FIDELITY DUALLY WHEELS WITH LUG NUTS AND TIRE TREADS */}
                {/* Dark Inner Wheel Well Housing (static, drawn behind wheels) */}
                <path d="M -48 53 C -48 38 -24 38 -24 53 Z" fill="#0a0f1d" opacity="0.95" />
                <path d="M 24 53 C 24 38 48 38 48 53 Z" fill="#0a0f1d" opacity="0.95" />

                {/* Front Wheel */}
                <g className="accelerate-layer" style={{ animation: "spinWheelLeft 0.3s infinite linear", transformOrigin: "-36px 53px" }}>
                  <circle cx="-36" cy="53" r="8" fill="url(#tireGrad)" />
                  <circle cx="-36" cy="53" r="7.8" fill="none" stroke="#0f172a" strokeWidth="0.4" strokeDasharray="1.2 0.8" />
                  <circle cx="-36" cy="53" r="7.2" fill="none" stroke="#0f172a" strokeWidth="0.3" strokeDasharray="1.2 1" />
                  <circle cx="-36" cy="53" r="5.6" fill="#f1f5f9" />
                  <circle cx="-36" cy="53" r="4.3" fill="none" stroke="#cbd5e1" strokeWidth="0.5" />
                  <circle cx="-36" cy="53" r="3.7" fill="url(#chromeGrad)" stroke="#475569" strokeWidth="0.4" />
                  {/* 10 Lug Nuts arranging in a circle */}
                  <circle cx="-38.8" cy="53" r="0.3" fill="#475569" />
                  <circle cx="-33.2" cy="53" r="0.3" fill="#475569" />
                  <circle cx="-36" cy="55.8" r="0.3" fill="#475569" />
                  <circle cx="-36" cy="50.2" r="0.3" fill="#475569" />
                  <circle cx="-38" cy="54.6" r="0.3" fill="#475569" />
                  <circle cx="-34" cy="51.4" r="0.3" fill="#475569" />
                  <circle cx="-34" cy="54.6" r="0.3" fill="#475569" />
                  <circle cx="-38" cy="51.4" r="0.3" fill="#475569" />
                  <circle cx="-37" cy="52.1" r="0.25" fill="#475569" />
                  <circle cx="-35" cy="53.9" r="0.25" fill="#475569" />
                  <path d="M -36 53 L -39.5 49.5 A 5 5 0 0 1 -32.5 49.5 Z" fill="#ffffff" opacity="0.55" />
                  <circle cx="-36" cy="53" r="1.3" fill="url(#chromeGrad)" stroke="#334155" strokeWidth="0.3" />
                </g>

                {/* Rear Wheel (Deep Dish Dually) */}
                <g className="accelerate-layer" style={{ animation: "spinWheelLeft 0.3s infinite linear", transformOrigin: "36px 53px" }}>
                  <circle cx="36" cy="53" r="8" fill="url(#tireGrad)" />
                  <circle cx="36" cy="53" r="7.8" fill="none" stroke="#0f172a" strokeWidth="0.4" strokeDasharray="1.2 0.8" />
                  <circle cx="36" cy="53" r="7.2" fill="none" stroke="#0f172a" strokeWidth="0.3" strokeDasharray="1.2 1" />
                  <circle cx="36" cy="53" r="5.6" fill="#f1f5f9" />
                  <circle cx="36" cy="53" r="4.3" fill="none" stroke="#cbd5e1" strokeWidth="0.5" />
                  {/* Deep Dish Inner Shading */}
                  <circle cx="36" cy="53" r="3.7" fill="#1e293b" />
                  <circle cx="36" cy="53" r="3.0" fill="url(#chromeGrad)" stroke="#475569" strokeWidth="0.4" />
                  {/* Lug Nuts */}
                  <circle cx="33.8" cy="53" r="0.3" fill="#475569" />
                  <circle cx="38.2" cy="53" r="0.3" fill="#475569" />
                  <circle cx="36" cy="55.2" r="0.3" fill="#475569" />
                  <circle cx="36" cy="50.8" r="0.3" fill="#475569" />
                  <circle cx="34.5" cy="54.5" r="0.3" fill="#475569" />
                  <circle cx="37.5" cy="51.5" r="0.3" fill="#475569" />
                  <circle cx="37.5" cy="54.5" r="0.3" fill="#475569" />
                  <circle cx="34.5" cy="51.5" r="0.3" fill="#475569" />
                  <path d="M 36 53 L 32.5 49.5 A 5 5 0 0 1 39.5 49.5 Z" fill="#ffffff" opacity="0.55" />
                  <circle cx="36" cy="53" r="1.1" fill="url(#chromeGrad)" stroke="#334155" strokeWidth="0.3" />
                </g>

                {/* Bouncing Truck Body */}
                <g className="accelerate-layer" style={{ animation: "wobbleCab 0.25s infinite alternate ease-in-out", transformOrigin: "0px 48px" }}>

                  {/* Truck Chassis Frame & Leaf Springs */}
                  <rect x="-56" y="47" width="108" height="4" fill="#1e293b" rx="1" />
                  <path d="M -46 47 Q -36 50 -26 47" fill="none" stroke="#0f172a" strokeWidth="1.6" />
                  <path d="M -44 48 Q -36 51 -28 48" fill="none" stroke="#475569" strokeWidth="1.2" />
                  <path d="M 26 47 Q 36 50 46 47" fill="none" stroke="#0f172a" strokeWidth="1.6" />
                  <path d="M 28 48 Q 36 51 44 48" fill="none" stroke="#475569" strokeWidth="1.2" />
                  <rect x="34" y="47" width="4" height="2.5" fill="#0f172a" />

                  {/* Front Bumper - Rounded Retro Chrome Finish with Bolts */}
                  <rect x="-58" y="44" width="7" height="3.5" fill="url(#metallicBlueGrad)" rx="1.5" stroke="#172554" strokeWidth="0.8" />
                  <circle cx="-56.2" cy="45.8" r="0.4" fill="#64748b" />
                  <circle cx="-53.2" cy="45.8" r="0.4" fill="#64748b" />

                  {/* Heavy Duty Chrome Bullbar / Grille Guard */}
                  <path d="M -59,47 L -59,37 L -55,37 L -55,47 Z" fill="none" stroke="#1e293b" strokeWidth="1.2" />
                  <line x1="-59" y1="41" x2="-55" y2="41" stroke="#1e293b" strokeWidth="1.2" />
                  <line x1="-59" y1="44" x2="-55" y2="44" stroke="#1e293b" strokeWidth="1.2" />
                  <circle cx="-57" cy="37.5" r="0.8" fill="#fbbf24" stroke="#d97706" strokeWidth="0.3" /> {/* Amber Fog Lights */}
                  <circle cx="-57" cy="37.5" r="0.4" fill="#ffffff" />

                  {/* Classic Heavy-Duty Conventional Semi Cab (Long-nose) */}
                  {/* Long Hood */}
                  <rect x="-56" y="31" width="24" height="13" fill="url(#metallicBlueGrad)" stroke="#172554" strokeWidth="1.2" rx="0.5" />
                  {/* Hood Specular Highlight */}
                  <path d="M -55 31.8 L -33 31.8" stroke="#ffffff" strokeWidth="0.7" opacity="0.45" strokeLinecap="round" />

                  {/* Detailed Engine Vent Louvers */}
                  <rect x="-50" y="35" width="4" height="1.0" fill="#1e293b" rx="0.3" />
                  <rect x="-49.5" y="35" width="3" height="0.5" fill="#0f172a" />

                  <rect x="-50" y="37" width="4" height="1.0" fill="#1e293b" rx="0.3" />
                  <rect x="-49.5" y="37" width="3" height="0.5" fill="#0f172a" />

                  <rect x="-50" y="39" width="4" height="1.0" fill="#1e293b" rx="0.3" />
                  <rect x="-49.5" y="39" width="3" height="0.5" fill="#0f172a" />

                  {/* Classic Hood Latches / Fasteners */}
                  <path d="M -34 43 L -33 41.5 L -31 41.5 L -30 43" stroke="#1e293b" strokeWidth="0.8" fill="none" />
                  <circle cx="-33" cy="42" r="0.4" fill="url(#chromeGrad)" />
                  <circle cx="-31" cy="42" r="0.4" fill="url(#chromeGrad)" />
                  <path d="M -32 41.5 L -32 43.5" stroke="#111827" strokeWidth="0.6" />

                  {/* Cab Main Body */}
                  <path d="M -32 44 L -32 20 C -32 19 -30 18 -28 18 L 2 18 C 3 18 4 19 4 20 L 4 44 Z" fill="url(#metallicBlueGrad)" stroke="#172554" strokeWidth="1.2" />
                  {/* Cab Roof Curve Specular Highlight */}
                  <path d="M -30 18.8 C -29 18.6 -25 18.6 -23 18.6 L 2 18.6" stroke="#ffffff" strokeWidth="0.8" opacity="0.4" strokeLinecap="round" />

                  {/* Cab Door & Hood Panel Seams */}
                  <path d="M -30 29 L -32 44 L 1 44 L 3 29 Z" fill="none" stroke="#0f172a" strokeWidth="0.6" opacity="0.75" />
                  <line x1="-32" y1="31" x2="-32" y2="44" stroke="#0f172a" strokeWidth="0.6" opacity="0.75" />
                  <path d="M -31 43.5 L 3 43.5" stroke="#0f172a" strokeWidth="1.0" opacity="0.6" />

                  {/* Custom Classic Body Decal / Chrome Side Stripe */}
                  <path d="M -54,34 L -32,34 L -28,40 L 2,40" fill="none" stroke="url(#chromeGrad)" strokeWidth="1" />
                  <path d="M -54,35 L -32,35 L -28,41 L 2,41" fill="none" stroke="#ea580c" strokeWidth="0.4" /> {/* Orange accent line */}

                  {/* Fenders (Wheel Arches) - Custom Classic Chrome Style */}
                  {/* Vintage Teardrop Chrome Front Fender with Amber Marker Light */}
                  <path d="M -52 44 C -52 30 -24 30 -24 44" fill="url(#metallicBlueGrad)" stroke="#172554" strokeWidth="1.2" />
                  <path d="M -52 44 C -52 29.8 -24 29.8 -24 44" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.85" />
                  <ellipse cx="-43" cy="33.5" rx="2.5" ry="1.4" fill="#f97316" opacity="0.45" />
                  <ellipse cx="-43" cy="33.5" rx="1.2" ry="0.6" fill="#fb923c" stroke="#d97706" strokeWidth="0.3" />
                  <ellipse cx="-43" cy="33.5" rx="0.5" ry="0.2" fill="#ffffff" />

                  {/* Sleek Quarter Chrome Rear Fender & Heavy-Duty Rubber Mudflaps */}
                  <path d="M 23 44 C 23 33 38 33 42 38" fill="none" stroke="url(#chromeGrad)" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M 23 44 C 23 32.8 38 32.8 42 37.8" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.8" />

                  {/* Rubber Mudflap assembly behind dually wheel */}
                  <line x1="40" y1="44" x2="48" y2="44" stroke="url(#chromeGrad)" strokeWidth="0.8" />
                  <rect x="42" y="44" width="6" height="10" fill="#111827" rx="0.3" stroke="#1f2937" strokeWidth="0.3" />
                  {/* Reflective "404" mudflap logo */}
                  <rect x="43" y="45.5" width="4" height="3" fill="#ffffff" opacity="0.8" />
                  <text x="45" y="48.0" fontSize="2.4" fontWeight="bold" fill="#000000" textAnchor="middle">404</text>
                  <rect x="43" y="50" width="4" height="1" fill="#ef4444" />

                  {/* Chrome Side Trim Spear */}
                  <path d="M -54 32.5 L -32 32.5" stroke="url(#chromeGrad)" strokeWidth="1.2" strokeLinecap="round" />
                  <path d="M -54 33.1 L -32 33.1" stroke="#7f1d1d" strokeWidth="0.4" />

                  {/* Chrome Door Handle & Keyhole */}
                  <rect x="-10" y="32" width="3.5" height="1" fill="url(#chromeGrad)" rx="0.3" stroke="#475569" strokeWidth="0.3" />
                  <circle cx="-11.2" cy="32.5" r="0.5" fill="url(#chromeGrad)" />

                  {/* Windshield & Cabin Side Window */}
                  <path d="M -30 29 L -28 20 L -16 20 L -16 29 Z" fill="url(#cabGlassGrad)" stroke="#172554" strokeWidth="0.8" />
                  <path d="M -13 29 L -13 20 L 1 20 L 1 29 Z" fill="url(#cabGlassGrad)" stroke="#172554" strokeWidth="0.8" />
                  <polygon points="-28,21 -25,21 -27,28 -29,28" fill="#ffffff" opacity="0.25" style={{ pointerEvents: "none" }} />
                  <polygon points="-11,21 -8,21 -10,28 -12,28" fill="#ffffff" opacity="0.25" style={{ pointerEvents: "none" }} />

                  {/* Chrome Sun Visor over Windshield */}
                  <path d="M -32 20 C -25 21 -19 21 -14 20 L -15 21 C -20 22 -26 22 -31 21 Z" fill="url(#chromeGrad)" stroke="#475569" strokeWidth="0.3" />

                  {/* Driver - High Fidelity Silhouette with Trucker Cap & Steering Wheel */}
                  <g opacity="0.85" style={{ pointerEvents: "none" }}>
                    {/* Steering Wheel */}
                    <ellipse cx="-26" cy="25.5" rx="0.6" ry="2.2" fill="#1e293b" stroke="#0f172a" strokeWidth="0.3" transform="rotate(-15 -26 25.5)" />
                    {/* Driver Body/Shoulders */}
                    <path d="M -24,29 C -24,26.8 -23,26.2 -21,26.2 C -19,26.2 -18,26.8 -18,29 Z" fill="#1f2937" />
                    {/* Driver Head */}
                    <circle cx="-21" cy="24.2" r="2.4" fill="#1f2937" />
                    {/* Trucker Cap Visor */}
                    <path d="M -23.4,23.2 L -25.6,23.8 L -23.4,24.4 Z" fill="#1f2937" />
                    {/* Arm reaching for wheel */}
                    <path d="M -20.5,27 Q -23.5,27 -25.5,26" fill="none" stroke="#1f2937" strokeWidth="1.1" strokeLinecap="round" />
                  </g>

                  {/* West-Coast Chrome Mirror Set with Brackets */}
                  <path d="M -31 20.5 L -35 20.5 L -35 21.5" fill="none" stroke="url(#chromeGrad)" strokeWidth="0.8" />
                  <path d="M -31 27.5 L -35 27.5 L -35 26.5" fill="none" stroke="url(#chromeGrad)" strokeWidth="0.8" />
                  <line x1="-31" y1="24" x2="-35" y2="24" stroke="url(#chromeGrad)" strokeWidth="0.7" />
                  <rect x="-37.5" y="20.5" width="2.2" height="7" fill="url(#chromeGrad)" rx="0.5" stroke="#334155" strokeWidth="0.4" />
                  <rect x="-37.1" y="21" width="0.8" height="6" fill="#e0f2fe" opacity="0.8" style={{ pointerEvents: "none" }} />

                  {/* Chrome Air Cleaner Canister with Intake Pipe & Cap */}
                  <rect x="-42" y="25" width="3.5" height="11.5" fill="url(#chromeGrad)" rx="1.7" stroke="#475569" strokeWidth="0.4" />
                  <path d="M -40.2 28.5 Q -38 28.5 -38 31.5 L -38 33" fill="none" stroke="url(#chromeGrad)" strokeWidth="0.8" />
                  <circle cx="-40.2" cy="24.8" r="1.2" fill="url(#chromeGrad)" stroke="#475569" strokeWidth="0.3" />

                  {/* Integrated Headlight Cluster */}
                  <path d="M -56 40 L -51 39 L -51 43 L -55 44 Z" fill="#1e293b" stroke="#475569" strokeWidth="0.5" />
                  <path d="M -55 40.5 L -51.5 39.5 L -51.5 42.5 L -54.5 43.5 Z" fill="#e2e8f0" />
                  <path d="M -55.5 40.2 L -52 39.2 L -52 43.2" fill="none" stroke="#ffffff" strokeWidth="2.0" opacity="0.3" />
                  <path d="M -55.5 40.2 L -52 39.2 L -52 43.2" fill="none" stroke="#ffffff" strokeWidth="0.8" />
                  <circle cx="-54" cy="41.5" r="0.7" fill={headlightMode === "off" ? "#475569" : "#38bdf8"} />
                  <circle cx="-52.6" cy="42" r="0.7" fill={headlightMode === "off" ? "#475569" : "#38bdf8"} />

                  {/* Headlight beam */}
                  <g style={{ cursor: "pointer" }} onClick={cycleHeadlight}>
                    {headlightMode === "normal" && (
                      <polygon points="-54,41.5 -160,19 -160,69" fill="url(#headlightNormalGrad)" opacity="0.25" style={{ pointerEvents: "none" }} />
                    )}
                    {headlightMode === "high" && (
                      <polygon points="-54,41.5 -240,9 -240,99" fill="url(#headlightHighGrad)" opacity="0.45" style={{ pointerEvents: "none" }} />
                    )}
                  </g>

                  {/* Tall Chrome Vertical Semi Front Grill */}
                  <rect x="-56" y="31" width="3.5" height="13" fill="url(#metallicBlueGrad)" rx="0.5" stroke="#172554" strokeWidth="0.5" />
                  <line x1="-55" y1="32" x2="-55" y2="43" stroke="#0f172a" strokeWidth="0.35" />
                  <line x1="-54.3" y1="32" x2="-54.3" y2="43" stroke="#0f172a" strokeWidth="0.35" />
                  <line x1="-53.6" y1="32" x2="-53.6" y2="43" stroke="#0f172a" strokeWidth="0.35" />

                  {/* 5 Amber Roof Marker Lights (Classic Semi Signature) */}
                  {/* Outer Glow Circles */}
                  <circle cx="-28" cy="18" r="1.4" fill="#fb923c" opacity="0.4" />
                  <circle cx="-25" cy="18" r="1.4" fill="#fb923c" opacity="0.4" />
                  <circle cx="-22" cy="18" r="1.4" fill="#fb923c" opacity="0.4" />
                  <circle cx="-19" cy="18" r="1.4" fill="#fb923c" opacity="0.4" />
                  <circle cx="-16" cy="18" r="1.4" fill="#fb923c" opacity="0.4" />
                  {/* Light Bulbs */}
                  <circle cx="-28" cy="18" r="0.6" fill="#f97316" />
                  <circle cx="-25" cy="18" r="0.6" fill="#f97316" />
                  <circle cx="-22" cy="18" r="0.6" fill="#f97316" />
                  <circle cx="-19" cy="18" r="0.6" fill="#f97316" />
                  <circle cx="-16" cy="18" r="0.6" fill="#f97316" />

                  {/* Chrome Roof Air Horns (Dual horns) */}
                  <path d="M -26 17 L -20 17 L -18 15 L -18 19 Z" fill="url(#chromeGrad)" />
                  <rect x="-27" y="16.5" width="1.5" height="1" fill="url(#chromeGrad)" />

                  <path d="M -23 15.5 L -18 15.5 L -16 13.5 L -16 17.5 Z" fill="url(#chromeGrad)" />
                  <rect x="-24" y="15" width="1.5" height="1" fill="url(#chromeGrad)" />

                  {/* Dual Chrome Exhaust Vertical Stack Pipes with Smoke Puffs */}
                  {/* Back Stack */}
                  <path d="M 4 44 L 4 9 C 4 8 5 7 6 7" fill="none" stroke="#475569" strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />
                  <circle cx="7" cy="6.2" r="1.8" fill="#64748b" opacity="0.2" />
                  <circle cx="9" cy="4.2" r="2.5" fill="#94a3b8" opacity="0.1" />

                  {/* Front Stack */}
                  <path d="M 7.5 44 L 7.5 8 C 7.5 7 8.5 6 9.5 6" fill="none" stroke="url(#chromeGrad)" strokeWidth="2.2" strokeLinecap="round" />
                  <path d="M 8.5 6 L 11 5 L 9.5 4 Z" fill="url(#chromeGrad)" stroke="#475569" strokeWidth="0.3" /> {/* Flap */}
                  <rect x="6" y="16" width="3" height="28" fill="#475569" rx="0.5" stroke="#334155" strokeWidth="0.4" />
                  <rect x="6.3" y="16" width="2.4" height="28" fill="none" stroke="#cbd5e1" strokeWidth="0.8" strokeDasharray="1.2 1.2" opacity="0.9" />
                  <rect x="4.5" y="24" width="4.5" height="1.5" fill="#475569" rx="0.2" />
                  {/* Active Radiating Puffing Smoke Rings */}
                  <circle cx="9.5" cy="5" r="3.2" fill="#cbd5e1" className="accelerate-layer" style={{ animation: "smokeRing 1.5s infinite ease-out", transformOrigin: "9.5px 5px" }} />
                  <circle cx="9.5" cy="5" r="3.2" fill="#e2e8f0" className="accelerate-layer" style={{ animation: "smokeRing 1.5s infinite ease-out 0.5s", transformOrigin: "9.5px 5px" }} />
                  <circle cx="9.5" cy="5" r="3.2" fill="#94a3b8" className="accelerate-layer" style={{ animation: "smokeRing 1.5s infinite ease-out 1.0s", transformOrigin: "9.5px 5px" }} />

                  {/* Under-Chassis Components: Driveshaft, Axles, Transmission, Tanks, and Toolboxes */}
                  {/* Engine Oil Pan & Transmission Bell Housing under cab area */}
                  <rect x="-35" y="47" width="13" height="4.5" fill="#0f172a" stroke="#1e293b" strokeWidth="0.5" rx="0.5" />
                  <line x1="-32" y1="48" x2="-32" y2="51" stroke="#334155" strokeWidth="0.4" />
                  <line x1="-29" y1="48" x2="-29" y2="51" stroke="#334155" strokeWidth="0.4" />
                  <line x1="-26" y1="48" x2="-26" y2="51" stroke="#334155" strokeWidth="0.4" />

                  {/* Steel Drive Shaft running from Transmission to Rear Differential */}
                  <line x1="-22" y1="49" x2="36" y2="49" stroke="url(#chromeGrad)" strokeWidth="1.2" />
                  {/* Universal Joints */}
                  <rect x="-23" y="48.2" width="1.5" height="1.6" fill="#111827" />
                  <rect x="33" y="48.2" width="1.5" height="1.6" fill="#111827" />

                  {/* Rear Axle Housing & Differential Pumpkin (behind rear wheels) */}
                  <rect x="28" y="52" width="16" height="2" fill="#0f172a" rx="0.5" />
                  <circle cx="36" cy="53" r="3.2" fill="#111827" stroke="#334155" strokeWidth="0.5" />
                  <circle cx="36" cy="53" r="1.8" fill="url(#chromeGrad)" opacity="0.15" />

                  {/* Dual Cylindrical Air Brake Tanks with copper lines */}
                  <rect x="-1" y="46.5" width="7" height="2.8" fill="url(#titaniumGrad)" rx="1.4" stroke="#334155" strokeWidth="0.4" />
                  <path d="M 1 49.3 Q 3 52 4 49.3" fill="none" stroke="#ea580c" strokeWidth="0.5" />

                  {/* Left Chrome Fuel Tank with double-straps and step */}
                  <rect x="-22" y="44.5" width="21" height="6.2" fill="url(#chromeGrad)" rx="3.1" stroke="#475569" strokeWidth="0.6" />
                  <rect x="-19" y="44.5" width="0.8" height="6.3" fill="#111827" />
                  <rect x="-6.5" y="44.5" width="0.8" height="6.3" fill="#111827" />
                  <circle cx="-20" cy="46" r="0.6" fill="#cbd5e1" />
                  <rect x="-18" y="43.2" width="13" height="0.8" fill="url(#chromeGrad)" stroke="#475569" strokeWidth="0.3" />

                  {/* Detailed Heavy-Duty Chrome Utility Toolbox with T-Handle Locks */}
                  <rect x="7" y="44.5" width="16" height="6.2" fill="url(#chromeGrad)" stroke="#334155" strokeWidth="0.6" rx="0.5" />
                  <rect x="8.5" y="45.5" width="13" height="4.2" fill="none" stroke="#475569" strokeWidth="0.4" />
                  <circle cx="11.5" cy="47.6" r="0.6" fill="#111827" />
                  <line x1="10.7" y1="47.6" x2="12.3" y2="47.6" stroke="url(#chromeGrad)" strokeWidth="0.4" />
                  <circle cx="18.5" cy="47.6" r="0.6" fill="#111827" />
                  <line x1="17.7" y1="47.6" x2="19.3" y2="47.6" stroke="url(#chromeGrad)" strokeWidth="0.4" />

                  {/* WOBBLING OVERLOADED CARGO STACK (Shifted onto flatbed behind cab) */}
                  <g className="accelerate-layer" style={{ animation: "wobbleCargo 0.4s infinite alternate ease-in-out", transformOrigin: "26px 41px" }}>

                    {/* Steel Filing Cabinet in middle */}
                    <rect x="12" y="16" width="16" height="25" fill="#475569" stroke="#1e293b" strokeWidth="0.8" rx="1" />
                    <rect x="13.5" y="19" width="13" height="5.5" fill="#334155" rx="0.5" />
                    <rect x="13.5" y="27" width="13" height="5.5" fill="#334155" rx="0.5" />
                    <rect x="13.5" y="35" width="13" height="5.5" fill="#334155" rx="0.5" />
                    <line x1="19" y1="21.5" x2="21" y2="21.5" stroke="#cbd5e1" strokeWidth="1" />
                    <line x1="19" y1="29.5" x2="21" y2="29.5" stroke="#cbd5e1" strokeWidth="1" />
                    <line x1="19" y1="37.5" x2="21" y2="37.5" stroke="#cbd5e1" strokeWidth="1" />

                    {/* Cardboard Box Stack on right */}
                    {/* Bottom Box */}
                    <rect x="30" y="21" width="20" height="20" fill="#d97706" rx="1" stroke="#b45309" strokeWidth="0.8" />
                    <rect x="30" y="30" width="20" height="3" fill="#b45309" opacity="0.8" />
                    {/* Middle Box */}
                    <rect x="32" y="7" width="16" height="14" fill="#b45309" rx="1" stroke="#78350f" strokeWidth="0.8" />
                    <rect x="32" y="13" width="16" height="2.5" fill="#78350f" opacity="0.8" />
                    {/* Top Box */}
                    <rect x="35" y="-3" width="10" height="10" fill="#d97706" rx="1" stroke="#b45309" strokeWidth="0.8" />

                    {/* Office Chair stacked on left */}
                    <g transform="translate(2, 24) rotate(-12)">
                      <rect x="-6" y="-10" width="12" height="9" fill="#10b981" rx="1.5" stroke="#047857" strokeWidth="0.8" />
                      <rect x="-7" y="-1" width="14" height="2" fill="#047857" rx="0.5" />
                      <line x1="0" y1="1" x2="0" y2="7" stroke="#1f2937" strokeWidth="1.5" />
                      <path d="M -5 8 L 5 8" stroke="#1f2937" strokeWidth="1" />
                    </g>

                    {/* Desktop CRT Monitor precariously balanced on top of cabinet */}
                    <g transform="translate(20, 5) rotate(14)">
                      <rect x="-7" y="-7" width="14" height="11" fill="#cbd5e1" stroke="#475569" strokeWidth="0.8" rx="1" />
                      <rect x="-6" y="-6" width="12" height="8" fill="#1e293b" rx="0.5" />
                      <rect x="-4.5" y="-4.5" width="9" height="6" fill="#022c22" rx="0.3" />
                      <text x="0" y="-0.5" fontSize="3" fontWeight="bold" fill="#34d399" textAnchor="middle" filter="drop-shadow(0 0 1px #34d399)">404</text>
                      <line x1="-3.5" y1="2" x2="3.5" y2="2" stroke="#ef4444" strokeWidth="0.5" strokeDasharray="1.5 1" />
                      <polygon points="-3,4 3,4 1.5,6 -1.5,6" fill="#475569" />
                    </g>

                    {/* Loose Orange Straps holding the mountain of assets with buckles */}
                    <rect x="11.5" y="15" width="2.5" height="1.8" fill="url(#chromeGrad)" stroke="#475569" strokeWidth="0.3" />
                    <rect x="29" y="20" width="2.5" height="1.8" fill="url(#chromeGrad)" stroke="#475569" strokeWidth="0.3" />
                    <path d="M -4 41 Q 15 -15 32 7 Q 40 15 46 41" fill="none" stroke="#ea580c" strokeWidth="1.2" strokeDasharray="4 2.5" />
                    <path d="M 2 41 Q 22 -5 40 -3 Q 44 12 48 41" fill="none" stroke="#ea580c" strokeWidth="0.8" opacity="0.7" />

                  </g>

                  {/* Wood Cargo Bed Side Rails matching the classic retro style */}
                  {/* Bed outer frame */}
                  <rect x="4" y="26" width="48" height="18" fill="url(#metallicBlueGrad)" stroke="#172554" strokeWidth="1" rx="0.5" />
                  {/* Three Wood Planks with wood grain details */}
                  <rect x="6" y="28" width="13" height="14" fill="url(#woodPlankGrad)" stroke="#78350f" strokeWidth="0.8" rx="0.5" />
                  <path d="M 7,31 Q 12,30 18,31 M 8,36 Q 14,35 17,37" fill="none" stroke="#451a03" strokeWidth="0.45" opacity="0.4" />

                  <rect x="22" y="28" width="13" height="14" fill="url(#woodPlankGrad)" stroke="#78350f" strokeWidth="0.8" rx="0.5" />
                  <path d="M 23,32 Q 28,33 34,31 M 24,38 Q 30,37 33,39" fill="none" stroke="#451a03" strokeWidth="0.45" opacity="0.4" />

                  <rect x="38" y="28" width="12" height="14" fill="url(#woodPlankGrad)" stroke="#78350f" strokeWidth="0.8" rx="0.5" />
                  <path d="M 39,30 Q 43,31 49,30 M 40,37 Q 45,36 48,38" fill="none" stroke="#451a03" strokeWidth="0.45" opacity="0.4" />

                  {/* Chrome Corner Rivets/Bolts */}
                  <circle cx="7.5" cy="29.5" r="0.6" fill="url(#chromeGrad)" />
                  <circle cx="17.5" cy="29.5" r="0.6" fill="url(#chromeGrad)" />
                  <circle cx="7.5" cy="40.5" r="0.6" fill="url(#chromeGrad)" />
                  <circle cx="17.5" cy="40.5" r="0.6" fill="url(#chromeGrad)" />

                  <circle cx="23.5" cy="29.5" r="0.6" fill="url(#chromeGrad)" />
                  <circle cx="33.5" cy="29.5" r="0.6" fill="url(#chromeGrad)" />
                  <circle cx="23.5" cy="40.5" r="0.6" fill="url(#chromeGrad)" />
                  <circle cx="33.5" cy="40.5" r="0.6" fill="url(#chromeGrad)" />

                  <circle cx="39.5" cy="29.5" r="0.6" fill="url(#chromeGrad)" />
                  <circle cx="48.5" cy="29.5" r="0.6" fill="url(#chromeGrad)" />
                  <circle cx="39.5" cy="40.5" r="0.6" fill="url(#chromeGrad)" />
                  <circle cx="48.5" cy="40.5" r="0.6" fill="url(#chromeGrad)" />

                  {/* Divider bars */}
                  <rect x="20" y="26" width="2" height="18" fill="url(#metallicBlueGrad)" stroke="#172554" strokeWidth="0.4" />
                  <rect x="36" y="26" width="2" height="18" fill="url(#metallicBlueGrad)" stroke="#172554" strokeWidth="0.4" />
                  <path d="M 48 26 L 52 24 L 52 44 L 48 44 Z" fill="url(#metallicBlueGrad)" stroke="#172554" strokeWidth="0.5" />
                  {/* Red Glowing Tail Light at the rear edge of the flatbed */}
                  <rect x="50" y="38" width="2" height="3.5" fill="#ef4444" rx="0.5" stroke="#991b1b" strokeWidth="0.4" />
                  <circle cx="51" cy="39.7" r="0.8" fill="#fca5a5" />

                </g>

              </g>

              {/* Retro Analog Dashboard Cockpit Deck (Static at bottom) */}
              <g transform="translate(0, 180)">
                {/* Dashboard background panel */}
                <rect x="0" y="0" width="400" height="40" fill="#0b0f19" stroke="#1e293b" strokeWidth="0.8" />

                {/* Brushed steel metallic texture stripe */}
                <rect x="0" y="0" width="400" height="3" fill="url(#chromeGrad)" />
                <line x1="0" y1="3" x2="400" y2="3" stroke="#334155" strokeWidth="0.5" />

                {/* Speedometer Gauge */}
                <g transform="translate(45, 20)">
                  <circle cx="0" cy="0" r="14" fill="#020617" stroke="#334155" strokeWidth="1" />
                  <path d="M-10,4 A11,11 0 1,1 10,4" fill="none" stroke="#475569" strokeWidth="1.2" strokeDasharray="2 1.5" />
                  {/* Speed indicator needle - animated to drop on crash */}
                  <g style={{ animation: "speedNeedle 8s infinite linear", transformOrigin: "0px 0px" }}>
                    <line x1="0" y1="0" x2="-10" y2="-6" stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round" />
                    <circle cx="0" cy="0" r="1.8" fill="#f8fafc" />
                  </g>
                  <text x="0" y="11" fontSize="5" fontWeight="bold" fill="#64748b" textAnchor="middle">MPH</text>
                </g>

                {/* Cargo Load Status bar */}
                <g transform="translate(85, 8)">
                  <text x="0" y="8" fontSize="6" fontWeight="bold" fill="#94a3b8" letterSpacing="0.2px">CARGO STATUS</text>
                  {/* Cargo Bar container */}
                  <rect x="0" y="12" width="100" height="8" fill="#020617" rx="2" stroke="#334155" strokeWidth="0.8" />
                  {/* Draining cargo progress bar - animated to empty in steps as cargo falls */}
                  <rect x="1.5" y="13.5" height="5" rx="1" style={{ animation: "cargoWeightBar 8s infinite linear" }} />
                </g>

                {/* Diagnostic Digital Display center */}
                <g transform="translate(205, 8)">
                  <text x="0" y="8" fontSize="6" fontWeight="bold" fill="#94a3b8" letterSpacing="0.2px">MONITOR DIAGNOSTICS</text>
                  <rect x="0" y="12" width="125" height="15" fill="#020617" rx="3" stroke="#1e293b" strokeWidth="0.8" />

                  {/* Animated diagnostic text messages toggling based on truck status */}
                  <g fontSize="7" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                    {/* Status 1: Normal (driving) */}
                    <text x="62.5" y="22" fill="#10b981" style={{ animation: "textNormal 8s infinite linear" }} letterSpacing="0.5px">SYSTEM_OK // DISPATCHED</text>

                    {/* Status 2: Crash detected */}
                    <text x="62.5" y="22" fill="#ef4444" style={{ animation: "textCrash 8s infinite linear" }} letterSpacing="0.5px">WARNING: CARGO_SPILLED</text>

                    {/* Status 3: Rerouting */}
                    <text x="62.5" y="22" fill="#f59e0b" style={{ animation: "textReroute 8s infinite linear" }} letterSpacing="0.5px">RESOLVING_ROUTE... [404]</text>
                  </g>
                </g>

                {/* Flashing Hazard Light indicator */}
                <g transform="translate(360, 20)">
                  <circle cx="0" cy="0" r="8" fill="#1e293b" stroke="#334155" strokeWidth="0.8" />
                  {/* Red warning flasher */}
                  <circle cx="0" cy="0" r="5" fill="#ef4444" style={{ animation: "sparkPop 1s infinite" }} />
                  <text x="0" y="11" fontSize="5" fontWeight="bold" fill="#64748b" textAnchor="middle">WARN</text>
                </g>

                {/* Decorative chassis screws in the corners */}
                <circle cx="4" cy="4" r="1.2" fill="#334155" />
                <line x1="3" y1="4" x2="5" y2="4" stroke="#0f172a" strokeWidth="0.4" />

                <circle cx="396" cy="4" r="1.2" fill="#334155" />
                <line x1="395" y1="4" x2="397" y2="4" stroke="#0f172a" strokeWidth="0.4" />

                <circle cx="4" cy="36" r="1.2" fill="#334155" />
                <line x1="3" y1="36" x2="5" y2="36" stroke="#0f172a" strokeWidth="0.4" />

                <circle cx="396" cy="36" r="1.2" fill="#334155" />
                <line x1="395" y1="36" x2="397" y2="36" stroke="#0f172a" strokeWidth="0.4" />
              </g>
            </svg>
          </Box>

          {/* Overlay SVG container for elements spilling outside the card bounds */}
          <svg
            viewBox="0 0 400 220"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              overflow: "visible",
              pointerEvents: "none",
              zIndex: 12,
            }}
          >
            {/* Digit 4 (Rightmost - Computer Monitor) */}
            <g className="accelerate-layer" style={{ animation: "spillFourRight 8s infinite linear" }}>
              <rect x="-10" y="-10" width="20" height="15" fill="#475569" rx="1.5" stroke="#1e293b" strokeWidth="0.8" />
              <rect x="-8.5" y="-8.5" width="17" height="11" fill="#0ea5e9" rx="0.5" />
              <text x="0" y="-1.5" fontSize="9" fontWeight="900" fill="#ffffff" textAnchor="middle">4</text>
              <polygon points="-4,5 4,5 2,8 -2,8" fill="#334155" />
              <rect x="-5" y="8" width="10" height="1.5" fill="#1e293b" rx="0.5" />
            </g>

            {/* Digit 0 (Middle - Cardboard Box) */}
            <g className="accelerate-layer" style={{ animation: "spillZero 8s infinite linear" }}>
              <rect x="-10" y="-10" width="20" height="20" fill="#b45309" rx="1" stroke="#78350f" strokeWidth="0.8" />
              <rect x="-10" y="-2" width="20" height="3.5" fill="#451a03" opacity="0.85" />
              <rect x="-2" y="-10" width="4" height="20" fill="#451a03" opacity="0.85" />
              <text x="0" y="4" fontSize="11" fontWeight="900" fill="#ffffff" textAnchor="middle">0</text>
            </g>

            {/* Digit 4 (Leftmost - Office Chair) */}
            <g className="accelerate-layer" style={{ animation: "spillFourLeft 8s infinite linear" }}>
              <rect x="-7" y="-12" width="14" height="11" fill="#10b981" rx="2" stroke="#047857" strokeWidth="0.8" />
              <rect x="-8" y="-1" width="16" height="3" fill="#047857" rx="1" />
              <path d="M -8 -4 L -10 -4 L -10 1 M 8 -4 L 10 -4 L 10 1" fill="none" stroke="#1f2937" strokeWidth="1" />
              <line x1="0" y1="2" x2="0" y2="8" stroke="#1f2937" strokeWidth="1.8" />
              <path d="M -6 10 L 6 10 M -4 8 L 4 11 M -4 11 L 4 8" stroke="#1f2937" strokeWidth="1.2" />
              <circle cx="-6" cy="11.5" r="1.2" fill="#111827" />
              <circle cx="6" cy="11.5" r="1.2" fill="#111827" />
              <text x="0" y="-3" fontSize="9" fontWeight="900" fill="#ffffff" textAnchor="middle">4</text>
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
        <Box sx={{ display: "flex", gap: 1.5, animation: "fadeReveal 2.5s ease-out forwards" }}>
          <Button
            variant="contained"
            onClick={() => navigate("/home")}
            sx={{
              position: "relative",
              overflow: "hidden",
              bgcolor: "#2563eb",
              color: "#ffffff",
              fontWeight: 700,
              px: 2,
              py: 0.75,
              borderRadius: "8px",
              fontSize: "11px",
              height: "auto",
              textTransform: "none",
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)",
              animation: "buttonImpactReaction 8s infinite linear",
              "&::after": {
                content: '""',
                position: "absolute",
                top: 0,
                left: "-150%",
                width: "60%",
                height: "100%",
                background: "linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.45) 50%, rgba(255, 255, 255, 0) 100%)",
                transform: "skewX(-25deg)",
                animation: "glossSweep 4s infinite ease-in-out",
              },
              "&:hover": {
                bgcolor: "#1d4ed8",
                boxShadow: "0 6px 16px rgba(37, 99, 235, 0.3)",
              },
            }}
          >
            Back to Headquarters
          </Button>

          <Button
            variant="outlined"
            onClick={handleReRun}
            startIcon={<RefreshIcon sx={{ fontSize: 12, animation: "refreshSpinLoop 8s infinite ease-in-out", transformOrigin: "center" }} />}
            sx={{
              position: "relative",
              overflow: "hidden",
              borderColor: "#cbd5e1",
              color: "#475569",
              fontWeight: 700,
              fontSize: "11px",
              borderRadius: "8px",
              px: 2,
              py: 0.75,
              textTransform: "none",
              animation: "buttonImpactReaction 8s infinite linear",
              "&::after": {
                content: '""',
                position: "absolute",
                top: 0,
                left: "-150%",
                width: "60%",
                height: "100%",
                background: "linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.25) 50%, rgba(255, 255, 255, 0) 100%)",
                transform: "skewX(-25deg)",
                animation: "glossSweep 4s infinite ease-in-out",
                animationDelay: "0.5s",
              },
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
