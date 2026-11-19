import { useEffect, useRef } from "react";
import type { Object3D } from "three";
import {
  ACESFilmicToneMapping,
  DirectionalLight,
  Group,
  Mesh,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  WebGLRenderer,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { useReducedMotion } from "@/hooks/useMediaQuery";

// Node names inside the .glb (see client/scripts/gamepad-model.mjs). A model
// exported from Blender can replace the file: missing nodes are just skipped.
const BUTTONS = ["button_a", "button_b", "button_x", "button_y"];
const STICKS = ["stick_left", "stick_right"];

const MODEL_URL = `${import.meta.env.BASE_URL}models/gamepad.glb`;
const BASE_TILT = { x: -0.32, y: -0.18 };

type Props = {
  /** Called once the first frame is on screen, so the still picture can step aside. */
  onReady: () => void;
  onError: () => void;
};

export default function GamepadScene({ onReady, onError }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    } catch {
      onError();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    const canvas = renderer.domElement;
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText = "display:block;width:100%;height:100%";
    el.appendChild(canvas);

    const scene = new Scene();
    const pmrem = new PMREMGenerator(renderer);
    const envTarget = pmrem.fromScene(new RoomEnvironment(), 0.04, 0.1, 100, { size: 64 });
    scene.environment = envTarget.texture;
    scene.environmentIntensity = 0.7;

    const key = new DirectionalLight(0xffffff, 1.4);
    key.position.set(-4, 6, 8);
    const rim = new DirectionalLight(0xfa8e1b, 2.6); // brand orange, from behind
    rim.position.set(6, 2, -5);
    scene.add(key, rim);

    const camera = new PerspectiveCamera(26, 1, 0.1, 100);
    camera.position.set(0, 0.6, 27);
    camera.lookAt(0, 1.4, 0);

    const pivot = new Group(); // tilt + float
    pivot.position.x = 0.9; // leaves room for the Unity logo on the left
    scene.add(pivot);

    const pointer = { x: 0, y: 0 };
    const view = { x: BASE_TILT.x, y: BASE_TILT.y };
    let model: Group | null = null;
    const parts: Record<string, Object3D | undefined> = {};
    const home: Record<string, { x: number; y: number; z: number }> = {};

    let raf = 0;
    let running = false;
    let inView = true;
    let disposed = false;
    const clock = performance.now();

    const render = () => renderer.render(scene, camera);

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const t = (now - clock) / 1000;

      const targetY = BASE_TILT.y + pointer.x * 0.5 + Math.sin(t * 0.5) * 0.1;
      const targetX = BASE_TILT.x + pointer.y * 0.28 + Math.cos(t * 0.65) * 0.04;
      view.x += (targetX - view.x) * 0.06;
      view.y += (targetY - view.y) * 0.06;
      pivot.rotation.set(view.x, view.y, 0);
      pivot.position.y = Math.sin(t * 1.1) * 0.14;

      // one face button is pressed at a time
      const slot = Math.floor(t / 1.3) % (BUTTONS.length + 1);
      const phase = (t % 1.3) / 1.3;
      const press = Math.sin(Math.min(phase / 0.35, 1) * Math.PI) * (phase < 0.35 ? 1 : 0);
      BUTTONS.forEach((name, i) => {
        const b = parts[name];
        const h = home[name];
        if (b && h) b.position.z = h.z - (slot === i ? press * 0.09 : 0);
      });
      STICKS.forEach((name, i) => {
        const s = parts[name];
        const h = home[name];
        if (!s || !h) return;
        s.position.x = h.x + Math.sin(t * 1.4 + i * 2) * 0.03;
        s.position.y = h.y + Math.cos(t * 1.1 + i) * 0.03;
      });
      render();
    };

    const start = () => {
      if (running || disposed || reduced || !model || !inView || document.hidden) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const resize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      render();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      inView = entry.isIntersecting;
      if (inView) start();
      else stop();
    });
    io.observe(el);

    const onPointer = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const onVisibility = () => (document.hidden ? stop() : start());
    if (!reduced) window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    new GLTFLoader().load(
      MODEL_URL,
      (gltf) => {
        if (disposed) return;
        model = gltf.scene as unknown as Group;
        model.position.y = 0.55; // body centre to the pivot
        pivot.add(model);
        for (const name of [...BUTTONS, ...STICKS]) {
          const node = model.getObjectByName(name);
          if (!node) continue;
          parts[name] = node;
          home[name] = { x: node.position.x, y: node.position.y, z: node.position.z };
        }
        pivot.rotation.set(view.x, view.y, 0);
        resize();
        render();
        onReady();
        start();
      },
      undefined,
      () => onError(),
    );

    return () => {
      disposed = true;
      stop();
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
      scene.traverse((obj) => {
        if (obj instanceof Mesh) {
          obj.geometry.dispose();
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m) => m.dispose());
        }
      });
      envTarget.dispose();
      pmrem.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, [reduced, onReady, onError]);

  return <div ref={host} className="hero__3d" />;
}
