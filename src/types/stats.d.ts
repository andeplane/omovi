declare module 'stats.js' {
  export default class Stats {
    constructor()
    showPanel(id: number): void
    update(): void
    dom: HTMLDivElement
    domElement: HTMLDivElement
  }
}

