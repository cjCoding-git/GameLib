var VariableTypes = {
  "VECTOR": {
    "FLOAT": {
      "2": "vec2",
      "3": "vec3",
      "4": "vec4"
    },
    "DOUBLE": {
      "2": "dvec2",
      "3": "dvec3",
      "4": "dvec4"
    },
    "INT": {
      "2": "ivec2",
      "3": "ivec3",
      "4": "ivec4"
    },
    "UINT": {
      "2": "uvec2",
      "3": "uvec3",
      "4": "uvec4"
    },
    "BOOL": {
      "2": "bvec2",
      "3": "bvec3",
      "4": "bvec4"
    }
  },
  "MATRIX": {
    "2": "mat2",
    "3": "mat3",
    "4": "mat4",
    "custom": function(rows, cols) {
      return `mat${rows}x${cols}`;
    }
  },
  "FLOAT": "float",
  "DOUBLE": "double",
  "INT": "int",
  "UINT": "uint",
  "BOOL": "bool",
  "VOID": "void",
  "SAMPLER": {
    "2D": "sampler2D"
  }
};
export {
  VariableTypes
}
