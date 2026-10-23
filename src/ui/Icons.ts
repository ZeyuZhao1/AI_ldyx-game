/**
 * Tactical Vector Icons for Aerospace & Defense Systems
 * Replaces all platform-dependent emoji glyphs with crisp, scalable SVGs
 */

export const ICONS = {
  // Rocket / Missile Vector
  rocket: (cls = 'vec-icon') => `
    <svg viewBox="0 0 24 24" class="${cls}" fill="currentColor" aria-hidden="true">
      <path d="M12 2.5C9.5 5 8 9 8 13.5l-3 3v2l4-1 2 2h2l2-2 4 1v-2l-3-3C16 9 14.5 5 12 2.5zm0 9a2 2 0 110-4 2 2 0 010 4z"/>
    </svg>
  `,

  // Radiation / Atomic Warhead Symbol
  atomic: (cls = 'vec-icon') => `
    <svg viewBox="0 0 24 24" class="${cls}" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="12" r="2.5"/>
      <path d="M12 2a10 10 0 00-5 1.34l2.5 4.33A5 5 0 0112 7V2zm-7.66 4.66A10 10 0 003 12h5a5 5 0 011.34-3.66L4.34 6.66zM12 17a5 5 0 01-4.34-2.5L2.66 17.34A10 10 0 0012 22v-5zm4.66-2.5A5 5 0 0112 17v5a10 10 0 009.34-4.66l-4.68-2.84zm0-5A5 5 0 0116 12h5a10 10 0 00-1.34-5.34l-3 2.84zM12 7a5 5 0 012.5.68l2.5-4.34A10 10 0 0012 2v5z"/>
    </svg>
  `,

  // Thermonuclear / Hydrogen Atom Fusion
  hydro: (cls = 'vec-icon') => `
    <svg viewBox="0 0 24 24" class="${cls}" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="12" r="2.8"/>
      <ellipse cx="12" cy="12" rx="10" ry="3.8" fill="none" stroke="currentColor" stroke-width="1.8" transform="rotate(30 12 12)"/>
      <ellipse cx="12" cy="12" rx="10" ry="3.8" fill="none" stroke="currentColor" stroke-width="1.8" transform="rotate(-30 12 12)"/>
      <ellipse cx="12" cy="12" rx="10" ry="3.8" fill="none" stroke="currentColor" stroke-width="1.8" transform="rotate(90 12 12)"/>
    </svg>
  `,

  // Bunker Buster Drill
  bunker: (cls = 'vec-icon') => `
    <svg viewBox="0 0 24 24" class="${cls}" fill="currentColor" aria-hidden="true">
      <path d="M12 1.5L8 7h3v6h-3l4 6 4-6h-3V7h3l-4-5.5zM7 21h10v2H7v-2z"/>
    </svg>
  `,

  // Deployable Canister / Crate
  deploy: (cls = 'vec-icon') => `
    <svg viewBox="0 0 24 24" class="${cls}" fill="currentColor" aria-hidden="true">
      <path d="M12 2L3 6.5V17.5L12 22L21 17.5V6.5L12 2zM12 4.3L18.4 7.5L12 10.7L5.6 7.5L12 4.3zm-7 4.9L11 12.2V19.3L5 16.3V9.2zm14 7.1L13 19.3V12.2L19 9.2V16.3z"/>
    </svg>
  `,

  // Detonate / High-Yield Blast
  detonate: (cls = 'vec-icon') => `
    <svg viewBox="0 0 24 24" class="${cls}" fill="currentColor" aria-hidden="true">
      <path d="M12 2l1.8 4.6L18 5l-2.2 4.4L20 12l-4.2 2.6L18 19l-4.2-1.6L12 22l-1.8-4.6L6 19l2.2-4.4L4 12l4.2-2.6L6 5l4.2 1.6L12 2z"/>
    </svg>
  `,

  // Submarine / Naval Anchor
  submarine: (cls = 'vec-icon') => `
    <svg viewBox="0 0 24 24" class="${cls}" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="5" r="2.5" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M11 7.5h2v11h-2z"/>
      <path d="M4 14c0 4.4 3.6 8 8 8s8-3.6 8-8h-2.5c0 3-2.5 5.5-5.5 5.5s-5.5-2.5-5.5-5.5H4z"/>
      <path d="M6 10h12v2H6z"/>
    </svg>
  `,

  // Qian Xuesen Aerodynamic Glide
  glide: (cls = 'vec-icon') => `
    <svg viewBox="0 0 24 24" class="${cls}" fill="currentColor" aria-hidden="true">
      <path d="M2.5 16c4.5-5.5 10-7.5 18-5.5l-4-3.5L21.5 5l-5 5.5 4 1.5c-7 0-12 2.5-17 9z"/>
      <path d="M11 16c2.5-1.5 5-2 8-1.5l-2-2c-3-.5-5 0-7 1.5l1 2z" opacity="0.6"/>
    </svg>
  `,

  // Stage 2 Rocket Ignition Flame
  flame: (cls = 'vec-icon') => `
    <svg viewBox="0 0 24 24" class="${cls}" fill="currentColor" aria-hidden="true">
      <path d="M12 2C9.5 5.5 8 9 9 12c-1.5-1-2.5-2.5-2.5-4.5C4.5 9.5 4 12 4 14c0 4.4 3.6 8 8 8s8-3.6 8-8c0-4-3-8-8-12zm0 17c-2.2 0-4-1.8-4-4 0-1.8 1.5-3.5 3-4.5.5 1.5 1.8 2.5 3.5 2.5 1.2 0 1.5-1 1.5-1 0 3.9-1.8 7-4 7z"/>
    </svg>
  `,

  // Lock / Classified Security
  lock: (cls = 'vec-icon') => `
    <svg viewBox="0 0 24 24" class="${cls}" fill="currentColor" aria-hidden="true">
      <path d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2H5v13h14V9h-2zm-8-2c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9V7zm4 8.7V18h-2v-2.3c-.6-.4-1-1-1-1.7 0-1.1.9-2 2-2s2 .9 2 2c0 .7-.4 1.3-1 1.7z"/>
    </svg>
  `,

  // Five-Pointed Star
  star: (cls = 'vec-icon') => `
    <svg viewBox="0 0 24 24" class="${cls}" fill="currentColor" aria-hidden="true">
      <path d="M12 2.5l2.9 6.2 6.8.8-5 4.7 1.3 6.7L12 17.5 6 20.9l1.3-6.7-5-4.7 6.8-.8L12 2.5z"/>
    </svg>
  `,

  // Chronicle / Historical Scroll
  chronicle: (cls = 'vec-icon') => `
    <svg viewBox="0 0 24 24" class="${cls}" fill="currentColor" aria-hidden="true">
      <path d="M19 3H7c-1.7 0-3 1.3-3 3v12c0 1.7 1.3 3 3 3h12c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-12 2h12v11H7c-.6 0-1 .4-1 1s.4 1 1 1h12v1H7c-1.1 0-2-.9-2-2V6c0-.6.4-1 1-1zm2 3h8v2H9V8zm0 4h8v2H9v-2z"/>
    </svg>
  `,

  // Presentation / Strategy Board
  presentation: (cls = 'vec-icon') => `
    <svg viewBox="0 0 24 24" class="${cls}" fill="currentColor" aria-hidden="true">
      <path d="M21 3H3c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h7l-2 3v1h8v-1l-2-3h7c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 13H3V5h18v11zM6 7h12v2H6V7zm0 3h8v2H6v-2z"/>
    </svg>
  `,

  // Settings Cog
  settings: (cls = 'vec-icon') => `
    <svg viewBox="0 0 24 24" class="${cls}" fill="currentColor" aria-hidden="true">
      <path d="M19.4 13c.1-.3.1-.7.1-1s0-.7-.1-1l2.1-1.6c.2-.2.2-.4.1-.6l-2-3.5c-.1-.2-.4-.3-.6-.2l-2.5 1c-.5-.4-1.1-.7-1.7-1l-.4-2.6c0-.2-.3-.5-.5-.5h-4c-.3 0-.5.2-.5.5l-.4 2.6c-.6.3-1.2.6-1.7 1l-2.5-1c-.2-.1-.5 0-.6.2l-2 3.5c-.1.2-.1.5.1.6l2.1 1.6c-.1.3-.1.7-.1 1s0 .7.1 1l-2.1 1.6c-.2.2-.2.4-.1.6l2 3.5c.1.2.4.3.6.2l2.5-1c.5.4 1.1.7 1.7 1l.4 2.6c0 .2.3.5.5.5h4c.3 0 .5-.2.5-.5l.4-2.6c.6-.3 1.2-.6 1.7-1l2.5 1c.2.1.5 0 .6-.2l2-3.5c.1-.2.1-.5-.1-.6L19.4 13zM12 15.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5z"/>
    </svg>
  `,

  // Endless Infinity Symbol
  infinity: (cls = 'vec-icon') => `
    <svg viewBox="0 0 24 24" class="${cls}" fill="currentColor" aria-hidden="true">
      <path d="M18.6 6.5c-1.8 0-3.3.9-4.3 2.3-.6-.8-1.5-1.5-2.3-2-.7-.4-1.5-.6-2.3-.6-2.6 0-4.7 2.1-4.7 4.7s2.1 4.7 4.7 4.7c1.7 0 3.2-.9 4.2-2.3.6.8 1.5 1.5 2.3 2 .7.4 1.5.6 2.4.6 2.6 0 4.7-2.1 4.7-4.7s-2.1-4.7-4.7-4.7zm-8.9 7.1c-1.4 0-2.5-1.1-2.5-2.5s1.1-2.5 2.5-2.5c1.1 0 2.1.7 2.4 1.7l.1.8-.1.8c-.3 1-1.3 1.7-2.4 1.7zm8.9 0c-1.1 0-2.1-.7-2.4-1.7l-.1-.8.1-.8c.3-1 1.3-1.7 2.4-1.7 1.4 0 2.5 1.1 2.5 2.5s-1.1 2.5-2.5 2.5z"/>
    </svg>
  `,

  // Radar Guidance Dish
  radar: (cls = 'vec-icon') => `
    <svg viewBox="0 0 24 24" class="${cls}" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm0-14c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm0 10c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4zm-1-5h2v2h-2zm0-4h2v2h-2z"/>
    </svg>
  `,

  // Protective Shield
  shield: (cls = 'vec-icon') => `
    <svg viewBox="0 0 24 24" class="${cls}" fill="currentColor" aria-hidden="true">
      <path d="M12 2L4 5v6.1c0 5.6 3.4 10.8 8 12.1 4.6-1.3 8-6.5 8-12.1V5l-8-3zm0 2.2l6 2.2v5.7c0 4.5-2.7 8.7-6 9.8-3.3-1.1-6-5.3-6-9.8V6.4l6-2.2z"/>
    </svg>
  `,

  // Crosshair Target
  target: (cls = 'vec-icon') => `
    <svg viewBox="0 0 24 24" class="${cls}" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 2c4.4 0 8 3.6 8 8 0 3.9-2.8 7.1-6.5 7.8V17h-3v2.8C6.8 19.1 4 15.9 4 12c0-4.4 3.6-8 8-8zm-1 5v2H9v2h2v2h2v-2h2v-2h-2V9h-2zm1 3c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1z"/>
    </svg>
  `,

  // Orbit Satellite
  satellite: (cls = 'vec-icon') => `
    <svg viewBox="0 0 24 24" class="${cls}" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="12" r="3.5"/>
      <path d="M5 10H2v4h3v-4zm17 0h-3v4h3v-4zM10 5V2h4v3h-4zm0 17v-3h4v3h-4z"/>
      <path d="M4 4l3.5 3.5m9 9L20 20M20 4l-3.5 3.5m-9 9L4 20" stroke="currentColor" stroke-width="1.8"/>
    </svg>
  `,
};
