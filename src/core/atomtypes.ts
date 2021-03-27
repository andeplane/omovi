export interface Color {
  r: number
  g: number
  b: number
}

export interface AtomType {
  fullname: string
  radius: number
  color: Color
}

const AtomTypes: { [key: string]: AtomType } = {
  H: { fullname: 'hydrogen', radius: 1.2, color: { r: 204, g: 204, b: 204 } },
  He: { fullname: 'helium', radius: 1.4, color: { r: 217, g: 255, b: 255 } },
  Li: { fullname: 'lithium', radius: 1.82, color: { r: 204, g: 128, b: 255 } },
  Be: { fullname: 'beryllium', radius: 1.53, color: { r: 194, g: 255, b: 0 } },
  B: { fullname: 'boron', radius: 1.92, color: { r: 255, g: 181, b: 181 } },
  C: { fullname: 'carbon', radius: 1.7, color: { r: 80, g: 80, b: 80 } },
  N: { fullname: 'nitrogen', radius: 1.55, color: { r: 48, g: 80, b: 248 } },
  O: { fullname: 'oxygen', radius: 1.52, color: { r: 170, g: 0, b: 0 } },
  F: { fullname: 'fluorine', radius: 1.35, color: { r: 144, g: 224, b: 80 } },
  Ne: { fullname: 'neon', radius: 1.54, color: { r: 48, g: 80, b: 248 } },
  Na: { fullname: 'sodium', radius: 2.27, color: { r: 171, g: 92, b: 242 } },
  Mg: { fullname: 'magnesium', radius: 1.73, color: { r: 138, g: 255, b: 0 } },
  Al: {
    fullname: 'aluminium',
    radius: 1.84,
    color: { r: 191, g: 166, b: 166 }
  },
  Si: { fullname: 'silicon', radius: 2.27, color: { r: 240, g: 200, b: 160 } },
  P: { fullname: 'phosphorus', radius: 1.8, color: { r: 255, g: 128, b: 0 } },
  S: { fullname: 'sulfur', radius: 1.8, color: { r: 255, g: 255, b: 48 } },
  Cl: { fullname: 'chlorine', radius: 1.75, color: { r: 31, g: 240, b: 31 } },
  Ar: { fullname: 'argon', radius: 1.88, color: { r: 128, g: 209, b: 227 } },
  K: { fullname: 'potassium', radius: 2.75, color: { r: 143, g: 64, b: 212 } },
  Ca: { fullname: 'calcium', radius: 2.31, color: { r: 61, g: 255, b: 0 } },
  Sc: { fullname: 'scandium', radius: 2.11, color: { r: 230, g: 230, b: 230 } },
  Ti: { fullname: 'titanium', radius: 2.0, color: { r: 191, g: 194, b: 199 } },
  V: { fullname: 'vanadium', radius: 2.0, color: { r: 166, g: 166, b: 171 } },
  Cr: { fullname: 'chromium', radius: 2.0, color: { r: 138, g: 153, b: 199 } },
  Mn: { fullname: 'manganese', radius: 2.0, color: { r: 156, g: 122, b: 199 } },
  Fe: { fullname: 'iron', radius: 2.0, color: { r: 224, g: 102, b: 51 } },
  Co: { fullname: 'cobalt', radius: 2.0, color: { r: 240, g: 144, b: 160 } },
  Ni: { fullname: 'nickel', radius: 1.63, color: { r: 80, g: 208, b: 80 } },
  Cu: { fullname: 'copper', radius: 1.4, color: { r: 200, g: 128, b: 51 } },
  Zn: { fullname: 'zinc', radius: 1.39, color: { r: 125, g: 128, b: 176 } },
  Ga: { fullname: 'gallium', radius: 1.87, color: { r: 194, g: 143, b: 143 } },
  Ge: {
    fullname: 'germanium',
    radius: 2.11,
    color: { r: 102, g: 143, b: 143 }
  },
  As: { fullname: 'arsenic', radius: 1.85, color: { r: 189, g: 128, b: 227 } },
  Se: { fullname: 'selenium', radius: 1.9, color: { r: 255, g: 161, b: 0 } },
  Br: { fullname: 'bromine', radius: 1.85, color: { r: 166, g: 41, b: 41 } },
  Kr: { fullname: 'krypton', radius: 2.02, color: { r: 92, g: 184, b: 209 } },
  Rb: { fullname: 'rubidium', radius: 3.03, color: { r: 112, g: 46, b: 176 } },
  Sr: { fullname: 'strontium', radius: 2.49, color: { r: 0, g: 255, b: 0 } },
  Y: { fullname: 'yttrium', radius: 2.0, color: { r: 148, g: 255, b: 255 } },
  Zr: { fullname: 'zirconium', radius: 2.0, color: { r: 148, g: 224, b: 224 } },
  Nb: { fullname: 'niobium', radius: 2.0, color: { r: 115, g: 194, b: 201 } },
  Mo: { fullname: 'molybdenum', radius: 2.0, color: { r: 84, g: 181, b: 181 } },
  Tc: { fullname: 'technetium', radius: 2.0, color: { r: 59, g: 158, b: 158 } },
  Ru: { fullname: 'ruthenium', radius: 2.0, color: { r: 36, g: 143, b: 143 } },
  Rh: { fullname: 'rhodium', radius: 2.0, color: { r: 10, g: 125, b: 140 } },
  Pd: { fullname: 'palladium', radius: 1.63, color: { r: 0, g: 105, b: 133 } },
  Ag: { fullname: 'silver', radius: 1.72, color: { r: 192, g: 192, b: 192 } },
  Cd: { fullname: 'cadmium', radius: 1.58, color: { r: 255, g: 217, b: 143 } },
  In: { fullname: 'indium', radius: 1.93, color: { r: 166, g: 117, b: 115 } },
  Sn: { fullname: 'tin', radius: 2.17, color: { r: 102, g: 128, b: 128 } },
  Sb: { fullname: 'antimony', radius: 2.06, color: { r: 158, g: 99, b: 181 } },
  Te: { fullname: 'tellurium', radius: 2.06, color: { r: 212, g: 122, b: 0 } },
  I: { fullname: 'iodine', radius: 1.98, color: { r: 148, g: 0, b: 148 } },
  Xe: { fullname: 'xenon', radius: 2.16, color: { r: 66, g: 158, b: 176 } },
  Cs: { fullname: 'caesium', radius: 3.43, color: { r: 87, g: 23, b: 143 } },
  Ba: { fullname: 'barium', radius: 2.68, color: { r: 0, g: 201, b: 0 } },
  La: { fullname: 'lanthanum', radius: 2.0, color: { r: 112, g: 212, b: 255 } },
  Ce: { fullname: 'cerium', radius: 2.0, color: { r: 255, g: 255, b: 199 } },
  Pr: {
    fullname: 'praseodymium',
    radius: 2.0,
    color: { r: 217, g: 255, b: 199 }
  },
  Nd: { fullname: 'neodymium', radius: 2.0, color: { r: 199, g: 255, b: 199 } },
  Pm: {
    fullname: 'promethium',
    radius: 2.0,
    color: { r: 163, g: 255, b: 199 }
  },
  Sm: { fullname: 'samarium', radius: 2.0, color: { r: 143, g: 255, b: 199 } },
  Eu: { fullname: 'europium', radius: 2.0, color: { r: 97, g: 255, b: 199 } },
  Gd: { fullname: 'gadolinium', radius: 2.0, color: { r: 69, g: 255, b: 199 } },
  Tb: { fullname: 'terbium', radius: 2.0, color: { r: 48, g: 255, b: 199 } },
  Dy: { fullname: 'dysprosium', radius: 2.0, color: { r: 31, g: 255, b: 199 } },
  Ho: { fullname: 'holmium', radius: 2.0, color: { r: 0, g: 255, b: 156 } },
  Er: { fullname: 'erbium', radius: 2.0, color: { r: 0, g: 230, b: 117 } },
  Tm: { fullname: 'thulium', radius: 2.0, color: { r: 0, g: 212, b: 82 } },
  Yb: { fullname: 'ytterbium', radius: 2.0, color: { r: 0, g: 191, b: 56 } },
  Lu: { fullname: 'lutetium', radius: 2.0, color: { r: 0, g: 171, b: 36 } },
  Hf: { fullname: 'hafnium', radius: 2.0, color: { r: 77, g: 194, b: 255 } },
  Ta: { fullname: 'tantalum', radius: 2.0, color: { r: 77, g: 166, b: 255 } },
  W: { fullname: 'tungsten', radius: 2.0, color: { r: 33, g: 148, b: 214 } }
}

export default AtomTypes
