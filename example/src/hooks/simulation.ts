
export const useLoadSimulation = () => {
  let loading: boolean = false
  const loadSimulation = async (url: string, onFileLoaded: (fileName: string, contents?: string, buffer?: ArrayBuffer) => void) => {
    loading = true
    const file = await fetch(url)
    let text, buffer
    if (url.endsWith('.bin')) {
      buffer = await file.arrayBuffer()
    } else {
      text = await file.text()
    }
    loading = false
    onFileLoaded(url, text, buffer)
  }
  return { loading, loadSimulation }
}