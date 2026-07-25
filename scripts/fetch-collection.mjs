// Builds the big art collection: curated artists (Renaissance → early modern, all with
// public-domain works at the Met), up to 12 works each via the Met Open Access API.
// Writes images to public/art/coll/ (640px jpeg) + metadata to src/modules/art/collection.json.
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { execSync } from 'child_process';
const OUT = '/Users/simonfelixwalenski/Desktop/DailyLearning/public/art/coll';
const META = '/Users/simonfelixwalenski/Desktop/DailyLearning/src/modules/art/collection.json';
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// [search name, match token, movement]
const ARTISTS = [
  ['Albrecht Dürer','dürer','Northern Renaissance'], ['Lucas Cranach','cranach','Northern Renaissance'],
  ['Hans Holbein','holbein','Northern Renaissance'], ['Pieter Bruegel','bruegel','Northern Renaissance'],
  ['Hans Memling','memling','Northern Renaissance'],
  ['Titian','titian','Venetian Renaissance'], ['Tintoretto','tintoretto','Venetian Renaissance'],
  ['Veronese','veronese','Venetian Renaissance'], ['Bronzino','bronzino','Mannerism'],
  ['El Greco','greco','Mannerism'],
  ['Caravaggio','caravaggio','Baroque'], ['Peter Paul Rubens','rubens','Baroque'],
  ['Anthony van Dyck','dyck','Baroque'], ['Diego Velázquez','velázquez','Baroque'],
  ['Jusepe de Ribera','ribera','Baroque'], ['Bartolomé Murillo','murillo','Baroque'],
  ['Nicolas Poussin','poussin','Baroque'], ['Claude Lorrain','lorrain','Baroque'],
  ['Georges de La Tour','la tour','Baroque'],
  ['Rembrandt van Rijn','rembrandt','Dutch Golden Age'], ['Frans Hals','hals','Dutch Golden Age'],
  ['Johannes Vermeer','vermeer','Dutch Golden Age'], ['Jan Steen','steen','Dutch Golden Age'],
  ['Jacob van Ruisdael','ruisdael','Dutch Golden Age'], ['Pieter de Hooch','hooch','Dutch Golden Age'],
  ['Meindert Hobbema','hobbema','Dutch Golden Age'],
  ['Giovanni Battista Tiepolo','tiepolo','Rococo & the 18th century'], ['Canaletto','canaletto','Rococo & the 18th century'],
  ['Francesco Guardi','guardi','Rococo & the 18th century'], ['Jean Siméon Chardin','chardin','Rococo & the 18th century'],
  ['François Boucher','boucher','Rococo & the 18th century'], ['Jean Honoré Fragonard','fragonard','Rococo & the 18th century'],
  ['Antoine Watteau','watteau','Rococo & the 18th century'], ['Thomas Gainsborough','gainsborough','Rococo & the 18th century'],
  ['Joshua Reynolds','reynolds','Rococo & the 18th century'],
  ['Jacques Louis David','david','Neoclassicism & Romanticism'], ['Ingres','ingres','Neoclassicism & Romanticism'],
  ['Goya','goya','Neoclassicism & Romanticism'], ['Eugène Delacroix','delacroix','Neoclassicism & Romanticism'],
  ['Caspar David Friedrich','friedrich','Neoclassicism & Romanticism'], ['J. M. W. Turner','turner','Neoclassicism & Romanticism'],
  ['John Constable','constable','Neoclassicism & Romanticism'],
  ['Camille Corot','corot','Realism & the 19th century'], ['Gustave Courbet','courbet','Realism & the 19th century'],
  ['Jean-François Millet','millet','Realism & the 19th century'], ['Honoré Daumier','daumier','Realism & the 19th century'],
  ['Winslow Homer','homer','Realism & the 19th century'], ['Thomas Eakins','eakins','Realism & the 19th century'],
  ['Frederic Edwin Church','church','Realism & the 19th century'], ['Thomas Cole','cole','Realism & the 19th century'],
  ['Albert Bierstadt','bierstadt','Realism & the 19th century'], ['John Singer Sargent','sargent','Realism & the 19th century'],
  ['Édouard Manet','manet','Impressionism'], ['Edgar Degas','degas','Impressionism'],
  ['Auguste Renoir','renoir','Impressionism'], ['Camille Pissarro','pissarro','Impressionism'],
  ['Alfred Sisley','sisley','Impressionism'],
  ['Paul Cézanne','cézanne','Post-Impressionism & Symbolism'], ['Vincent van Gogh','gogh','Post-Impressionism & Symbolism'],
  ['Paul Gauguin','gauguin','Post-Impressionism & Symbolism'], ['Georges Seurat','seurat','Post-Impressionism & Symbolism'],
  ['Toulouse-Lautrec','lautrec','Post-Impressionism & Symbolism'], ['Odilon Redon','redon','Post-Impressionism & Symbolism'],
  ['Henri Rousseau','rousseau','Post-Impressionism & Symbolism'], ['Gustav Klimt','klimt','Post-Impressionism & Symbolism'],
  ['Ferdinand Hodler','hodler','Post-Impressionism & Symbolism'],
  ['Katsushika Hokusai','hokusai','Japan — Ukiyo-e'], ['Utagawa Hiroshige','hiroshige','Japan — Ukiyo-e'],
  ['Kitagawa Utamaro','utamaro','Japan — Ukiyo-e'],
];
const PER_ARTIST = 12, SCAN_CAP = 28;
const works = [];
let req = 0;
async function get(url) {
  req++;
  const r = await fetch(url);
  if (r.status === 403) { console.log('RATE LIMITED at req', req, '— backing off 60s'); await sleep(60000); return get(url); }
  return r;
}
for (const [query, token, movement] of ARTISTS) {
  try {
    const s = await get(`https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true&artistOrCulture=true&q=${encodeURIComponent(query)}`);
    if (!s.ok) { console.log(query, 'search HTTP', s.status); continue; }
    const ids = ((await s.json()).objectIDs || []).slice(0, SCAN_CAP);
    let kept = 0;
    for (const id of ids) {
      if (kept >= PER_ARTIST) break;
      await sleep(300);
      try {
        const r = await get(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`);
        if (!r.ok) continue;
        const o = await r.json();
        if (!o.isPublicDomain || !o.primaryImageSmall) continue;
        if (!(o.artistDisplayName || '').toLowerCase().includes(token)) continue;
        if (/photograph/i.test(o.classification || '')) continue;
        const dest = `${OUT}/${id}.jpg`;
        if (!existsSync(dest)) {
          const img = await fetch(o.primaryImageSmall);
          if (!img.ok) continue;
          writeFileSync(dest, Buffer.from(await img.arrayBuffer()));
          try { execSync(`sips -Z 640 -s format jpeg -s formatOptions 65 "${dest}" >/dev/null 2>&1`); } catch {}
        }
        works.push({ id, artist: o.artistDisplayName, title: (o.title || 'Untitled').slice(0, 120), date: o.objectDate || '', movement });
        kept++;
      } catch (e) { console.log(id, 'ERR', e.message); }
    }
    console.log(query, '→', kept);
    writeFileSync(META, JSON.stringify(works));
    await sleep(400);
  } catch (e) { console.log(query, 'ERR', e.message); }
}
writeFileSync(META, JSON.stringify(works));
console.log('DONE — total works:', works.length, '| requests:', req);
try { console.log(execSync(`du -sh ${OUT}`).toString().trim()); } catch {}
