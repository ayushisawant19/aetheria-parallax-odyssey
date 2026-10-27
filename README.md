# ◈ AETHERIA // The Vertical Odyssey

An immersive multi-layered parallax scrolling web experience delivering a vertical journey from a misty alpine valley at dawn, soaring up through the clouds, navigating the neon ribbons of the aurora stratosphere, and breaking out into the infinite cosmic expanse.

---

## 🌟 Parallax Techniques & Highlights

1. **Hardware-Accelerated Multi-Speed Scrubbing (60 FPS)**:
   Every section incorporates at least 4 discrete visual planes (`data-speed` from `0.15` to `1.45`) utilizing CSS `transform: translate3d` and `will-change: transform`, powered by GSAP ScrollTrigger with a performant vanilla JS `requestAnimationFrame` fallback.

2. **Pinned Horizontal Stratospheric Sweep**:
   Altitude checkpoint 48,000m pins the viewport in place while scrubbing a 300vw panoramic orbital vista across the screen, complete with glowing Aurora Borealis curtains, Earth's limb curvature, and orbital satellite telemetry.

3. **Dynamic Sky Morphing & Responsive Canvas Atmosphere**:
   Smooth continuous RGB interpolation of background sky gradients on scroll (Dawn Rose → Alpine Azure → Sunset Amber → Aurora Cyan → Inky Void), accompanied by an altitude-aware HTML5 canvas particle system and interactive desktop mouse-tilt parallax.

---

## 🧭 Waypoint Itinerary & Story

- **Tier 01: The Valley of Dawn (0m)**: Golden dawn sun, misty alpine silhouettes, pine forests, floating pollen fireflies.
- **Tier 02: The Whispering Ridge (3,200m)**: Glaciated snow spires, suspension bridge, levitating crystalline aeroliths, soaring eagle.
- **Tier 03: The Sea of Clouds (9,500m)**: Golden hour sunset, deep cumulus clouds, steam-powered Grand Aerostat dirigible with animated propeller.
- **Tier 04: The Aurora Stratosphere (48,000m - Pinned)**: Curving Earth horizon with night-side city lights, shimmering aurora curtains, satellite array Sol-9, meteor trails.
- **Tier 05: The Celestial Terminus & Stargazer (384,400m)**: Luminescent cratered Moon, spacewalk astronaut, deep space nebula, interactive telemetry terminal, and soundscape synthesizer.

---

## 🚀 Key Features

- **Real-Time Telemetry HUD**: Live tracking of altitude (0m → 384,400km), velocity (km/h), atmospheric tier, and oxygen levels.
- **Celestial Soundscape**: Web Audio API ambient drone and chime synthesizer (100% self-contained code, zero external audio assets).
- **Zero Broken Links**: 100% vector SVG artwork and CSS shapes.
- **Accessibility & Performance**: High contrast WCAG AA/AAA typography, keyboard skip links, ARIA telemetry attributes, and full `@media (prefers-reduced-motion: reduce)` support.

---

## 🛠 Tech Stack

- Semantic HTML5
- Modern CSS3 (CSS Variables, Flexbox, CSS Grid, Glassmorphism)
- Vanilla JavaScript + GSAP 3.12 & ScrollTrigger (via CDN)
- Web Audio API (Synthesized ambient chords & chimes)
- Git & Surge / Vercel / GitHub Pages deployment
