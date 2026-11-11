#version 300 es
precision mediump float;
in vec4 vColor;
out vec4 outColor;
void main() {
  vec2 p = gl_PointCoord - vec2(0.5);
  if(dot(p, p) > 0.25) discard;
  outColor = vColor;
}
