## Resumen
**Sobre mi:** Soy creadora digital enfocada en storytelling, branding visual y estrategia de contenido. Transformo ideas en piezas visuales que conectan y convierten.

**Skills:**
Storytelling
Web Design
Modelado 3D
Estrategia Digital


El sitio de Bruno Simon no es una landing tradicional sino un **portfolio interactivo en 3D**:
el visitante conduce un coche de juguete por un mundo renderizado con Three.js (motor WebGPU y
TSL para shaders) y física real vía Rapier. El contenido (proyectos, bio, contacto) no está en
secciones de scroll sino distribuido en "zonas" del mapa que se descubren conduciendo: una zona
de proyectos, un "laboratorio" de experimentos, una pista de carreras con leaderboard, un área
bajo el agua, un portal/altar y easter eggs (cookie clicker, logros ocultos).

**Enfoque:** demostrar virtuosismo técnico en 3D/WebGL y crear una experiencia memorable que
funcione como carta de presentación para un creative developer especializado en Three.js
(también autor del curso "Three.js Journey").

**Público objetivo:** reclutadores, clientes y desarrolladores curiosos por el desarrollo web
creativo y 3D; tolera un público dispuesto a "jugar" en vez de leer un CV convencional.

**Estructura:** SPA en React sin HTML5 semántico (sin `header`/`nav`/`main`/`footer`; todo vive
en un `<canvas>` R3F con overlays). Un menú de iconos abre una barra superior sobre un fondo
atenuado a pantalla completa con 4 accesos: Home, About, Projects, Contact.

**UX:** curva de aprendizaje inicial (hay que entender que se conduce con WASD/flechas), pero
muy lúdica y con feedback constante (sonido, física, logros, clima dinámico). El descubrimiento
de contenido es lento comparado con un sitio de scroll, lo que puede frustrar a quien solo
busca información rápida.

**UI:** estética low-poly tipo diorama, colores saturados y amigables, tipografías Amatic SC
(títulos, trazo manuscrito) y Nunito (texto), iconografía de HUD de videojuego.

**Stack confirmado (créditos del propio sitio):** React Three Fiber + drei + Zustand, Virtual
Scroll Handler (scroll) y joystick-controller (táctil móvil); sin CMS.
