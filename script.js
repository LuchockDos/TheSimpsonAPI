// ==============================
// SIMPSONS API + FAVORITOS (GLOBAL) + PAGINACIÓN
// ==============================
// Objetivo:
// - Mostrar personajes paginados desde la Simpsons API.
// - Guardar favoritos en localStorage (solo IDs).
// - Mostrar "Solo favoritos" GLOBAL (de todas las páginas) haciendo fetch por ID.
// - Botón "Solo favoritos" en modo toggle: favoritos <-> listado normal.

// ------------------------------
// 1) ESTADO GLOBAL (variables que representan el "estado" de la app)
// ------------------------------

// Página actual del listado (paginación normal)
let currentPage = 1;

// Key (nombre) con el que guardamos favoritos en localStorage
const Favorites_key = "rm_favorites";

// Array en memoria con IDs favoritos (ej: [9, 15, 120])
// IMPORTANTE: esto es el "estado principal" en JS.
// localStorage es solo persistencia.
let favorites = [];


// ------------------------------
// 2) REFERENCIAS AL DOM (elementos HTML)
// ------------------------------

// Contenedor donde se renderizan las cards
const containerCards = document.getElementById("cardsGrid");

// Botones de paginación
const nextBtn = document.getElementById("nextPage");
const prevBtn = document.getElementById("prevPage");

// Texto que muestra la página actual
const pageInfo = document.getElementById("pageInfo");

// Botón para alternar entre "Solo favoritos" y "Volver"
const onlyFavoritesBtn = document.getElementById("favoritesBtn");

// Flag para saber si estamos viendo favoritos (true) o el listado normal (false)
let showingFavorites = false;


// ------------------------------
// 3) TOGGLE: BOTÓN "SOLO FAVORITOS" <-> "VOLVER"
// ------------------------------

// Cuando hacemos click:
// - cambiamos el estado showingFavorites
// - si está en true: mostramos favoritos globales
// - si está en false: volvemos a la paginación normal
onlyFavoritesBtn.addEventListener("click", async () => {
  // Toggle: si era false -> true, si era true -> false
  showingFavorites = !showingFavorites;

  if (showingFavorites) {
    // Cambiamos el texto del botón para indicar que estamos en modo favoritos
    onlyFavoritesBtn.textContent = "↩ Volver";

    // Mostramos favoritos GLOBAL (no depende de la página actual)
    // await porque showAllFavorites hace fetch (async)
    await showAllFavorites();

    // Nota: en showAllFavorites deshabilitamos next/prev, porque en favoritos globales
    // no tiene sentido pasar páginas del listado.
  } else {
    // Volvemos al modo normal
    onlyFavoritesBtn.textContent = "⭐ Solo favoritos";

    // Volvemos a cargar la página actual de la lista normal (paginada)
    controllerFunction(currentPage);
  }
});


// ------------------------------
// 4) INICIALIZACIÓN DE LA APP
// ------------------------------

// Cargamos favoritos desde localStorage a memoria (favorites)
// Esto es CLAVE para que aparezcan las ⭐ al renderizar.
favorites = loadFavorites();

// Cargamos la primera página del listado normal
controllerFunction(currentPage);


// ------------------------------
// 5) LOCALSTORAGE: CARGAR FAVORITOS (leer)
// ------------------------------

// Esta función lee rm_favorites del localStorage y lo devuelve como array.
// Si la key no existe o hay errores, devuelve [].
function loadFavorites() {
  try {
    // localStorage solo devuelve strings o null
    const data = localStorage.getItem(Favorites_key);

    // Si no existe nada guardado -> devolvemos array vacío
    if (!data) return [];

    // Convertimos de string JSON a array/objeto real
    const parsed = JSON.parse(data);

    // Validamos que sea realmente un array (evita bugs si se guardó otra cosa)
    if (!Array.isArray(parsed)) return [];

    return parsed;
  } catch (error) {
    // Si el JSON está corrupto o hay error de parseo -> devolvemos []
    return [];
  }
}


// ------------------------------
// 6) CONTROLLER (conecta Model + View)
// ------------------------------

// El controller pide datos al Model (apiCall) y se los pasa a la View (renderCharacters).
async function controllerFunction(page) {
  try {
    // Model: trae datos de la API
    const { characters, next, prev, pages } = await apiCall(page);

    // UI: actualizar texto de paginación
    if (pageInfo) pageInfo.textContent = `Página ${currentPage} de ${pages}`;

    // UI: habilitar/deshabilitar botones según si existe next/prev en la API
    nextBtn.disabled = !next;
    prevBtn.disabled = !prev;

    // View: renderizar cards
    renderCharacters(characters);
  } catch (error) {
    console.log(error);
  }
}


// ------------------------------
// 7) MODEL: LLAMADA A LA API (paginación normal)
// ------------------------------

// Trae la página indicada desde /api/characters?page=X
async function apiCall(page) {
  // Construimos URL correctamente con URL()
  const url = new URL("https://thesimpsonsapi.com/api/characters");

  // Query param page (esto es lo que cambia el contenido)
  url.searchParams.set("page", page);

  // Pedimos la URL
  const response = await fetch(url);

  // Pasamos a JSON (esto devuelve un objeto con results, next, prev, pages, etc.)
  const data = await response.json();

  // Devolvemos lo que nos interesa (nombres consistentes)
  return {
    characters: data.results, // array de personajes
    next: data.next,         // string URL o null
    prev: data.prev,         // string URL o null
    pages: data.pages,       // total de páginas
  };
}


// ------------------------------
// 8) VIEW: RENDERIZAR PERSONAJES (cards)
// ------------------------------

function renderCharacters(characters) {
  // Si no existe el contenedor, salimos para evitar errores
  if (!containerCards) return;

  // En Simpsons, las imágenes están en CDN (no en thesimpsonsapi.com directamente)
  const CDN_BASE = "https://cdn.thesimpsonsapi.com/500";

  // Limpiamos el contenedor antes de renderizar de nuevo
  containerCards.innerHTML = "";

  // Recorremos cada personaje y creamos su card
  characters.forEach((c) => {
    // Card principal
    const card = document.createElement("div");
    card.classList.add("card");

    // Imagen del personaje
    const img = document.createElement("img");
    img.classList.add("card__img");
    img.alt = c.name || "Personaje"; // accesibilidad
    img.src = `${CDN_BASE}${c.portrait_path}`; // armamos URL final con el path

    // Cuerpo de la card (texto + badges)
    const body = document.createElement("div");
    body.classList.add("card__body");

    // Nombre
    const name = document.createElement("h3");
    name.classList.add("card__title");
    name.textContent = c.name ?? "Sin nombre";

    // Contenedor de badges (estado, ocupación, botón fav)
    const badges = document.createElement("div");
    badges.classList.add("badges");

    // --------------------------
    // Botón favoritos ⭐ / ❌
    // --------------------------

    const favoriteBtn = document.createElement("button");
    favoriteBtn.style.backgroundColor = "transparent";
    favoriteBtn.style.border = "0";
    favoriteBtn.style.cursor = "pointer";

    // Preguntamos si el ID del personaje está en favorites
    const esFavorito = isFavorite(c.id);

    // Mostramos ⭐ si es favorito, si no ❌ (podrías cambiar por 🤍/❤️)
    favoriteBtn.textContent = esFavorito ? "⭐" : "❌";

    // Al click:
    // - si ya era favorito -> lo removemos
    // - si no -> lo agregamos
    // - re-renderizamos la lista actual para que cambie el icono en pantalla
    favoriteBtn.addEventListener("click", () => {
      if (isFavorite(c.id)) {
        removeFavorite(c.id);
      } else {
        addFavorite(c.id);
      }

      // Volvemos a renderizar ESTE MISMO array (closure):
      // characters es el array que estábamos mostrando cuando se creó el botón.
      renderCharacters(characters);
    });

    // Ocupación
    const occupation = document.createElement("span");
    occupation.classList.add("badge");
    occupation.textContent = c.occupation ?? "Unknown";

    // Status (Alive / Deceased / Unknown) con clases para colores
    const status = document.createElement("span");
    status.classList.add("badge");

    if (c.status === "Alive") status.classList.add("badge--alive");
    else if (c.status === "Deceased") status.classList.add("badge--dead");
    else status.classList.add("badge--unknown");

    status.textContent = c.status;

    // Agregamos elementos al DOM en el orden deseado
    badges.append(status, occupation, favoriteBtn);
    body.append(name, badges);
    card.append(img, body);
    containerCards.appendChild(card);
  });
}


// ------------------------------
// 9) EVENTOS DE PAGINACIÓN (modo normal)
// ------------------------------

// IMPORTANTE: si estamos mostrando favoritos globales, next/prev están deshabilitados,
// pero igual es buena práctica evitar que hagan algo si showingFavorites es true.

nextBtn.addEventListener("click", () => {
  if (showingFavorites) return; // si estamos en favoritos, no paginamos

  // Avanzamos página
  currentPage++;

  // Cargamos nuevos datos
  controllerFunction(currentPage);
});

prevBtn.addEventListener("click", () => {
  if (showingFavorites) return; // si estamos en favoritos, no paginamos

  // Evita bajar de página 1
  if (currentPage <= 1) return;

  // Retrocedemos página
  currentPage--;

  // Cargamos nuevos datos
  controllerFunction(currentPage);
});


// ------------------------------
// 10) FAVORITOS: GUARDAR / VERIFICAR / AGREGAR / REMOVER
// ------------------------------

// Guarda el array favorites en localStorage
function saveFavorites() {
  // Convertimos a string JSON (localStorage guarda strings)
  const json = JSON.stringify(favorites);
  localStorage.setItem(Favorites_key, json);
}

// Devuelve true si el id está en favorites, false si no
function isFavorite(id) {
  // includes usa comparación estricta (===)
  return favorites.includes(id);
}

// Agrega un id a favorites si no estaba
function addFavorite(id) {
  if (!favorites.includes(id)) {
    favorites.push(id); // push modifica el array original
    saveFavorites();    // persistimos el cambio
  }
}

// Remueve un id de favorites
function removeFavorite(id) {
  // filter crea un array nuevo con todos menos el id a borrar
  favorites = favorites.filter((favId) => favId !== id);
  saveFavorites();
}


// ------------------------------
// 11) FAVORITOS GLOBALES: FETCH POR ID + CACHE
// ------------------------------

// Base URL para pedir un personaje individual por ID
const API_BASE = "https://thesimpsonsapi.com/api";

// Cache para no pedir el mismo personaje 2 veces
// Map guarda: id -> personajeCompleto
const characterCache = new Map();

// Trae un personaje por ID.
// Si está en cache, devuelve desde memoria sin hacer fetch.
async function fetchCharacterById(id) {
  // Si ya lo tenemos guardado en cache, devolvemos rápido
  if (characterCache.has(id)) return characterCache.get(id);

  // Si no está en cache, lo pedimos a la API
  const res = await fetch(`${API_BASE}/characters/${id}`);

  // Validación básica
  if (!res.ok) throw new Error(`No se pudo cargar id=${id} (HTTP ${res.status})`);

  // Convertimos a JSON
  const data = await res.json();

  // Guardamos en cache para futuras llamadas
  characterCache.set(id, data);

  // Devolvemos el personaje completo
  return data;
}

// Muestra FAVORITOS GLOBALES: (todos los IDs guardados) -> fetch por ID -> render.
// No depende de la página actual.
async function showAllFavorites() {
  // Leemos desde localStorage por seguridad (si abriste otra pestaña, etc.)
  // Si no querés, podrías usar solo el favorites en memoria.
  favorites = loadFavorites();

  // Si no hay favoritos, mostramos mensaje y salimos
  if (!favorites.length) {
    containerCards.innerHTML = "<p>No tenés favoritos todavía.</p>";
    if (pageInfo) pageInfo.textContent = "Favoritos (0)";
    nextBtn.disabled = true;
    prevBtn.disabled = true;
    return;
  }

  try {
    // favorites.map(...) crea un array de Promises (porque fetchCharacterById es async)
    // Promise.all espera a que TODAS terminen y devuelve un array de personajes
    const favCharacters = await Promise.all(
      favorites.map((id) => fetchCharacterById(id))
    );

    // Renderizamos los favoritos
    renderCharacters(favCharacters);

    // UI: mostramos cantidad de favoritos y bloqueamos paginación normal
    if (pageInfo) pageInfo.textContent = `Favoritos (${favCharacters.length})`;
    nextBtn.disabled = true;
    prevBtn.disabled = true;
  } catch (e) {
    console.log(e);
    containerCards.innerHTML = "<p>Error cargando favoritos.</p>";
  }
}

