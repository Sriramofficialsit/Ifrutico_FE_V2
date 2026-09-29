import { useEffect, useRef, useState } from 'react';
import { mat4, quat, vec2, vec3 } from 'gl-matrix';
import './InfiniteMenu.css';

const discVertShaderSource = `#version 300 es
uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform vec3 uCameraPosition;
uniform vec4 uRotationAxisVelocity;
in vec3 aModelPosition;
in vec3 aModelNormal;
in vec2 aModelUvs;
in mat4 aInstanceMatrix;
out vec2 vUvs;
out float vAlpha;
flat out int vInstanceId;
#define PI 3.141593
void main() {
    vec4 worldPosition = uWorldMatrix * aInstanceMatrix * vec4(aModelPosition, 1.);
    vec3 centerPos = (uWorldMatrix * aInstanceMatrix * vec4(0., 0., 0., 1.)).xyz;
    float radius = length(centerPos.xyz);
    if (gl_VertexID > 0) {
        vec3 rotationAxis = uRotationAxisVelocity.xyz;
        float rotationVelocity = min(.15, uRotationAxisVelocity.w * 15.);
        vec3 stretchDir = normalize(cross(centerPos, rotationAxis));
        vec3 relativeVertexPos = normalize(worldPosition.xyz - centerPos);
        float strength = dot(stretchDir, relativeVertexPos);
        float invAbsStrength = min(0., abs(strength) - 1.);
        strength = rotationVelocity * sign(strength) * abs(invAbsStrength * invAbsStrength * invAbsStrength + 1.);
        worldPosition.xyz += stretchDir * strength;
    }
    worldPosition.xyz = radius * normalize(worldPosition.xyz);
    gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
    vAlpha = smoothstep(0.5, 1., normalize(worldPosition.xyz).z) * .9 + .1;
    vUvs = aModelUvs;
    vInstanceId = gl_InstanceID;
}
`;

const discFragShaderSource = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform int uItemCount;
uniform int uAtlasSize;
out vec4 outColor;
in vec2 vUvs;
in float vAlpha;
flat in int vInstanceId;
void main() {
    int itemIndex = vInstanceId % uItemCount;
    int cellsPerRow = uAtlasSize;
    int cellX = itemIndex % cellsPerRow;
    int cellY = itemIndex / cellsPerRow;
    vec2 cellSize = vec2(1.0) / vec2(float(cellsPerRow));
    vec2 cellOffset = vec2(float(cellX), float(cellY)) * cellSize;
    vec2 st = vec2(vUvs.x, 1.0 - vUvs.y);
    st = st * cellSize + cellOffset;
    outColor = texture(uTex, st);
    outColor.a *= vAlpha;
}
`;

class Face { constructor(a, b, c) { this.a = a; this.b = b; this.c = c; } }
class Vertex { constructor(x, y, z) { this.position = vec3.fromValues(x, y, z); this.normal = vec3.create(); this.uv = vec2.create(); } }

class Geometry {
  constructor() { this.vertices = []; this.faces = []; }
  addVertex(x, y, z) { this.vertices.push(new Vertex(x, y, z)); return this; }
  addFace(a, b, c) { this.faces.push(new Face(a, b, c)); return this; }
  subdivide(divisions = 1) {
    const midPointCache = {};
    let f = this.faces;
    for (let div = 0; div < divisions; ++div) {
      const newFaces = [];
      f.forEach(face => {
        const mAB = this.getMidPoint(face.a, face.b, midPointCache);
        const mBC = this.getMidPoint(face.b, face.c, midPointCache);
        const mCA = this.getMidPoint(face.c, face.a, midPointCache);
        newFaces.push(new Face(face.a, mAB, mCA), new Face(face.b, mBC, mAB), new Face(face.c, mCA, mBC), new Face(mAB, mBC, mCA));
      });
      f = newFaces;
    }
    this.faces = f; return this;
  }
  spherize(radius = 1) {
    this.vertices.forEach(v => { vec3.normalize(v.normal, v.position); vec3.scale(v.position, v.normal, radius); });
    return this;
  }
  get data() {
    return {
      vertices: new Float32Array(this.vertices.flatMap(v => [v.position[0], v.position[1], v.position[2]])),
      indices: new Uint16Array(this.faces.flatMap(f => [f.a, f.b, f.c])),
      uvs: new Float32Array(this.vertices.flatMap(v => [v.uv[0], v.uv[1]]))
    };
  }
  getMidPoint(ndxA, ndxB, cache) {
    const key = ndxA < ndxB ? `k_${ndxB}_${ndxA}` : `k_${ndxA}_${ndxB}`;
    if (cache[key] !== undefined) return cache[key];
    const a = this.vertices[ndxA].position, b = this.vertices[ndxB].position;
    const ndx = this.vertices.length; cache[key] = ndx;
    this.addVertex((a[0] + b[0]) * 0.5, (a[1] + b[1]) * 0.5, (a[2] + b[2]) * 0.5);
    return ndx;
  }
}

class IcosahedronGeometry extends Geometry {
  constructor() {
    super(); const t = (1 + Math.sqrt(5)) / 2;
    [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].forEach(v => this.addVertex(...v));
    [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]].forEach(f => this.addFace(...f));
  }
}

class DiscGeometry extends Geometry {
  constructor(steps = 56, radius = 1) {
    super(); this.addVertex(0, 0, 0); this.vertices[0].uv[0] = 0.5; this.vertices[0].uv[1] = 0.5;
    for (let i = 0; i < steps; ++i) {
      const a = (2 * Math.PI * i) / steps, x = Math.cos(a), y = Math.sin(a);
      this.addVertex(radius * x, radius * y, 0);
      const v = this.vertices[this.vertices.length - 1]; v.uv[0] = x * 0.5 + 0.5; v.uv[1] = y * 0.5 + 0.5;
      this.addFace(0, i + 1, (i + 1) % steps + 1 || 1);
    }
  }
}

function createShader(gl, type, source) {
  const s = gl.createShader(type); gl.shaderSource(s, source); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
  return s;
}

function createProgram(gl, vsSource, fsSource, attribs) {
  const p = gl.createProgram();
  gl.attachShader(p, createShader(gl, gl.VERTEX_SHADER, vsSource));
  gl.attachShader(p, createShader(gl, gl.FRAGMENT_SHADER, fsSource));
  if (attribs) Object.keys(attribs).forEach(k => gl.bindAttribLocation(p, attribs[k], k));
  gl.linkProgram(p); return p;
}

function makeBuffer(gl, data, type = gl.ARRAY_BUFFER) {
  const b = gl.createBuffer(); gl.bindBuffer(type, b); gl.bufferData(type, data, gl.STATIC_DRAW); return b;
}

class ArcballControl {
  constructor(canvas) {
    this.canvas = canvas; this.orientation = quat.create(); this.ptrRot = quat.create(); this.rotVel = 0; this.rotAxis = vec3.fromValues(1, 0, 0);
    this.snapDir = vec3.fromValues(0, 0, 1); this.snapTargetDir = null; this.isDown = false;
    this.pos = vec2.create(); this.prev = vec2.create(); this._combined = quat.create();
    canvas.addEventListener('pointerdown', e => { this.isDown = true; vec2.set(this.pos, e.clientX, e.clientY); vec2.copy(this.prev, this.pos); });
    window.addEventListener('pointerup', () => this.isDown = false);
    window.addEventListener('pointermove', e => { if (this.isDown) vec2.set(this.pos, e.clientX, e.clientY); });
  }
  update(dt) {
    const ts = dt / 16.67 + 0.0001; let snapRot = quat.create();
    if (this.isDown) {
      const d = vec2.sub(vec2.create(), this.pos, this.prev);
      if (vec2.len(d) > 0.1) {
        const axis = vec3.normalize(vec3.create(), [-d[1], -d[0], 0]);
        quat.setAxisAngle(this.ptrRot, axis, vec2.len(d) * 0.005 * ts);
        vec2.copy(this.prev, this.pos);
      } else quat.slerp(this.ptrRot, this.ptrRot, [0, 0, 0, 1], 0.3 * ts);
    } else {
      quat.slerp(this.ptrRot, this.ptrRot, [0, 0, 0, 1], 0.1 * ts);
      if (this.snapTargetDir) {
        const axis = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), this.snapTargetDir, this.snapDir));
        const angle = Math.acos(Math.max(-1, Math.min(1, vec3.dot(this.snapTargetDir, this.snapDir))));
        quat.setAxisAngle(snapRot, axis, angle * 0.2 * ts);
      }
    }
    const comb = quat.multiply(quat.create(), snapRot, this.ptrRot);
    this.orientation = quat.multiply(quat.create(), comb, this.orientation); quat.normalize(this.orientation, this.orientation);
    quat.slerp(this._combined, this._combined, comb, 0.8 * ts); quat.normalize(this._combined, this._combined);
    const r = Math.acos(this._combined[3]) * 2, s = Math.sin(r / 2);
    if (s > 0.00001) { this.rotVel = r / (2 * Math.PI) / ts; vec3.set(this.rotAxis, this._combined[0] / s, this._combined[1] / s, this._combined[2] / s); }
  }
}

class InfiniteGridMenu {
  constructor(canvas, items, onActive, onMove, scale = 1.0) {
    this.canvas = canvas; this.items = items; this.onActive = onActive; this.onMove = onMove; this.scale = scale;
    this.gl = canvas.getContext('webgl2', { antialias: true, alpha: false }); this.init();
  }
  init() {
    const gl = this.gl; this.prog = createProgram(gl, discVertShaderSource, discFragShaderSource, { aModelPosition: 0, aModelUvs: 2, aInstanceMatrix: 3 });
    this.locs = {
      uWorldMatrix: gl.getUniformLocation(this.prog, 'uWorldMatrix'), uViewMatrix: gl.getUniformLocation(this.prog, 'uViewMatrix'), uProjectionMatrix: gl.getUniformLocation(this.prog, 'uProjectionMatrix'),
      uCameraPosition: gl.getUniformLocation(this.prog, 'uCameraPosition'), uRotationAxisVelocity: gl.getUniformLocation(this.prog, 'uRotationAxisVelocity'),
      uTex: gl.getUniformLocation(this.prog, 'uTex'), uItemCount: gl.getUniformLocation(this.prog, 'uItemCount'), uAtlasSize: gl.getUniformLocation(this.prog, 'uAtlasSize')
    };
    const disc = new DiscGeometry().data; this.indexCount = disc.indices.length; this.vao = gl.createVertexArray(); gl.bindVertexArray(this.vao);
    makeBuffer(gl, disc.vertices); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    makeBuffer(gl, disc.uvs); gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);
    makeBuffer(gl, disc.indices, gl.ELEMENT_ARRAY_BUFFER);
    const ico = new IcosahedronGeometry(); ico.subdivide(1).spherize(2); this.instPos = ico.vertices.map(v => v.position);
    this.instMat = new Float32Array(this.instPos.length * 16); this.instBuff = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.instBuff); gl.bufferData(gl.ARRAY_BUFFER, this.instMat.byteLength, gl.DYNAMIC_DRAW);
    for (let i = 0; i < 4; i++) { gl.enableVertexAttribArray(3 + i); gl.vertexAttribPointer(3 + i, 4, gl.FLOAT, false, 64, i * 16); gl.vertexAttribDivisor(3 + i, 1); }
    this.tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, this.tex); this.atlasSize = Math.ceil(Math.sqrt(this.items.length));
    const c = document.createElement('canvas'), ctx = c.getContext('2d'), sz = 512; c.width = c.height = this.atlasSize * sz;
    Promise.all(this.items.map(it => new Promise(res => { const img = new Image(); img.crossOrigin = 'anonymous'; img.onload = () => res(img); img.src = it.image; }))).then(imgs => {
      imgs.forEach((img, i) => {
        const x = (i % this.atlasSize) * sz, y = Math.floor(i / this.atlasSize) * sz, asp = img.width / img.height;
        let w = sz, h = sz, ox = 0, oy = 0; if (asp > 1) { h = sz; w = sz * asp; ox = -(w - sz) / 2; } else { w = sz; h = sz / asp; oy = -(h - sz) / 2; }
        ctx.save(); ctx.beginPath(); ctx.rect(x, y, sz, sz); ctx.clip(); ctx.drawImage(img, x + ox, y + oy, w, h); ctx.restore();
      });
      gl.bindTexture(gl.TEXTURE_2D, this.tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c); gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    });
    this.ctrl = new ArcballControl(this.canvas); this.camPos = vec3.fromValues(0, 0, 3 * this.scale); this.run();
  }
  run(t = 0) {
    const gl = this.gl; const dt = Math.min(32, t - (this.lastT || t)); this.lastT = t; this.ctrl.update(dt);
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight; if (this.canvas.width !== w || this.canvas.height !== h) { this.canvas.width = w; this.canvas.height = h; gl.viewport(0, 0, w, h); }
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST);
    const view = mat4.lookAt(mat4.create(), this.camPos, [0, 0, 0], [0, 1, 0]);
    const proj = mat4.perspective(mat4.create(), Math.PI / 4, w / h, 0.1, 100);
    gl.useProgram(this.prog); gl.uniformMatrix4fv(this.locs.uWorldMatrix, false, mat4.create()); gl.uniformMatrix4fv(this.locs.uViewMatrix, false, view); gl.uniformMatrix4fv(this.locs.uProjectionMatrix, false, proj);
    gl.uniform3fv(this.locs.uCameraPosition, this.camPos); gl.uniform4f(this.locs.uRotationAxisVelocity, this.ctrl.rotAxis[0], this.ctrl.rotAxis[1], this.ctrl.rotAxis[2], this.ctrl.rotVel);
    gl.uniform1i(this.locs.uItemCount, this.items.length); gl.uniform1i(this.locs.uAtlasSize, this.atlasSize);
    this.instPos.forEach((p, i) => {
      const pw = vec3.transformQuat(vec3.create(), p, this.ctrl.orientation);
      const s = (Math.abs(pw[2]) / 2) * 0.6 + 0.4, f = s * 0.25, m = mat4.create();
      mat4.multiply(m, m, mat4.fromTranslation(mat4.create(), pw));
      mat4.multiply(m, m, mat4.targetTo(mat4.create(), [0, 0, 0], pw, [0, 1, 0]));
      mat4.multiply(m, m, mat4.fromScaling(mat4.create(), [f, f, f]));
      mat4.multiply(m, m, mat4.fromTranslation(mat4.create(), [0, 0, -2]));
      this.instMat.set(m, i * 16);
    });
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instBuff); gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.instMat); gl.bindVertexArray(this.vao); gl.drawElementsInstanced(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0, this.instPos.length);
    const move = this.ctrl.isDown || Math.abs(this.ctrl.rotVel) > 0.01; if (move !== this.wasMove) { this.wasMove = move; if (this.onMove) this.onMove(move); }
    if (!this.ctrl.isDown) {
      const inv = quat.conjugate(quat.create(), this.ctrl.orientation), nt = vec3.transformQuat(vec3.create(), this.ctrl.snapDir, inv);
      let maxD = -1, ni = 0; this.instPos.forEach((p, i) => { const d = vec3.dot(nt, p); if (d > maxD) { maxD = d; ni = i; } });
      if (this.onActive) this.onActive(ni % this.items.length);
      this.ctrl.snapTargetDir = vec3.normalize(vec3.create(), vec3.transformQuat(vec3.create(), this.instPos[ni], this.ctrl.orientation));
    }
    const targetZ = 3 * this.scale + (this.ctrl.isDown ? this.ctrl.rotVel * 50 : 0);
    this.camPos[2] += (targetZ - this.camPos[2]) * 0.1;
    requestAnimationFrame(time => this.run(time));
  }
}

export default function InfiniteMenu({ items = [], scale = 1.0 }) {
  const canvasRef = useRef(null), [activeItem, setActiveItem] = useState(null), [isMoving, setIsMoving] = useState(false);
  useEffect(() => {
    if (canvasRef.current && items.length) {
      const sketch = new InfiniteGridMenu(canvasRef.current, items, i => setActiveItem(items[i]), setIsMoving, scale);
    }
  }, [items, scale]);
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', touchAction: 'none' }} />
      {activeItem && (
        <>
          <h2 className={`face-title ${isMoving ? 'inactive' : 'active'}`}>{activeItem.title}</h2>
          <p className={`face-description ${isMoving ? 'inactive' : 'active'}`}> {activeItem.description}</p>
          <div onClick={() => activeItem.link?.startsWith('http') ? window.open(activeItem.link, '_blank') : null} className={`action-button ${isMoving ? 'inactive' : 'active'}`}>
            <p className="action-button-icon">&#x2197;</p>
          </div>
        </>
      )}
    </div>
  );
}
