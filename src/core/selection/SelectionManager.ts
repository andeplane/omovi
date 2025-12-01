import DataTexture from '../datatexture'

/**
 * Manages particle selection state and rendering.
 * 
 * Handles selection tracking, clearing, and provides O(1) selection checks.
 */
export class SelectionManager {
  private selectionTexture: DataTexture
  private selectedCount: number = 0
  private onUpdate: () => void

  /**
   * Create a new SelectionManager.
   * 
   * @param selectionTexture - Data texture storing selection state
   * @param onUpdate - Callback triggered when selection state changes
   */
  constructor(selectionTexture: DataTexture, onUpdate: () => void) {
    this.selectionTexture = selectionTexture
    this.onUpdate = onUpdate

    // Initialize selection texture to all unselected (black with full alpha)
    const selectionData = this.selectionTexture.getData()
    for (let i = 0; i < selectionData.length; i += 4) {
      selectionData[i] = 0 // R
      selectionData[i + 1] = 0 // G
      selectionData[i + 2] = 0 // B
      selectionData[i + 3] = 255 // A
    }
    this.selectionTexture.getTexture().needsUpdate = true
  }

  /**
   * Set the selection state of a particle by atom ID.
   * 
   * @param atomId - The LAMMPS atom ID
   * @param selected - Whether the particle should be selected
   */
  setSelected(atomId: number, selected: boolean): void {
    const wasSelected = this.selectionTexture.getInteger(atomId) > 0
    this.selectionTexture.setRGBA(atomId, selected ? 255 : 0, 0, 0, 255)

    // Update selection counter for O(1) hasSelection check
    if (selected && !wasSelected) {
      this.selectedCount++
    } else if (!selected && wasSelected) {
      this.selectedCount--
    }

    this.onUpdate()
  }

  /**
   * Clear all particle selections.
   */
  clearSelection(): void {
    // Direct data manipulation for performance - avoid O(n) setRGBA calls
    const data = this.selectionTexture.getData()
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 0 // R
      data[i + 1] = 0 // G
      data[i + 2] = 0 // B
      data[i + 3] = 255 // A
    }
    this.selectionTexture.getTexture().needsUpdate = true
    this.selectedCount = 0
    this.onUpdate()
  }

  /**
   * Check if any particles are currently selected.
   * 
   * @returns True if at least one particle is selected
   */
  hasSelection(): boolean {
    return this.selectedCount > 0
  }

  /**
   * Get the selection texture.
   * 
   * @returns The data texture storing selection state
   */
  getTexture(): DataTexture {
    return this.selectionTexture
  }
}

