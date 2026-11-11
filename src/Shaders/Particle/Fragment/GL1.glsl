precision mediump float;
varying vec4 vColor;
void main() {
  vec2 p = gl_PointCoord - vec2(0.5);
  if(dot(p, p) > 0.25) discard;
  gl_FragColor=vColor;
}
