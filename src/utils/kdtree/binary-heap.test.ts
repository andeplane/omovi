import { describe, it, expect, beforeEach } from 'vitest'
import BinaryHeap from './binary-heap'

describe('BinaryHeap', () => {
  describe('basic operations', () => {
    let heap: BinaryHeap<number>

    beforeEach(() => {
      heap = new BinaryHeap<number>((x) => x)
    })

    it('should start with size 0', () => {
      expect(heap.size()).toBe(0)
    })

    it('should push and peek elements', () => {
      heap.push(5)
      expect(heap.size()).toBe(1)
      expect(heap.peek()).toBe(5)
    })

    it('should pop elements', () => {
      heap.push(5)
      const popped = heap.pop()
      expect(popped).toBe(5)
      expect(heap.size()).toBe(0)
    })

    it('should remove specific elements', () => {
      heap.push(5)
      heap.push(3)
      heap.push(7)
      heap.remove(3)
      expect(heap.size()).toBe(2)
      expect(heap.content).not.toContain(3)
    })

    it('should throw error when removing non-existent element', () => {
      heap.push(5)
      expect(() => heap.remove(10)).toThrow('Node not found.')
    })
  })

  describe('heap property maintenance', () => {
    it.each([
      { values: [5, 3, 7, 1, 9], expected: [1, 3, 5, 7, 9] },
      { values: [10, 20, 30, 40, 50], expected: [10, 20, 30, 40, 50] },
      { values: [50, 40, 30, 20, 10], expected: [10, 20, 30, 40, 50] },
      { values: [1], expected: [1] },
      { values: [5, 5, 5, 5], expected: [5, 5, 5, 5] }
    ])(
      'should maintain min-heap property for $values',
      ({ values, expected }) => {
        // Arrange
        const heap = new BinaryHeap<number>((x) => x)

        // Act - push all values
        values.forEach((val) => heap.push(val))

        // Assert - pop all values and verify sorted order
        const result: number[] = []
        while (heap.size() > 0) {
          result.push(heap.pop()!)
        }
        expect(result).toEqual(expected)
      }
    )

    it('should maintain heap property after remove operations', () => {
      // Arrange
      const heap = new BinaryHeap<number>((x) => x)
      ;[5, 3, 7, 1, 9, 2, 8].forEach((val) => heap.push(val))

      // Act - remove middle element
      heap.remove(7)

      // Assert - remaining elements should still be in heap order
      const result: number[] = []
      while (heap.size() > 0) {
        result.push(heap.pop()!)
      }
      expect(result).toEqual([1, 2, 3, 5, 8, 9])
    })
  })

  describe('custom score function', () => {
    it('should work with negative scores', () => {
      // Arrange - use negative score to make max-heap
      const heap = new BinaryHeap<number>((x) => -x)

      // Act
      ;[5, 3, 7, 1, 9].forEach((val) => heap.push(val))

      // Assert - should pop in descending order (max-heap behavior)
      const result: number[] = []
      while (heap.size() > 0) {
        result.push(heap.pop()!)
      }
      expect(result).toEqual([9, 7, 5, 3, 1])
    })

    it('should work with object score functions', () => {
      // Arrange
      type Item = { priority: number; value: string }
      const heap = new BinaryHeap<Item>((item) => item.priority)

      // Act
      heap.push({ priority: 5, value: 'medium' })
      heap.push({ priority: 1, value: 'high' })
      heap.push({ priority: 10, value: 'low' })

      // Assert
      expect(heap.pop()?.value).toBe('high')
      expect(heap.pop()?.value).toBe('medium')
      expect(heap.pop()?.value).toBe('low')
    })
  })

  describe('edge cases', () => {
    it('should handle popping from empty heap', () => {
      // Arrange
      const heap = new BinaryHeap<number>((x) => x)

      // Act
      const result = heap.pop()

      // Assert
      expect(result).toBeUndefined()
    })

    it('should handle pushing and popping single element', () => {
      // Arrange
      const heap = new BinaryHeap<number>((x) => x)

      // Act
      heap.push(42)
      const result = heap.pop()

      // Assert
      expect(result).toBe(42)
      expect(heap.size()).toBe(0)
    })

    it('should handle removing last element', () => {
      // Arrange
      const heap = new BinaryHeap<number>((x) => x)
      heap.push(5)
      heap.push(3)

      // Act
      heap.remove(5)

      // Assert
      expect(heap.size()).toBe(1)
      expect(heap.peek()).toBe(3)
    })
  })
})
