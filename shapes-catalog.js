// ============================================================================
// SHARED SHAPE CATALOG — SINGLE SOURCE OF TRUTH
// ============================================================================
// To add/remove/rename a "stuff" model: edit ONLY this file. Do NOT inline new
// entries into any viewer.
//
// Current consumers (all import from /shapes-catalog.js):
//   - public/pieces-of-peace.html   imports STUFF as SHAPES_STUFF
//                                   → buildSHAPELIB(): G('stuff', SHAPES_STUFF)
//   - public/ghostcube.html         imports STUFF as SHAPES_STUFF
//                                   → buildSHAPELIB(): G('stuff', SHAPES_STUFF)
//                                   → setShape() handles def.url via _gltfLoader
//   - public/destinys-child.html    imports STUFF_GLB_ITEMS
//                                   → OBJECT_SECTIONS: { id:'stuff', items:STUFF_GLB_ITEMS }
//
// When wiring a new viewer:
//   - SHAPE_LIBRARY-style ({id,label,url}) → import { STUFF } from '/shapes-catalog.js'
//   - OBJECT_SECTIONS-style ({kind:'glb',label,url}) → import { STUFF_GLB_ITEMS }
//   - The viewer's setShape/replaceCenterObject must handle url via GLTFLoader.
//
// GLB files live at /public/shapes/stuff/*.glb (fetched by tools/download_stuff_models.py).
// ============================================================================

export const STUFF = [
  {id:'st1',  label:'rocks ground',          url:'/shapes/stuff/rocks-ground.glb'},
  {id:'st2',  label:'singing boys',          url:'/shapes/stuff/singing-boys.glb'},
  {id:'st3',  label:'cosmic buddha',         url:'/shapes/stuff/cosmic-buddha.glb'},
  {id:'st4',  label:'washington statue',     url:'/shapes/stuff/george-washington-greenough-statue.glb'},
  {id:'st5',  label:'lady of carmel',        url:'/shapes/stuff/our-lady-of-mount-carmel.glb'},
  {id:'st6',  label:'benicato',              url:'/shapes/stuff/benicato-near-nules-of-castellon-in-spain.glb'},
  {id:'st7',  label:'leech jar',             url:'/shapes/stuff/pharmacy-leech-jar.glb'},
  {id:'st8',  label:'mr t chia box',         url:'/shapes/stuff/mr-t-chia-box.glb'},
  {id:'st9',  label:'tuatara',               url:'/shapes/stuff/sphenodon-tuatara.glb'},
  {id:'st10', label:'old chair',             url:'/shapes/stuff/old-chair-from-england.glb'},
  {id:'st11', label:'eucidaris echinoid',    url:'/shapes/stuff/eucidaris-tribuloides-echinoid.glb'},
  {id:'st12', label:'rocks ground 2',        url:'/shapes/stuff/rocks-ground-2.glb'},
  {id:'st13', label:'heterocentrotus',       url:'/shapes/stuff/heterocentrotus-mamillatus-echinoid.glb'},
  {id:'st14', label:'ritual ewer huo',       url:'/shapes/stuff/lidded-ritual-ewer-huo.glb'},
  {id:'st15', label:'winged monster',        url:'/shapes/stuff/kneeling-winged-monster.glb'},
  {id:'st16', label:'roman dove',            url:'/shapes/stuff/roman-white-dove.glb'},
  {id:'st17', label:'cathedral window',      url:'/shapes/stuff/annaghdown-cathedral-window.glb'},
  {id:'st18', label:'temne mask',            url:'/shapes/stuff/temne-mask.glb'},
  {id:'st19', label:'stela fragment',        url:'/shapes/stuff/stela-fragment.glb'},
  {id:'st20', label:'chinese junk',          url:'/shapes/stuff/chinese-junk-ship.glb'},
  {id:'st21', label:'horse',                 url:'/shapes/stuff/horse.glb'},
  {id:'st22', label:'priory pillars',        url:'/shapes/stuff/annaghdown-priory-pillars.glb'},
  {id:'st23', label:'jomon figurine',        url:'/shapes/stuff/jomon-figurine-dogu.glb'},
  {id:'st24', label:'amenhotep iii head',    url:'/shapes/stuff/head-of-amenhotep-iii.glb'},
  {id:'st25', label:'aryballisk vase',       url:'/shapes/stuff/red-figure-aryballisk-vase.glb'},
  {id:'st26', label:'mercenaria bivalve',    url:'/shapes/stuff/mercenaria-mercenaria-bivalve.glb'},
  {id:'st27', label:'seated guanyin',        url:'/shapes/stuff/seated-bodhisattva-guanyin.glb'},
  {id:'st28', label:'tetradrachm coin',      url:'/shapes/stuff/tetradrachm-of-antigone-doson.glb'},
  {id:'st29', label:'kalong fish vase',      url:'/shapes/stuff/kalong-vase-with-fish.glb'},
  {id:'st30', label:'standing arhat',        url:'/shapes/stuff/standing-arhat.glb'},
  {id:'st31', label:'nasca fish vessel',     url:'/shapes/stuff/nasca-fish-vessel.glb'},
  {id:'st32', label:'male figure statue',    url:'/shapes/stuff/statue-of-male-figure.glb'},
  {id:'st33', label:'phelim o conor tomb',   url:'/shapes/stuff/phelim-o-conor-tomb.glb'},
  {id:'st34', label:'pierre de wissant head',url:'/shapes/stuff/heroic-head-of-pierre-de-wissant.glb'},
  {id:'st35', label:'chilean frog',          url:'/shapes/stuff/chilean-frog.glb'},
  {id:'st36', label:'prajnaparamita',        url:'/shapes/stuff/prajnaparamita.glb'},
  {id:'st37', label:'wade cup script',       url:'/shapes/stuff/wade-cup-with-animated-script.glb'},
  {id:'st38', label:'egyptian basalt head',  url:'/shapes/stuff/egyptian-basalt-head.glb'},
  {id:'st39', label:'medieval wood',         url:'/shapes/stuff/medieval-wood.glb'},
  {id:'st40', label:'gandhara buddha',       url:'/shapes/stuff/gandhara-buddha.glb'},
  {id:'st41', label:'libation cup',          url:'/shapes/stuff/libation-cup.glb'},
  {id:'st42', label:'bodhisattva head',      url:'/shapes/stuff/bodhisattva-head.glb'},
  {id:'st43', label:'imitoceras cephalopod', url:'/shapes/stuff/imitoceras-rotatorium-cephalopod.glb'},
  {id:'st44', label:'sandstone blocks',      url:'/shapes/stuff/large-sandstone-blocks.glb'},
  {id:'st45', label:'nobber tomb slab',      url:'/shapes/stuff/nobber-tomb-slab.glb'},
  {id:'st46', label:'baluster vase',         url:'/shapes/stuff/baluster-vase-from-a-five-piece-garniture.glb'},
  {id:'st47', label:'beaker vase',           url:'/shapes/stuff/beaker-shaped-vase-from-a-five-piece-garniture.glb'},
  {id:'st48', label:'pocket watch',          url:'/shapes/stuff/vintage-pocket-watch.glb'},
  {id:'st49', label:'faroe islands site',    url:'/shapes/stuff/the-site-of-a-sondum-on-faroe-islands.glb'},
  {id:'st50', label:'space shuttle',         url:'/shapes/stuff/orbiter-space-shuttle-ov-103-discovery.glb'},
  {id:'st51', label:'apollo 11 module',      url:'/shapes/stuff/apollo-11-command-module-combined.glb'},
];

// Convenience: destinys-child OBJECT_SECTIONS expects {kind:'glb', label, url}.
export const STUFF_GLB_ITEMS = STUFF.map(s => ({ kind:'glb', label: s.label, url: s.url }));

// ============================================================================
// BRAVE-NEW-WORLD OBJECTS — add entries here, they spawn in the walkable world
// ============================================================================
// Primitive shapes:
//   { type:'sphere',   x, y, z, radius:5,              color:0xff0000, opacity:1.0 }
//   { type:'box',      x, y, z, w:10, h:10, d:10,      color:0x00ff00 }
//   { type:'cylinder', x, y, z, radius:3, height:20,   color:0x0000ff }
//   { type:'torus',    x, y, z, radius:8, tube:1.5,    color:0xffaa00 }
// GLB models (any from STUFF above, or custom path):
//   { type:'glb', x, y, z, scale:1, url:'/shapes/stuff/horse.glb' }

export const WORLD_OBJECTS = [
  // add objects here — they appear immediately on hard-refresh:

];

// ============================================================================
// MULTIVERSE PORTALS — visible from brave-new-world.html as 3D portals
// Free Spirit is last — quantum pair with Merkaba, same coordinate.
// ============================================================================
export const WORLD_PORTALS = [
  { id:'pp',  name:'Pieces of Peace',      url:'/pieces-of-peace.html',             x:600,   y:2400, z:-1800, color:0xffaa44, freq:528 },
  { id:'gc0', name:'Ghost Cube',           url:'/ghostcube.html',                   x:-900,  y:2800, z:-1400, color:0x44ffcc, freq:741 },
  { id:'gc1', name:'GC: Aurora',           url:'/ghostcube.html?world=iridescent',  x:-900,  y:3120, z:-1400, color:0x22eeff, freq:741, clusterOf:'gc' },
  { id:'gc2', name:'GC: Joy Division',     url:'/ghostcube.html?world=cosmos',      x:-580,  y:2960, z:-1400, color:0xff7722, freq:741, clusterOf:'gc' },
  { id:'gc3', name:'GC: Sacred Mandala',   url:'/ghostcube.html?world=sea',         x:-580,  y:2640, z:-1400, color:0xffaa55, freq:741, clusterOf:'gc' },
  { id:'gc4', name:'GC: Cyberpunk',        url:'/ghostcube.html?world=cyber',       x:-900,  y:2480, z:-1400, color:0xcc00ff, freq:741, clusterOf:'gc' },
  { id:'gc5', name:'GC: Hand-Drawn',       url:'/ghostcube.html?world=sketch',      x:-1220, y:2640, z:-1400, color:0xddddcc, freq:741, clusterOf:'gc' },
  { id:'gc6', name:'GC: Endless Fractal',  url:'/ghostcube.html?world=fractal',     x:-1220, y:2960, z:-1400, color:0x8855ff, freq:741, clusterOf:'gc' },
  { id:'fr',  name:'Fractal',              url:'/FRACTAL.html',                     x:1400,  y:900,  z:600,   color:0xff44ff, freq:396 },
  { id:'mk',  name:'Merkaba',              url:'/merkaba.html',                     x:-300,  y:700,  z:-2200, color:0xffdd00, freq:432, isQuantum:true },
  { id:'dc',  name:"Destiny's Child",      url:'/destinys-child.html',              x:-2200, y:80,   z:-1500, color:0xff2244, freq:285 },
  // FREE SPIRIT LAST — quantum superposition partner with Merkaba, same coordinate
  { id:'fs',  name:'Free Spirit',          url:'/freespirit.html',                  x:-300,  y:700,  z:-2200, color:0x00aaff, freq:639, isQuantum:true },
];
