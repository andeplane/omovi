/**
 * @file Kdtree
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 * @private
 */
declare class Kdtree {
    readonly points: Float32Array;
    readonly metric: (a: Float32Array, b: Float32Array) => number;
    indices: Uint32Array;
    nodes: Int32Array;
    rootIndex: number;
    maxDepth: number;
    currentNode: number;
    constructor(points: Float32Array, metric: (a: Float32Array, b: Float32Array) => number);
    buildTree(depth: number, parent: number, arrBegin: number, arrEnd: number): number;
    getNodeDepth(nodeIndex: number): number;
    /**
     * find nearest points
     * @param {Array} point - array of size 3
     * @param {Integer} maxNodes - max amount of nodes to return
     * @param {Float} maxDistance - maximum distance of point to result nodes
     * @return {Array} array of point, distance pairs
     */
    nearest(point: Float32Array, maxNodes: number, maxDistance: number): [number, number][];
    verify(nodeIndex?: number, depth?: number): number;
}
export default Kdtree;
