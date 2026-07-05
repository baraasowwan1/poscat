import { createContext, useContext, useEffect, useState } from "react";
import { getSectorConfig, DEFAULT_SECTOR, SECTOR_LIST, type SectorId, type SectorConfig } from "./sectorConfig";

interface SectorContextValue {
  sectorId: SectorId;
  config: SectorConfig;
  setSector: (id: SectorId) => void;
}

const SectorContext = createContext<SectorContextValue>({
  sectorId: DEFAULT_SECTOR,
  config: getSectorConfig(DEFAULT_SECTOR),
  setSector: () => {},
});

const STYLE_TAG_ID = "sector-theme-override";

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

function injectSectorCSS(config: SectorConfig) {
  let tag = document.getElementById(STYLE_TAG_ID) as HTMLStyleElement | null;
  if (!tag) {
    tag = document.createElement("style");
    tag.id = STYLE_TAG_ID;
    document.head.appendChild(tag);
  }
  const t = config.theme;
  const rgb = hexToRgb(t.primary);
  tag.textContent = `
    :root, .dark, .light {
      --primary: ${t.primary} !important;
      --primary-foreground: ${t.primaryFg} !important;
      --accent: ${t.accent} !important;
      --accent-foreground: ${t.accentFg} !important;
      --ring: ${t.ring} !important;
      --sidebar-primary: ${t.primary} !important;
      --sidebar-ring: ${t.ring} !important;
      --sector-sidebar-from: ${t.sidebarFrom};
      --sector-sidebar-to: ${t.sidebarTo};
      --sector-sidebar-border: ${t.sidebarBorder};
      --sector-sidebar-active-text: ${t.sidebarActiveText};
      --sector-sidebar-active-bg: ${t.sidebarActiveBg};
      --sector-top-bar: ${t.topBar};
      /* Subtle background overlay (handled via pseudo-elements, not variable override) */
      --chart-1: ${t.primary} !important;
      --chart-2: ${t.accent} !important;
    }
    /* Sector top accent bar */
    .sector-topbar-accent {
      background: linear-gradient(90deg, ${t.topBar}, ${t.accent});
    }
    /* Glow effect on primary buttons */
    .bg-primary, button[class*="bg-primary"] {
      box-shadow: 0 0 12px rgba(${rgb}, 0.35) !important;
    }
    /* Active nav item glow */
    [data-active-nav="true"] {
      box-shadow: 0 0 10px rgba(${rgb}, 0.25) !important;
    }
  `;
}

export function SectorProvider({ children, initialSector }: {
  children: React.ReactNode;
  initialSector?: string | null;
}) {
  const [sectorId, setSectorId] = useState<SectorId>(() => {
    const id = (initialSector as SectorId) ?? DEFAULT_SECTOR;
    // Inject immediately on first render (avoids flash of default theme)
    injectSectorCSS(getSectorConfig(id));
    return id;
  });

  // Sync when initialSector prop changes (e.g. impersonating a different store)
  useEffect(() => {
    const next = (initialSector as SectorId) ?? DEFAULT_SECTOR;
    if (next !== sectorId) setSectorId(next);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSector]);

  const config = getSectorConfig(sectorId);

  // Re-inject CSS whenever sector changes
  useEffect(() => {
    injectSectorCSS(config);
    return () => {
      const tag = document.getElementById(STYLE_TAG_ID);
      if (tag) tag.textContent = "";
    };
  }, [sectorId, config]);

  function setSector(id: SectorId) {
    setSectorId(id);
    try { localStorage.setItem("pos_sector", id); } catch {}
  }

  return (
    <SectorContext.Provider value={{ sectorId, config, setSector }}>
      {children}
    </SectorContext.Provider>
  );
}

export function useSector(): SectorContextValue {
  return useContext(SectorContext);
}

// Hook shortcut to get just labels
export function useSectorLabels() {
  return useContext(SectorContext).config.labels;
}

// Hook shortcut to get sector theme
export function useSectorTheme() {
  return useContext(SectorContext).config.theme;
}

// Sector badge — small pill shown in sidebar
export function SectorBadge({ collapsed }: { collapsed?: boolean }) {
  const { config } = useSector();
  if (collapsed) {
    return (
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center text-base mx-auto cursor-default"
        style={{ background: config.theme.sidebarActiveBg, border: `1px solid ${config.theme.sidebarBorder}` }}
        title={config.nameAr}
      >
        {config.emoji}
      </div>
    );
  }
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold cursor-default"
      style={{
        background: config.theme.sidebarActiveBg,
        border: `1px solid ${config.theme.sidebarBorder}`,
        color: config.theme.sidebarActiveText,
      }}
    >
      <span className="text-sm">{config.emoji}</span>
      <span>{config.nameAr}</span>
    </div>
  );
}

// Sector selector dropdown — used in settings
export function SectorSelector({ value, onChange }: {
  value: SectorId;
  onChange: (id: SectorId) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {SECTOR_LIST.map((s: SectorConfig) => (
        <button
          key={s.id}
          onClick={() => onChange(s.id as SectorId)}
          className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-xs font-bold transition-all"
          style={value === s.id ? {
            background: s.theme.sidebarActiveBg,
            border: `2px solid ${s.theme.primary}`,
            color: s.theme.sidebarActiveText,
          } : {
            background: "transparent",
            border: "1px solid rgba(148,163,184,0.1)",
            color: "rgba(148,163,184,0.7)",
          }}
        >
          <span className="text-2xl">{s.emoji}</span>
          <span>{s.nameAr}</span>
        </button>
      ))}
    </div>
  );
}
