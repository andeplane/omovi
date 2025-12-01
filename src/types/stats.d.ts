declare module 'stats.js' {
  export default class Stats {
    constructor()
    showPanel(id: number): void
    update(): void
    begin(): void
    end(): void
    dom: HTMLDivElement
    domElement: HTMLDivElement
  }
}
