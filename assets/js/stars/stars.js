const vert_shader_src = `#version 300 es
#pragma vscode_glsllint_stage: vert
precision highp float;

in vec2 position;
in vec2 translation;
in vec3 vertex_color;
out vec3 color;
uniform float u_rot;

void main(void) {
  mat2 rot_mat = mat2(cos(u_rot), sin(u_rot), -sin(u_rot), cos(u_rot));
  //mat2 scale_mat = mat2(0.2, 0.0, 0.0, 0.2);
	//gl_Position = vec4(rot_mat*scale_mat*position + translation, 0.0, 1.0);
	gl_Position = vec4(rot_mat*position + translation, 0.0, 1.0);
  if (gl_VertexID == 0) {
    color = vec3(0.0, 0.0, 0.0);
  } else {
    color = vertex_color;
  }
}`;

const frag_shader_src = `#version 300 es
#pragma vscode_glsllint_stage: frag
#ifdef GL_FRAGMENT_PRECISION_HIGH
	precision highp float;
#else
	precision mediump float;
#endif

in vec3 color;
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

  gl.clearColor(0.2, 0.3, 0.3, 1);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.viewport(0, 0, g.canvas.width, g.canvas.height);
}

function initProg() {
  const prog = createProgram();
  const gl = g.gl;
  gl.useProgram(prog);

  g.u_rot = gl.getUniformLocation(prog, 'u_rot');

  /*
   * Two coordinates(x, y) for 11 vertices(including the center)
   * is 22
   */
  const vert_posns = new Float32Array(22);
  const r1 = 0.18; //0.9; //larger radius
  const r2 = 0.08; //0.4; //smaller radius
  const vert_angle = (36 * Math.PI) / 180;
  vert_posns[0] = 0;
  vert_posns[1] = 0;
  for (let i = 0; i < 5; i++) {
    vert_posns[i * 4 + 2] = r1 * Math.cos(2 * i * vert_angle);
    vert_posns[i * 4 + 3] = r1 * Math.sin(2 * i * vert_angle);
    vert_posns[i * 4 + 4] = r2 * Math.cos((2 * i + 1) * vert_angle);
    vert_posns[i * 4 + 5] = r2 * Math.sin((2 * i + 1) * vert_angle);
  }

  const position = gl.getAttribLocation(prog, 'position');
  const pos_buf = gl.createBuffer();
  gl.enableVertexAttribArray(position);
  gl.bindBuffer(gl.ARRAY_BUFFER, pos_buf);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  gl.bufferData(gl.ARRAY_BUFFER, vert_posns, gl.STATIC_DRAW);

  //Three values(R,G,B) for 6 colors(for 6 stars) is 18
  const vert_colors = new Float32Array([
    0, 0.75, 1, 0.2, 0.8, 0.2, 0.48, 0.41, 0.93, 1.0, 0.55, 0.0, 0.69, 0.88,
    0.9, 0.87, 0.63, 0.87,
  ]);
  const vertex_color = gl.getAttribLocation(prog, 'vertex_color');
  const col_buf = gl.createBuffer();
  gl.enableVertexAttribArray(vertex_color);
  gl.bindBuffer(gl.ARRAY_BUFFER, col_buf);
  gl.vertexAttribPointer(vertex_color, 3, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(vertex_color, 1);
  gl.bufferData(gl.ARRAY_BUFFER, vert_colors, gl.STATIC_DRAW);

  const translations = new Float32Array(12);
  translations[0] = 0.0;
  translations[1] = 0.0;
  const star_angle = vert_angle * 2;
  for (let i = 0; i < 5; i++) {
    translations[2 * i + 2] = 0.5 * Math.cos(i * star_angle + Math.PI / 2);
    translations[2 * i + 3] = 0.5 * Math.sin(i * star_angle + Math.PI / 2);
  }

  const translation = gl.getAttribLocation(prog, 'translation');
  const trans_buf = gl.createBuffer();
  gl.enableVertexAttribArray(translation);
  gl.bindBuffer(gl.ARRAY_BUFFER, trans_buf);
  gl.vertexAttribPointer(translation, 2, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(translation, 1);
  gl.bufferData(gl.ARRAY_BUFFER, translations, gl.STATIC_DRAW);

  const index_buf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buf);
  const indices = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1]);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
}

function draw() {
  const gl = g.gl;
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.uniform1f(g.u_rot, g.rotn);
  gl.drawElementsInstanced(gl.TRIANGLE_FAN, 12, gl.UNSIGNED_BYTE, 0, 6);
}

function animate(delay) {
  const rotn_speed = 0.8; //radians per second
  const TWOPI = 2 * Math.PI;
  let then;
  function tick(now) {
    if (!then) {
      then = now;
    }
    const elapsed = now - then;
    if (elapsed > delay) {
      then = now;
      //elapsed is in milliseconds
      rotn_change = (rotn_speed * elapsed) / 1000;
      g.rotn += rotn_change;
      if (g.rotn > TWOPI) {
        g.rotn -= TWOPI;
      }
      draw();
    }
    g.animation_request = requestAnimationFrame(tick);
  }
  g.animation_request = requestAnimationFrame(tick);
}

function onResize() {
  if (g.animation_request) {
    cancelAnimationFrame(g.animation_request);
  }
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
  if (g.animation) {
    animate(16);
  } else {
    draw();
  }
}

function onClick() {
  g.animation = !g.animation;
  if (g.animation) {
    animate(16);
  } else {
    if (g.animation_request) {
      cancelAnimationFrame(g.animation_request);
    }
  }
}

function init() {
  g.canvas_div = document.querySelector('#canvas_div');
  g.canvas = document.querySelector('canvas');
  g.canvas.addEventListener('click', onClick);
  g.rotn = 0;
  g.animation = true;
  onResize();
}

window.addEventListener('load', init);
window.addEventListener('resize', onResize, false);
window.addEventListener('orientationchange', onResize, false);
