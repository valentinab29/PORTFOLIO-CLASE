// Escena 3D del hero. Si algo falla (sin WebGL, sin conexión al CDN), el `catch`
// deja visible el fallback de CSS y el resto del sitio sigue funcionando igual.
const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

async function initHeroScene() {
  const hero = document.querySelector(".hero");
  const canvas = document.querySelector("#hero-canvas");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  try {
    const THREE = await import(THREE_URL);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.z = 7;

    scene.add(new THREE.HemisphereLight(0xffffff, 0xffc83d, 1.6));
    const sun = new THREE.DirectionalLight(0xffffff, 2);
    sun.position.set(3, 4, 5);
    scene.add(sun);

    // `flatShading` es lo que da el look low-poly: cada cara se ilumina con un solo tono.
    function createMesh(geometry, color) {
      const material = new THREE.MeshStandardMaterial({ color, flatShading: true });
      return new THREE.Mesh(geometry, material);
    }

    // TODO: reemplazar este placeholder por un modelo propio (.glb) con GLTFLoader.
    const group = new THREE.Group();
    const core = createMesh(new THREE.IcosahedronGeometry(1.6, 0), 0xff7a3d);
    group.add(core);

    const satellites = [
      createMesh(new THREE.ConeGeometry(0.4, 0.8, 5), 0x19b5a5),
      createMesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), 0xffc83d),
      createMesh(new THREE.TorusGeometry(0.35, 0.15, 6, 8), 0xff5d8f),
    ];

    satellites.forEach((mesh, index) => {
      const angle = (index / satellites.length) * Math.PI * 2;
      mesh.position.set(Math.cos(angle) * 2.6, Math.sin(angle) * 2.6, 0);
      group.add(mesh);
    });

    scene.add(group);

    function resize() {
      const { clientWidth, clientHeight } = canvas.parentElement;
      renderer.setSize(clientWidth, clientHeight, false);
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
    }

    // Posición del mouse normalizada entre -1 y 1
    const pointer = { x: 0, y: 0 };
    window.addEventListener("pointermove", (event) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
    });

    function render() {
      // Se acerca un 5% por frame al objetivo: por eso el movimiento se siente suave.
      group.rotation.y += (pointer.x * 0.8 - group.rotation.y) * 0.05;
      group.rotation.x += (pointer.y * 0.5 - group.rotation.x) * 0.05;

      if (!reduceMotion) {
        core.rotation.y += 0.004;
        group.rotation.z += 0.002;
        satellites.forEach((mesh) => {
          mesh.rotation.x += 0.01;
          mesh.rotation.y += 0.01;
        });
      }

      renderer.render(scene, camera);
    }

    hero.classList.add("has-3d");
    resize();
    window.addEventListener("resize", resize);
    renderer.setAnimationLoop(render);
  } catch (error) {
    console.warn("Hero 3D scene could not start, showing fallback.", error);
  }
}

initHeroScene();
