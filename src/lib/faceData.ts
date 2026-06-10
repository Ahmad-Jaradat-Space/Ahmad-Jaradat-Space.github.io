import type { Face } from "./types";

const GH = "https://github.com/Ahmad-Jaradat-Space";

/**
 * The four faces of Ahmad Jaradat.
 * CONTENT-HONESTY RULE: every metric.value and featuredProject traces to a
 * real repo, paper, role, or live URL (see `source`). No fabricated scale.
 */
export const FACES: Face[] = [
  {
    id: "scientist",
    index: 0,
    faceLabel: "Face 01",
    title: "Scientist",
    shortTitle: "Scientist",
    eyebrow: "Scientist",
    headlineLines: ["Exploring the Universe.", "Measuring the Earth."],
    body: "I study the cosmos and our planet with radio waves. Through VLBI, radio astronomy and geodesy I work to pull a clean signal out of noise, to measure positions at the millimetre level, and to study the solar wind.",
    cta: "Explore My Research",
    ctaHref: GH,
    media: {
      image: { src: "/visuals/scientist.webp", alt: "ALMA radio-telescope antennas under the Milky Way", position: "60% 72%" },
      overlay: "scientist",
      renderer: "canvas",
    },
    theme: {
      accent: "#38bdf8",
      accent2: "#93c5fd",
      accentSoft: "rgba(56,189,248,0.16)",
      background: "#02070f",
      background2: "#061325",
      panel: "rgba(8,18,32,0.82)",
      textMuted: "#94a3b8",
    },
    mood: { glowIntensity: 0.6, grainOpacity: 0.05, vignetteStrength: 0.62, particleDensity: 0.9, panelTilt: 3 },
    keywords: [
      { label: "Radio Astronomy", icon: "Telescope" },
      { label: "VLBI", icon: "Satellite" },
      { label: "Geodesy", icon: "Globe" },
      { label: "Space Weather", icon: "Wind" },
    ],
    metrics: [
      { value: "PhD", label: "VLBI · Geodesy (2025)", source: "conferred, University of Tasmania, Dec 2025" },
      { value: "MSc", label: "Geodetic Engineering", source: "Master of Science in Geodetic Engineering" },
      { value: "6", label: "Publications", source: "journal and conference publications" },
      { value: "25", label: "Broadband sessions", source: "processed end to end" },
    ],
    featuredProjects: [
      { title: "pasa-bayesian-vlbi", description: "Hierarchical Bayesian SNR / SEFD / flux modelling for VLBI.", type: "Open source", repoUrl: `${GH}/pasa-bayesian-vlbi` },
      { title: "ips-broadband-vlbi", description: "Interplanetary scintillation extracted from broadband VLBI.", type: "Open source", repoUrl: `${GH}/ips-broadband-vlbi` },
      { title: "Probing IPS using Broadband VLBI", description: "First author, PASA 2025.", type: "Publication" },
      { title: "VLBI transmitters on Galileo", description: "Advances in Space Research, 2021.", type: "Publication" },
    ],
    chapter: {
      kicker: "Scientist",
      title: "Reading the Universe in Radio",
      intro:
        "I work with radio telescopes, turning very faint signals into precise numbers. The same antennas tell me about distant quasars, about the ground they stand on, and about the stream of charged particles the Sun throws past the Earth.",
      heroFigure: "vlbi",
      ideas: [
        {
          title: "An Earth-sized telescope",
          icon: "Telescope",
          figure: "vlbi",
          text: "Very Long Baseline Interferometry links antennas thousands of kilometres apart so they behave as one giant instrument. What I actually measure is the tiny gap in time between a wavefront reaching one dish and the next, timed against hydrogen-maser clocks.",
        },
        {
          title: "Measuring the Earth",
          icon: "Globe",
          figure: "geodesy",
          text: "The same signals fix where the antennas sit, how the Earth is turning, and how the continents slowly drift, all to the millimetre. This is the quiet geodesy that keeps GPS and reference frames honest.",
        },
        {
          title: "Watching the solar wind",
          icon: "Wind",
          figure: "spaceweather",
          text: "Compact radio sources flicker when their signal crosses turbulence in the solar wind. Read that flicker carefully and a geodetic array doubles as a space-weather monitor.",
        },
      ],
      beats: [
        {
          title: "PhD in VLBI and geodesy",
          kind: "Doctorate",
          icon: "Telescope",
          figure: "geodesy",
          summary:
            "Doctoral research at the University of Tasmania, conferred in 2025, on broadband VLBI and geodesy with the AuScope array. The work is about pulling a clean signal out of noise to measure positions, Earth orientation, and the medium the signal travels through.",
          facts: [
            { label: "Awarded", value: "UTAS, 2025" },
            { label: "Array", value: "AuScope VGOS" },
          ],
        },
        {
          title: "Probing the solar wind with broadband VLBI",
          kind: "Publication, PASA 2025",
          icon: "Wind",
          figure: "kolmogorov",
          summary:
            "An early use of broadband geodetic VLBI to study space weather through interplanetary scintillation. Watching compact sources near the Sun from 3 to 13 GHz on baselines of 2400 to 3400 km, the scintillation grew toward the Sun and matched Kolmogorov turbulence. It showed up even with weaker sources, which suggests VLBI could help monitor the solar wind.",
          facts: [
            { label: "Bands", value: "3 to 13 GHz" },
            { label: "Baselines", value: "2400 to 3400 km" },
            { label: "Turbulence", value: "Kolmogorov, p = 11/3" },
          ],
          href: "https://arxiv.org/abs/2503.14683",
          linkLabel: "Read the paper",
        },
        {
          title: "VLBI transmitters on Galileo satellites",
          kind: "Publication, Advances in Space Research 2021",
          icon: "Satellite",
          figure: "satlink",
          summary:
            "A design for putting a small VLBI beacon on Galileo navigation satellites. It would tie the satellite reference frame straight to the frame of distant quasars, which helps with frame ties, transferring UT1 to UTC, and tracking how the Earth wobbles.",
          facts: [
            { label: "Goal", value: "Frame ties" },
            { label: "Enables", value: "UT1 to UTC transfer" },
          ],
          href: "https://www.sciencedirect.com/science/article/pii/S0273117721003690",
          linkLabel: "Read the paper",
        },
        {
          title: "Bayesian flux and sensitivity modelling",
          kind: "Open source",
          icon: "Sparkles",
          figure: "bayes",
          summary:
            "A Bayesian model that works out signal-to-noise, system sensitivity and source flux together across many VLBI sessions and frequencies. It turns scattered correlator readings into calibrated estimates that carry their own uncertainty.",
          facts: [
            { label: "Method", value: "Hierarchical Bayes" },
            { label: "Infers", value: "SNR, SEFD, flux" },
          ],
          href: "https://github.com/Ahmad-Jaradat-Space/pasa-bayesian-vlbi",
          linkLabel: "View on GitHub",
        },
        {
          title: "Interplanetary scintillation pipeline",
          kind: "Open source",
          icon: "Radio",
          figure: "scintillation",
          summary:
            "An end-to-end pipeline that pulls interplanetary scintillation out of broadband VLBI correlator data and recovers the turbulence parameters, run on real AuScope observations of the solar wind.",
          facts: [
            { label: "Input", value: "Correlator data" },
            { label: "Output", value: "Turbulence parameters" },
          ],
          href: "https://github.com/Ahmad-Jaradat-Space/ips-broadband-vlbi",
          linkLabel: "View on GitHub",
        },
      ],
    },
  },
  {
    id: "ml-builder",
    index: 1,
    faceLabel: "Face 02",
    title: "ML / Data Builder",
    shortTitle: "ML Builder",
    eyebrow: "ML / Data Builder",
    headlineLines: ["Turning Data Into Insight.", "Models That Earn Their Keep."],
    body: "I model messy, real-world data to understand what drives outcomes. I work across forecasting, causal inference, geospatial ML and deployment, building pipelines that turn tangled data into decisions worth acting on.",
    cta: "View ML Projects",
    ctaHref: GH,
    media: {
      image: { src: "/visuals/ml.webp", alt: "Green aurora borealis over a dark fjord at night", position: "center 34%" },
      overlay: "ml",
      renderer: "canvas",
    },
    theme: {
      accent: "#10b981",
      accent2: "#6ee7b7",
      accentSoft: "rgba(16,185,129,0.16)",
      background: "#020c08",
      background2: "#04140d",
      panel: "rgba(6,24,18,0.82)",
      textMuted: "#94a3b8",
    },
    mood: { glowIntensity: 0.5, grainOpacity: 0.045, vignetteStrength: 0.55, particleDensity: 0.6, panelTilt: 3 },
    keywords: [
      { label: "Forecasting", icon: "TrendingUp" },
      { label: "Causal Inference", icon: "Workflow" },
      { label: "Geospatial ML", icon: "Map" },
      { label: "Reproducible Pipelines", icon: "Boxes" },
    ],
    metrics: [
      { value: "6", label: "Public ML repos", source: "github.com/Ahmad-Jaradat-Space" },
      { value: "1", label: "Live app", source: "auroragaze.fly.dev" },
      { value: "Geo·TS", label: "+ anomaly detection", source: "remote sensing, time-series, fraud" },
      { value: "E2E", label: "Data → model → deploy", source: "executed notebooks + provenance" },
    ],
    featuredProjects: [
      { title: "bushfire-burn-severity-mapper", description: "Five-method burn-severity benchmark on Sentinel-2.", type: "Geospatial ML", repoUrl: `${GH}/bushfire-burn-severity-mapper` },
      { title: "tas1-rainfall-to-price", description: "Causal chain: rainfall → hydro storage → electricity price.", type: "Time-series", repoUrl: `${GH}/tas1-rainfall-to-price` },
      { title: "tas1-price-basslink-forecast", description: "Probabilistic price forecasting across the Basslink HVDC.", type: "Forecasting", repoUrl: `${GH}/tas1-price-basslink-forecast` },
      { title: "hydro-storage-scheduling", description: "Stochastic dynamic programming for reservoir dispatch.", type: "Optimisation", repoUrl: `${GH}/hydro-storage-scheduling` },
      { title: "Tactical camera tracking", description: "YOLOv8 and ByteTrack player and ball tracking from match footage.", type: "Computer vision" },
    ],
    chapter: {
      kicker: "ML and Data Builder",
      title: "Turning Messy Data into Decisions",
      intro:
        "I build models that try to take uncertainty and cause seriously, not just correlation. They forecast what might come next, read the world from orbit, and turn tangled real data into something a person can work with.",
      heroFigure: "forecast",
      ideas: [
        {
          title: "Forecasting with honesty",
          icon: "TrendingUp",
          figure: "forecast",
          text: "A single number hides the risk. I forecast the whole range, with calibrated intervals, so the uncertainty is part of the answer instead of a footnote.",
        },
        {
          title: "Cause, not just correlation",
          icon: "Workflow",
          figure: "causal",
          text: "I follow the chain from driver to outcome, including lags, thresholds and regime changes, so a model can say why something moves and keeps working when the conditions shift.",
        },
        {
          title: "Geospatial at scale",
          icon: "Map",
          figure: "geoscan",
          text: "A lot of my data is a map. That means watching for the quiet traps, like spatial leakage, that make a model look good on paper and then fail in the field.",
        },
      ],
      beats: [
        {
          title: "Rainfall to storage to price",
          kind: "Causal time-series",
          icon: "Workflow",
          figure: "causal",
          summary:
            "A study of how rainfall on Tasmania's west coast flows through hydro storage into the electricity price. It pins down a roughly 44-day half-life in the response, and shows the effect depends on how full the dams are. Below about 17 percent capacity, an extra 10 mm of rain pushes the price down by around 3 to 17 dollars per MWh.",
          facts: [
            { label: "Lag", value: "~44-day half-life" },
            { label: "Regime", value: "Depends on storage" },
            { label: "Effect", value: "3 to 17 $/MWh" },
          ],
          href: "https://github.com/Ahmad-Jaradat-Space/tas1-rainfall-to-price",
          linkLabel: "View on GitHub",
        },
        {
          title: "Probabilistic price and Basslink forecasting",
          kind: "Forecasting",
          icon: "TrendingUp",
          figure: "forecast",
          summary:
            "Forecasts of the Tasmanian price and the Basslink interconnector flow with calibrated intervals. The question it answers is where machine learning actually earns its keep, which turns out to be when the link congests and the local price breaks away from the mainland.",
          facts: [
            { label: "Output", value: "Calibrated intervals" },
            { label: "Edge", value: "Congested periods" },
          ],
          href: "https://github.com/Ahmad-Jaradat-Space/tas1-price-basslink-forecast",
          linkLabel: "View on GitHub",
        },
        {
          title: "Burn-severity mapping from orbit",
          kind: "Geospatial ML",
          icon: "Map",
          image: {
            src: "/visuals/chapters/ml-fivemethods.webp",
            alt: "Five burn-severity mapping methods compared against the GEEBAM proxy for one fire",
            caption: "Five methods, one fire: from a simple burn index to deep segmentation, compared on Sentinel-2.",
          },
          summary:
            "Five ways to map wildfire severity on Sentinel-2 imagery, from a simple burn index to deep segmentation, tested across Australia's Black Summer fires. The real lesson is about method: spatial leakage can flatter the scores, so honest evaluation has to hold out whole regions.",
          facts: [
            { label: "Imagery", value: "Sentinel-2" },
            { label: "Methods", value: "5 compared" },
            { label: "Lesson", value: "Spatial leakage" },
          ],
          href: "https://github.com/Ahmad-Jaradat-Space/bushfire-burn-severity-mapper",
          linkLabel: "View on GitHub",
        },
        {
          title: "Optimal reservoir dispatch",
          kind: "Optimisation",
          icon: "Boxes",
          figure: "optim",
          summary:
            "Stochastic dynamic programming to schedule hydro releases against uncertain prices, tested against simple rules and against risk-averse and reinforcement-learning baselines. The aim is to see whether formal optimisation helps next to operator intuition, and by how much.",
          facts: [
            { label: "Method", value: "Stochastic DP" },
            { label: "Compared", value: "Rules, RL, CVaR" },
          ],
          href: "https://github.com/Ahmad-Jaradat-Space/hydro-storage-scheduling",
          linkLabel: "View on GitHub",
        },
        {
          title: "Tactical camera tracking",
          kind: "Computer vision",
          icon: "Film",
          figure: "tracking",
          summary:
            "A pipeline that turns match footage into tracked players and ball. Detections on each frame are linked into stable identities, so movement and spacing can be measured rather than eyeballed. This one is shared with my football work.",
          facts: [
            { label: "Stack", value: "YOLOv8 and ByteTrack" },
            { label: "Input", value: "Match footage" },
            { label: "Output", value: "Player and ball tracks" },
          ],
        },
      ],
    },
  },
  {
    id: "ai-engineer",
    index: 2,
    faceLabel: "Face 03",
    title: "AI Engineer",
    shortTitle: "AI Engineer",
    eyebrow: "AI Engineer",
    headlineLines: ["Designing Multi-Agent Systems.", "Grounded and Reliable."],
    body: "I build multi-agent systems, LLM tools and reasoning workflows around real problems rather than toy demos. The aim is systems that reason, act and try to stay dependable, including one that runs live.",
    cta: "Explore AI Systems",
    ctaHref: "https://auroragaze.fly.dev",
    media: {
      image: { src: "/visuals/ai.webp", alt: "Violet light-installation hallway receding into darkness", position: "center" },
      overlay: "agents",
      renderer: "canvas",
    },
    theme: {
      accent: "#a855f7",
      accent2: "#c084fc",
      accentSoft: "rgba(168,85,247,0.16)",
      background: "#080312",
      background2: "#140a26",
      panel: "rgba(20,10,38,0.82)",
      textMuted: "#a1a1aa",
    },
    mood: { glowIntensity: 0.7, grainOpacity: 0.05, vignetteStrength: 0.6, particleDensity: 0.7, panelTilt: 3.5 },
    keywords: [
      { label: "Multi-Agent Systems", icon: "Network" },
      { label: "LLM Apps", icon: "Bot" },
      { label: "Automation", icon: "Zap" },
      { label: "Tooling", icon: "Wrench" },
    ],
    metrics: [
      { value: "Multi-agent", label: "LangGraph systems", source: "Session Architect, TacLab" },
      { value: "1", label: "Live agent app", source: "auroragaze.fly.dev (DSCOVR briefings)" },
      { value: "RAG", label: "+ LLM tooling", source: "retrieval + verification layers" },
      { value: "150-pg", label: "LLM-engineering notes", source: "personal long-form reference" },
    ],
    featuredProjects: [
      { title: "AuroraGaze", description: "Multi-agent solar-wind and aurora briefings, grounded and cited.", type: "Live app", liveUrl: "https://auroragaze.fly.dev" },
      { title: "Session Architect", description: "LangGraph multi-agent designer for football training sessions.", type: "Agents" },
      { title: "Tutor", description: "Adaptive hub-and-spoke skill tutor with persistent learner state.", type: "Agents" },
      { title: "TacLab", description: "Agentic tactical simulation: LLM agents reasoning over a deterministic football model.", type: "Simulation" },
      { title: "BFAS AI", description: "AI assistant for applied football data analysis, pairing the BFAS methods with LLM agents.", type: "Agents" },
    ],
    chapter: {
      kicker: "AI Engineer",
      title: "Systems That Reason",
      intro:
        "I build multi-agent systems that work on real problems. A coordinator hands work to focused specialists, answers lean on retrieved evidence, and the parts that need to be dependable are kept dependable rather than left to chance.",
      heroFigure: "agentflow",
      ideas: [
        {
          title: "Coordinate, do not monolith",
          icon: "Network",
          figure: "agentflow",
          text: "One model trying to do everything is fragile. A supervisor that routes work to focused agents, each with its own tools, is far easier to reason about, test and trust.",
        },
        {
          title: "Grounded, not guessing",
          icon: "Database",
          figure: "rag",
          text: "Answers are retrieved and cited, not improvised. Retrieval brings the evidence and the agent builds its reply on top of it, so you can see why it said what it said.",
        },
        {
          title: "Reliable by design",
          icon: "Wrench",
          figure: "guardrail",
          text: "I put determinism where it matters: checks, guardrails and structured tools around the model, so a system can run on its own with less chance of drifting off course.",
        },
      ],
      beats: [
        {
          title: "AuroraGaze, live multi-agent briefings",
          kind: "Live app",
          icon: "Sparkles",
          image: {
            src: "/visuals/chapters/ai-hero.webp",
            alt: "The AuroraGaze app showing live Sun imagery, corona, the aurora oval, and solar-wind and Kp readings",
            caption: "AuroraGaze: live solar-wind and aurora briefings, grounded in NASA and NOAA data.",
          },
          summary:
            "A deployed app that writes location-specific aurora and solar-wind briefings. Specialist agents pull live Sun imagery, aurora-oval forecasts, solar-wind and Kp data, then ground a cited briefing, with a fleet mode that lines up forecasts across nearby sites.",
          facts: [
            { label: "Sources", value: "NASA, NOAA, DSCOVR" },
            { label: "Modes", value: "Single and fleet" },
            { label: "Status", value: "Live" },
          ],
          href: "https://auroragaze.fly.dev",
          linkLabel: "Open the live app",
        },
        {
          title: "Session Architect",
          kind: "Agents, LangGraph",
          icon: "MessagesSquare",
          figure: "agentflow",
          summary:
            "A LangGraph system that helps design football training sessions. It takes a coaching goal and works it into a structured, progressive plan through a set of cooperating agents.",
          facts: [
            { label: "Framework", value: "LangGraph" },
            { label: "Domain", value: "Coaching" },
          ],
        },
        {
          title: "Tutor",
          kind: "Agents",
          icon: "Brain",
          figure: "rag",
          summary:
            "An adaptive tutor built as a hub with spokes, holding on to what each learner knows and sending them to the right next step instead of a fixed script.",
          facts: [
            { label: "Shape", value: "Hub and spoke" },
            { label: "Memory", value: "Per-learner state" },
          ],
        },
        {
          title: "TacLab, tactical simulation",
          kind: "Agentic simulation",
          icon: "Shapes",
          figure: "guardrail",
          summary:
            "A tactical simulation where LLM-driven agents reason over a deterministic football model. The agents propose and test positional ideas inside fixed rules, so the creative part stays bounded by something checkable. It is a simulation and agent system, not a web app. Shared with my football work.",
          facts: [
            { label: "Pattern", value: "LLM agents plus fixed rules" },
            { label: "Domain", value: "Tactics" },
          ],
        },
        {
          title: "BFAS AI",
          kind: "Agents, football analytics",
          icon: "Bot",
          figure: "passmap",
          summary:
            "An AI layer over BFAS, my applied football data analysis work. LLM agents help turn tracking, metrics and tactical questions into readable analysis, so the library's methods are easier to pick up and apply. Shared with my football work.",
          facts: [
            { label: "Pairs", value: "LLM agents and analytics" },
            { label: "Domain", value: "Football data" },
          ],
        },
      ],
    },
  },
  {
    id: "football",
    index: 3,
    faceLabel: "Face 04",
    title: "Football Data Scientist",
    shortTitle: "Football",
    eyebrow: "Football Data Scientist",
    headlineLines: ["Reading Space.", "Creating Dilemmas.", "Coaching the Game."],
    body: "I study football as a system of space, pressure and movement, and bring data science to it. I look at how opponents behave, design dilemmas that ask hard questions, and build the tools, from tracking to tactical models, that help me see the game more clearly.",
    cta: "Explore Football Work",
    ctaHref: GH,
    media: {
      image: { src: "/visuals/football.webp", alt: "Aerial top-down view of a floodlit football pitch at night", position: "center" },
      overlay: "pitch",
      renderer: "canvas",
    },
    theme: {
      accent: "#ef4444",
      accent2: "#fb7185",
      accentSoft: "rgba(239,68,68,0.15)",
      background: "#0c0504",
      background2: "#1c0708",
      panel: "rgba(32,9,9,0.82)",
      textMuted: "#b8a3a3",
    },
    mood: { glowIntensity: 0.55, grainOpacity: 0.05, vignetteStrength: 0.6, particleDensity: 0.5, panelTilt: 2.5 },
    keywords: [
      { label: "Tactical Analysis", icon: "Target" },
      { label: "Positional Play", icon: "Spline" },
      { label: "Simulation", icon: "Activity" },
      { label: "Decision-Making", icon: "Brain" },
    ],
    metrics: [
      { value: "Head Coach", label: "UTAS FC Senior Men's", source: "appointed 2025" },
      { value: "B-Diploma", label: "FA / AFC coaching", source: "completed practical 2025" },
      { value: "Tactical Analyst", label: "Opposition analysis", source: "tactical and opposition analysis" },
      { value: "YOLOv8", label: "+ ByteTrack tracking", source: "Tactical camera tracking pipeline" },
    ],
    featuredProjects: [
      { title: "Tactical camera tracking", description: "YOLOv8 and ByteTrack player and ball tracking from match footage.", type: "Computer vision" },
      { title: "TacLab", description: "Agentic tactical simulation: LLM agents reasoning over a deterministic football model.", type: "Simulation" },
      { title: "BFAS", description: "Applied Football Data Analysis, course and visual library.", type: "Education" },
      { title: "UTAS FC", description: "Senior Men's Championship head coach; tactical identity manual.", type: "Coaching" },
    ],
    chapter: {
      kicker: "Football and Data Science",
      title: "Reading Space, Creating Dilemmas",
      intro:
        "I read football as a system of space, pressure and movement. I study how teams behave, design situations that ask the opponent harder questions, and build the tools that turn footage into evidence.",
      heroFigure: "pitch",
      ideas: [
        {
          title: "Football is space",
          icon: "Target",
          figure: "pitch",
          text: "Who controls which area, and who would get there first. Pitch control turns positioning into a surface you can see, and a pass into a real shift in territory.",
        },
        {
          title: "Engineering dilemmas",
          icon: "Spline",
          figure: "dilemma",
          text: "The best moves are questions a defender cannot answer. Play through the gap between two cover-shadows and you force a step that opens the next line.",
        },
        {
          title: "From footage to evidence",
          icon: "Activity",
          figure: "tracking",
          text: "Computer vision turns raw match video into tracked players and ball, so movement, spacing and pressing can be measured instead of just felt.",
        },
      ],
      beats: [
        {
          title: "Tactical camera tracking",
          kind: "Computer vision",
          icon: "Film",
          figure: "tracking",
          summary:
            "A pipeline that turns broadcast or sideline footage into tracked players and ball. Detection on each frame is stitched into stable identities, so runs, spacing and pressing traps become data instead of impressions.",
          facts: [
            { label: "Stack", value: "YOLOv8 and ByteTrack" },
            { label: "Input", value: "Match footage" },
            { label: "Output", value: "Player and ball tracks" },
          ],
        },
        {
          title: "TacLab, tactical simulation",
          kind: "Agentic simulation",
          icon: "Shapes",
          figure: "pitch",
          summary:
            "A tactical simulation where LLM-driven agents reason over a deterministic football model, working through positional ideas and dilemmas step by step. It is a simulation and agent system, not a web app, and a sandbox for testing what a shape does before a session is run.",
          facts: [
            { label: "Type", value: "Agentic simulation" },
            { label: "Use", value: "Positional play" },
          ],
        },
        {
          title: "UTAS FC, Senior Men's",
          kind: "Coaching",
          icon: "Trophy",
          figure: "dilemma",
          summary:
            "Head coach of the University of Tasmania Senior Men's side from 2025, writing the team's tactical identity and running opposition analysis. This is where the ideas above meet a real squad and its week-to-week choices.",
          facts: [
            { label: "Role", value: "Head Coach" },
            { label: "Since", value: "2025" },
            { label: "Badge", value: "FA/AFC B-Diploma" },
          ],
        },
        {
          title: "BFAS, applied football data analysis",
          kind: "Education",
          icon: "Presentation",
          figure: "passmap",
          summary:
            "A course and visual library that teaches applied football data analysis, turning tracking, metrics and tactical models into something coaches and analysts can pick up and use.",
          facts: [
            { label: "Format", value: "Course and library" },
            { label: "Focus", value: "Applied analytics" },
          ],
        },
      ],
    },
  },
];

export const FACE_COUNT = FACES.length;

/** Scientist (face one) is the landing page. */
export const DEFAULT_FACE_INDEX = 0;
