import { aplicarMejoraAleatoria, obtenerMejorasActivas, resetearMejoras } from "./tienda.js";
import { iniciarDuelo2Jugadores } from "./modo2jugadores.js";

document.getElementById("btnLocal").addEventListener("click", iniciarDuelo2Jugadores);

console.log("script.js cargado correctamente");

const pantallaInicial = document.getElementById('pantalla-inicial');
const btnCPU = document.getElementById('btnCPU');
const btnLocal = document.getElementById('btnLocal');
const nivelInfo = document.getElementById('nivel-info');
const zonaControl = document.getElementById('zona-control');
const mensajeElem = document.getElementById('mensaje');

// Ocultamos elementos del juego al inicio
nivelInfo.style.display = 'none';
zonaControl.style.display = 'none';
mensajeElem.style.display = 'none';

btnCPU.addEventListener('click', () => {
  pantallaInicial.style.display = 'none';
  nivelInfo.style.display = 'block';
  zonaControl.style.display = 'flex';
  mensajeElem.style.display = 'block';
  
  reiniciarJuego(); // inicia el juego contra CPU como antes
});

// -------------------------
// ELEMENTOS DEL DOM
// -------------------------
const botones = {
  iniciar: document.getElementById("btnIniciar"),
  jugador: document.getElementById("btnJugador"),
  cubrirse: document.getElementById("btnCubrirse"),
  tienda: document.getElementById("btnTienda")
};

const spans = {
  nivel: document.getElementById("nivel"),
  exp: document.getElementById("exp")
};

const sonidos = {
  inicio: document.getElementById("sndInicio"),
  disparo: document.getElementById("sndDisparo"),
  victoria: document.getElementById("sndVictoria"),
  derrota: document.getElementById("sndDerrota"),
  tienda: document.getElementById("sndTienda"),
  cubrirse: document.getElementById("sndCubrirse"),
  gameOver: document.getElementById("sndGameOver")
};

const mensaje = document.getElementById("mensaje");
const overlay = document.getElementById("gameover-overlay");
const flash = document.getElementById("pantalla-flash");

// -------------------------
// VARIABLES DE JUEGO
// -------------------------
let juegoTerminado = true;
let puedeDisparar = false;
let disparoJugador = false;
let disparoCPU = false;
let cubierto = false;
let nivel = 1;
let experiencia = 0;
let disparosRestantes = 6;
let timeoutReaccion;
let parpadeoInterval = null;
let moverBotonInterval = null;
let derrotasSeguidas = 0;
let chalecoActivo = false;
let disparoAntesDeTiempoUsado = false;

// -------------------------
// HELPER FUNCTIONS
// -------------------------

function bloquearBotones(...btns) {
  btns.forEach(btn => btn.disabled = true);
}

function desbloquearBotones(...btns) {
  btns.forEach(btn => btn.disabled = false);
}

function resetBotonJugador() {
  Object.assign(botones.jugador.style, {
    position: "static",
    transform: "",
    opacity: "1",
    left: "",
    top: ""
  });
  botones.jugador.classList.remove("girando");
  clearInterval(moverBotonInterval);
  clearInterval(parpadeoInterval);
  moverBotonInterval = parpadeoInterval = null;
}

function efectoDisparoPantalla() {
  flash.style.animation = "flash-disparo 0.6s ease-in-out";
  document.body.classList.add("sacudida");

   // Vibración en móviles (si el navegador lo soporta)
  if (navigator.vibrate) {
    navigator.vibrate([100, 50, 150]); 
  }
  crearSplash(40);
  setTimeout(() => {
    flash.style.animation = "none";
    document.body.classList.remove("sacudida");
  }, 700);
}

function actualizarBalasyVidas() {
  const mejoras = obtenerMejorasActivas();
  const balasDiv = document.getElementById("balas");
  const vidasDiv = document.getElementById("vidas");

  balasDiv.innerHTML = Array.from({ length: 6 }, (_, i) =>
    `<div class="bala ${i < (mejoras.noRecarga ? 6 : disparosRestantes) ? 'activa' : ''}"></div>`
  ).join('');

  const maxVidas = mejoras.instintoSupervivencia ? 5 : 3;
  const vidasRestantes = Math.max(maxVidas - derrotasSeguidas, 0);

  vidasDiv.innerHTML = Array.from({ length: maxVidas }, (_, i) =>
    `<span class="vida ${i < vidasRestantes ? 'activa' : 'perdida'}"></span>`
  ).join('');
}

function aplicarDerrota() {
  const mejoras = obtenerMejorasActivas();

  if (mejoras.chalecoAntibalas && !chalecoActivo) {
    chalecoActivo = true;
    mensaje.textContent = "❤︎ ¡Sobrevives al disparo gracias al chaleco antibalas!";
    efectoDisparoPantalla();
    return true;
  }

  mensaje.textContent = "☠︎ La máquina te disparó primero...";
  sonidos.derrota.play();
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  efectoDisparoPantalla();
  disparoCPU = true;

  derrotasSeguidas++;
  actualizarBalasyVidas();

  const limiteDerrotas = mejoras.instintoSupervivencia ? 5 : 3;
  if (derrotasSeguidas >= limiteDerrotas) {
    mostrarGameOver();
    return true;
  }

  if (experiencia > 1) {
    experiencia--;
    mensaje.textContent += " Has perdido un punto de experiencia...";
  }

  spans.nivel.textContent = nivel;
  spans.exp.textContent = experiencia;
  return false;
}

// -------------------------
// FUNCIONES DE JUEGO
// -------------------------
function aumentarDificultad() {
  const mejoras = obtenerMejorasActivas();

  // --- 1. TIEMPOS DE REACCIÓN CPU ---
  let tiempoEsperaMin = Math.max(1500 - (nivel - 1) * 150, 600); // más rápido que antes
  let tiempoEsperaMax = Math.max(2500 - (nivel - 1) * 250, 1200);

  // --- 2. DISPAROS INICIALES ---
  if (experiencia === 0) {
    const baseDisparos = Math.max(6 - (nivel - 1), 2);
    disparosRestantes = mejoras.noRecarga ? 6 : baseDisparos;
    actualizarBalasyVidas();
  }

  // --- 3. RESET DEL BOTÓN ---
  resetBotonJugador();

  // --- 4. MOVIMIENTO DEL BOTÓN ---
  let maxX = 200 + (nivel - 1) * 60;
  let maxY = 200 + (nivel - 1) * 60;
  let intervaloMovimiento = Math.max(900 - (nivel - 1) * 100, 80); // más rápido a niveles altos

  // Cambios visuales según nivel
  if (nivel >= 3) botones.jugador.style.transform = "scale(0.5)";
  if (nivel >= 4) botones.jugador.classList.add("girando");

  // Parpadeo según nivel
  if (nivel >= 6) {
    parpadeoInterval = setInterval(() => {
      botones.jugador.style.opacity = botones.jugador.style.opacity === "0.3" ? "1" : "0.3";
    }, 500);
  }

  // Movimiento del botón según nivel
  moverBotonInterval = setInterval(() => {
    let randomX, randomY;

    if (nivel >= 9) {
      // Nivel 9+: movimiento totalmente errático
      randomX = Math.floor(Math.random() * maxX);
      randomY = Math.floor(Math.random() * maxY);
    } else if (nivel >= 7) {
      // Nivel 7-8: movimiento sinusoidal suave
      randomX = Math.floor((Math.sin(Date.now() / 100) * maxX) / 2 + maxX / 2);
      randomY = Math.floor((Math.cos(Date.now() / 100) * maxY) / 2 + maxY / 2);
    } else {
      // Niveles bajos: movimiento aleatorio normal
      randomX = Math.floor(Math.random() * maxX);
      randomY = Math.floor(Math.random() * maxY);
    }

    botones.jugador.style.position = "absolute";
    botones.jugador.style.left = `${randomX}px`;
    botones.jugador.style.top = `${randomY}px`;
  }, intervaloMovimiento);

  // --- 5. TIEMPO MÁXIMO PARA RESPONDER DEL JUGADOR ---
  const tiempoMaximoBase = Math.random() * 3000 + 2000;
  let tiempoMaximo = Math.max(tiempoMaximoBase - (nivel - 1) * 200, 800); // CPU más rápida a cada nivel

  console.log(`Nivel ${nivel}: CPU responde entre ${tiempoEsperaMin}ms y ${tiempoEsperaMax}ms, botón mueve cada ${intervaloMovimiento}ms, tiempoMaximo=${tiempoMaximo}ms`);

  return { tiempoEsperaMin, tiempoEsperaMax, tiempoMaximo };
}

function mostrarGameOver() {
  juegoTerminado = true;
  mensaje.textContent = "☠︎ GAME OVER - Has perdido el juego";
  sonidos.gameOver.currentTime = 0;
  sonidos.gameOver.play();

  bloquearBotones(botones.jugador, botones.cubrirse, botones.iniciar, botones.tienda);

  resetBotonJugador();
  clearTimeout(timeoutReaccion);

  const cartel = document.getElementById("cartel-gameover");
  cartel.style.display = "flex";
  setTimeout(() => cartel.classList.add("mostrar"), 50);
}

function reiniciarJuego() {
  nivel = 1;
  experiencia = 0;
  disparosRestantes = 6;
  derrotasSeguidas = 0;
  juegoTerminado = false;

  resetearMejoras();
  chalecoActivo = false;
  disparoAntesDeTiempoUsado = false;
  puedeDisparar = disparoJugador = disparoCPU = cubierto = false;

  mensaje.textContent = "Presiona Iniciar Duelo";
  spans.nivel.textContent = nivel;
  spans.exp.textContent = experiencia;
  actualizarBalasyVidas();

  bloquearBotones(botones.jugador, botones.cubrirse);
  desbloquearBotones(botones.iniciar);
  botones.tienda.disabled = true;
  botones.tienda.dataset.used = "false";

  resetBotonJugador();
  clearTimeout(timeoutReaccion);
  aumentarDificultad();
}

// -------------------------
// EVENTOS
// -------------------------

// INICIAR RONDA
botones.iniciar.addEventListener("click", () => {
  mensaje.textContent = "Preparado... espera la señal...";
  bloquearBotones(botones.iniciar);
  const disparoContainer = document.getElementById("boton-disparo-container");
  disparoContainer.style.display = "block";

  clearTimeout(timeoutReaccion);
  desbloquearBotones(botones.jugador);
  botones.cubrirse.disabled = true;
  puedeDisparar = disparoJugador = disparoCPU = cubierto = false;

  sonidos.inicio.currentTime = 0;
  sonidos.inicio.play().catch(() => console.warn("No se pudo reproducir el sonido de inicio"));

  const { tiempoEsperaMin, tiempoEsperaMax, tiempoMaximo } = aumentarDificultad();
  const tiempoEspera = Math.random() * (tiempoEsperaMax - tiempoEsperaMin) + tiempoEsperaMin;

  setTimeout(() => {
    mensaje.textContent = "¡DISPARA!";
    sonidos.disparo.play();
    puedeDisparar = true;
    botones.cubrirse.disabled = false;

    timeoutReaccion = setTimeout(() => {
      if (!disparoJugador && !cubierto) aplicarDerrota();
    }, tiempoMaximo);

    desbloquearBotones(botones.iniciar);
  }, tiempoEspera);
});

// CUBRIRSE
botones.cubrirse.addEventListener("click", () => {
  if (disparoCPU) {
    const mejoras = obtenerMejorasActivas();
    if (mejoras.chalecoAntibalas && !chalecoActivo) {
      chalecoActivo = true;
      mensaje.textContent = "❤︎ ¡Sobrevives al disparo gracias al chaleco antibalas!";
      return;
    }
    mensaje.textContent = "☠︎ Te cubriste demasiado tarde... ¡La máquina ya había disparado!";
    sonidos.derrota.play();
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    bloquearBotones(botones.jugador, botones.cubrirse);
    if (experiencia > 1) {
      experiencia--;
      mensaje.textContent += " Has perdido un punto de experiencia...";
    }
    spans.nivel.textContent = nivel;
    spans.exp.textContent = experiencia;
    return;
  }

  cubierto = true;
  clearTimeout(timeoutReaccion);
  bloquearBotones(botones.jugador, botones.cubrirse);
  mensaje.textContent = "☮ Te has cubierto. Ganaste 2 balas extra.";
  sonidos.cubrirse.play();
  disparosRestantes = Math.min(disparosRestantes + 2, 6);
  actualizarBalasyVidas();
});

// DISPARAR
botones.jugador.addEventListener("click", () => {
  const mejoras = obtenerMejorasActivas();
  if (puedeDisparar && !disparoJugador && !disparoCPU && (disparosRestantes > 0 || mejoras.noRecarga)) {
    disparoJugador = true;
    clearTimeout(timeoutReaccion);
    derrotasSeguidas = 0;

    if (!mejoras.noRecarga) disparosRestantes--;

    mensaje.textContent = "𒀭 ¡Disparaste primero! Has ganado el duelo.";
    bloquearBotones(botones.jugador, botones.cubrirse);
    sonidos.victoria.play();

    if (!cubierto) {
      experiencia += mejoras.municionPerforante ? 2 : 1;
      const expNecesaria = mejoras.experienciaRapida ? 3 : 5;
      if (experiencia >= expNecesaria) {
        nivel++;
        experiencia = 0;
        mensaje.textContent += " ¡Subiste de nivel!";
        animarSlideIn(mensaje);
        aumentarDificultad();
      }
      if ((nivel === 5 || nivel === 10) && botones.tienda.dataset.used === "false") {
        botones.tienda.disabled = false;
        botones.tienda.dataset.used = "true";
        mensaje.textContent += " ¡Puedes usar la tienda!";
        sonidos.tienda.play();
      }
    }

    spans.nivel.textContent = nivel;
    spans.exp.textContent = experiencia;
    actualizarBalasyVidas();

  } else if (!puedeDisparar) {
    if (mejoras.menteFria && !disparoAntesDeTiempoUsado) {
      disparoAntesDeTiempoUsado = true;
      mensaje.textContent = "֍ Mente Fría te protege de perder experiencia esta vez.";
    } else {
      mensaje.textContent = "𒀯 ¡Disparaste antes de tiempo!";
      sonidos.derrota.play();
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      if (experiencia > 0) experiencia--;
      mensaje.textContent += "◉ Has perdido 1 de experiencia.";
    }
    bloquearBotones(botones.jugador, botones.cubrirse);
    spans.nivel.textContent = nivel;
    spans.exp.textContent = experiencia;
    actualizarBalasyVidas();
    desbloquearBotones(botones.iniciar);
  }
});

// TIENDA
botones.tienda.addEventListener("click", () => {
  if (nivel >= 5) {
    const mejora = aplicarMejoraAleatoria(nivel);
    mensaje.textContent = mejora
      ? `⚒︎ ¡Has obtenido: ${mejora.nombre} (${mejora.descripcion ?? ""})!`
      : "𒉽 Ya tienes todas las mejoras disponibles.";
    botones.tienda.disabled = true;
  }
});

// -------------------------
// FUNCIONES UTILES
// -------------------------
function animarSlideIn(elemento) {
  elemento.classList.remove("anim-slide-in");
  void elemento.offsetWidth;
  elemento.classList.add("anim-slide-in");
}

// PASSWORD
const inputPassword = document.getElementById("password");
inputPassword.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    const valor = inputPassword.value.trim();
    if (valor !== "") {
      verificarPassword(valor);
      inputPassword.value = "";
    }
  }
});

function establecerNivel(nuevoNivel) {
  nivel = nuevoNivel;
  experiencia = 0;
  spans.nivel.textContent = nivel;
  spans.exp.textContent = experiencia;

  botones.tienda.dataset.used = "false";
  if ((nivel === 5 || nivel === 10) && botones.tienda.dataset.used === "false") {
    botones.tienda.disabled = false;
    botones.tienda.dataset.used = "true";
    mensaje.textContent = "☄︎ ¡Puedes usar la tienda!";
    sonidos.tienda.play();
  }

  aumentarDificultad();
}

function verificarPassword(pass) {
  const passwordsValidas = { "truco": 5, "trato": 10, "game over": 99 };
  if (passwordsValidas[pass] !== undefined) {
    establecerNivel(passwordsValidas[pass]);
    mostrarMensaje("ღ ¡Nivel desbloqueado!");
  } else mostrarMensaje("𒉽 Contraseña incorrecta");

  function mostrarMensaje(texto) {
    mensaje.textContent = texto;
    animarSlideIn(mensaje);
  }
}



// -------------------------
// BOTON REINICIAR
// -------------------------
document.getElementById("btnReiniciar").addEventListener("click", () => {
  const cartel = document.getElementById("cartel-gameover");
  cartel.classList.remove("mostrar");
  setTimeout(() => {
    cartel.style.display = "none";
    reiniciarJuego();
  }, 500);
});
function crearSplash(cantidad = 30) {
  const container = document.getElementById("splash-container");

  for (let i = 0; i < cantidad; i++) {
    const particula = document.createElement("div");
    particula.classList.add("particula");

    // Aleatorizar tamaño y color
    const size = Math.random() * 20 + 5; // entre 5px y 25px
    particula.style.width = `${size}px`;
    particula.style.height = `${size}px`;

    const colores = ["#8b0000", "#b22222", "#660000", "#3a0000"];
    particula.style.background = `radial-gradient(circle, ${
      colores[Math.floor(Math.random() * colores.length)]
    } 0%, #1a0000 90%)`;

    // Dirección aleatoria
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * 250 + 80; // más lejos todavía
    const x = Math.cos(angle) * distance + "px";
    const y = Math.sin(angle) * distance + "px";

    particula.style.setProperty("--x", x);
    particula.style.setProperty("--y", y);

    container.appendChild(particula);

    // Limpiar después de la animación
    particula.addEventListener("animationend", () => particula.remove());
  }
}

