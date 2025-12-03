// =======================
// Datos base y capacidades
// =======================
let pacientes = [];

// Capacidad de cada sala
const capacidadSalas = {
  listaEspera: 0,
  preanestesia: 16,
  cma: 20,
  pabellon: 16,
  recuperacion: 20,
  alta: 0
};

// Camas disponibles en cada sala con camas
const camas = {
  preanestesia: Array.from({ length: 16 }, (_, i) => i + 1),
  cma: Array.from({ length: 20 }, (_, i) => i + 1),
  recuperacion: Array.from({ length: 20 }, (_, i) => i + 1)
};

// Mapa visual de recuperación
const salaDerecha = [1, 2, 3, 4, 5, 6];
const salaCentral = [7, 8, 9, 10, 11, 12];
const salaIzquierda = [13, 14, 15, 16, 17, 18, 19, 20];
const aislamientos = [3, 16];

// Mapa visual CMA
const cmaDerecha = [1, 2, 3, 4, 5, 6];
const cmaCentral = [7, 8, 9, 10, 11, 12];
const cmaIzquierda = [13, 14, 15, 16, 17, 18, 19, 20];

// Parámetros SmartTV
let paginaActualTV = 0;
const pacientesPorPaginaTV = 10;

// =======================
// Utilidades
// =======================
function obtenerIniciales(nombre) {
  if (!nombre) return "";
  const partes = nombre.trim().split(" ");
  if (partes.length < 2) return nombre;

  const n = partes[0];
  const a1 = partes[1] ? partes[1][0] + "." : "";
  const a2 = partes[2] ? partes[2][0] + "." : "";
  return n + " " + a1 + " " + a2;
}

function formatoUbicacion(sala) {
  const map = {
    preanestesia: "En Preanestesia",
    cma: "En CMA",
    pabellon: "En Pabellón",
    recuperacion: "En Recuperación",
    alta: "Alta Médica",
    listaEspera: "Lista de Espera"
  };
  return map[sala] || "";
}

function contarOcupacion(sala) {
  return pacientes.filter(p => p.sala === sala).length;
}

function obtenerCamaLibre(sala) {
  const camasOcupadas = pacientes
    .filter(p => p.sala === sala && p.cama !== null && p.cama !== undefined)
    .map(p => p.cama);
  const disponibles = (camas[sala] || []).filter(c => !camasOcupadas.includes(c));
  return disponibles.length > 0 ? disponibles[0] : null;
}

// =======================
// Navegación
// =======================
function mostrarPantalla(id) {
  // Ocultar todas
  document
    .querySelectorAll(".pantalla, .pantalla-tv")
    .forEach(p => (p.style.display = "none"));

  // Para panel general en móvil, usar versión móvil
  if (id === "panelGeneral" && window.innerWidth <= 800) {
    const mobile = document.getElementById("panelGeneralMovil");
    if (mobile) mobile.style.display = "block";
  } else {
    const seccion = document.getElementById(id);
    if (seccion) seccion.style.display = "block";
  }

  // Cerrar menú en móvil
  if (window.innerWidth < 800) toggleMenu(false);

  // Refrescar vistas según pantalla
  if (id === "panelGeneral") {
    cargarPanelGeneral();
    cargarPanelGeneralMovil();
  } else if (id === "panelGeneralMovil") {
    cargarPanelGeneralMovil();
  } else if (id === "mapaRecuperacion") {
    cargarMapaCamas();
  } else if (id === "mapaCMA") {
    cargarMapaCMA();
  } else if (id === "smartTV") {
    cargarSmartTV();
  } else {
    cargarPanelGeneral();
    cargarPanelGeneralMovil();
  }
}

function toggleMenu(forceState) {
  const sidebar = document.getElementById("sidebar");
  if (forceState === true) sidebar.classList.add("open");
  else if (forceState === false) sidebar.classList.remove("open");
  else sidebar.classList.toggle("open");
}

// =======================
// Manejo de pacientes
// =======================
function crearBotonesMovimiento(paciente) {
  const salas = [
    { id: "listaEspera", nombre: "Espera" },
    { id: "preanestesia", nombre: "Preanestesia" },
    { id: "cma", nombre: "CMA" },
    { id: "pabellon", nombre: "Pabellón" },
    { id: "recuperacion", nombre: "Recuperación" },
    { id: "alta", nombre: "Alta" }
  ];

  return salas
    .filter(s => s.id !== paciente.sala)
    .map(
      s =>
        '<button onclick="moverPaciente(\'' +
        paciente.id +
        "\', '" +
        s.id +
        "')">" +
        s.nombre +
        "</button>"
    )
    .join("");
}

function moverPaciente(id, nuevaSala) {
  const p = pacientes.find(x => x.id === id);
  if (!p) return;

  // Liberar cama actual
  if (["preanestesia", "cma", "recuperacion"].includes(p.sala)) {
    p.cama = null;
  }

  p.sala = nuevaSala;

  // Asignar cama si corresponde
  if (["preanestesia", "cma", "recuperacion"].includes(nuevaSala)) {
    const camaLibre = obtenerCamaLibre(nuevaSala);
    if (camaLibre === null) {
      alert("No hay camas disponibles en " + nuevaSala);
    } else {
      p.cama = camaLibre;
    }
  }

  // Registrar hora de alta
  if (nuevaSala === "alta") {
    p.horaAlta = Date.now();
  }

  refrescarTodo();
}

// =======================
// Listas visuales
// =======================
function cargarListaPacientes() {
  const contenedores = {
    listaEspera: document.getElementById("listaEsperaContenedor"),
    preanestesia: document.getElementById("listaPreanestesia"),
    cma: document.getElementById("listaCMA"),
    pabellon: document.getElementById("listaPabellon"),
    recuperacion: document.getElementById("listaRecuperacion")
  };

  Object.values(contenedores).forEach(c => {
    if (c) c.innerHTML = "";
  });

  pacientes.forEach(p => {
    const cont = contenedores[p.sala];
    if (!cont) return;

    const div = document.createElement("div");
    div.className = "paciente";

    const shortName = obtenerIniciales(p.nombre);

    let info = "";
    if (p.cama) info = "Cama: " + p.cama;

    div.innerHTML =
      "<h3>" +
      shortName +
      '</h3><div class="info">' +
      info +
      "</div><div class='acciones'>" +
      crearBotonesMovimiento(p) +
      "</div>";

    cont.appendChild(div);
  });
}

// =======================
// Panel General (PC + móvil)
// =======================
function cargarPanelGeneral() {
  const cont = document.getElementById("panelGeneralResumen");
  if (!cont) return;
  cont.innerHTML = "";

  const salas = [
    { id: "listaEspera", nombre: "Lista de Espera" },
    { id: "preanestesia", nombre: "Preanestesia" },
    { id: "cma", nombre: "CMA" },
    { id: "pabellon", nombre: "Pabellones" },
    { id: "recuperacion", nombre: "Recuperación" },
    { id: "alta", nombre: "Alta" }
  ];

  salas.forEach(s => {
    const ocupados = contarOcupacion(s.id);
    const total = capacidadSalas[s.id] || 0;

    const card = document.createElement("div");
    card.className = "panel-card";

    let detalle = "Pacientes actuales: " + ocupados;
    if (total > 0) detalle += " | Ocupación: " + ocupados + " / " + total;

    card.innerHTML =
      "<h3>" +
      s.nombre +
      '</h3><div class="count">' +
      ocupados +
      '</div><div class="detalle">' +
      detalle +
      "</div>";

    cont.appendChild(card);
  });
}

function cargarPanelGeneralMovil() {
  const cont = document.getElementById("mobileLista");
  if (!cont) return;
  cont.innerHTML = "";

  const salas = [
    { id: "listaEspera", nombre: "Lista de Espera" },
    { id: "preanestesia", nombre: "Preanestesia" },
    { id: "cma", nombre: "CMA" },
    { id: "pabellon", nombre: "Pabellones" },
    { id: "recuperacion", nombre: "Recuperación" },
    { id: "alta", nombre: "Alta" }
  ];

  salas.forEach(s => {
    const ocupados = contarOcupacion(s.id);
    const total = capacidadSalas[s.id] || 0;

    const div = document.createElement("div");
    div.className = "mobile-card";

    div.innerHTML =
      '<div class="titulo-sala">' +
      s.nombre +
      '</div><div class="estado">Pacientes actuales: ' +
      ocupados +
      "</div>" +
      (total > 0
        ? '<div class="ocupacion">Ocupación: ' +
          ocupados +
          " / " +
          total +
          "</div>"
        : "");

    cont.appendChild(div);
  });
}

// =======================
// Mapas de camas
// =======================
function cargarMapaCamas() {
  const der = document.getElementById("salaDerecha");
  const cen = document.getElementById("salaCentral");
  const izq = document.getElementById("salaIzquierda");
  if (!der || !cen || !izq) return;

  der.innerHTML = "";
  cen.innerHTML = "";
  izq.innerHTML = "";

  function crearCama(num) {
    const div = document.createElement("div");
    const paciente = pacientes.find(
      p => p.sala === "recuperacion" && p.cama === num
    );

    let clase = paciente ? "ocupada" : "libre";
    if (aislamientos.includes(num)) clase = "aislamiento";

    div.className = "cama " + clase;
    div.innerHTML =
      "<strong>Cama " +
      num +
      "</strong><h4>" +
      (paciente ? paciente.nombre : "Disponible") +
      "</h4>";
    return div;
  }

  salaDerecha.forEach(num => der.appendChild(crearCama(num)));
  salaCentral.forEach(num => cen.appendChild(crearCama(num)));
  salaIzquierda.forEach(num => izq.appendChild(crearCama(num)));
}

function cargarMapaCMA() {
  const der = document.getElementById("cmaDerecha");
  const cen = document.getElementById("cmaCentral");
  const izq = document.getElementById("cmaIzquierda");
  if (!der || !cen || !izq) return;

  der.innerHTML = "";
  cen.innerHTML = "";
  izq.innerHTML = "";

  function crearCamaCMA(num) {
    const div = document.createElement("div");
    const paciente = pacientes.find(p => p.sala === "cma" && p.cama === num);

    div.className = "cama " + (paciente ? "ocupada" : "libre");
    div.innerHTML =
      "<strong>Cama " +
      num +
      "</strong><h4>" +
      (paciente ? paciente.nombre : "Disponible") +
      "</h4>";
    return div;
  }

  cmaDerecha.forEach(num => der.appendChild(crearCamaCMA(num)));
  cmaCentral.forEach(num => cen.appendChild(crearCamaCMA(num)));
  cmaIzquierda.forEach(num => izq.appendChild(crearCamaCMA(num)));
}

// =======================
// Smart TV
// =======================
function obtenerPacientesParaTV() {
  const ahora = Date.now();
  return pacientes.filter(p => {
    if (p.sala === "alta") {
      return p.horaAlta && ahora - p.horaAlta <= 3600000;
    }
    return p.sala !== "listaEspera";
  });
}

function cargarSmartTV() {
  const cont = document.getElementById("listaTV");
  const lblPag = document.getElementById("tvPagina");
  if (!cont || !lblPag) return;

  cont.innerHTML = "";
  let lista = obtenerPacientesParaTV().sort((a, b) =>
    a.nombre.localeCompare(b.nombre)
  );

  if (lista.length === 0) {
    cont.innerHTML =
      '<div style="color:#ccc;font-size:2rem;text-align:center;">No hay pacientes actualmente.</div>';
    lblPag.textContent = "";
    return;
  }

  const totalPaginas = Math.ceil(lista.length / pacientesPorPaginaTV);
  if (paginaActualTV >= totalPaginas) paginaActualTV = 0;

  const inicio = paginaActualTV * pacientesPorPaginaTV;
  const fin = inicio + pacientesPorPaginaTV;
  const pagina = lista.slice(inicio, fin);

  pagina.forEach(p => {
    const item = document.createElement("div");
    let clase = "tv-item tv-" + p.sala;
    item.className = clase;

    item.innerHTML =
      "<div>" +
      obtenerIniciales(p.nombre) +
      '</div><div class="tv-ubicacion">' +
      formatoUbicacion(p.sala) +
      "</div>";

    cont.appendChild(item);
  });

  lblPag.textContent = "Página " + (paginaActualTV + 1) + " de " + totalPaginas;
}

// Reloj y cambio de página en SmartTV
setInterval(() => {
  const lblHora = document.getElementById("tvHora");
  if (lblHora) {
    lblHora.textContent = new Date().toLocaleTimeString("es-CL", {
      hour12: false
    });
  }
}, 1000);

setInterval(() => {
  paginaActualTV++;
  const tvVisible =
    document.getElementById("smartTV") &&
    document.getElementById("smartTV").style.display !== "none";
  if (tvVisible) cargarSmartTV();
}, 7000);

// =======================
// Selector Informe PDF
// =======================
function abrirSelector() {
  const sel = document.getElementById("selectorInforme");
  if (sel) sel.classList.remove("oculto");
}

function cerrarSelector() {
  const sel = document.getElementById("selectorInforme");
  if (sel) sel.classList.add("oculto");
}

function seleccionarTodos() {
  const estado = document.getElementById("chkTodos").checked;
  document.querySelectorAll(".chk-sala").forEach(c => {
    c.checked = estado;
  });
}

function generarPDFDesdeSelector() {
  const checks = document.querySelectorAll(".chk-sala:checked");
  if (checks.length === 0) {
    alert("Debe seleccionar al menos un sector.");
    return;
  }
  const salasSeleccionadas = Array.from(checks).map(c => c.value);
  cerrarSelector();
  generarInformePDF(salasSeleccionadas);
}

// =======================
// Generar informe PDF
// =======================
async function generarInformePDF(salasElegidas) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y = 20;
  const fecha = new Date().toLocaleString("es-CL");

  const nombresSalas = {
    listaEspera: "Lista de Espera",
    preanestesia: "Preanestesia",
    cma: "CMA",
    pabellon: "Pabellones",
    recuperacion: "Recuperación",
    alta: "Pacientes de Alta"
  };

  let titulo = "";
  if (salasElegidas.length === 1) {
    titulo = "Censo de " + (nombresSalas[salasElegidas[0]] || "Unidad");
  } else {
    titulo = "Censo de las Unidades Seleccionadas";
  }

  doc.setFontSize(18);
  doc.text("Hospital Clínico Félix Bulnes", 10, y);
  y += 8;
  doc.setFontSize(14);
  doc.text("Pabellón Central", 10, y);
  y += 8;
  doc.text(titulo, 10, y);
  y += 8;

  doc.setFontSize(12);
  doc.text("Fecha: " + fecha, 10, y);
  y += 10;

  salasElegidas.forEach(id => {
    const tituloSala = nombresSalas[id] || id;
    const lista = pacientes
      .filter(p => p.sala === id)
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    if (lista.length > 0) {
      const ocupadas = contarOcupacion(id);
      const total = capacidadSalas[id] || 0;

      doc.setFontSize(14);
      if (total > 0) {
        doc.text(
          tituloSala + " (" + ocupadas + " / " + total + ")",
          10,
          y
        );
      } else {
        doc.text(tituloSala, 10, y);
      }
      y += 8;

      doc.setFontSize(12);
      lista.forEach(p => {
        doc.text("• " + p.nombre, 15, y);
        y += 7;

        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });
      y += 5;
    }
  });

  doc.save(titulo + ".pdf");
}

// =======================
// Cargar Excel
// =======================
const inputExcel = document.getElementById("inputExcel");
if (inputExcel) {
  inputExcel.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const data = evt.target.result;
      const workbook = XLSX.read(data, { type: "binary" });

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      cargarPacientesDesdeExcel(json);
    };
    reader.readAsBinaryString(file);
  });
}

function cargarPacientesDesdeExcel(json) {
  pacientes = [];
  let idCounter = 1;

  json.forEach(row => {
    const nombre =
      row["NOMBRE"] ||
      row["Nombre"] ||
      row["Paciente"] ||
      row["PACIENTE"] ||
      "";

    if (!nombre) return;

    pacientes.push({
      id: "P" + idCounter++,
      nombre: nombre,
      sala: "listaEspera",
      cama: null,
      horaAlta: null
    });
  });

  refrescarTodo();
}

// =======================
// Refrescar toda la interfaz
// =======================
function refrescarTodo() {
  cargarListaPacientes();
  cargarPanelGeneral();
  cargarPanelGeneralMovil();
  cargarMapaCamas();
  cargarMapaCMA();
  const tvVisible =
    document.getElementById("smartTV") &&
    document.getElementById("smartTV").style.display !== "none";
  if (tvVisible) cargarSmartTV();
}

// =======================
// Datos de prueba (demo)
// =======================
function cargarPacientesDemo() {
  pacientes = [
    {
      id: "P1",
      nombre: "Ana Gomez Ruiz",
      sala: "listaEspera",
      cama: null
    },
    {
      id: "P2",
      nombre: "Marco Diaz Soto",
      sala: "preanestesia",
      cama: 1
    },
    {
      id: "P3",
      nombre: "Laura Perez Vega",
      sala: "pabellon",
      cama: null
    },
    {
      id: "P4",
      nombre: "Jorge Fuentes Lopez",
      sala: "recuperacion",
      cama: 7
    },
    {
      id: "P5",
      nombre: "Claudia Rojas Arce",
      sala: "cma",
      cama: 3
    },
    {
      id: "P6",
      nombre: "Pedro Mella Torres",
      sala: "alta",
      cama: null,
      horaAlta: Date.now()
    }
  ];

  refrescarTodo();
}

// =======================
// Inicio de la aplicación
// =======================
window.addEventListener("load", () => {
  cargarPacientesDemo(); // demo inicial, se reemplaza al cargar Excel
  mostrarPantalla("panelGeneral");
});
