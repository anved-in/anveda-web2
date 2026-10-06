"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "@/components/Link";
import { createStage } from "./glass3d";

export interface Slide {
  image: string;
  title: string;
  blurb: string;
  href: string;
  /** Small tracked label above the title. Same wording across slides by
   *  default — it names the whole showcase, not the individual slide. */
  eyebrow?: string;
}

/**
 * The home page's opening: the same three featured collections as before, but
 * the photograph is drawn in WebGL, so it can have depth. It drifts against the
 * pointer, dissolves between slides through a ripple, and a set of real glass
 * bangles floats in front of it, refracting the photograph behind them with a
 * faint colour split along every edge.
 *
 * The plain HTML slider underneath is the whole component without WebGL: the
 * photographs, captions, arrows, dots and autoplay are all ordinary DOM, and
 * the canvas only ever replaces the photographs once it is actually drawing.
 */
export default function Hero3D({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [on3d, setOn3d] = useState(false);
  const n = slides.length;

  const host = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(0);
  const go = useCallback((d: number) => setI((c) => (c + d + n) % n), [n]);

  const still = useRef(false);
  useEffect(() => {
    still.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    activeRef.current = i;
  });

  useEffect(() => {
    if (n < 2 || paused || still.current) return;
    const t = window.setInterval(() => go(1), 6500);
    return () => window.clearInterval(t);
  }, [n, paused, go]);

  useEffect(() => {
    const hostEl = host.current;
    const cv = canvas.current;
    if (!hostEl || !cv || !n) return;

    let disposed = false;
    let raf = 0;
    let stageRef: { dispose: () => void } | null = null;
    const undo: Array<() => void> = [];

    const hooks: { fit?: () => void } = {};

    (async () => {
      let off: Array<[number, number, number]> = [[0, 0, 0], [-1.45, 1.0, 0.5], [1.4, 0.95, -0.4]];
      const stage = await createStage(cv, hostEl, {
        bg: "#f7f5f3",
        onResize: (s) => {
          const { w, h } = s.lay;
          const wide = w >= 860;
          const cx = w * (wide ? 0.74 : 0.5);
          const cy = h * (wide ? 0.4 : 0.34);
          const rpx = wide ? Math.min(w * 0.14, h * 0.28) : Math.min(w * 0.24, h * 0.2);
          s.place(cx, cy, rpx);
          off = wide
            ? [[0, 0, 0], [-1.45, 1.0, 0.5], [1.4, 0.95, -0.4]]
            : [[0, 0, 0], [-1.2, -1.0, 0.5], [1.2, 0.95, -0.4]];
          hooks.fit?.();
        },
      });
      if (!stage || disposed) { stage?.dispose(); return; }
      stageRef = stage;
      const { THREE, gl, scene, camera, world } = stage;
      const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
      const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

      /* The photograph, as a plane far behind the glass, so the glass refracts it. */
      const loader = new THREE.TextureLoader();
      const tex = await Promise.all(
        slides.map(
          (s) =>
            new Promise<InstanceType<typeof THREE.Texture> | null>((res) =>
              loader.load(s.image, (t) => {
                t.colorSpace = THREE.SRGBColorSpace;
                t.anisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy());
                res(t);
              }, undefined, () => res(null)),
            ),
        ),
      );
      if (disposed) { stage.dispose(); return; }
      if (tex.some((t) => !t)) { stage.dispose(); return; } // a photo failed: keep the HTML slider
      const T = tex as Array<InstanceType<typeof THREE.Texture>>;
      const aspect = (t: InstanceType<typeof THREE.Texture>) => {
        const im = t.image as { width: number; height: number };
        return im.width / im.height;
      };

      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.ShaderMaterial({
          toneMapped: false,
          uniforms: {
            tA: { value: T[0] }, tB: { value: T[0] },
            uAspA: { value: aspect(T[0]) }, uAspB: { value: aspect(T[0]) },
            uPlane: { value: 1 }, uMix: { value: 0 }, uZoom: { value: 1.08 },
            uShift: { value: new THREE.Vector2() }, uT: { value: 0 },
          },
          vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
          fragmentShader: `varying vec2 vUv; uniform sampler2D tA, tB; uniform float uAspA, uAspB, uPlane, uMix, uZoom, uT; uniform vec2 uShift;
            float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
            float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
              return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
            vec2 cover(vec2 uv, float pa, float ia){
              vec2 s = pa > ia ? vec2(1.0, ia / pa) : vec2(pa / ia, 1.0);
              return (uv - 0.5) * s + 0.5;
            }
            void main(){
              vec2 uv = (vUv - 0.5) / uZoom + 0.5 + uShift;
              float m = smoothstep(0.0, 1.0, uMix);
              float k = m * (1.0 - m) * 4.0;
              vec2 d = (vec2(n(vUv * 5.0 + uT * 0.2), n(vUv * 5.0 + 7.0)) - 0.5) * 0.09 * k;
              vec3 a = texture2D(tA, cover(uv + d * m, uPlane, uAspA)).rgb;
              vec3 b = texture2D(tB, cover(uv - d * (1.0 - m), uPlane, uAspB)).rgb;
              gl_FragColor = vec4(mix(a, b, m), 1.0);
            }`,
        }),
      );
      const PZ = -1.8;
      plane.position.z = PZ;
      scene.add(plane);
      hooks.fit = () => {
        const hgt = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * (camera.position.z - PZ);
        plane.scale.set(hgt * camera.aspect, hgt, 1);
        plane.material.uniforms.uPlane.value = camera.aspect;
      };
      hooks.fit();
      undo.push(() => { plane.geometry.dispose(); plane.material.dispose(); T.forEach((t) => t.dispose()); });

      /* The glass: a statement bangle with two slim ones, one gold-tinted. */
      const parts = [
        { R: 1, tube: 0.13, th: 0.3, tint: "#ffffff" },
        { R: 0.5, tube: 0.045, th: 0.12, tint: "#c8ae71" },
        { R: 0.42, tube: 0.04, th: 0.1, tint: "#ffffff" },
      ].map((p) => {
        const mat = stage.glass(p.th);
        mat.attenuationColor.set(p.tint);
        mat.attenuationDistance = p.tint === "#ffffff" ? 1.5 : 0.45;
        const geo = new THREE.TorusGeometry(p.R, p.tube, 56, 180);
        const g = new THREE.Group();
        g.add(new THREE.Mesh(geo, mat));
        world.add(g);
        return { g, mat, geo, ph: Math.random() * 6.28 };
      });
      const shardGeo = new THREE.OctahedronGeometry(1, 0);
      const shardMat = stage.glass(0.08);
      shardMat.dispersion = 3;
      const shards = Array.from({ length: 14 }, () => {
        const a = Math.random() * 6.283, d = 1.5 + Math.random() * 1.8;
        const m = new THREE.Mesh(shardGeo, shardMat);
        const s = 0.015 + Math.pow(Math.random(), 2) * 0.05;
        m.scale.set(s, s * (0.3 + Math.random() * 0.5), s * 0.2);
        m.position.set(Math.cos(a) * d, Math.sin(a) * d * 0.7, (Math.random() - 0.5) * 1.6);
        m.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
        m.userData = { b: m.position.clone(), ph: Math.random() * 6.28, sp: 0.3 + Math.random() * 0.5 };
        world.add(m);
        return m;
      });
      undo.push(() => { parts.forEach((p) => { p.geo.dispose(); p.mat.dispose(); }); shardGeo.dispose(); shardMat.dispose(); });

      stage.place(stage.lay.w * 0.74, stage.lay.h * 0.4, Math.min(stage.lay.w * 0.14, stage.lay.h * 0.28));

      const ptr = { x: 0, y: 0, sx: 0, sy: 0, px: 0, py: 0, moved: false };
      const onMove = (e: PointerEvent) => {
        const r = hostEl.getBoundingClientRect();
        ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1;
        ptr.y = ((e.clientY - r.top) / r.height) * 2 - 1;
        ptr.moved = true;
      };
      addEventListener("pointermove", onMove, { passive: true });
      undo.push(() => removeEventListener("pointermove", onMove));

      let visible = true;
      const io = new IntersectionObserver((en) => { visible = en[0]?.isIntersecting ?? true; });
      io.observe(hostEl);
      undo.push(() => io.disconnect());

      const u = plane.material.uniforms;
      let cur = 0, mix = 0, to = -1;
      const t0 = performance.now();
      let last = t0;
      setOn3d(true);

      const frame = (now: number) => {
        raf = requestAnimationFrame(frame);
        if (!visible) { last = now; return; }
        const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
        last = now;
        const t = Math.max(0, (now - t0) / 1000);
        const k = 1 - Math.pow(0.0009, dt);

        ptr.sx = lerp(ptr.sx, reduce ? 0 : ptr.x, k * 0.5);
        ptr.sy = lerp(ptr.sy, reduce ? 0 : ptr.y, k * 0.5);
        const speed = clamp(Math.hypot(ptr.x - ptr.px, ptr.y - ptr.py) / (Math.max(dt, 0.001) * 2.2));
        ptr.px = ptr.x; ptr.py = ptr.y;

        // slide change: ripple-dissolve from the current photo to the next
        if (to < 0 && activeRef.current !== cur) {
          to = activeRef.current;
          u.tB.value = T[to];
          u.uAspB.value = aspect(T[to]);
          mix = 0;
        }
        if (to >= 0) {
          mix = Math.min(1, mix + dt / 1.1);
          if (mix >= 1) {
            cur = to; to = -1; mix = 0;
            u.tA.value = T[cur]; u.uAspA.value = aspect(T[cur]);
            u.tB.value = T[cur]; u.uAspB.value = aspect(T[cur]);
          }
        }
        u.uMix.value = mix;
        u.uT.value = t;
        u.uZoom.value = 1.07 + (reduce ? 0 : Math.sin(t * 0.18) * 0.012);
        u.uShift.value.set(-ptr.sx * 0.018, ptr.sy * 0.012);

        const intro = reduce ? 1 : 1 - Math.pow(1 - clamp(t / 1.6), 4);
        world.rotation.x = -0.25 + ptr.sy * 0.4 + (reduce ? 0 : Math.sin(t * 0.45) * 0.05);
        world.rotation.y = ptr.sx * 0.55 + (1 - intro) * 1.2 + (reduce ? 0 : Math.cos(t * 0.33) * 0.07);
        world.rotation.z = reduce ? 0 : Math.sin(t * 0.12) * 0.08;

        parts.forEach((p, idx) => {
          const o = off[idx];
          const fl = reduce ? 0 : Math.sin(t * 0.6 + p.ph);
          p.g.position.set(o[0] - ptr.sx * 0.1 * idx, o[1] + fl * 0.05 * (idx + 1) + ptr.sy * 0.07 * idx, o[2]);
          p.g.rotation.x = ptr.sy * 0.2 * idx;
          p.g.rotation.y = ptr.sx * 0.28 * idx;
          p.mat.dispersion = 1.2 + speed * 2.2;
        });
        shards.forEach((s) => {
          const ud = s.userData as { b: InstanceType<typeof THREE.Vector3>; ph: number; sp: number };
          if (!reduce) {
            s.position.set(ud.b.x + Math.sin(t * ud.sp + ud.ph) * 0.08, ud.b.y + Math.cos(t * ud.sp * 0.8 + ud.ph) * 0.08, ud.b.z);
            s.rotation.x += dt * 0.4; s.rotation.y += dt * 0.3;
          }
        });
        scene.environmentRotation.set(ptr.sy * 0.3, ptr.sx * 0.8 + (reduce ? 0 : t * 0.02), 0);
        stage.fringe(0.007 + speed * 0.014);
        stage.render();
      };
      raf = requestAnimationFrame(frame);
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      undo.forEach((f) => f());
      stageRef?.dispose();
    };
  }, [slides, n]);

  if (!n) return null;

  return (
    <section
      ref={host}
      className="relative aspect-square w-full overflow-hidden bg-cream-2 sm:aspect-[16/8] md:aspect-[22/8]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured collections"
    >
      <canvas
        ref={canvas}
        aria-hidden="true"
        className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${on3d ? "opacity-100" : "opacity-0"}`}
      />

      {slides.map((s, k) => (
        <div
          key={s.href}
          className={[
            "absolute inset-0 transition-opacity duration-700",
            k === i ? "opacity-100" : "pointer-events-none opacity-0",
          ].join(" ")}
          aria-hidden={k === i ? undefined : true}
        >
          {/* The photograph is part of the WebGL scene once it is drawing; until
              then (or without WebGL) this is the picture. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={s.image}
            alt=""
            className={`h-full w-full object-cover transition-opacity duration-700 ${on3d ? "opacity-0" : ""}`}
            fetchPriority={k === 0 ? "high" : "low"}
            loading="eager"
            decoding="async"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(100deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,.15) 42%, rgba(0,0,0,0) 62%)",
            }}
          />
          <div className="absolute inset-y-0 right-0 flex w-[88%] max-w-[480px] flex-col justify-center p-6 sm:p-10 md:p-14">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.24em] text-white/80">
              {s.eyebrow ?? "The ANVEDA Collection"}
            </span>
            <h2 className="mt-3 font-display text-[clamp(34px,5.2vw,64px)] leading-[0.98] text-white">
              {s.title}
            </h2>
            <span className="mt-5 block h-px w-10 bg-white/50" aria-hidden="true" />
            <p className="mt-5 max-w-[42ch] text-[13.5px] leading-relaxed text-white/85 md:text-[14.5px]">
              {s.blurb}
            </p>
            <Link
              href={s.href}
              className="mt-7 inline-flex w-fit items-center gap-3 border border-white/70 px-7 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-white hover:text-ink"
            >
              Shop now
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
        </div>
      ))}

      {n > 1 && (
        <>
          {/* Numbered rail (sm+): which slide is active, and a direct jump to
              any other. Desktop-width real estate only — on a short mobile
              hero this and the arrow pair would collide, so mobile falls
              back to plain centred dots instead. */}
          <div className="absolute left-6 top-1/2 hidden -translate-y-1/2 flex-col gap-2.5 sm:flex md:left-10">
            {slides.map((s, k) => (
              <button
                key={s.href}
                type="button"
                onClick={() => setI(k)}
                className="group flex items-center gap-2"
                aria-label={`Go to slide ${k + 1}`}
                aria-current={k === i || undefined}
              >
                <span className={["text-[12px] font-semibold tabular-nums transition-colors", k === i ? "text-white" : "text-white/50 group-hover:text-white/80"].join(" ")}>
                  {String(k + 1).padStart(2, "0")}
                </span>
                <span className={["h-px transition-all", k === i ? "w-5 bg-white" : "w-2.5 bg-white/40"].join(" ")} aria-hidden="true" />
              </button>
            ))}
          </div>

          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2 sm:hidden">
            {slides.map((s, k) => (
              <button
                key={s.href}
                type="button"
                onClick={() => setI(k)}
                className={["h-1.5 rounded-full transition-all", k === i ? "w-5 bg-white" : "w-1.5 bg-white/55"].join(" ")}
                aria-label={`Go to slide ${k + 1}`}
                aria-current={k === i || undefined}
              />
            ))}
          </div>

          {/* Arrows: edge-positioned on mobile (clear of both the dots and
              the right-side text column), bottom-right on sm+ to match the
              reference, clear of the numbered rail on the opposite side. */}
          {([-1, 1] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => go(d)}
              className={[
                "absolute flex h-9 w-9 items-center justify-center rounded-full border border-white/60 text-white transition-colors hover:bg-white hover:text-ink",
                "top-1/2 -translate-y-1/2 sm:top-auto sm:bottom-6 sm:translate-y-0 md:bottom-10",
                d === -1 ? "left-2 sm:left-auto sm:right-[52px] md:right-[58px]" : "right-2 sm:right-6 md:right-10",
              ].join(" ")}
              aria-label={d === -1 ? "Previous slide" : "Next slide"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d={d === -1 ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
              </svg>
            </button>
          ))}
        </>
      )}
    </section>
  );
}
