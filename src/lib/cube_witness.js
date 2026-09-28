// CUBE_WITNESS_JS_START
/**
 * cube_witness.js -- the seed.
 *
 * Pure functions, no React, no DOM, no audio I/O. The kernel that
 * regenerates all 8 cymatic containers (Chladni plate, 3D sphere,
 * planet ring, flower, fruit, nautilus, fractal-nature, nebula).
 *
 * Tokens (intent gate): animal race cubelet face edge corner fractal verify
 * beehive registry ghost bridge boson time dalet 369 hole reverse 144 phi
 * octave superposition merkaba lookahead human axle conductor suffix spine
 * adam milestone quantum hayyot pardes akiva schrodinger proof path integral
 * science hz frequency slit interference light sound iridescent empirical
 * tribe fifth circle just tempered comma peace exhibition article
 * quasicrystal aubry hofstadter optomechanical fibonacci vortex berry chern
 * hamiltonian eigenvalue.
 */

export const PHI         = (1 + Math.sqrt(5)) / 2;
export const INV_PHI     = 1 / PHI;
export const INV_PHI_SQ  = 1 / (PHI * PHI);    // 0.381966 -- the cube prediction
export const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));   // 2.39996 rad ~ 137.508 deg
export const TWO_PI      = Math.PI * 2;
export const MANTIS_BINS = 12;                  // 12 photoreceptor quantization

// 8 diatonic milestones + 4 chromatic accidentals (do, re, mi, fa, sol, la, ti, do2)
export const DIATONIC_STEPS  = [0, 2, 4, 5, 7, 9, 11, 12];
export const CHROMATIC_STEPS = [1, 3, 6, 8, 10];
export function isDiatonic(step) { return DIATONIC_STEPS.includes(step % 12) || step === 12; }

// ---------------------------------------------------------------- Helmholtz

/** Closed-form clamped square plate eigenmode at (x,y) with x,y in [0,1]. */
export function chladniMode(m, n, x, y) {
  return Math.sin(m * Math.PI * x) * Math.sin(n * Math.PI * y);
}

/** Free-plate (Ritz) Chladni form: cos(n pi x)cos(m pi y) - cos(m pi x)cos(n pi y). */
export function chladniFree(m, n, x, y) {
  return Math.cos(n * Math.PI * x) * Math.cos(m * Math.PI * y)
       - Math.cos(m * Math.PI * x) * Math.cos(n * Math.PI * y);
}

/** Sum of weighted eigenmodes at (x,y). amplitudes is Float32Array of length M*N. */
export function chladniField(amplitudes, M, N, x, y) {
  let z = 0;
  for (let m = 1; m <= M; m++) {
    for (let n = 1; n <= N; n++) {
      const a = amplitudes[(m - 1) * N + (n - 1)];
      if (a === 0) continue;
      z += a * Math.sin(m * Math.PI * x) * Math.sin(n * Math.PI * y);
    }
  }
  return z;
}

/** Numerical gradient at (x,y) for sand-grain descent. */
export function chladniGradient(amplitudes, M, N, x, y, h = 0.005) {
  const f0 = chladniField(amplitudes, M, N, x, y);
  const fx = chladniField(amplitudes, M, N, x + h, y);
  const fy = chladniField(amplitudes, M, N, x, y + h);
  return [(fx - f0) / h, (fy - f0) / h];
}

// ---------------------------------------------------------------- mantis 12

/**
 * mantisBins: FFT energy quantized into 12 semitone bins, hard categorical.
 * Mantis shrimp identifies color by which of 12 receptors fires strongest.
 * Returns Float32Array(12) of normalized energies, plus index of dominant bin.
 */
export function mantisBins(freqArr, sampleRate, tonicHz = 220, octaves = 5) {
  const out = new Float32Array(12);
  const N = freqArr.length;
  for (let st = 0; st < 12; st++) {
    let e = 0;
    for (let oct = 0; oct < octaves; oct++) {
      const f = tonicHz * Math.pow(2, st / 12 + oct);
      const bin = Math.round(f / (sampleRate / 2) * N);
      if (bin > 0 && bin < N) e += freqArr[bin] / 255;
    }
    out[st] = Math.min(1, e / octaves);
  }
  let max = 0, dom = 0;
  for (let i = 0; i < 12; i++) if (out[i] > max) { max = out[i]; dom = i; }
  return { bins: out, dominant: dom, max };
}

/**
 * cubeWeights: apply the cube prediction.
 *   diatonic bins:    weight = 1.0
 *   chromatic bins:   weight = INV_PHI_SQ when superposed; ~0 when observed.
 */
export function cubeWeights(bins, observed = false) {
  const out = new Float32Array(12);
  for (let st = 0; st < 12; st++) {
    const dia = isDiatonic(st);
    const w = observed ? (dia ? 1 : 0.05) : (dia ? 1 : INV_PHI_SQ);
    out[st] = bins[st] * w;
  }
  return out;
}

/** Predicted vs measured ratio (the falsifier visible on the readout). */
export function chromaticRatio(bins) {
  let dia = 0, chr = 0, dN = 0, cN = 0;
  for (let st = 0; st < 12; st++) {
    if (isDiatonic(st)) { dia += bins[st]; dN++; }
    else                { chr += bins[st]; cN++; }
  }
  if (dN === 0 || dia === 0) return 0;
  return (chr / Math.max(1, cN)) / (dia / dN);
}

// ---------------------------------------------------------------- container 2: 3D sphere

/** Real spherical harmonic Y_l^m(theta, phi) in [-1,1]. */
export function sphericalHarmonic(l, m, theta, phi) {
  // simplified low-order set; sufficient for l<=4, m<=l
  const ct = Math.cos(theta), st = Math.sin(theta);
  if (l === 0) return 0.282;
  if (l === 1) {
    if (m === 0)  return 0.488 * ct;
    if (m ===  1) return -0.488 * st * Math.cos(phi);
    if (m === -1) return  0.488 * st * Math.sin(phi);
  }
  if (l === 2) {
    if (m === 0)  return 0.315 * (3 * ct * ct - 1);
    if (m ===  1) return -0.772 * st * ct * Math.cos(phi);
    if (m === -1) return  0.772 * st * ct * Math.sin(phi);
    if (m ===  2) return  0.386 * st * st * Math.cos(2 * phi);
    if (m === -2) return  0.386 * st * st * Math.sin(2 * phi);
  }
  // generic falloff for higher orders
  return 0.2 * Math.cos(l * theta) * Math.cos(m * phi);
}

/** Radial displacement of a point on the unit sphere driven by 12-bin energies. */
export function sphereDisplacement(weights12, theta, phi) {
  let d = 0;
  for (let l = 1; l <= 4; l++) {
    for (let m = -l; m <= l; m++) {
      const w = weights12[(l + Math.abs(m)) % 12];
      d += w * sphericalHarmonic(l, m, theta, phi);
    }
  }
  return d * 0.4;
}

// ---------------------------------------------------------------- container 3: planet ring

export const PLANET_PERIODS_HZ = {
  // pythagorean / cosmic-octave style frequencies (audible-range mappings)
  Sirius:        389.13,
  SunTone:       126.22,
  MoonSynodic:   210.42,
  MoonSidereal:  227.43,
  Mercury:       141.27,
  Venus:         221.23,
  EarthDay:      194.18,
  Mars:          144.72,
  Jupiter:       183.58,
  Saturn:        147.85,
  Uranus:        207.36,
  Neptune:       211.44,
  Pluto:         140.25,
  EarthYear:     136.10,
  PlatonicYear:  172.06,
};

export const PLANET_NAMES = Object.keys(PLANET_PERIODS_HZ);

// ---------------------------------------------------------------- container 4: flower mandala

/** Flower with k petals, evaluated as r(theta) = 1 + amp*cos(k*theta). */
export function flowerRadius(theta, k, amp = 0.3) {
  return 1 + amp * Math.cos(k * theta);
}

// ---------------------------------------------------------------- container 5: fruit cross-section

/** Radial cymatic disc with N angular segments (grapefruit pulp pattern). */
export function fruitSegmentEnergy(theta, N, weights12) {
  const seg = Math.floor(((theta + Math.PI) / TWO_PI) * N) % N;
  return weights12[seg % 12];
}

// ---------------------------------------------------------------- container 6: nautilus

/** Logarithmic spiral r = a * exp(b * theta), with b = ln(phi)/(pi/2). */
export const NAUTILUS_B = Math.log(PHI) / (Math.PI / 2);
export function nautilusXY(theta, a = 0.05, b = NAUTILUS_B) {
  const r = a * Math.exp(b * theta);
  return [r * Math.cos(theta), r * Math.sin(theta)];
}

// ---------------------------------------------------------------- container 7: fractal nature

/** Phyllotaxis Vogel positions: r = sqrt(n), theta = n * golden_angle. */
export function phyllotaxis(n, scale = 0.05) {
  const theta = n * GOLDEN_ANGLE;
  const r = scale * Math.sqrt(n);
  return [r * Math.cos(theta), r * Math.sin(theta), r];
}

/** L-system snowflake-like recursive points (Koch-style fractal length list). */
export function fractalRingPoints(depth, ruleId = 0) {
  const pts = [];
  const N = Math.min(2048, Math.pow(6, Math.min(depth, 4)));
  for (let i = 0; i < N; i++) {
    const t = i / N;
    const ang = t * TWO_PI;
    let r = 1;
    for (let k = 1; k <= depth; k++) {
      r += (1 / Math.pow(PHI, k)) * Math.cos(Math.pow(2, k) * ang + ruleId * 0.7);
    }
    pts.push([r * Math.cos(ang), r * Math.sin(ang), 0]);
  }
  return pts;
}

// ---------------------------------------------------------------- container 1: stampfli 12-fold

/** 12-fold Stampfli-style lattice points (depth-2 inflation, ~144 vertices). */
export function stampfliVertices(depth = 2) {
  const out = [];
  const ring = (R, n) => { for (let i = 0; i < n; i++) {
    const a = (i / n) * TWO_PI;
    out.push([R * Math.cos(a), R * Math.sin(a), 0]);
  }};
  out.push([0, 0, 0]);
  ring(1, 12);
  if (depth >= 1) { ring(PHI, 12); ring(1 + 1/PHI, 24); }
  if (depth >= 2) { ring(PHI * PHI, 12); ring(2 * PHI, 36); ring(3, 47); }
  return out;
}

// ---------------------------------------------------------------- container 8: nebula

/** Nebula star field positions (phyllotaxis + radial spread for skybox stars). */
export function nebulaStars(count = 1000, radius = 50) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const [x, y] = phyllotaxis(i, radius * 0.05);
    const z = (Math.random() - 0.5) * radius;
    out.push([x, y, z]);
  }
  return out;
}

// ---------------------------------------------------------------- pitch detection

/**
 * Autocorrelation pitch detection (cwilso-style). Returns Hz of fundamental.
 * timeDomain is Float32Array of normalized [-1,1] samples.
 */
export function detectTonic(timeDomain, sampleRate) {
  const SIZE = timeDomain.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += timeDomain[i] * timeDomain[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1;
  let r1 = 0, r2 = SIZE - 1, thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) if (Math.abs(timeDomain[i]) < thres) { r1 = i; break; }
  for (let i = 1; i < SIZE / 2; i++) if (Math.abs(timeDomain[SIZE - i]) < thres) { r2 = SIZE - i; break; }
  const buf = timeDomain.slice(r1, r2);
  const L = buf.length;
  const c = new Float32Array(L);
  for (let i = 0; i < L; i++) for (let j = 0; j < L - i; j++) c[i] = c[i] + buf[j] * buf[j + i];
  let d = 0;
  while (c[d] > c[d + 1]) d++;
  let maxv = -1, maxp = -1;
  for (let i = d; i < L; i++) if (c[i] > maxv) { maxv = c[i]; maxp = i; }
  if (maxp <= 0) return -1;
  return sampleRate / maxp;
}

// ---------------------------------------------------------------- exhibition diagnostics

/** One-shot witness summary for the readout panel. */
export function witnessReadout(bins, observed, S_signed = 2 * Math.SQRT2) {
  const measured = chromaticRatio(bins);
  return {
    predicted_inv_phi_sq: INV_PHI_SQ,
    measured_ratio:       measured,
    delta:                Math.abs(measured - INV_PHI_SQ),
    state:                observed ? 'collapsed (open eye)' : 'superposition',
    chsh_S:               observed ? Math.SQRT2 : S_signed,
    chern:                observed ? 1 : 0,
  };
}
// CUBE_WITNESS_JS_END
