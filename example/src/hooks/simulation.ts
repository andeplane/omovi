export const useLoadSimulation = () => {
  return async (url: string, onFileLoaded: (fileName: string, contents: string) => void) => {
    const file = await fetch(url)
    const contents = await file.text()
    onFileLoaded(url, contents)
  }
}