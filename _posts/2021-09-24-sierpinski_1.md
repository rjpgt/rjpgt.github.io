---
layout: post
title: 'Sierpinski gasket using points'
date: 2021-09-24 18:05:00 +0530
script: sierpinski_1
extracss: true
hascanvas: true
hasmath: true
---

Click( or touch ) any three points in the black square above to draw a so-called Sierpinski gasket.

I am refreshing my knowledge of Webgl. Now we have webgl2.

One way of drawing a Sierpinski gasket, as given by Wikipedia and other sources, is this:

1. Take 3 points that form a triangle.
2. Take a random point inside the triangle. Make that your current point.
3. Take a random corner( of the three corners ) of the triangle.
4. Find the midpoint of the line between the current point and the corner of step 3 and plot it. This is your new current point.
5. Repeat from step 3 until you have plotted the required number of points.

In the applet above, the three points that are clicked form the triangle that make up the Sierpinski gasket. To select the initial random point inside the triangle I choose two randomly interpolated points on two of the edges of the triangle and then find a randomly interpolated point on the line connecting them. Here is how all the points in the Sierpinski gasket are computed:

```javascript
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
```

We can plot these points using the canvas api. But since we are using webgl we need to write shader code. One advantage of webgl is that shader code is executed in parallel by the GPU for all the vertices, which here are the points we computed above. Not that for the number of points we are plotting it will make any discernible difference -- the canvas api is pretty fast too.

The computed points are sent to the GPU using a vertex buffer object, `_coords_buf`, and drawn using the simplest primitive of OpenGL or Webgl -- POINTS.

```javascript
function draw() {
  _gl.clear(_gl.COLOR_BUFFER_BIT);
  _gl.bindBuffer(_gl.ARRAY_BUFFER, _coords_buf);
  _gl.bufferData(_gl.ARRAY_BUFFER, _coords, _gl.STREAM_DRAW);
  _gl.drawArrays(_gl.POINTS, 0, _point_count);
}
```

Here is the shader code for the vertex and fragment shaders:

```glsl
#version 300 es
in vec2 a_coords;
uniform float u_pointsize;
uniform float u_width;
uniform float u_height;
void main() {
  float x = -1.0 + 2.0*(a_coords.x / u_width);
  float y = 1.0 - 2.0*(a_coords.y / u_height);
  gl_Position = vec4(x, y, 0.0, 1.0);
  gl_PointSize = u_pointsize;
}

#version 300 es
#ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
#else
  precision mediump float;
#endif
uniform vec3 u_color;
out vec4 out_color;
void main() {
  out_color = vec4(u_color, 1.0);
}
```

The points that are sent to the GPU are in pixel coordinates with $$x$$ going from 0 to the width of the canvas from left to right and $$y$$ going from 0 to the height of the canvas from _top_ to _bottom_. In Webgl, however, the coordinates go from -1 to 1 from left to right for $$x$$ and -1 to 1 from _bottom_ to _top_ for $$y$$. The conversion from pixel coordinates to normalized Webgl coordinates is carried out in the first two lines of the vertex shader code inside `main`. `u_width` and `u_height` are the canvas width and height.

Here is the entire code:

```javascript
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
