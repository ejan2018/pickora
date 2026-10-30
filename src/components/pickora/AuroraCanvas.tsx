"use client";

import { useEffect, useRef } from "react";

/**
 * AuroraCanvas — raw WebGL fragment shader background.
 * Slow silk-flow aurora in ember tones over deep charcoal, with film grain
 * and a soft vignette. No dependencies; degrades to a CSS gradient
 * (rendered by the parent) when WebGL is unavailable.
 * Honors prefers-reduced-motion by rendering a single static frame.
 */

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = rot * p * 2.03;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res.xy;
  vec2 p = uv;
  p.x *= u_res.x / max(u_res.y, 1.0);
  float t = u_time * 0.045;

  // Slow, layered silk field.
  float f1 = fbm(p * 1.6 + vec2(t, -t * 0.7));
  float f2 = fbm(p * 2.3 - vec2(t * 0.8, t * 0.5) + 3.7);
  float band = fbm(vec2(f1 * 2.2 + t * 0.3, p.y * 1.4 - f2 * 1.8));

  // Diagonal light streaks drifting through.
  float streak = pow(
    max(0.0, sin((p.x * 0.7 + p.y * 0.5) * 2.2 + f1 * 4.0 - t * 2.0)),
    6.0
  );

  // Palette: charcoal -> deep ember -> amber.
  vec3 base  = vec3(0.051, 0.063, 0.090);
  vec3 deep  = vec3(0.350, 0.070, 0.024);
  vec3 ember = vec3(1.000, 0.416, 0.000);
  vec3 amber = vec3(1.000, 0.698, 0.302);

  float m = smoothstep(0.35, 0.92, band);
  vec3 col = base;
  col = mix(col, deep, m * 0.55);
  col = mix(col, ember, smoothstep(0.55, 1.0, band) * (0.32 + 0.22 * f2));
  col += amber * streak * 0.26;

  // Soft glow behind the wordmark.
  float d = length(uv - vec2(0.5, 0.55));
  col += ember * exp(-d * 3.4) * 0.10;

  // Vignette + film grain.
  float vig = smoothstep(1.25, 0.35, length(uv - 0.5));
  col *= mix(0.70, 1.0, vig);
  float g = hash(gl_FragCoord.xy + fract(u_time) * vec2(17.0, 31.0));
  col += (g - 0.5) * 0.034;

  gl_FragColor = vec4(col, 1.0);
}
`;

export function AuroraCanvas({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const gl =
      (canvas.getContext("webgl", { antialias: false, alpha: false }) as WebGLRenderingContext | null) ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) return; // CSS fallback shows through

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    };

    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    const prog = gl.createProgram();
    if (!vs || !fs || !prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    // Fullscreen triangle.
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );
    const loc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");

    const resize = () => {
      // Soft blur field → half-res is visually identical and guaranteed
      // smooth, even where WebGL runs on the CPU (software rasterizer).
      const dpr = Math.min(window.devicePixelRatio || 1, 2) * 0.5;
      const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    resize();
    window.addEventListener("resize", resize);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();

    const draw = (now: number) => {
      resize();
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, reduced ? 24.0 : (now - start) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    let raf = 0;
    if (reduced) {
      draw(start); // single static frame
    } else {
      const loop = (now: number) => {
        if (!document.hidden) draw(now);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
     
  }, []);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
