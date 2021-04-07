const parser = (data: string) => {
  const lines = data.split('\n');
  let i = 1;
  const numAtoms = parseInt(lines[i++].split(" ")[0])
  const numAtomTypes = parseInt(lines[i++].split(" ")[0])
  const [xlo, xhi] = lines[i++].split(" ").map(parseFloat)
  const [ylo, yhi] = lines[i++].split(" ").map(parseFloat)
  const [zlo, zhi] = lines[i++].split(" ").map(parseFloat)
  const [xy, xz, yz] = lines[i++].split(" ").map(parseFloat)
  i++
  i++
  i++
  const positions = new Float32Array(3 * numAtoms)
  const ids = new Int32Array(numAtoms)
  const types = new Int32Array(numAtoms)
  const molIds = new Int32Array(numAtoms)
  for (let j = 0; j < numAtoms; j++) {
    const [id, molId, type, x, y, z] = lines[i + j].split(" ")
    positions[3 * j + 0] = parseFloat(x)
    positions[3 * j + 1] = parseFloat(y)
    positions[3 * j + 2] = parseFloat(z)
    ids[j] = parseInt(id)
    types[j] = parseInt(type)
    molIds[j] = parseInt(molId)
  }

  return {
    numAtoms, positions, ids, types
  }
}

export default parser