import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const config = [
  { ignores: [".next/**", "node_modules/**", "public/sw.js", "tests/**"] },
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      // The QR code is a generated data URL, so next/image has nothing to offer.
      "@next/next/no-img-element": "off",
    },
  },
];

export default config;
