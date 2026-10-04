// Escena 3D del hero: un avatar low-poly de Valentina rodeado de estrellas.
// Si algo falla (sin WebGL, sin conexión al CDN), el `catch` deja visible el
// fallback de CSS y el resto del sitio sigue funcionando igual.
const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

// Cambia estos colores para que el avatar se parezca más a ti.
const AVATAR_COLORS = {
  skin: 0xe8b894,
  hair: 0x7a4a2a,   // castaño medio
  shirt: 0x8f5cff,  // morado
  eyes: 0x2b1a3a,
  blush: 0xff8fb8,
  stars: [0xb57bff, 0xd9b8ff, 0xe07bff],
};

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

    scene.add(new THREE.HemisphereLight(0xffffff, 0x8f5cff, 1.6));
    const sun = new THREE.DirectionalLight(0xffffff, 2);
    sun.position.set(3, 4, 5);
    scene.add(sun);
    // Luz de contorno morada desde atrás: separa la silueta del fondo oscuro.
    const rimLight = new THREE.DirectionalLight(0xc9a2ff, 2.5);
    rimLight.position.set(-3, 2, -4);
    scene.add(rimLight);

    // `flatShading` es lo que da el look low-poly: cada cara se ilumina con un solo tono.
    function createMesh(geometry, color, options = {}) {
      const material = new THREE.MeshStandardMaterial({ color, flatShading: true, ...options });
      return new THREE.Mesh(geometry, material);
    }

    // Estrella de 5 puntas: 10 vértices alternando radio exterior (punta) e interior (hueco),
    // y luego se le da grosor con ExtrudeGeometry.
    function createStarGeometry(outerRadius, innerRadius, depth) {
      const shape = new THREE.Shape();
      for (let i = 0; i < 10; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i / 10) * Math.PI * 2 + Math.PI / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      }
      const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
      geometry.center();
      return geometry;
    }

    // ---------- Avatar ----------
    // Cada parte es hija de un grupo: al mover el grupo se mueve todo lo que tiene dentro.
    const avatar = new THREE.Group();
    avatar.position.y = 0.6;

    // Cabeza (grupo propio para que gire siguiendo el mouse sin mover el cuerpo)
    const head = new THREE.Group();
    avatar.add(head);

    head.add(createMesh(new THREE.IcosahedronGeometry(1, 1), AVATAR_COLORS.skin));

    // Pelo de arriba: media esfera un poco más grande que la cabeza, inclinada hacia
    // adelante para que el borde baje sobre la frente como un flequillo.
    const hairCap = createMesh(
      new THREE.SphereGeometry(1.1, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.45),
      AVATAR_COLORS.hair
    );
    hairCap.rotation.x = 0.15;
    head.add(hairCap);

    // Pelo de atrás hasta los hombros: un cilindro abierto que solo cubre la parte de atrás
    // (thetaStart/thetaLength recortan el ángulo), así no tapa la cara.
    const hairBack = createMesh(
      new THREE.CylinderGeometry(1.05, 1.2, 1.5, 10, 1, true, Math.PI * 0.4, Math.PI * 1.2),
      AVATAR_COLORS.hair,
      { side: THREE.DoubleSide }
    );
    hairBack.position.set(0, -0.45, -0.05);
    head.add(hairBack);

    const eyes = [-0.35, 0.35].map((x) => {
      const eye = createMesh(new THREE.SphereGeometry(0.11, 8, 6), AVATAR_COLORS.eyes);
      eye.position.set(x, -0.05, 0.92);
      head.add(eye);
      return eye;
    });

    [-0.55, 0.55].forEach((x) => {
      const blush = createMesh(new THREE.CircleGeometry(0.13, 8), AVATAR_COLORS.blush, {
        transparent: true,
        opacity: 0.6,
      });
      blush.position.set(x, -0.3, 0.84);
      blush.rotation.y = x * 0.8; // gira para quedar pegada a la curva de la mejilla
      head.add(blush);
    });

    // Sonrisa: medio toro (arco = Math.PI) dado vuelta
    const smile = createMesh(new THREE.TorusGeometry(0.15, 0.035, 6, 10, Math.PI), AVATAR_COLORS.eyes);
    smile.position.set(0, -0.35, 0.93);
    smile.rotation.z = Math.PI;
    head.add(smile);

    // Cuello y cuerpo
    const neck = createMesh(new THREE.CylinderGeometry(0.22, 0.25, 0.4, 8), AVATAR_COLORS.skin);
    neck.position.y = -1.05;
    avatar.add(neck);

    const body = createMesh(new THREE.CylinderGeometry(0.55, 1.0, 1.4, 8), AVATAR_COLORS.shirt);
    body.position.y = -1.85;
    avatar.add(body);

    // Brazos: el pivote (grupo) está en el hombro, así rotar el grupo mueve el brazo
    // desde el hombro y no desde su centro.
    function createArm(side) {
      const pivot = new THREE.Group();
      pivot.position.set(side * 0.62, -1.3, 0);

      const arm = createMesh(new THREE.CylinderGeometry(0.14, 0.16, 0.9, 6), AVATAR_COLORS.shirt);
      arm.position.y = -0.45;
      pivot.add(arm);

      const hand = createMesh(new THREE.IcosahedronGeometry(0.17, 0), AVATAR_COLORS.skin);
      hand.position.y = -0.95;
      pivot.add(hand);

      pivot.rotation.z = side * 0.35;
      avatar.add(pivot);
      return pivot;
    }

    createArm(-1);
    const wavingArm = createArm(1);

    scene.add(avatar);

    // ---------- Estrellas que orbitan ----------
    const stars = Array.from({ length: 5 }, (_, index) => {
      const size = 0.18 + (index % 3) * 0.08;
      const star = createMesh(
        createStarGeometry(size, size * 0.45, size * 0.4),
        AVATAR_COLORS.stars[index % AVATAR_COLORS.stars.length],
        { emissive: 0x6b3fd1, emissiveIntensity: 0.5 }
      );
      star.userData.angle = (index / 5) * Math.PI * 2;
      star.userData.height = -0.8 + (index % 3) * 0.9;
      scene.add(star);
      return star;
    });

    function placeStars(time) {
      stars.forEach((star, index) => {
        const angle = star.userData.angle + time * 0.4;
        // Órbita elíptica alrededor del avatar (más ancha que profunda)
        star.position.set(Math.cos(angle) * 2.1, star.userData.height + Math.sin(time + index) * 0.15, Math.sin(angle) * 1.2);
        star.rotation.y = time * 1.5 + index;
      });
    }

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

    const clock = new THREE.Clock();

    function render() {
      const time = clock.getElapsedTime();

      // La cabeza mira hacia el mouse; se acerca un 5% por frame al objetivo,
      // por eso el movimiento se siente suave.
      head.rotation.y += (pointer.x * 0.6 - head.rotation.y) * 0.05;
      head.rotation.x += (pointer.y * 0.3 - head.rotation.x) * 0.05;
      avatar.rotation.y += (pointer.x * 0.25 - avatar.rotation.y) * 0.05;

      if (!reduceMotion) {
        // Flota suavemente arriba y abajo
        avatar.position.y = 0.6 + Math.sin(time * 1.5) * 0.08;

        // Saluda: el brazo derecho sube y se mece
        wavingArm.rotation.z = 2.6 + Math.sin(time * 6) * 0.35;

        // Parpadeo: cada 3.5 s los ojos se aplastan en Y durante una fracción de segundo
        const isBlinking = time % 3.5 < 0.12;
        eyes.forEach((eye) => (eye.scale.y = isBlinking ? 0.1 : 1));

        placeStars(time);
      }

      renderer.render(scene, camera);
    }

    placeStars(0);
    hero.classList.add("has-3d");
    resize();
    window.addEventListener("resize", resize);
    renderer.setAnimationLoop(render);
  } catch (error) {
    console.warn("Hero 3D scene could not start, showing fallback.", error);
  }
}

initHeroScene();
