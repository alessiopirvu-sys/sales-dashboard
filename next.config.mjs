/** @type {import('next').NextConfig} */
const nextConfig = {
  // Molte librerie (recharts, zod, il client Supabase, ecc.) pubblicano codice
  // con sintassi recente (?., ??, arrow function) non transpilata. Next.js per
  // default non tocca il codice dentro node_modules, quindi su un motore JS
  // vecchio (es. il browser integrato di alcune Smart TV) quella sintassi causa
  // un errore di parsing che manda in crash l'intera pagina. transpilePackages
  // forza Next a passarle comunque da SWC, seguendo il target del browserslist.
  transpilePackages: [
    "recharts",
    "victory-vendor",
    "react-smooth",
    "recharts-scale",
    "d3-array",
    "d3-color",
    "d3-ease",
    "d3-format",
    "d3-interpolate",
    "d3-path",
    "d3-scale",
    "d3-shape",
    "d3-time",
    "d3-time-format",
    "d3-timer",
    "fast-equals",
    "zod",
    "@supabase/auth-js",
    "@supabase/functions-js",
    "@supabase/postgrest-js",
    "@supabase/realtime-js",
    "@supabase/ssr",
    "@supabase/storage-js",
    "@supabase/supabase-js",
    "@supabase/phoenix",
    "iceberg-js",
    "date-fns",
    "tailwind-merge",
    "cookie",
    "resize-observer-polyfill",
    "@radix-ui/number",
    "@radix-ui/primitive",
    "@radix-ui/react-arrow",
    "@radix-ui/react-collection",
    "@radix-ui/react-compose-refs",
    "@radix-ui/react-context",
    "@radix-ui/react-direction",
    "@radix-ui/react-dismissable-layer",
    "@radix-ui/react-focus-guards",
    "@radix-ui/react-focus-scope",
    "@radix-ui/react-id",
    "@radix-ui/react-popper",
    "@radix-ui/react-portal",
    "@radix-ui/react-primitive",
    "@radix-ui/react-select",
    "@radix-ui/react-slot",
    "@radix-ui/react-use-callback-ref",
    "@radix-ui/react-use-controllable-state",
    "@radix-ui/react-use-effect-event",
    "@radix-ui/react-use-escape-keydown",
    "@radix-ui/react-use-layout-effect",
    "@radix-ui/react-use-previous",
    "@radix-ui/react-use-rect",
    "@radix-ui/react-use-size",
    "@radix-ui/react-visually-hidden",
    "@radix-ui/rect"
  ]
};

export default nextConfig;
