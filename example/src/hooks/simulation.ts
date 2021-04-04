export const useLoadSimulation = () => {
  let loading: boolean = false
  const loadSimulation = async (url: string, onFileLoaded: (fileName: string, contents: string) => void) => {
    loading = true
    const file = await fetch(url)
    const contents = await file.text()
    loading = false
    onFileLoaded(url, contents)
  }
  return { loading, loadSimulation }
}