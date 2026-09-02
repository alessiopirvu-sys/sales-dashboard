import ResizeObserverPolyfill from "resize-observer-polyfill";

// recharts (ResponsiveContainer) chiama "new ResizeObserver(...)" senza controllare
// se il browser la supporta. E' un'API del 2018 assente sui motori JS piu' vecchi
// (es. il browser integrato di alcune Smart TV), dove il solo import di recharts fa
// crashare la pagina. Importare questo modulo prima di recharts garantisce che
// window.ResizeObserver esista sempre.
if (typeof window !== "undefined" && typeof window.ResizeObserver === "undefined") {
  window.ResizeObserver = ResizeObserverPolyfill as unknown as typeof ResizeObserver;
}
