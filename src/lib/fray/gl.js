// WebGL2 fabric renderer. One instanced triangle strip draws every thread;
// y and activity come from two (minute × day) textures blended by uT so weaves
// morph. antialias:false, DPR capped at 2 (render-budget levers).

const VS = `#version 300 es
precision highp float;
uniform sampler2D uTex0, uTex1;
uniform float uT, uMinStep, uThickPx, uCanvasW, uCanvasH, uReveal, uGlobalDim, uAlpha;
uniform vec4 uPad;      // l, r, t, b fractions of canvas
uniform vec3 uDim;      // xNorm0, xNorm1, outside-factor
uniform int uForceRow;
uniform int uOnlyMajor;
uniform float uForceThick, uForceAlpha;
uniform float uHalo;    // 1 = paint the ground colour instead of the activity's
uniform vec3 uBg;
uniform vec3 uPal[12];
out vec4 vColor;

float yAt(int row, int minute) {
  vec4 a = texelFetch(uTex0, ivec2(row, minute), 0);
  vec4 b = texelFetch(uTex1, ivec2(row, minute), 0);
  return mix((a.r * 65280.0 + a.g * 255.0) / 65535.0,
             (b.r * 65280.0 + b.g * 255.0) / 65535.0, uT);
}

void main() {
  int s = gl_VertexID >> 1;
  float side = float(gl_VertexID & 1) * 2.0 - 1.0;
  int row = uForceRow >= 0 ? uForceRow : gl_InstanceID;
  int minute = int(round(float(s) * uMinStep));
  minute = clamp(minute, 0, 1439);
  vec4 t0 = texelFetch(uTex0, ivec2(row, minute), 0);
  vec4 t1 = texelFetch(uTex1, ivec2(row, minute), 0);
  float y0 = (t0.r * 65280.0 + t0.g * 255.0) / 65535.0;
  float y1 = (t1.r * 65280.0 + t1.g * 255.0) / 65535.0;
  float y01 = mix(y0, y1, uT);
  float a = mix(t0.a, t1.a, uT);
  int major = int(t1.b * 255.0 + 0.5);

  float xNorm = float(minute) / 1439.0;
  float x01 = uPad.x + xNorm * (1.0 - uPad.x - uPad.y);
  float yS = uPad.z + y01 * (1.0 - uPad.z - uPad.w);
  float thick = uForceRow >= 0 ? uForceThick : uThickPx;

  // A fabric thread is a hair, so offsetting it straight up and down costs
  // nothing. The lit thread is a ribbon, and where a person changes activity it
  // runs nearly vertical — offset that straight up and it collapses to a
  // hairline, so the bold horizontal runs end up joined by threads of gaps.
  // Expanding along the segment normal keeps one width the whole way round.
  // Only the forced row pays for the two extra fetches; the fabric skips them.
  vec2 nrm = vec2(0.0, 1.0);
  if (uForceRow >= 0) {
    int step = int(uMinStep + 0.5) + 1;
    int mA = clamp(minute - step, 0, 1439);
    int mB = clamp(minute + step, 0, 1439);
    float dxPx = (float(mB - mA) / 1439.0) * (1.0 - uPad.x - uPad.y) * uCanvasW;
    float dyPx = (yAt(row, mB) - yAt(row, mA)) * (1.0 - uPad.z - uPad.w) * uCanvasH;
    vec2 dir = normalize(vec2(max(dxPx, 0.001), dyPx));
    nrm = vec2(-dir.y, dir.x);
  }
  vec2 offPx = nrm * (side * thick * 0.5);
  gl_Position = vec4((x01 * 2.0 - 1.0) + offPx.x * 2.0 / uCanvasW,
                     (1.0 - 2.0 * yS) - offPx.y * 2.0 / uCanvasH, 0.0, 1.0);

  float f = 0.014;
  float inside = smoothstep(uDim.x - f, uDim.x + f, xNorm) * (1.0 - smoothstep(uDim.y - f, uDim.y + f, xNorm));
  float dimF = mix(uDim.z, 1.0, inside);
  float reveal = smoothstep(xNorm, xNorm + 0.10, uReveal * 1.10);
  float alpha = (uForceRow >= 0 ? uForceAlpha : uAlpha) * a * dimF * reveal * uGlobalDim;
  if (uOnlyMajor >= 0 && major != uOnlyMajor) alpha *= 0.08;
  vColor = vec4(mix(uPal[major], uBg, uHalo), alpha);
}`;

const FS = `#version 300 es
precision highp float;
in vec4 vColor;
out vec4 outColor;
void main() { outColor = vColor; }`;

export function createRenderer(canvas, K, palette, bg) {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' });
  if (!gl) return null;

  const prog = gl.createProgram();
  for (const [type, src] of [[gl.VERTEX_SHADER, VS], [gl.FRAGMENT_SHADER, FS]]) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
    gl.attachShader(prog, sh);
  }
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);

  const U = {};
  for (const name of ['uTex0', 'uTex1', 'uT', 'uMinStep', 'uThickPx', 'uCanvasW', 'uCanvasH', 'uReveal',
    'uGlobalDim', 'uAlpha', 'uPad', 'uDim', 'uForceRow', 'uForceThick', 'uForceAlpha', 'uPal', 'uOnlyMajor',
    'uHalo', 'uBg'])
    U[name] = gl.getUniformLocation(prog, name);
  gl.uniform3fv(U.uBg, bg);

  const palFlat = new Float32Array(36);
  palette.forEach((rgb, i) => palFlat.set(rgb, i * 3));
  gl.uniform3fv(U.uPal, palFlat);
  gl.uniform1i(U.uTex0, 0);
  gl.uniform1i(U.uTex1, 1);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(...bg, 1);

  function makeTex(bytes) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, K, 1440, 0, gl.RGBA, gl.UNSIGNED_BYTE, bytes);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  }
  function updateTex(tex, bytes) {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, K, 1440, gl.RGBA, gl.UNSIGNED_BYTE, bytes);
  }

  function draw(state) {
    const { tex0, tex1, t, samples, thickPx, hiPx, haloPx, pad, dim, reveal, globalDim, alpha, selected, drawCount, onlyMajor = -1 } = state;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, tex1);
    gl.uniform1f(U.uT, t);
    gl.uniform1f(U.uMinStep, 1439 / (samples - 1));
    gl.uniform1f(U.uThickPx, thickPx);
    gl.uniform1f(U.uCanvasW, canvas.width);
    gl.uniform1f(U.uCanvasH, canvas.height);
    gl.uniform1f(U.uReveal, reveal);
    gl.uniform1f(U.uGlobalDim, selected >= 0 ? globalDim : 1.0);
    gl.uniform1f(U.uAlpha, alpha);
    gl.uniform4fv(U.uPad, pad);
    gl.uniform3fv(U.uDim, dim);
    gl.uniform1i(U.uForceRow, -1);
    gl.uniform1i(U.uOnlyMajor, onlyMajor);
    gl.uniform1f(U.uHalo, 0.0);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, samples * 2, drawCount);

    if (selected >= 0) {
      // The lit thread is a mark, not a thread: it has to read over a fabric of
      // its own colour, so it is drawn last, at a fixed width, over a ground-
      // coloured halo that cuts it out of whatever band it is passing through.
      // Without the halo a lavender sleeper vanishes inside the lavender band.
      gl.uniform1f(U.uGlobalDim, 1.0);
      gl.uniform1i(U.uOnlyMajor, -1);
      gl.uniform1i(U.uForceRow, selected);
      gl.uniform1f(U.uForceAlpha, 1.0);
      gl.uniform1f(U.uHalo, 1.0);
      gl.uniform1f(U.uForceThick, haloPx);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, samples * 2, 1);
      gl.uniform1f(U.uHalo, 0.0);
      gl.uniform1f(U.uForceThick, hiPx);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, samples * 2, 1);
    }
  }

  return { gl, makeTex, updateTex, draw };
}
