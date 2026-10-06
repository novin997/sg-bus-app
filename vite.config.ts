import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
// PAGES_BASE is set by the GitHub Pages workflow; Cloudflare deploys serve from the root.
const pagesBase = process.env.PAGES_BASE

export default defineConfig({
  base: pagesBase ?? '/',
  plugins: pagesBase ? [react()] : [react(), cloudflare()],
})
