"use client";

import { useEffect, useRef } from "react";

/**
 * EmberFlowCanvas — raw WebGL background for the About-the-Creator page.
 *
 * A calmer companion to the intro's AuroraCanvas: horizontal ember waves
 * drifting like heat haze, with faint rising sparks. Performance-first:
 *  - devicePixelRatio capped at 1.5 (full-page canvas = a lot of pixels)
 *  - IntersectionObserver pauses rendering while scrolled offscreen
 *  - stops entirely when the tab is hidden
 *  - prefers-reduced-motion renders a single static frame
 *  - full cleanup on unmount (context loss + listeners)
 * Falls back to the parent's CSS gradient when WebGL is unavailable.
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
  for (int i = 0; i < 3; i++) {
    v += a * noise(p);
    p = rot * p * 2.02;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res.xy;
  vec2 p = uv;
  p.x *= u_res.x / max(u_res.y, 1.0);
  float t = u_time * 0.06;

  // Layered horizontal waves rising like heat haze.
  float w1 = fbm(vec2(p.x * 1.4, p.y * 2.6 - t * 1.6));
  float w2 = fbm(vec2(p.x * 2.2 + 9.1, p.y * 3.4 - t * 2.4));
  float wave = w1 * 0.65 + w2 * 0.35;

  // Palette: near-black charcoal -> deep ember -> warm amber glow.
  vec3 base  = vec3(0.043, 0.055, 0.082);
  vec3 deep  = vec3(0.290, 0.055, 0.020);
  vec3 ember = vec3(0.960, 0.380, 0.050);
  vec3 amber = vec3(1.000, 0.760, 0.420);

  float band = smoothstep(0.30, 0.85, wave + (uv.y - 0.35) * 0.35);
  vec3 col = base;
  col = mix(col, deep, band * 0.62);
  col = mix(col, ember, smoothstep(0.62, 1.0, wave) * 0.30);

  // Rising sparks — deterministic pseudo-particles from hashed cells.
  for (int i = 0; i < 2; i++) {
    float fi = float(i);
    vec2 cell = vec2(p.x * (2.0 + fi * 0.7), p.y * 3.0 - t * (0.9 + fi * 0.5));
    vec2 id = floor(cell);
    vec2 f = fract(cell) - 0.5;
    float rnd = hash(id + fi * 17.0);
    if (rnd > 0.955) {
      vec2 off = vec2(hash(id + 3.7) - 0.5, hash(id + 9.2) - 0.5) * 0.55;
      float d = length(f - off);
      float tw = 0.55 + 0.45 * sin(u_time * (1.5 + rnd * 3.0) + rnd * 40.0);
      col += amber * exp(-d * 22.0) * 0.34 * tw * (1.0 - uv.y * 0.55);
    }
  }

  // Warm glow pooling behind the profile card.
  float d = length(uv - vec2(0.5, 0.46));
  col += ember * exp(-d * 2.6) * 0.12;

  // Vignette + fine grain.
  float vig = smoothstep(1.3, 0.35, length(uv - 0.5));
  col *= mix(0.72, 1.0, vig);
  float g = hash(gl_FragCoord.xy + fract(u_time) * vec2(19.0, 29.0));
  col += (g - 0.5) * 0.028;

  gl_FragColor = vec4(col, 1.0);
}
`;

export function EmberFlowCanvas({ className = "" }: { className?: string }) {
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

    // Full-page canvas → render at reduced resolution. The content is a
    // soft blur field, so half-res is visually identical and guaranteed
    // smooth — even on machines that rasterize WebGL in software.
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5) * 0.5;
      const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    resize();
    let resizeRaf = 0;
    const onResize = () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(resize);
    };
    window.addEventListener("resize", onResize);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();

    const draw = (now: number) => {
      resize();
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, reduced ? 21.0 : (now - start) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    let visible = true;
    let raf = 0;

    if (reduced) {
      draw(start); // single static frame, zero GPU after that
    } else {
      const loop = (now: number) => {
        if (!document.hidden && visible) draw(now);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);

      // Pause while the canvas is scrolled out of view.
      const io = new IntersectionObserver(
        (entries) => {
          visible = entries.some((e) => e.isIntersecting);
        },
        { rootMargin: "80px" }
      );
      io.observe(canvas);
      return () => {
        cancelAnimationFrame(raf);
        cancelAnimationFrame(resizeRaf);
        window.removeEventListener("resize", onResize);
        io.disconnect();
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      };
    }

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(resizeRaf);
      window.removeEventListener("resize", onResize);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
