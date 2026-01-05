import { defineConfig } from "vite";

// GitHub Pages repo site is served at: https://<owner>.github.io/<repo>/
// So base must be "/<repo>/" for assets to resolve correctly.
export default defineConfig({
    base: "/iseefortune-verifier/"
});