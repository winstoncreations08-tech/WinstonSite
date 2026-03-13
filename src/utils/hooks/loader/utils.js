import { mango } from './of.js';
import whitelist from '/src/data/whitelist.json';
import appsData from '/src/data/apps.json';

const check = (inp, engine) => {
  const trimmed = inp.trim();
  if (!trimmed) return '';

  const isUrl =
    /^https?:\/\//i.test(trimmed) ||
    /^[\w-]+\.[\w.-]+/i.test(trimmed) ||
    trimmed.startsWith('localhost');

  if (isUrl) {
    return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
  } else {
    return engine + encodeURIComponent(trimmed);
  }
};

const scrwlist = new Set([
  ...whitelist,
  ...Object.values(appsData.games || {}).flatMap(cat => 
    cat.filter(g => g.url && !g.local).map(g => {
      try { return new URL(g.url.startsWith('http') ? g.url : `https://${g.url}`).hostname.replace(/^www\./, ''); }
      catch { return null; }
    }).filter(Boolean)
  )
]);

const scrblist = new Set([
  'youtube.com',
  'youtu.be',
  'm.youtube.com'
]);

export const process = (input, decode = false, prType, engine = "https://www.google.com/search?q=") => {
  const upwefix = isStaticBuild 
    ? new URL('./portal/k12/', location.href).pathname
    : '/portal/k12/';
  const eggowaffle = isStaticBuild
    ? new URL('./ham/', location.href).pathname
    : '/ham/';
  
  let prefix;

  switch (prType) {
    case 'uv':
      prefix = upwefix;
      break;
    case 'scr':
      prefix = eggowaffle;
      break;
    default:
      const url = check(input, engine);
      const isBlacklisted = [...scrblist].some(d => url.includes(d));
      const match = [...scrwlist].some(d => url.includes(d));
      prefix = (!isBlacklisted && match) ? eggowaffle : upwefix;
  }

  if (decode) {
    const uvPart = input.split(upwefix)[1];
    const scrPart = input.split(eggowaffle)[1];
    const decoded = uvPart ? mango.dnc(uvPart) : scrPart ? mango.dnc(scrPart) : input;
    return decoded.endsWith('/') ? decoded.slice(0, -1) : decoded;
  } else {
    let final = check(input, engine);
    if (!final || final.trim() === '') {
      return null;
    }
    
    // Rewrite youtube links to an Invidious frontend to prevent proxy rendering blocks
    try {
      const parsed = new URL(final);
      if (parsed.hostname === 'youtube.com' || parsed.hostname === 'www.youtube.com' || parsed.hostname === 'm.youtube.com' || parsed.hostname === 'youtu.be') {
          if (parsed.pathname === '/watch' && parsed.searchParams.has('v')) {
              final = `https://inv.nadeko.net/watch?v=${parsed.searchParams.get('v')}`;
          } else if (parsed.pathname !== '/') {
              final = `https://inv.nadeko.net${parsed.pathname}${parsed.search}`;
          } else {
              final = 'https://inv.nadeko.net/';
          }
      }
    } catch(e) { /* ignore invalid urls */ }

    const encoded = prefix === eggowaffle ? mango.enc(final) : mango.enc(final);
    return `${location.protocol}//${location.host}${prefix}${encoded}`;
  }
};

export function openEmbed(url) {
  var win = window.open();
  win.document.body.style.margin = "0";
  win.document.body.style.height = "100vh";
  var iframe = win.document.createElement("iframe");
  iframe.style.border = "none";
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.margin = "0";
  iframe.src = url;
  win.document.body.appendChild(iframe);
}