// Web bilan bir xil brand palette (web/src/index.css :root)
// brand: #0A5C45, brand-lt: #12A87D, green-bright: #22c55e
export const light = {
  bg:         "#f0f7f4",  // --bg-page
  bgCard:     "#ffffff",  // --bg-card
  bgMuted:    "#f5faf7",  // --bg-muted
  bgSurface:  "#e8f4ef",  // --bg-surface
  border:     "rgba(10, 92, 69, 0.14)", // --bd
  primary:    "#0A5C45",  // --brand
  primaryDark:"#083d2e",
  accent:     "#12A87D",  // --brand-lt
  accentBright:"#22c55e", // --green-bright
  gold:       "#d4a853",  // --gold (CTA accents)
  text:       "#0D1F18",  // --tx-1
  textSub:    "rgba(13, 31, 24, 0.65)",  // --tx-2
  textMuted:  "rgba(13, 31, 24, 0.38)",  // --tx-3
  danger:     "#D62828",
  warn:       "#D97706",
  tabBar:     "#ffffff",
  tabBorder:  "rgba(10, 92, 69, 0.14)",
  success:    "#22c55e",
};

export const dark = {
  bg:         "#0a1f12",  // --bg-page dark
  bgCard:     "#112920",  // --bg-card dark
  bgMuted:    "#091a0f",  // --bg-muted dark
  bgSurface:  "#0d2418",  // --bg-surface dark
  border:     "rgba(255, 255, 255, 0.08)", // --bd dark
  primary:    "#12A87D",  // --brand dark
  primaryDark:"#0A5C45",
  accent:     "#22c55e",  // --green-bright
  accentBright:"#54BC5A",
  gold:       "#d4a853",
  text:       "#f0f7f2",  // --tx-1 dark
  textSub:    "rgba(240, 247, 242, 0.6)",  // --tx-2 dark
  textMuted:  "rgba(240, 247, 242, 0.35)", // --tx-3 dark
  danger:     "#EF6060",
  warn:       "#F5A623",
  tabBar:     "#0a1f12",
  tabBorder:  "rgba(255, 255, 255, 0.08)",
  success:    "#22c55e",
};

export type Theme = typeof light;
