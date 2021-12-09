const _v_shader_src = `#version 300 es
in vec2 a_coords;
uniform float u_pointsize;
uniform float u_width;
uniform float u_height;
void main() {
  float x = -1.0 + 2.0*(a_coords.x / u_width);
  float y = 1.0 - 2.0*(a_coords.y / u_height);
  gl_Position = vec4(x, y, 0.0, 1.0);
  gl_PointSize = u_pointsize;
}`;

const _f_shader_src = `#version 300 es
#ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
#else
  precision mediump float;
#endif
uniform vec3 u_color;
out vec4 out_color;
void main() {
  out_color = vec4(u_color, 1.0);
}`;
let _canvas_div;
let _canvas;
let _gl;
let _a_coords;
let _coords_buf;
let _coords;
let _click_pts = [];

let _point_count;
const _point_size = 1;

function createProgram() {
  const v_shader = _gl.createShader(_gl.VERTEX_SHADER);
  _gl.shaderSource(v_shader, _v_shader_src);
  _gl.compileShader(v_shader);
  if (!_gl.getShaderParameter(v_shader, _gl.COMPILE_STATUS)) {
    throw new Error(
      `Error in vertex shader: ${_gl.getShaderInfoLog(v_shader)}`
    );
  }
  const f_shader = _gl.createShader(_gl.FRAGMENT_SHADER);
  _gl.shaderSource(f_shader, _f_shader_src);
  _gl.compileShader(f_shader);
  if (!_gl.getShaderParameter(f_shader, _gl.COMPILE_STATUS)) {
    throw new Error(
      `Error in fragment shader: ${_gl.getShaderInfoLog(f_shader)}`
    );
  }
  const prog = _gl.createProgram();
  _gl.attachShader(prog, v_shader);
  _gl.attachShader(prog, f_shader);
  _gl.linkProgram(prog);
  if (!_gl.getProgramParameter(prog, _gl.LINK_STATUS)) {
    throw new Error(`Link error in program:${_gl.getProgramInfoLog(prog)}`);
  }
  return prog;
}

function pointInBetween(p1, p2, pct) {
  return { x: p1.x * (1 - pct) + p2.x * pct, y: p1.y * (1 - pct) + p2.y * pct };
}

function createPointData(triangle_corners) {
  const u = pointInBetween(
    triangle_corners[0],
    triangle_corners[1],
    Math.random()
  );
  const v = pointInBetween(
    triangle_corners[0],
    triangle_corners[2],
    Math.random()
  );
  let p = pointInBetween(u, v, Math.random());
  for (let i = 0; i < _point_count; i++) {
    const rand_index = Math.floor(Math.random() * 3);
    p = pointInBetween(p, triangle_corners[rand_index], 0.5);
    _coords[2 * i] = p.x;
    _coords[2 * i + 1] = p.y;
  }
}

function initGL() {
  const prog = createProgram();
  _gl.useProgram(prog);
  _a_coords = _gl.getAttribLocation(prog, 'a_coords');
  _coords_buf = _gl.createBuffer();
  const u_width = _gl.getUniformLocation(prog, 'u_width');
  const u_height = _gl.getUniformLocation(prog, 'u_height');
  _gl.uniform1f(u_width, _canvas.width);
  _gl.uniform1f(u_height, _canvas.height);
  const u_pointsize = _gl.getUniformLocation(prog, 'u_pointsize');
  _gl.uniform1f(u_pointsize, _point_size);
  const u_color = _gl.getUniformLocation(prog, 'u_color');
  _gl.uniform3fv(u_color, [1.0, 1.0, 0.0]);
  _gl.enableVertexAttribArray(_a_coords);
  _gl.bindBuffer(_gl.ARRAY_BUFFER, _coords_buf);
  _gl.vertexAttribPointer(_a_coords, 2, _gl.FLOAT, false, 0, 0);
  _gl.clearColor(0, 0, 0, 1);
  _gl.viewport(0, 0, _canvas.width, _canvas.height);
}

function draw() {
  _gl.clear(_gl.COLOR_BUFFER_BIT);
  _gl.bindBuffer(_gl.ARRAY_BUFFER, _coords_buf);
  _gl.bufferData(_gl.ARRAY_BUFFER, _coords, _gl.STREAM_DRAW);
  _gl.drawArrays(_gl.POINTS, 0, _point_count);
}

function onClick(e) {
  _click_pts.push({ x: e.offsetX, y: e.offsetY });
  if (_click_pts.length === 3) {
    createPointData(_click_pts);
    draw(_gl);
    _click_pts.length = 0;
  }
}

function resize() {
  _canvas.width = _canvas_div.clientWidth;
  _canvas.height = _canvas_div.clientHeight;
  _point_count = _canvas.width === 600 ? 100000 : 50000;
  _coords = new Float32Array(2 * _point_count);
  try {
    _gl = _canvas.getContext('webgl2', { alpha: false, depth: false });
    if (!_gl) {
      throw new Error('Browser does not support WebGL2');
    }
  } catch (e) {
    _canvas_div.innerHTML =
      '<p>Sorry, could not get a WebGL graphics context.</p>';
    return;
  }
  try {
    initGL(); // initialize the WebGL graphics context
  } catch (e) {
    _canvas_div.innerHTML = `<p>Sorry, could not initialize the WebGL graphics context: ${e.message}</p>`;
    return;
  }
}

function init() {
  _canvas_div = document.getElementById('canvas_div');
  _canvas = document.getElementById('canvas');
  _canvas.addEventListener('click', onClick);
  resize();
}

window.addEventListener('load', init);
window.addEventListener('resize', resize, false);
window.addEventListener('orientationchange', resize, false);
