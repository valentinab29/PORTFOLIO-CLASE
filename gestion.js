// JS propio de gestion.html: CRUD de los proyectos del portafolio.
//
// Un navegador NO puede escribir en data/projects.json. Por eso los cambios se
// guardan en localStorage (clave "projects") y main.js lee esa versión primero;
// projects.json queda como los datos iniciales.
const PROJECTS_KEY = "projects";

let projects = [];

// ---------- Data ----------
async function loadProjects() {
  const saved = localStorage.getItem(PROJECTS_KEY);
  if (saved) return JSON.parse(saved);

  const response = await fetch("data/projects.json");
  if (!response.ok) throw new Error(`Could not load projects.json (${response.status})`);
  return response.json();
}

// localStorage solo guarda texto: por eso el array pasa por JSON.stringify.
function saveProjects() {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

// ---------- Views ----------
const tabs = document.querySelectorAll(".admin-tab");
const views = document.querySelectorAll(".admin-view");

function showView(viewName) {
  views.forEach((view) => {
    view.hidden = view.id !== `view-${viewName}`;
  });
  tabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.view === viewName);
  });
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => showView(tab.dataset.view));
});

function showMessage(element, text) {
  element.textContent = text;
  element.hidden = false;
}

// ---------- Show all ----------
const allList = document.querySelector("#all-list");

// Arma la fila de UN proyecto sin agregarla a la página: así sirve tanto para
// "Mostrar todos" como para los resultados de "Buscar".
function createItem(project) {
  const item = document.createElement("div");
  item.className = "admin-item";

  const title = document.createElement("strong");
  title.textContent = project.title;

  const skill = document.createElement("span");
  skill.className = "project-skill";
  skill.textContent = project.skill;

  const description = document.createElement("p");
  description.textContent = project.description;

  item.append(skill, title, description);
  return item;
}

function renderAll() {
  allList.replaceChildren(...projects.map(createItem));
}

// ---------- Forms ----------
// Los campos de Crear y Actualizar se llaman igual salvo el prefijo
// ("create-title" / "update-title"), así una sola función lee los dos forms.
const fieldNames = ["title", "skill", "description", "image", "url"];

function readForm(prefix) {
  const project = {};
  fieldNames.forEach((name) => {
    project[name] = document.querySelector(`#${prefix}-${name}`).value.trim();
  });
  if (project.url === "") project.url = "#";
  return project;
}

function fillForm(prefix, project) {
  fieldNames.forEach((name) => {
    document.querySelector(`#${prefix}-${name}`).value = project[name];
  });
}

// ---------- Create ----------
const createForm = document.querySelector("#create-form");
const createMessage = document.querySelector("#create-message");

createForm.addEventListener("submit", (event) => {
  event.preventDefault();

  // Nuevo id = el mayor que exista + 1 (el 0 cubre el caso de la lista vacía)
  const nextId = Math.max(0, ...projects.map((project) => project.id)) + 1;
  const project = { id: nextId, ...readForm("create") };

  projects.push(project);
  saveProjects();
  createForm.reset();
  refreshViews();
  showMessage(createMessage, `"${project.title}" se agregó correctamente.`);
});

// ---------- Search ----------
const searchText = document.querySelector("#search-text");
const searchResults = document.querySelector("#search-results");
const searchMessage = document.querySelector("#search-message");

// "Diseño" -> "diseno": normalize("NFD") separa cada letra de su tilde, el
// replace borra esas marcas y toLowerCase quita las mayúsculas.
function normalize(text) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function search() {
  searchResults.replaceChildren();
  searchMessage.hidden = true;

  const query = normalize(searchText.value.trim());
  if (query === "") return;

  const found = projects.filter((project) =>
    normalize(`${project.title} ${project.skill}`).includes(query)
  );

  if (found.length === 0) {
    showMessage(searchMessage, "Sin resultados.");
    return;
  }

  searchResults.append(...found.map(createItem));
}

searchText.addEventListener("input", search);

// ---------- Update ----------
const updateSelect = document.querySelector("#update-select");
const updateForm = document.querySelector("#update-form");
const updateMessage = document.querySelector("#update-message");

// El value de cada <option> es el id (no la posición en el array): así se
// edita o borra exactamente ese proyecto aunque el orden cambie.
function fillSelect(select) {
  const placeholder = new Option("-- Elige un proyecto --", "");
  const options = projects.map((project) => new Option(project.title, String(project.id)));
  select.replaceChildren(placeholder, ...options);
}

function findSelected(select) {
  if (select.value === "") return undefined;
  return projects.find((project) => project.id === Number(select.value));
}

updateSelect.addEventListener("change", () => {
  updateMessage.hidden = true;

  const project = findSelected(updateSelect);
  updateForm.hidden = !project;
  if (project) fillForm("update", project);
});

updateForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const project = findSelected(updateSelect);
  if (!project) return;

  // Object.assign copia los valores del form sobre el mismo objeto; el id no se toca.
  Object.assign(project, readForm("update"));
  saveProjects();
  refreshViews();

  // refreshViews() dejó el select en "-- Elige --" y cerró el form; se vuelve
  // a elegir el mismo proyecto para poder seguir editándolo.
  updateSelect.value = String(project.id);
  updateForm.hidden = false;
  showMessage(updateMessage, `"${project.title}" se actualizó correctamente.`);
});

// ---------- Delete ----------
const deleteSelect = document.querySelector("#delete-select");
const deleteButton = document.querySelector("#delete-button");
const deleteMessage = document.querySelector("#delete-message");

deleteButton.addEventListener("click", () => {
  const project = findSelected(deleteSelect);
  if (!project) {
    showMessage(deleteMessage, "Primero elige un proyecto.");
    return;
  }

  if (!confirm(`¿Eliminar "${project.title}"? Esta acción no se puede deshacer.`)) return;

  projects = projects.filter((item) => item.id !== project.id);
  saveProjects();
  refreshViews();
  showMessage(deleteMessage, `"${project.title}" se eliminó correctamente.`);
});

// ---------- Reset ----------
const resetButton = document.querySelector("#reset-button");
const resetMessage = document.querySelector("#reset-message");

resetButton.addEventListener("click", async () => {
  if (!confirm("¿Descartar los cambios y volver a los proyectos de projects.json?")) return;

  localStorage.removeItem(PROJECTS_KEY);
  projects = await loadProjects();
  refreshViews();
  showMessage(resetMessage, "Se restauraron los proyectos de projects.json.");
});

// ---------- Init ----------
// Vuelve a pintar todo lo que depende de "projects". Se llama después de
// crear, actualizar o eliminar, para que ninguna vista muestre datos viejos.
function refreshViews() {
  renderAll();
  fillSelect(updateSelect);
  fillSelect(deleteSelect);
  updateForm.hidden = true;
  search();
}

async function init() {
  try {
    projects = await loadProjects();
    showView("all");
    refreshViews();
  } catch (error) {
    console.error(error);
    showMessage(
      document.querySelector("#load-error"),
      "No se pudieron cargar los proyectos. Abre la página con Live Server, no con doble clic."
    );
  }
}

init();
