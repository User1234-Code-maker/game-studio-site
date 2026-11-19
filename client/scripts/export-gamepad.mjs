// npm run model   ->   writes public/models/gamepad.glb
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Scene } from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { buildGamepad } from "./gamepad-model.mjs";

// GLTFExporter expects a browser; these two shims are all it needs for .glb.
globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf;
      this.onloadend?.();
    });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = `data:${blob.type};base64,${Buffer.from(buf).toString("base64")}`;
      this.onloadend?.();
    });
  }
};

const scene = new Scene();
scene.add(buildGamepad());
const glb = await new GLTFExporter().parseAsync(scene, { binary: true });
const out = fileURLToPath(new URL("../public/models/gamepad.glb", import.meta.url));
await mkdir(new URL("../public/models/", import.meta.url), { recursive: true });
await writeFile(out, Buffer.from(glb));
console.log(`wrote ${out} (${(glb.byteLength / 1024).toFixed(0)} KB)`);
