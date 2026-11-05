const MAGIC = "GML1";
const VERSION = 1;

/**
 * Loads GameLib's dependency-free native model format (GML1).
 *
 * Binary layout (little-endian):
 *   Header: 4-byte magic, uint16 version, uint16 mesh count
 *   Per mesh: uint16 UTF-8 name byte length, name bytes,
 *             uint32 vertex count, uint32 index count,
 *             float32[4] base color,
 *             float32[vertexCount * 3] positions,
 *             float32[vertexCount * 3] normals,
 *             float32[vertexCount * 2] UV coordinates,
 *             uint32[indexCount] triangle indices.
 *
 * parse() returns plain model data; it does not allocate WebGL resources.
 */
class NativeModelLoader {
  static MAGIC = MAGIC;
  static VERSION = VERSION;

  static async load(url, options = {}) {
    if (typeof fetch !== "function") {
      throw new Error("NativeModelLoader.load requires fetch support.");
    }
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Failed to load model (${response.status} ${response.statusText}): ${url}`);
    }
    return NativeModelLoader.parse(await response.arrayBuffer());
  }

  static parse(input) {
    let buffer;
    if (input instanceof ArrayBuffer) {
      buffer = input;
    } else if (ArrayBuffer.isView(input)) {
      buffer = input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength);
    } else {
      throw new TypeError("NativeModelLoader.parse expects an ArrayBuffer or typed-array view.");
    }

    const view = new DataView(buffer);
    let offset = 0;
    const ensure = (byteLength) => {
      if (!Number.isSafeInteger(byteLength) || byteLength < 0 || offset + byteLength > view.byteLength) {
        throw new Error("Invalid or truncated GML1 model data.");
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
    if (magic !== MAGIC) {
      throw new Error(`Invalid native model signature: expected ${MAGIC}.`);
    }
    offset = 4;
    const version = readUint16();
    if (version !== VERSION) {
      throw new Error(`Unsupported GML1 model version: ${version}.`);
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
        throw new Error(`Invalid vertex or triangle index count in GML1 mesh ${meshIndex}.`);
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
          throw new Error(`GML1 mesh ${meshIndex} contains an out-of-range index.`);
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
      throw new Error("Unexpected trailing bytes in GML1 model data.");
    }
    return { format: MAGIC, version, meshes };
  }
}

class GLTFLoader {}
class GLBLoader {}

export {
  NativeModelLoader,
  GLTFLoader,
  GLBLoader
}
