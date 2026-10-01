// ---------- Data ----------
// Los datos viven en data/profile.json y data/projects.json (TODO: reemplazar los de ejemplo).
// `fetch` no puede leer archivos con doble clic (file://): hay que abrir el sitio con Live Server.
async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load ${path} (${response.status})`);
  return response.json();
}

// Si gestion.html ya guardó cambios en localStorage, esa versión manda;
// si no, se usan los datos iniciales de data/projects.json.
async function loadProjects() {
  const saved = localStorage.getItem("projects");
  if (saved) return JSON.parse(saved);
  return loadJson("data/projects.json");
}

// ---------- Profile ----------
function renderProfile(profile) {
  // Cada elemento con data-profile="name" recibe profile.name, y así con las demás claves
  document.querySelectorAll("[data-profile]").forEach((element) => {
    element.textContent = profile[element.dataset.profile];
  });

  const skillItems = profile.skills.map((skill) => {
    const item = document.createElement("li");
    item.textContent = skill;
    return item;
  });
  document.querySelector("#skills-list").append(...skillItems);

  const contactItems = profile.contact.map((contact) => {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = contact.url;
    link.textContent = contact.label;
    item.append(link);
    return item;
  });
  document.querySelector("#contact-list").append(...contactItems);
}

// ---------- Projects ----------
// `image` es la ruta a la imagen (ej. "img/proyecto-1.jpg"); si queda vacía se ve un bloque de color.
const thumbColors = ["var(--color-teal)", "var(--color-yellow)", "var(--color-pink)", "var(--color-primary)"];

function createProjectCard(project, index) {
  const card = document.createElement("article");
  card.className = "project-card";

  const thumb = document.createElement("div");
  thumb.className = "project-thumb";
  thumb.style.background = thumbColors[index % thumbColors.length];

  if (project.image) {
    const img = document.createElement("img");
    img.src = project.image;
    img.alt = project.title;
    img.loading = "lazy";
    thumb.append(img);
  }

  const body = document.createElement("div");
  body.className = "project-body";

  const skill = document.createElement("span");
  skill.className = "project-skill";
  skill.textContent = project.skill;

  const title = document.createElement("h3");
  title.textContent = project.title;

  const description = document.createElement("p");
  description.textContent = project.description;

  const link = document.createElement("a");
  link.className = "project-link";
  link.href = project.url;
  link.textContent = "Ver proyecto →";

  body.append(skill, title, description, link);
  card.append(thumb, body);
  return card;
}

function renderProjects(projects) {
  const projectGrid = document.querySelector("#project-grid");
  projectGrid.append(...projects.map(createProjectCard));
}

async function loadContent() {
  try {
    // Promise.all pide los dos archivos a la vez en lugar de uno después del otro
    const [profile, projects] = await Promise.all([
      loadJson("data/profile.json"),
      loadProjects(),
    ]);
    renderProfile(profile);
    renderProjects(projects);
  } catch (error) {
    console.error(error);
    const loadError = document.querySelector("#load-error");
    loadError.textContent = "No se pudieron cargar los datos. Abre el sitio con Live Server, no con doble clic.";
    loadError.hidden = false;
  }
}

loadContent();

// ---------- Menu overlay ----------
const menuToggle = document.querySelector(".menu-toggle");
const siteMenu = document.querySelector(".site-menu");
const menuBackdrop = document.querySelector(".menu-backdrop");
const menuLinks = siteMenu.querySelectorAll("a");

function setMenuOpen(isOpen) {
  siteMenu.classList.toggle("is-open", isOpen);
  menuBackdrop.hidden = !isOpen;
  menuToggle.setAttribute("aria-expanded", String(isOpen));
}

menuToggle.addEventListener("click", () => {
  setMenuOpen(!siteMenu.classList.contains("is-open"));
});

menuBackdrop.addEventListener("click", () => setMenuOpen(false));

menuLinks.forEach((link) => {
  link.addEventListener("click", () => setMenuOpen(false));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setMenuOpen(false);
});

// ---------- Active section in the menu ----------
// IntersectionObserver avisa cuando una sección cruza el centro de la pantalla,
// sin tener que calcular posiciones en cada evento de scroll.
const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      menuLinks.forEach((link) => {
        const isCurrent = link.getAttribute("href") === `#${entry.target.id}`;
        link.classList.toggle("is-active", isCurrent);
      });
    });
  },
  { rootMargin: "-50% 0px -50% 0px" }
);

document.querySelectorAll("main section[id]").forEach((section) => {
  sectionObserver.observe(section);
});
