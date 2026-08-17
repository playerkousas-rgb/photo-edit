import type { MeshData } from './meshGenerator';

/**
 * Generate a Wavefront OBJ file from mesh data.
 */
export function generateOBJ(meshData: MeshData): string {
  const { vertices, normals, indices } = meshData;
  const lines: string[] = [];

  lines.push('# ReliefForge OBJ Export');
  lines.push(`# Vertices: ${vertices.length / 3}`);
  lines.push(`# Faces: ${indices.length / 3}`);
  lines.push('');

  // Vertices
  const vertCount = vertices.length / 3;
  for (let i = 0; i < vertCount; i++) {
    const x = vertices[i * 3];
    const y = vertices[i * 3 + 1];
    const z = vertices[i * 3 + 2];
    lines.push(`v ${x.toFixed(6)} ${y.toFixed(6)} ${z.toFixed(6)}`);
  }

  lines.push('');

  // Normals
  const normCount = normals.length / 3;
  for (let i = 0; i < normCount; i++) {
    const nx = normals[i * 3];
    const ny = normals[i * 3 + 1];
    const nz = normals[i * 3 + 2];
    lines.push(`vn ${nx.toFixed(6)} ${ny.toFixed(6)} ${nz.toFixed(6)}`);
  }

  lines.push('');

  // Faces (OBJ is 1-indexed)
  const faceCount = indices.length / 3;
  for (let i = 0; i < faceCount; i++) {
    const a = indices[i * 3] + 1;
    const b = indices[i * 3 + 1] + 1;
    const c = indices[i * 3 + 2] + 1;
    lines.push(`f ${a}//${a} ${b}//${b} ${c}//${c}`);
  }

  return lines.join('\n');
}
