---
layout: post
title: 'Sierpinski gasket using triangles'
date: 2021-09-26 12:54:00 +0530
script: sierpinski_2
extracss: true
hascanvas: true
hasmath: true
---

Click( or touch ) any three points in the black square above to draw a so-called Sierpinski gasket.

The prescription for drawing the Sierpinski gasket given in the previous post did not make it easy to visualize the final picture. But having seen the final pattern, one can understand the rationale behind an alternative method of drawing the Sierpinski gadget that is as follows.

1. Start with three points that make a triangle.
2. Construct 3 smaller triangles from this triangle as follows.
   1. Find the midpoint of each edge.
   2. Construct a triangle with each vertex and the midpoints of the edges connected to it.
3. Recursively repeat step 2 for each of the three new triangles until the divisions into smaller triangles have reached a chosen number in which case you draw the triangle. This means that you draw a triangle only when it has reached a certain small size that you have chosen.

The code may make that easier to understand:

```javascript
function averagePoint(p1, p2) {
  return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
}

function createPointData(start_corners) {
  const points = [];
  const colrs = [];
  function divideTriangle(a, b, c, count) {
    if (count === 0) {
      // add vertices of triangle for drawing
      points.push(a.x, a.y, b.x, b.y, c.x, c.y);
      // give the vertices the colours red, white, and white
      colrs.push(...[1, 0, 0], ...[1, 1, 1], ...[1, 1, 1]);
    } else {
      // subdivide into smaller triangles
      const ab_mid = averagePoint(a, b);
      const ac_mid = averagePoint(a, c);
      const bc_mid = averagePoint(b, c);
      --count;
      divideTriangle(a, ab_mid, ac_mid, count);
      divideTriangle(b, ab_mid, bc_mid, count);
      divideTriangle(c, bc_mid, ac_mid, count);
    }
  }
  divideTriangle(...start_corners, _divisions);
  _coords = new Float32Array(points);
  _colors = new Float32Array(colrs);
}
```

The computed points stored in the `_coords` array are now drawn using the TRIANGLES primitive which draws a triangle from every subsequent group of three vertices in the array.

```javascript
function draw() {
  _gl.clear(_gl.COLOR_BUFFER_BIT);
  _gl.bindBuffer(_gl.ARRAY_BUFFER, _coords_buf);
  _gl.bufferData(_gl.ARRAY_BUFFER, _coords, _gl.STREAM_DRAW);
  _gl.vertexAttribPointer(_a_coords, 2, _gl.FLOAT, false, 0, 0);
  _gl.bindBuffer(_gl.ARRAY_BUFFER, _color_buf);
  _gl.bufferData(_gl.ARRAY_BUFFER, _colors, _gl.STREAM_DRAW);
  _gl.vertexAttribPointer(_a_color, 3, _gl.FLOAT, false, 0, 0);
  _gl.drawArrays(_gl.TRIANGLES, 0, _coords.length / 2);
}
```

Since the points are stored in `_coords` as a sequence of their $$x$$ and $$y$$ coordinates, the number of points is `_coords.length/2`.

But since we are drawing triangles we can give a colour to each vertex of the triangle and Webgl will draw a triangle with a colour gradient obtained by interpolating between the colours at its vertices. So, in addition to a vertex buffer object that stores the coordinates of the triangle vertices, `_coords_buf`, we have another vertex buffer object that stores the colours, `_color_buf`. Each vertex has two position components, $$x$$ and $$y$$, and three colour components, red, blue, and green. The vertex shader, therefore, has an additional attribute for colour, `a_color`.

The rest of the code is mostly as it was in the previous post. Here is the entire code:

```javascript
const _v_shader_src = `#version 300 es
in vec2 a_coords;
in vec3 a_color;
out vec3 v_color;
uniform float u_width;
uniform float u_height;
void main() {
	float x = -1.0 + 2.0*(a_coords.x / u_width);
	float y = 1.0 - 2.0*(a_coords.y / u_height);
	gl_Position = vec4(x, y, 0.0, 1.0);
	v_color = a_color;
}`;

const _f_shader_src = `#version 300 es
#ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
#else
  precision mediump float;
#endif
in vec3 v_color;
out vec4 out_color;
void main() {
	out_color = vec4(v_color, 1.0);
}`;

let _canvas_div;
let _canvas;
let _gl;
let _a_coords;
let _coords_buf;
let _a_color;
let _color_buf;
let _click_pts = [];

let _coords;
let _colors;
let _divisions;

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

function averagePoint(p1, p2) {
  return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
}

function createPointData(start_corners) {
  const points = [];
  const colrs = [];
  function divideTriangle(a, b, c, count) {
    if (count === 0) {
      // add vertices of triangle for drawing
      points.push(a.x, a.y, b.x, b.y, c.x, c.y);
      colrs.push(...[1, 0, 0], ...[1, 1, 1], ...[1, 1, 1]);
    } else {
      // subdivide into smaller triangles
      const ab_mid = averagePoint(a, b);
      const ac_mid = averagePoint(a, c);
      const bc_mid = averagePoint(b, c);
      --count;
      divideTriangle(a, ab_mid, ac_mid, count);
      divideTriangle(b, ab_mid, bc_mid, count);
      divideTriangle(c, bc_mid, ac_mid, count);
    }
  }
  divideTriangle(...start_corners, _divisions);
  _coords = new Float32Array(points);
  _colors = new Float32Array(colrs);
}

function initGL() {
  const prog = createProgram(_gl, _v_shader_src, _f_shader_src);
  _gl.useProgram(prog);
  _a_coords = _gl.getAttribLocation(prog, 'a_coords');
  _coords_buf = _gl.createBuffer();
  _a_color = _gl.getAttribLocation(prog, 'a_color');
  _color_buf = _gl.createBuffer();
  const u_width = _gl.getUniformLocation(prog, 'u_width');
  const u_height = _gl.getUniformLocation(prog, 'u_height');
  _gl.uniform1f(u_width, _canvas.width);
  _gl.uniform1f(u_height, _canvas.height);
  _gl.enableVertexAttribArray(_a_color);
  _gl.enableVertexAttribArray(_a_coords);
  _gl.clearColor(0, 0, 0, 1);
  _gl.enable(_gl.BLEND);
  _gl.blendFunc(_gl.SRC_ALPHA, _gl.ONE_MINUS_SRC_ALPHA);
  _gl.viewport(0, 0, _canvas.width, _canvas.height);
}

function draw() {
  _gl.clear(_gl.COLOR_BUFFER_BIT);
  _gl.bindBuffer(_gl.ARRAY_BUFFER, _coords_buf);
  _gl.bufferData(_gl.ARRAY_BUFFER, _coords, _gl.STREAM_DRAW);
  _gl.vertexAttribPointer(_a_coords, 2, _gl.FLOAT, false, 0, 0);
  _gl.bindBuffer(_gl.ARRAY_BUFFER, _color_buf);
  _gl.bufferData(_gl.ARRAY_BUFFER, _colors, _gl.STREAM_DRAW);
  _gl.vertexAttribPointer(_a_color, 3, _gl.FLOAT, false, 0, 0);
  _gl.drawArrays(_gl.TRIANGLES, 0, _coords.length / 2);
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
  _divisions = _canvas.width === 600 ? 6 : 4;
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
    initGL();
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
```
