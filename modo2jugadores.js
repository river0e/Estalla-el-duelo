// ==============================
//   MODO 2 JUGADORES LOCAL
// ==============================
let vidasJ1, vidasJ2;
let balasJ1, balasJ2;
let expJ1, expJ2;

const btnJ1 = document.getElementById("btn-j1");
const btnJ2 = document.getElementById("btn-j2");
const btnCubrirJ1 = document.getElementById("btn-cubrir-j1");
const btnCubrirJ2 = document.getElementById("btn-cubrir-j2");

const balasUIJ1 = document.getElementById("balas-j1");
const balasUIJ2 = document.getElementById("balas-j2");
const vidasUIJ1 = document.getElementById("vidas-j1");
const vidasUIJ2 = document.getElementById("vidas-j2");
const expUIJ1 = document.getElementById("exp-j1");
const expUIJ2 = document.getElementById("exp-j2");

const mensaje = document.getElementById("mensaje-2jug");

// Sonidos reutilizados
const sndInicio = document.getElementById("sndInicio");
const sndDisparo = document.getElementById("sndDisparo");
const sndVictoria = document.getElementById("sndVictoria");
const sndCubrirse = document.getElementById("sndCubrirse");
const sndGameOver = document.getElementById("sndGameOver");

// Estados
let rondaActiva = false;
let cubiertoJ1 = false, cubiertoJ2 = false;
let turnoActivoTimeout = null;


function mostrarMensaje(texto, duracion = 3500) {
  const mensaje1 = document.getElementById("mensaje-2jug");
  const mensaje2 = document.getElementById("mensaje-2jug-invertido");

  mensaje1.textContent = texto;
  mensaje2.textContent = texto;

  clearTimeout(turnoActivoTimeout);
  turnoActivoTimeout = setTimeout(() => {
    mensaje1.textContent = "";
    mensaje2.textContent = "";
  }, duracion);
}
// ==============================
//   INICIO
// ==============================
function iniciarDuelo2Jugadores() {
  vidasJ1 = vidasJ2 = 3;
  balasJ1 = balasJ2 = 3;
  expJ1 = expJ2 = 0;
  actualizarUI();

  document.getElementById("pantalla-inicial").style.display = "none";
  document.getElementById("pantalla-2jug").style.display = "flex";

  sndInicio.play();
  iniciarRonda();
}

// ==============================
//   RONDAS
// ==============================
function iniciarRonda() {
  rondaActiva = false;
  cubiertoJ1 = cubiertoJ2 = false;

  btnJ1.disabled = true;
  btnJ2.disabled = true;
  btnCubrirJ1.disabled = true;
  btnCubrirJ2.disabled = true;

  mostrarMensaje("Preparados... espera la señal...");

  const delay = Math.random() * 2000 + 1500;
  setTimeout(() => {
    mostrarMensaje("¡DISPARA!");
    sndDisparo.play();
    rondaActiva = true;

    if (balasJ1 > 0) btnJ1.disabled = false;
    if (balasJ2 > 0) btnJ2.disabled = false;
    btnCubrirJ1.disabled = false;
    btnCubrirJ2.disabled = false;

    // Tiempo límite por ronda (6s)
    clearTimeout(turnoActivoTimeout);
    turnoActivoTimeout = setTimeout(() => {
      mostrarMensaje("¡Tiempo agotado! Ambos pierden 1 vida.");
      vidasJ1--; vidasJ2--;
      sndGameOver.play();
      actualizarUI();
      if (!comprobarGanador()) setTimeout(iniciarRonda, 1500);
    }, 6000);
  }, delay);
}

// ==============================
//   DISPARAR
// ==============================
function disparar(jugador) {
  if (!rondaActiva) return;
  clearTimeout(turnoActivoTimeout); 
  rondaActiva = false;

  let atacante, defensor, cubiertoDefensor, balasAtacante, expAtacante, vidasDefensor;
  if (jugador === 1) {
    atacante = "Jugador 1"; defensor = "Jugador 2";
    cubiertoDefensor = cubiertoJ2; balasAtacante = balasJ1; expAtacante = expJ1; vidasDefensor = vidasJ2;
  } else {
    atacante = "Jugador 2"; defensor = "Jugador 1";
    cubiertoDefensor = cubiertoJ1; balasAtacante = balasJ2; expAtacante = expJ2; vidasDefensor = vidasJ1;
  }

  if (balasAtacante > 0) balasAtacante--;

  let mensajeRonda = `${atacante} dispara. `;
  if (cubiertoDefensor) {
    mensajeRonda += `${defensor} se cubrió a tiempo y rebota el disparo. ${atacante} pierde 1 bala extra. ${defensor} gana 1 bala de reflejos.`;
    balasAtacante = Math.max(0, balasAtacante - 1);
    if (jugador === 1) { balasJ1 = balasAtacante; balasJ2 = Math.min(3, balasJ2+1); }
    else { balasJ2 = balasAtacante; balasJ1 = Math.min(3, balasJ1+1); }
  } else {
    mensajeRonda += `${defensor} recibe el disparo y pierde 1 vida. ${atacante} gana 1 experiencia.`;
    if (jugador === 1) { vidasJ2--; expJ1++; balasJ1 = balasAtacante; }
    else { vidasJ1--; expJ2++; balasJ2 = balasAtacante; }
  }

  mensaje.textContent = mensajeRonda;
  actualizarUI();

  btnJ1.disabled = true;
  btnJ2.disabled = true;
  btnCubrirJ1.disabled = true;
  btnCubrirJ2.disabled = true;
  sndVictoria.play();

  setTimeout(() => {
    if (!comprobarGanador()) iniciarRonda();
  }, 1500);
}


// ==============================
//   CUBRIRSE
// ==============================
function cubrirse(jugador) {
  if (!rondaActiva) return;
  sndCubrirse.play();
  clearTimeout(turnoActivoTimeout);
  rondaActiva = false;

  let mensajeRonda;
  if (jugador === 1) {
    cubiertoJ1 = true;
    if (balasJ1 < 3) balasJ1++;
    mensajeRonda = "Jugador 1 se cubre y carga 1 bala extra.";
  } else {
    cubiertoJ2 = true;
    if (balasJ2 < 3) balasJ2++;
    mensajeRonda = "Jugador 2 se cubre y carga 1 bala extra.";
  }

  mensaje.textContent = mensajeRonda;
  actualizarUI();

  btnJ1.disabled = true;
  btnJ2.disabled = true;
  btnCubrirJ1.disabled = true;
  btnCubrirJ2.disabled = true;

  setTimeout(iniciarRonda, 1500);
}

// ==============================
//   ACTUALIZAR UI
// ==============================
function actualizarUI() {
  renderBalas(balasUIJ1, balasJ1);
  renderBalas(balasUIJ2, balasJ2);
  renderVidas(vidasUIJ1, vidasJ1);
  renderVidas(vidasUIJ2, vidasJ2);
  expUIJ1.textContent = expJ1;
  expUIJ2.textContent = expJ2;
}

function renderBalas(container, cantidad) {
  container.innerHTML = "";
  for (let i = 0; i < 3; i++) {
    const bala = document.createElement("div");
    bala.classList.add("bala");
    if (i < cantidad) bala.classList.add("activa");
    container.appendChild(bala);
  }
}

function renderVidas(container, cantidad) {
  container.innerHTML = "";
  for (let i = 0; i < 3; i++) {
    const vida = document.createElement("span");
    vida.classList.add("vida");
    if (i < cantidad) {
      vida.classList.add("activa");
      // Si es la última vida y solo queda 1
      if (cantidad === 1) vida.classList.add("peligro");
    } else {
      vida.classList.add("perdida");
    }
    container.appendChild(vida);
  }
}

// ==============================
//   GANADOR / CARTEL 
// ==============================
function finalizarGanador(jugador) {
  rondaActiva = false;
  btnJ1.disabled = true;
  btnJ2.disabled = true;
  btnCubrirJ1.disabled = true;
  btnCubrirJ2.disabled = true;

  sndGameOver.play();
  mostrarCartelGanador(jugador);
}

function mostrarCartelGanador(jugador) {
  const cartel = document.getElementById("cartel-gameover");
  const texto = document.getElementById("texto-gameover");
  const btnReiniciar = document.getElementById("btnReiniciar");

  texto.textContent = `GANADOR: Jugador ${jugador}`;
  cartel.style.display = "flex";

  cartel.classList.remove("mostrar");
  void cartel.offsetWidth; // forzar reflow
  cartel.classList.add("mostrar");

  btnReiniciar.onclick = () => {
    cartel.classList.remove("mostrar");
    setTimeout(() => {
      cartel.style.display = "none";
      iniciarDuelo2Jugadores();
    }, 500);
  };
}

function comprobarGanador() {
  if (vidasJ1 <= 0 || expJ2 >= 3) {
    finalizarGanador(2);
    return true;
  }
  if (vidasJ2 <= 0 || expJ1 >= 3) {
    finalizarGanador(1);
    return true;
  }
  return false;
}

// ==============================
//   EVENTOS
// ==============================
btnJ1.addEventListener("click", () => disparar(1));
btnJ2.addEventListener("click", () => disparar(2));
btnCubrirJ1.addEventListener("click", () => cubrirse(1));
btnCubrirJ2.addEventListener("click", () => cubrirse(2));

export { iniciarDuelo2Jugadores };
