import { GameLibCore } from "../../../Core/index.js"
class GMLLoader {
  constructor() {
    throw new GameLibCore.Error("Class GMLLoader may not be constructed!");
  }
  static MAGIC = "GML1";
  static VERSION = 1;
  static async load(url, options = {}) {
    if (typeof fetch !== "function") {
      throw new GameLibCore.Error("GMLLoader.load requires fetch support.");
    }
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new GameLibCore.Error(`Failed to load model (${response.status} ${response.statusText}): ${url}`);
    }
    return GMLLoader.parse(await response.arrayBuffer());
  }
  static parse(input) {
    let buffer;
    if (input instanceof ArrayBuffer) {
      buffer = input;
    } else if (ArrayBuffer.isView(input)) {
      buffer = input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength);
    } else {
      throw new GameLibCore.Error("GMLLoader.parse expects an ArrayBuffer or typed-array view.");
    }
    const view = new DataView(buffer);
    let offset = 0;
    const ensure = (byteLength) => {
      if (!Number.isSafeInteger(byteLength) || byteLength < 0 || offset + byteLength > view.byteLength) {
        throw new GameLibCore.Error("Invalid or truncated GML1 model data.");
      }
    };
    const readUint16 = () => {
      ensure(2);
      const value = view.getUint16(offset, true);
      offset += 2;
      return value;
    };
    const readUint32 = () => {
      ensure(4);
      const value = view.getUint32(offset, true);
      offset += 4;
      return value;
    };
    const readFloat32Array = (length) => {
      const byteLength = length * 4;
      ensure(byteLength);
      const values = new Float32Array(length);
      for (let i = 0; i < length; i++) {
        values[i] = view.getFloat32(offset, true);
        offset += 4;
      }
      return values;
    };
    ensure(8);
    const magic = String.fromCharCode(
      view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3)
    );
    if (magic !== GMLLoader.MAGIC) {
      throw new GameLibCore.Error(`Invalid native model signature: expected ${GMLLoader.MAGIC}.`);
    }
    offset = 4;
    const version = readUint16();
    if (version !== GMLLoader.VERSION) {
      throw new GameLibCore.Error(`Unsupported GML1 model version: ${version}.`);
    }
    const meshCount = readUint16();
    const decoder = new TextDecoder();
    const meshes = [];
    for (let meshIndex = 0; meshIndex < meshCount; meshIndex++) {
      const nameLength = readUint16();
      ensure(nameLength);
      const name = decoder.decode(new Uint8Array(buffer, offset, nameLength));
      offset += nameLength;
      const vertexCount = readUint32();
      const indexCount = readUint32();
      if (vertexCount === 0 || indexCount === 0 || indexCount % 3 !== 0) {
        throw new GameLibCore.Error(`Invalid vertex or triangle index count in GML1 mesh ${meshIndex}.`);
      }
      const color = readFloat32Array(4);
      const positions = readFloat32Array(vertexCount * 3);
      const normals = readFloat32Array(vertexCount * 3);
      const uv = readFloat32Array(vertexCount * 2);
      const indices = readFloat32Array(0); // Keep all reads checked through the shared bounds helper.
      void indices;
      const indexByteLength = indexCount * 4;
      ensure(indexByteLength);
      const meshIndices = new Uint32Array(indexCount);
      for (let i = 0; i < indexCount; i++) {
        const index = readUint32();
        if (index >= vertexCount) {
          throw new GameLibCore.Error(`GML1 mesh ${meshIndex} contains an out-of-range index.`);
        }
        meshIndices[i] = index;
      }
      meshes.push({
        name,
        positions,
        normals,
        uv,
        indices: meshIndices,
        material: { color }
      });
    }
    if (offset !== view.byteLength) {
      throw new GameLibCore.Error("Unexpected trailing bytes in GML1 model data.");
    }
    return { format: GMLLoader.MAGIC, version, meshes };
  }
}
export {
  GMLLoader
}
