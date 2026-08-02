#!/usr/bin/env node
/* ============================================================
   build-autonome.js — regroupe le jeu en UN seul fichier HTML

   node jeu/build-autonome.js              → jeu/protocole-neon-autonome.html
   node jeu/build-autonome.js --fragment X → variante sans <html>/<head>/<body>
                                             (pour les hébergeurs qui fournissent
                                             eux-mêmes le squelette du document)

   Le fichier produit n'a aucune dépendance : il s'ouvre par un double-clic
   ou se dépose tel quel sur n'importe quel hébergement.
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(ROOT, 'css/style.css'), 'utf8');

/* Ordre de chargement : celui déclaré dans index.html */
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
if (!scripts.length) throw new Error('aucun <script src> trouvé dans index.html');

const js = scripts
  .map(rel => `/* ===== ${rel} ===== */\n` + fs.readFileSync(path.join(ROOT, rel), 'utf8'))
  .join('\n');

/* Corps de la page : tout ce qui est entre <body> et le premier <script src> */
const body = html
  .slice(html.indexOf('<body>') + 6, html.indexOf('<script src='))
  .trim();

/* Certains hébergeurs génèrent eux-mêmes le <head> : on réinjecte alors
   la balise viewport à l'exécution, sinon le jeu s'affiche en 980 px de large. */
const viewportShim = `
(function () {
  if (document.querySelector('meta[name="viewport"]')) return;
  var m = document.createElement('meta');
  m.name = 'viewport';
  m.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';
  document.head.appendChild(m);
})();`;

const fragment = process.argv.includes('--fragment');
const outArg = process.argv[process.argv.indexOf('--fragment') + 1];
const out = fragment
  ? (outArg && !outArg.startsWith('--') ? outArg : path.join(ROOT, 'protocole-neon-fragment.html'))
  : path.join(ROOT, 'protocole-neon-autonome.html');

const page = fragment
  ? `<title>Protocole Néon</title>
<script>${viewportShim}</script>
<style>
${css}
</style>
${body}
<script>
${js}
</script>
`
  : `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<meta name="theme-color" content="#05060f">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<title>Protocole Néon</title>
<style>
${css}
</style>
</head>
<body>
${body}
<script>
${js}
</script>
</body>
</html>
`;

fs.writeFileSync(out, page);
console.log(`${path.relative(process.cwd(), out)} — ${(page.length / 1024).toFixed(0)} Ko, ${scripts.length} scripts regroupés`);
