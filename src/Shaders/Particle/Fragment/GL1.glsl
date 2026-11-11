precision mediump float;
varying vec4 vColor;
varying vec2 vPoint;
uniform float uShape;
uniform vec4 uOutlineColor;
uniform float uOutlineWidth;
float shapeMask(float id, vec2 p) {
  if (id < 0.5) return 1.0 - step(1.0, length(p));
  if (id < 1.5) return 1.0 - step(1.0, max(abs(p.x), abs(p.y)));
  if (id < 2.5) {
    float h = 1.0 - abs(p.y);
    float tri = 1.0 - step(1.0, max(abs(p.x) * 1.25, h));
    return tri;
  }
  if (id < 3.5) return 1.0 - step(1.0, max(abs(p.x), abs(p.y)) * 0.8 + 0.2);
  if (id < 4.5) return 1.0 - step(1.0, max(abs(p.x) * 0.75, abs(p.y) * 1.5));
  if (id < 5.5) {
    vec2 q = abs(p);
    float x = 5.0 * q.x;
    float y = 5.0 * q.y;
    float star = 1.0 - step(1.0, (x * x + y * y) * 0.12 + abs(x - y) * 0.25);
    return star;
  }
  if (id < 6.5) {
    vec2 q = abs(p);
    float heart = 1.0 - step(1.0, max(q.x * 0.75 + q.y * 0.9, q.x * 0.9 + q.y * 0.75));
    return heart;
  }
  if (id < 7.5) return 1.0 - step(1.0, max(abs(p.x), abs(p.y)) * 0.9);
  return 1.0 - step(1.0, length(p));
}
void main() {
  vec2 p = vPoint;
  float mask = shapeMask(uShape, p);
  if (mask <= 0.0) discard;
  vec4 color = vColor;
  if (uOutlineWidth > 0.0) {
    float edge = 1.0 - smoothstep(1.0 - uOutlineWidth, 1.0, max(abs(p.x), abs(p.y)));
    color = mix(color, uOutlineColor, edge * 0.9);
  }
  gl_FragColor = color;
}
