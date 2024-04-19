---
layout: post
title: 'Triangles, triangle fan, and triangle strip'
date: 2024-04-20 02:15:00 +0530
script: triangles
extracss: true
hascanvas: true
hasmath: true
---

Basics.

Click( or touch ) the square above to cycle through triangles, a triangle fan, and a triangle strip.

There are seven vertices. All in the default clip coordinate system with $x$ and $y$ going from -1 to 1. $z$ is zero for all the vertices. The same vertices are used to draw two standalone triangles, a triangle fan with four triangles, and a triangle strip with four triangles. The order of the vertices in each case is different. In the function `initProg` shown below, the first six values in the `indices` array are the indices of the vertices in the `pos_buf` array buffer that draw the standalone triangles, the next six those that draw the triangle fan, and the last six those that draw the triangle strip. This program is an example of using `drawElements`.  The qualifier `flat` in the vertex and fragment shaders produce a flat coloring of the triangles instead of a coloring obtained by interpolating the colors at the vertices. This makes it easier to make out the individual triangles in the fan and the strip.

The code:

```javascript
const vert_shader_src = `#version 300 es
precision highp float;

in vec2 position;
in vec3 vertex_color;
flat out vec3 color;

void main(void) {
	gl_Position = vec4(position, 0.0, 1.0);
	color = vertex_color;
}`;

const frag_shader_src = `#version 300 es
#ifdef GL_FRAGMENT_PRECISION_HIGH
	precision highp float;
#else
	precision mediump float;
#endif

flat in vec3 color;
out vec4 frag_color;

void main(void) {
	frag_color = vec4(color, 1.0);
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

  g.primitives = [gl.TRIANGLES, gl.TRIANGLE_FAN, gl.TRIANGLE_STRIP];
  g.primitive_index = 0;
  gl.clearColor(0.2, 0.3, 0.3, 1);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.viewport(0, 0, g.canvas.width, g.canvas.height);
}

function initProg() {
  const prog = createProgram();
  const gl = g.gl;
  gl.useProgram(prog);

  const position = gl.getAttribLocation(prog, 'position');
  const pos_buf = gl.createBuffer();
  gl.enableVertexAttribArray(position);
  gl.bindBuffer(gl.ARRAY_BUFFER, pos_buf);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const positions = new Float32Array([
    -0.75, -0.667, 0.25, -0.333, -0.25, 0.0, 0.75, 0.2, 1.0, 1.0, 0.05, 0.667,
    -0.6, 0.6,
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  const vertex_color = gl.getAttribLocation(prog, 'vertex_color');
  const col_buf = gl.createBuffer();
  gl.enableVertexAttribArray(vertex_color);
  gl.bindBuffer(gl.ARRAY_BUFFER, col_buf);
  gl.vertexAttribPointer(vertex_color, 3, gl.FLOAT, false, 0, 0);
  const colors = new Float32Array([
    1, 0.85, 0.73, 1, 0.27, 0, 0.93, 0.53, 0.93, 0.74, 0.56, 0.56, 0.6, 0.8,
    0.2, 0.48, 0.41, 0.93, 0.86, 0.08, 0.24,
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

  const index_buf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buf);
  const indices = new Uint8Array([
    0, 1, 2, 3, 4, 5, 2, 0, 1, 3, 5, 6, 0, 1, 2, 3, 5, 4,
  ]);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
}

function draw() {
  const gl = g.gl;
  gl.clear(gl.COLOR_BUFFER_BIT);
  const primitive = g.primitives[g.primitive_index];
  gl.drawElements(primitive, 6, gl.UNSIGNED_BYTE, 6 * g.primitive_index);
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

```
