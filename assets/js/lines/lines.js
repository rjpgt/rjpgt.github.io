const vert_shader_src = `#version 300 es
precision highp float;

in vec2 line_vertex;
out vec3 colour;

void main(void) {
	gl_Position = vec4(line_vertex, 0.0, 1.0);
	colour = vec3(line_vertex.x+0.5, 1.0, line_vertex.y+0.5);
}`;

const frag_shader_src = `#version 300 es
#ifdef GL_FRAGMENT_PRECISION_HIGH
	precision highp float;
#else
	precision mediump float;
#endif

in vec3 colour;
out vec4 out_colour;

void main(void) {
	out_colour = vec4(colour, 1.0);
}`;

const g = {}; //globals

function createProgram() {
  const gl = g.gl;

  const vert_shader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vert_shader, vert_shader_src);
  gl.compileShader(vert_shader);

  const frag_shader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(frag_shader, frag_shader_src);
  gl.compileShader(frag_shader);

  const prog = gl.createProgram();
  gl.attachShader(prog, vert_shader);
  gl.attachShader(prog, frag_shader);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error(`Link failed: ${gl.getProgramInfoLog(prog)}`);
    console.error(`vs info-log: ${gl.getShaderInfoLog(vert_shader)}`);
    console.error(`fs info-log: ${gl.getShaderInfoLog(frag_shader)}`);
    throw new Error('Error creating program');
  }
  gl.deleteShader(vert_shader);
  gl.deleteShader(frag_shader);
  return prog;
}

function initGl() {
  const gl = g.gl;

  g.primitives = [gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP];
  g.primitive_index = 0;
  gl.clearColor(0.2, 0.3, 0.3, 1);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.viewport(0, 0, g.canvas.width, g.canvas.height);
  gl.lineWidth(5);
}

function initProg() {
  const prog = createProgram();
  const gl = g.gl;
  gl.useProgram(prog);
  const line_vertex = gl.getAttribLocation(prog, 'line_vertex');
  const pos_buf = gl.createBuffer();
  gl.enableVertexAttribArray(line_vertex);
  gl.bindBuffer(gl.ARRAY_BUFFER, pos_buf);
  gl.vertexAttribPointer(line_vertex, 2, gl.FLOAT, false, 0, 0);

  const line_vertices = new Float32Array([
    -0.2, -0.8, 0.8, 0.2, 0.6, 0.8, -0.5, 0.6, -0.4, 0.0, -0.7, -0.3,
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, line_vertices, gl.STATIC_DRAW);
}

function draw() {
  const gl = g.gl;
  gl.clear(gl.COLOR_BUFFER_BIT);
  const primitive = g.primitives[g.primitive_index];
  gl.drawArrays(primitive, 0, 6);
}

function onResize() {
  g.canvas.width = g.canvas_div.clientWidth;
  g.canvas.height = g.canvas_div.clientHeight;
  try {
    g.gl = g.canvas.getContext('webgl2', { alpha: false, depth: false });
    if (!g.gl) {
      throw new Error('Browser does not support WebGL2');
    }
  } catch (e) {
    g.canvas_div.innerHTML = `<p>${e.message}</p>`;
    return;
  }
  try {
    initGl();
    initProg();
  } catch (e) {
    g.canvas_div.innerHTML = `<p>${e.message}</p>`;
    return;
  }
  draw();
}

function onClick() {
  g.primitive_index = (g.primitive_index + 1) % g.primitives.length;
  draw();
}

function init() {
  g.canvas_div = document.querySelector('#canvas_div');
  g.canvas = document.querySelector('canvas');
  g.canvas.addEventListener('click', onClick);
  onResize();
}

window.addEventListener('load', init);
window.addEventListener('resize', onResize, false);
window.addEventListener('orientationchange', onResize, false);
