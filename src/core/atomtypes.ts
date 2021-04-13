export interface Color {
  r: number
  g: number
  b: number
}

export interface AtomType {
  fullname: string
  shortname: string
  radius: number
  color: Color
}

const colors: Color[] = [
  { r: 255, g: 102, b: 102 },
  { r: 102, g: 102, b: 255 },
  { r: 255, g: 255, b: 0 },
  { r: 255, g: 102, b: 255 },
  { r: 102, g: 255, b: 51 },
  { r: 204, g: 255, b: 179 },
  { r: 179, g: 0, b: 255 },
  { r: 51, g: 255, b: 255 },
  { r: 247, g: 247, b: 247 }
]

export function getColor(particleType: number) {
  const index = particleType % colors.length
  return colors[index]
}

const AtomTypes: { [key: string]: AtomType } = {
  H: {
    shortname: 'H',
    fullname: 'hydrogen',
    radius: 1.2,
    color: { r: 204, g: 204, b: 204 }
  },
  He: {
    shortname: 'He',
    fullname: 'helium',
    radius: 1.4,
    color: { r: 217, g: 255, b: 255 }
  },
  Li: {
    shortname: 'Li',
    fullname: 'lithium',
    radius: 1.82,
    color: { r: 204, g: 128, b: 255 }
  },
  Be: {
    shortname: 'Be',
    fullname: 'beryllium',
    radius: 1.53,
    color: { r: 194, g: 255, b: 0 }
  },
  B: {
    shortname: 'B',
    fullname: 'boron',
    radius: 1.92,
    color: { r: 255, g: 181, b: 181 }
  },
  C: {
    shortname: 'C',
    fullname: 'carbon',
    radius: 1.7,
    color: { r: 80, g: 80, b: 80 }
  },
  N: {
    shortname: 'N',
    fullname: 'nitrogen',
    radius: 1.55,
    color: { r: 48, g: 80, b: 248 }
  },
  O: {
    shortname: 'O',
    fullname: 'oxygen',
    radius: 1.52,
    color: { r: 170, g: 0, b: 0 }
  },
  F: {
    shortname: 'F',
    fullname: 'fluorine',
    radius: 1.35,
    color: { r: 144, g: 224, b: 80 }
  },
  Ne: {
    shortname: 'Ne',
    fullname: 'neon',
    radius: 1.54,
    color: { r: 48, g: 80, b: 248 }
  },
  Na: {
    shortname: 'Na',
    fullname: 'sodium',
    radius: 2.27,
    color: { r: 171, g: 92, b: 242 }
  },
  Mg: {
    shortname: 'Mg',
    fullname: 'magnesium',
    radius: 1.73,
    color: { r: 138, g: 255, b: 0 }
  },
  Al: {
    shortname: 'Al',
    fullname: 'aluminium',
    radius: 1.84,
    color: { r: 191, g: 166, b: 166 }
  },
  Si: {
    shortname: 'Si',
    fullname: 'silicon',
    radius: 2.27,
    color: { r: 240, g: 200, b: 160 }
  },
  P: {
    shortname: 'P',
    fullname: 'phosphorus',
    radius: 1.8,
    color: { r: 255, g: 128, b: 0 }
  },
  S: {
    shortname: 'S',
    fullname: 'sulfur',
    radius: 1.8,
    color: { r: 255, g: 255, b: 48 }
  },
  Cl: {
    shortname: 'Cl',
    fullname: 'chlorine',
    radius: 1.75,
    color: { r: 31, g: 240, b: 31 }
  },
  Ar: {
    shortname: 'Ar',
    fullname: 'argon',
    radius: 1.88,
    color: { r: 128, g: 209, b: 227 }
  },
  K: {
    shortname: 'K',
    fullname: 'potassium',
    radius: 2.75,
    color: { r: 143, g: 64, b: 212 }
  },
  Ca: {
    shortname: 'Ca',
    fullname: 'calcium',
    radius: 2.31,
    color: { r: 61, g: 255, b: 0 }
  },
  Sc: {
    shortname: 'Sc',
    fullname: 'scandium',
    radius: 2.11,
    color: { r: 230, g: 230, b: 230 }
  },
  Ti: {
    shortname: 'Ti',
    fullname: 'titanium',
    radius: 2.0,
    color: { r: 191, g: 194, b: 199 }
  },
  V: {
    shortname: 'V',
    fullname: 'vanadium',
    radius: 2.0,
    color: { r: 166, g: 166, b: 171 }
  },
  Cr: {
    shortname: 'Cr',
    fullname: 'chromium',
    radius: 2.0,
    color: { r: 138, g: 153, b: 199 }
  },
  Mn: {
    shortname: 'Mn',
    fullname: 'manganese',
    radius: 2.0,
    color: { r: 156, g: 122, b: 199 }
  },
  Fe: {
    shortname: 'Fe',
    fullname: 'iron',
    radius: 2.0,
    color: { r: 224, g: 102, b: 51 }
  },
  Co: {
    shortname: 'Co',
    fullname: 'cobalt',
    radius: 2.0,
    color: { r: 240, g: 144, b: 160 }
  },
  Ni: {
    shortname: 'Ni',
    fullname: 'nickel',
    radius: 1.63,
    color: { r: 80, g: 208, b: 80 }
  },
  Cu: {
    shortname: 'Cu',
    fullname: 'copper',
    radius: 1.4,
    color: { r: 200, g: 128, b: 51 }
  },
  Zn: {
    shortname: 'Zn',
    fullname: 'zinc',
    radius: 1.39,
    color: { r: 125, g: 128, b: 176 }
  },
  Ga: {
    shortname: 'Ga',
    fullname: 'gallium',
    radius: 1.87,
    color: { r: 194, g: 143, b: 143 }
  },
  Ge: {
    shortname: 'Ge',
    fullname: 'germanium',
    radius: 2.11,
    color: { r: 102, g: 143, b: 143 }
  },
  As: {
    shortname: 'As',
    fullname: 'arsenic',
    radius: 1.85,
    color: { r: 189, g: 128, b: 227 }
  },
  Se: {
    shortname: 'Se',
    fullname: 'selenium',
    radius: 1.9,
    color: { r: 255, g: 161, b: 0 }
  },
  Br: {
    shortname: 'Br',
    fullname: 'bromine',
    radius: 1.85,
    color: { r: 166, g: 41, b: 41 }
  },
  Kr: {
    shortname: 'Kr',
    fullname: 'krypton',
    radius: 2.02,
    color: { r: 92, g: 184, b: 209 }
  },
  Rb: {
    shortname: 'Rb',
    fullname: 'rubidium',
    radius: 3.03,
    color: { r: 112, g: 46, b: 176 }
  },
  Sr: {
    shortname: 'Sr',
    fullname: 'strontium',
    radius: 2.49,
    color: { r: 0, g: 255, b: 0 }
  },
  Y: {
    shortname: 'Y',
    fullname: 'yttrium',
    radius: 2.0,
    color: { r: 148, g: 255, b: 255 }
  },
  Zr: {
    shortname: 'Zr',
    fullname: 'zirconium',
    radius: 2.0,
    color: { r: 148, g: 224, b: 224 }
  },
  Nb: {
    shortname: 'Nb',
    fullname: 'niobium',
    radius: 2.0,
    color: { r: 115, g: 194, b: 201 }
  },
  Mo: {
    shortname: 'Mo',
    fullname: 'molybdenum',
    radius: 2.0,
    color: { r: 84, g: 181, b: 181 }
  },
  Tc: {
    shortname: 'Tc',
    fullname: 'technetium',
    radius: 2.0,
    color: { r: 59, g: 158, b: 158 }
  },
  Ru: {
    shortname: 'Ru',
    fullname: 'ruthenium',
    radius: 2.0,
    color: { r: 36, g: 143, b: 143 }
  },
  Rh: {
    shortname: 'Rh',
    fullname: 'rhodium',
    radius: 2.0,
    color: { r: 10, g: 125, b: 140 }
  },
  Pd: {
    shortname: 'Pd',
    fullname: 'palladium',
    radius: 1.63,
    color: { r: 0, g: 105, b: 133 }
  },
  Ag: {
    shortname: 'Ag',
    fullname: 'silver',
    radius: 1.72,
    color: { r: 192, g: 192, b: 192 }
  },
  Cd: {
    shortname: 'Cd',
    fullname: 'cadmium',
    radius: 1.58,
    color: { r: 255, g: 217, b: 143 }
  },
  In: {
    shortname: 'In',
    fullname: 'indium',
    radius: 1.93,
    color: { r: 166, g: 117, b: 115 }
  },
  Sn: {
    shortname: 'Sn',
    fullname: 'tin',
    radius: 2.17,
    color: { r: 102, g: 128, b: 128 }
  },
  Sb: {
    shortname: 'Sb',
    fullname: 'antimony',
    radius: 2.06,
    color: { r: 158, g: 99, b: 181 }
  },
  Te: {
    shortname: 'Te',
    fullname: 'tellurium',
    radius: 2.06,
    color: { r: 212, g: 122, b: 0 }
  },
  I: {
    shortname: 'I',
    fullname: 'iodine',
    radius: 1.98,
    color: { r: 148, g: 0, b: 148 }
  },
  Xe: {
    shortname: 'Xe',
    fullname: 'xenon',
    radius: 2.16,
    color: { r: 66, g: 158, b: 176 }
  },
  Cs: {
    shortname: 'Cs',
    fullname: 'caesium',
    radius: 3.43,
    color: { r: 87, g: 23, b: 143 }
  },
  Ba: {
    shortname: 'Ba',
    fullname: 'barium',
    radius: 2.68,
    color: { r: 0, g: 201, b: 0 }
  },
  La: {
    shortname: 'La',
    fullname: 'lanthanum',
    radius: 2.0,
    color: { r: 112, g: 212, b: 255 }
  },
  Ce: {
    shortname: 'Ce',
    fullname: 'cerium',
    radius: 2.0,
    color: { r: 255, g: 255, b: 199 }
  },
  Pr: {
    shortname: 'Pr',
    fullname: 'praseodymium',
    radius: 2.0,
    color: { r: 217, g: 255, b: 199 }
  },
  Nd: {
    shortname: 'Nd',
    fullname: 'neodymium',
    radius: 2.0,
    color: { r: 199, g: 255, b: 199 }
  },
  Pm: {
    shortname: 'Pm',
    fullname: 'promethium',
    radius: 2.0,
    color: { r: 163, g: 255, b: 199 }
  },
  Sm: {
    shortname: 'Sm',
    fullname: 'samarium',
    radius: 2.0,
    color: { r: 143, g: 255, b: 199 }
  },
  Eu: {
    shortname: 'Eu',
    fullname: 'europium',
    radius: 2.0,
    color: { r: 97, g: 255, b: 199 }
  },
  Gd: {
    shortname: 'Gd',
    fullname: 'gadolinium',
    radius: 2.0,
    color: { r: 69, g: 255, b: 199 }
  },
  Tb: {
    shortname: 'Tb',
    fullname: 'terbium',
    radius: 2.0,
    color: { r: 48, g: 255, b: 199 }
  },
  Dy: {
    shortname: 'Dy',
    fullname: 'dysprosium',
    radius: 2.0,
    color: { r: 31, g: 255, b: 199 }
  },
  Ho: {
    shortname: 'Ho',
    fullname: 'holmium',
    radius: 2.0,
    color: { r: 0, g: 255, b: 156 }
  },
  Er: {
    shortname: 'Er',
    fullname: 'erbium',
    radius: 2.0,
    color: { r: 0, g: 230, b: 117 }
  },
  Tm: {
    shortname: 'Tm',
    fullname: 'thulium',
    radius: 2.0,
    color: { r: 0, g: 212, b: 82 }
  },
  Yb: {
    shortname: 'Yb',
    fullname: 'ytterbium',
    radius: 2.0,
    color: { r: 0, g: 191, b: 56 }
  },
  Lu: {
    shortname: 'Lu',
    fullname: 'lutetium',
    radius: 2.0,
    color: { r: 0, g: 171, b: 36 }
  },
  Hf: {
    shortname: 'Hf',
    fullname: 'hafnium',
    radius: 2.0,
    color: { r: 77, g: 194, b: 255 }
  },
  Ta: {
    shortname: 'Ta',
    fullname: 'tantalum',
    radius: 2.0,
    color: { r: 77, g: 166, b: 255 }
  },
  W: {
    shortname: 'W',
    fullname: 'tungsten',
    radius: 2.0,
    color: { r: 33, g: 148, b: 214 }
  }
}

export default AtomTypes
