import type { ProcessedImage } from './imageProcessor';
import type { ReliefParams } from './types';

export interface MeshData {
  vertices: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
  physWidth: number;
  physHeight: number;
  maxZ: number;
}

/**
 * Generate a watertight relief mesh from a heightmap.
 * Creates: top surface (relief), bottom surface (flat), and side walls.
 * Supports invertRelief (凹凸反轉) for stamp/mold mode.
 */
export function generateMesh(
  processed: ProcessedImage,
  params: ReliefParams
): MeshData {
  const { heightMap, width: cols, height: rows } = processed;
  const aspect = rows / cols;
  const physWidth = params.width;
  const physHeight = physWidth * aspect;
  const depth = params.depth;
  const baseThick = params.baseThickness;

  const dx = physWidth / (cols - 1);
  const dy = physHeight / (rows - 1);

  // Perimeter calculation
  const perimeterPoints = 2 * (cols - 1) + 2 * (rows - 1);
  const topVertCount = cols * rows;
  const botVertCount = cols * rows;
  const sideVerts = (perimeterPoints + 1) * 2;
  const totalVerts = topVertCount + botVertCount + sideVerts;

  const vertices = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);

  const topFaces = (cols - 1) * (rows - 1) * 2;
  const botFaces = (cols - 1) * (rows - 1) * 2;
  const sideFaces = perimeterPoints * 2;
  const totalFaces = topFaces + botFaces + sideFaces;
  const indices = new Uint32Array(totalFaces * 3);

  let vi = 0;
  let ii = 0;

  // Determine max Z for the model
  // In normal mode: z = baseThick + h * depth (max = baseThick + depth)
  // In invertRelief mode: the top surface is flat at maxZ, and the relief is carved down
  const maxZ = baseThick + depth;

  // Helper to compute Z for a heightmap value
  function getZ(h: number): number {
    if (params.invertRelief) {
      // Flat top, carve down: high heightmap = deep carve
      return maxZ - h * depth;
    } else {
      // Normal: high heightmap = high relief
      return baseThick + h * depth;
    }
  }

  // --- TOP SURFACE ---
  const topStart = vi / 3;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const h = heightMap[r * cols + c];
      const x = c * dx;
      const y = r * dy;
      const z = getZ(h);
      vertices[vi] = x;
      vertices[vi + 1] = y;
      vertices[vi + 2] = z;
      vi += 3;
    }
  }

  // Top surface indices
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const i0 = topStart + r * cols + c;
      const i1 = i0 + 1;
      const i2 = i0 + cols;
      const i3 = i2 + 1;
      indices[ii++] = i0;
      indices[ii++] = i2;
      indices[ii++] = i1;
      indices[ii++] = i1;
      indices[ii++] = i2;
      indices[ii++] = i3;
    }
  }

  // --- BOTTOM SURFACE ---
  const botStart = vi / 3;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * dx;
      const y = r * dy;
      vertices[vi] = x;
      vertices[vi + 1] = y;
      vertices[vi + 2] = 0;
      vi += 3;
    }
  }

  // Bottom surface indices (reversed winding)
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const i0 = botStart + r * cols + c;
      const i1 = i0 + 1;
      const i2 = i0 + cols;
      const i3 = i2 + 1;
      indices[ii++] = i0;
      indices[ii++] = i1;
      indices[ii++] = i2;
      indices[ii++] = i1;
      indices[ii++] = i3;
      indices[ii++] = i2;
    }
  }

  // --- SIDE WALLS ---
  const perimPath: { r: number; c: number }[] = [];
  for (let c = 0; c < cols; c++) perimPath.push({ r: 0, c });
  for (let r = 1; r < rows; r++) perimPath.push({ r, c: cols - 1 });
  for (let c = cols - 2; c >= 0; c--) perimPath.push({ r: rows - 1, c });
  for (let r = rows - 2; r >= 1; r--) perimPath.push({ r, c: 0 });

  const sideStart = vi / 3;
  const perimLen = perimPath.length;

  for (let i = 0; i <= perimLen; i++) {
    const p = perimPath[i % perimLen];
    const x = p.c * dx;
    const y = p.r * dy;
    const zTop = getZ(heightMap[p.r * cols + p.c]);

    vertices[vi] = x;
    vertices[vi + 1] = y;
    vertices[vi + 2] = zTop;
    vi += 3;

    vertices[vi] = x;
    vertices[vi + 1] = y;
    vertices[vi + 2] = 0;
    vi += 3;
  }

  for (let i = 0; i < perimLen; i++) {
    const t0 = sideStart + i * 2;
    const b0 = sideStart + i * 2 + 1;
    const t1 = sideStart + (i + 1) * 2;
    const b1 = sideStart + (i + 1) * 2 + 1;

    indices[ii++] = t0;
    indices[ii++] = b0;
    indices[ii++] = t1;
    indices[ii++] = t1;
    indices[ii++] = b0;
    indices[ii++] = b1;
  }

  // Compute normals
  computeNormals(vertices, indices, normals, ii);

  return {
    vertices: vertices.slice(0, vi),
    normals: normals.slice(0, vi),
    indices: indices.slice(0, ii),
    physWidth,
    physHeight,
    maxZ,
  };
}

function computeNormals(
  vertices: Float32Array,
  indices: Uint32Array,
  normals: Float32Array,
  indexCount: number
) {
  normals.fill(0);

  for (let i = 0; i < indexCount; i += 3) {
    const ia = indices[i] * 3;
    const ib = indices[i + 1] * 3;
    const ic = indices[i + 2] * 3;

    const ax = vertices[ia], ay = vertices[ia + 1], az = vertices[ia + 2];
    const bx = vertices[ib], by = vertices[ib + 1], bz = vertices[ib + 2];
    const cx = vertices[ic], cy = vertices[ic + 1], cz = vertices[ic + 2];

    const e1x = bx - ax, e1y = by - ay, e1z = bz - az;
    const e2x = cx - ax, e2y = cy - ay, e2z = cz - az;

    const nx = e1y * e2z - e1z * e2y;
    const ny = e1z * e2x - e1x * e2z;
    const nz = e1x * e2y - e1y * e2x;

    normals[ia] += nx; normals[ia + 1] += ny; normals[ia + 2] += nz;
    normals[ib] += nx; normals[ib + 1] += ny; normals[ib + 2] += nz;
    normals[ic] += nx; normals[ic + 1] += ny; normals[ic + 2] += nz;
  }

  const vertCount = normals.length / 3;
  for (let i = 0; i < vertCount; i++) {
    const j = i * 3;
    const len = Math.sqrt(normals[j] ** 2 + normals[j + 1] ** 2 + normals[j + 2] ** 2);
    if (len > 0) {
      normals[j] /= len;
      normals[j + 1] /= len;
      normals[j + 2] /= len;
    }
  }
}
