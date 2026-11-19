// Builds the hero gamepad from plain geometry. It runs in Node (see
// export-gamepad.mjs) and produces public/models/gamepad.glb, which the site
// loads at runtime. To use a model made in Blender, replace that .glb file:
// the page animates the nodes named below and ignores any that are missing.
import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/** Node names the page looks for (see GamepadScene.tsx). */
export const NODE = {
  root: "gamepad",
  stickL: "stick_left",
  stickR: "stick_right",
  buttonA: "button_a",
  buttonB: "button_b",
  buttonX: "button_x",
  buttonY: "button_y",
};

const BODY_DEPTH = 0.9;
const BODY_BEVEL = 0.38;
const TOP = BODY_DEPTH / 2 + BODY_BEVEL; // z of the upper face of the shell

function smooth(geometry) {
  geometry.deleteAttribute("normal");
  geometry.deleteAttribute("uv");
  const merged = mergeVertices(geometry, 1e-4);
  merged.computeVertexNormals();
  return merged;
}

function outline() {
  const s = new THREE.Shape();
  s.moveTo(-1.5, 1.2);
  s.bezierCurveTo(-2.5, 1.5, -3.15, 1.1, -3.2, 0.15);
  s.bezierCurveTo(-3.3, -0.9, -3.35, -1.9, -2.8, -2.25);
  s.bezierCurveTo(-2.2, -2.6, -1.55, -2.05, -1.35, -1.25);
  s.bezierCurveTo(-1.15, -0.85, -0.6, -0.7, 0, -0.7);
  s.bezierCurveTo(0.6, -0.7, 1.15, -0.85, 1.35, -1.25);
  s.bezierCurveTo(1.55, -2.05, 2.2, -2.6, 2.8, -2.25);
  s.bezierCurveTo(3.35, -1.9, 3.3, -0.9, 3.2, 0.15);
  s.bezierCurveTo(3.15, 1.1, 2.5, 1.5, 1.5, 1.2);
  s.bezierCurveTo(1.0, 1.05, 0.5, 0.95, 0, 0.95);
  s.bezierCurveTo(-0.5, 0.95, -1.0, 1.05, -1.5, 1.2);
  return s;
}

function shell(material) {
  const geo = new THREE.ExtrudeGeometry(outline(), {
    depth: BODY_DEPTH,
    bevelEnabled: true,
    bevelThickness: BODY_BEVEL,
    bevelSize: BODY_BEVEL,
    bevelSegments: 8,
    curveSegments: 28,
  });
  geo.translate(0, 0, -BODY_DEPTH / 2);
  const mesh = new THREE.Mesh(smooth(geo), material);
  mesh.name = "shell";
  return mesh;
}

function thumbstick(name, x, y, white, dark) {
  const g = new THREE.Group();
  g.name = name;
  g.position.set(x, y, TOP - 0.02);

  // recessed collar
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.09, 12, 40), white);
  collar.position.z = 0.02;
  g.add(collar);

  // cap: lathe profile with a shallow dish on top
  const profile = [
    [0.0, 0.0],
    [0.5, 0.0],
    [0.52, 0.1],
    [0.46, 0.26],
    [0.4, 0.3],
    [0.3, 0.27],
    [0.0, 0.22],
  ].map(([r, z]) => new THREE.Vector2(r, z));
  const cap = new THREE.Mesh(smooth(new THREE.LatheGeometry(profile, 40).rotateX(Math.PI / 2)), white);
  cap.position.z = 0.04;
  cap.name = name + "_cap";
  g.add(cap);

  // soft dark ring under the cap gives a hint of depth
  const well = new THREE.Mesh(new THREE.CircleGeometry(0.66, 48), dark);
  well.position.z = -0.005;
  g.add(well);
  return g;
}

function dpad(x, y, white, dark) {
  const g = new THREE.Group();
  g.name = "dpad";
  g.position.set(x, y, TOP - 0.02);
  const well = new THREE.Mesh(new THREE.CircleGeometry(0.72, 48), dark);
  well.position.z = -0.005;
  g.add(well);

  const a = 0.22;
  const l = 0.62;
  const r = 0.09;
  const s = new THREE.Shape();
  s.moveTo(-a, l);
  s.lineTo(a, l);
  s.lineTo(a, a);
  s.lineTo(l, a);
  s.lineTo(l, -a);
  s.lineTo(a, -a);
  s.lineTo(a, -l);
  s.lineTo(-a, -l);
  s.lineTo(-a, -a);
  s.lineTo(-l, -a);
  s.lineTo(-l, a);
  s.lineTo(-a, a);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.06,
    bevelEnabled: true,
    bevelThickness: r,
    bevelSize: r,
    bevelSegments: 6,
  });
  const cross = new THREE.Mesh(smooth(geo), white);
  cross.position.z = 0.01;
  g.add(cross);
  return g;
}

function faceButton(name, x, y, color) {
  const mat = new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.38,
    clearcoat: 0.8,
    clearcoatRoughness: 0.3,
  });
  const profile = [
    [0, 0],
    [0.27, 0],
    [0.28, 0.06],
    [0.24, 0.16],
    [0.15, 0.2],
    [0, 0.21],
  ].map(([r, z]) => new THREE.Vector2(r, z));
  const mesh = new THREE.Mesh(smooth(new THREE.LatheGeometry(profile, 28).rotateX(Math.PI / 2)), mat);
  mesh.name = name;
  mesh.position.set(x, y, TOP - 0.03);
  return mesh;
}

function smallButton(x, y, white) {
  const geo = new THREE.CapsuleGeometry(0.09, 0.2, 8, 16).rotateZ(Math.PI / 2);
  const m = new THREE.Mesh(geo, white);
  m.scale.set(1, 1, 0.5);
  m.position.set(x, y, TOP - 0.02);
  return m;
}

function bumper(side, white) {
  const s = new THREE.Shape();
  s.moveTo(-0.9, 0);
  s.quadraticCurveTo(0, 0.28, 0.9, 0);
  s.quadraticCurveTo(0.95, -0.14, 0.7, -0.2);
  s.quadraticCurveTo(0, -0.02, -0.7, -0.2);
  s.quadraticCurveTo(-0.95, -0.14, -0.9, 0);
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.35,
    bevelEnabled: true,
    bevelThickness: 0.1,
    bevelSize: 0.08,
    bevelSegments: 6,
  });
  const m = new THREE.Mesh(smooth(geo), white);
  m.name = "bumper_" + side;
  m.position.set(side === "l" ? -2.15 : 2.15, 1.18, -0.15);
  m.rotation.z = side === "l" ? 0.18 : -0.18;
  return m;
}

function cable(white) {
  const curve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(0, 0.9, 0),
      new THREE.Vector3(0.02, 1.5, -0.1),
      new THREE.Vector3(0.25, 2.4, -0.25),
      new THREE.Vector3(0.05, 3.3, -0.2),
      new THREE.Vector3(0.4, 4.3, -0.3),
      new THREE.Vector3(0.3, 5.5, -0.3),
      new THREE.Vector3(-0.1, 6.8, -0.3),
      new THREE.Vector3(0.2, 8.2, -0.3),
      new THREE.Vector3(0.1, 10, -0.3),
    ],
    false,
    "catmullrom",
    0.5,
  );
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 72, 0.075, 10, false), white);
  m.name = "cable";
  return m;
}

export function buildGamepad() {
  const white = new THREE.MeshPhysicalMaterial({
    color: 0xf4f4f6,
    roughness: 0.34,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.22,
  });
  const dark = new THREE.MeshStandardMaterial({ color: 0xc9c9ce, roughness: 0.7 });

  const root = new THREE.Group();
  root.name = NODE.root;

  root.add(shell(white));
  root.add(bumper("l", white));
  root.add(bumper("r", white));
  root.add(thumbstick(NODE.stickL, -1.95, 0.3, white, dark));
  root.add(thumbstick(NODE.stickR, 0.95, -0.72, white, dark));
  root.add(dpad(-0.72, -0.72, white, dark));

  // face buttons: Y top (grey), B right (teal), X left (orange), A bottom (blue)
  const cx = 2.05;
  const cy = 0.3;
  const d = 0.55;
  root.add(faceButton(NODE.buttonY, cx, cy + d, 0x9a9aa0));
  root.add(faceButton(NODE.buttonB, cx + d, cy, 0x2fbf9a));
  root.add(faceButton(NODE.buttonX, cx - d, cy, 0xf0662b));
  root.add(faceButton(NODE.buttonA, cx, cy - d, 0x4f6bff));

  root.add(smallButton(-0.4, 0.4, white));
  root.add(smallButton(0.4, 0.4, white));
  root.add(cable(white));
  return root;
}
