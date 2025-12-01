import 'binary-parser'

declare module 'binary-parser' {
  interface Parser {
    saveOffset(name: string): this
  }
}

