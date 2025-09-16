import { aplicarMejoraAleatoria, obtenerMejorasActivas, resetearMejoras } from "./tienda.js";

console.log("script.js cargado correctamente");

const btnIniciar = document.getElementById("btnIniciar");
const btnJugador = document.getElementById("btnJugador");
const btnCubrirse = document.getElementById("btnCubrirse");
const btnTienda = document.getElementById("btnTienda");
const mensaje = document.getElementById("mensaje");

const sndInicio = document.getElementById("sndInicio");
const sndDisparo = document.getElementById("sndDisparo");
const sndVictoria = document.getElementById("sndVictoria");
const sndDerrota = document.getElementById("sndDerrota");
const sndTienda = document.getElementById("sndTienda");
const sndCubrirse = document.getElementById("sndCubrirse");
const sndGameOver = document.getElementById("sndGameOver");

const overlay = document.getElementById("gameover-overlay");
const flash = document.getElementById("pantalla-flash");

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
let derrotasSeguidas = 0;
let chalecoActivo = false;
let disparoAntesDeTiempoUsado = false;


const spanNivel = document.getElementById("nivel");
const spanExp = document.getElementById("exp");
const spanDisparos = document.getElementById("disparos"); // Para mostrar los disparos restantes

let moverBotonInterval = null;

function aumentarDificultad() {
  const mejoras = obtenerMejorasActivas();

  // --- 1. TIEMPOS DE REACCIÓN PROGRESIVOS ---
  let tiempoEsperaMin = Math.max(1500 - (nivel - 1) * 150, 800);
  let tiempoEsperaMax = Math.max(2500 - (nivel - 1) * 250, 1500);
  console.log(`🎯 Nivel ${nivel} - Tiempo de espera entre ${tiempoEsperaMin}ms y ${tiempoEsperaMax}ms`);

  // --- 2. DISPAROS INICIALES ---
  if (experiencia === 0) {
    const baseDisparos = Math.max(6 - (nivel - 1), 2);
    disparosRestantes = mejoras.noRecarga ? 6 : baseDisparos;
    spanDisparos.textContent = disparosRestantes;
    console.log(`🔫 Disparos: ${disparosRestantes} (noRecarga=${mejoras.noRecarga})`);
  }

  // --- 3. LIMPIEZA DE ESTADO ---
  clearInterval(moverBotonInterval);
  clearInterval(parpadeoInterval);
  moverBotonInterval = null;
  parpadeoInterval = null;
  btnJugador.style.position = "static";
  btnJugador.classList.remove("girando");
  btnJugador.style.opacity = "1";
  btnJugador.style.transform = "";

  // --- 4. AJUSTE DE MOVIMIENTO ---
  let maxX = 200 + (nivel - 1) * 60; // aumenta progresivamente
  let maxY = 200 + (nivel - 1) * 60;
  let intervaloMovimiento = Math.max(900 - (nivel - 1) * 80, 120);

  // Nivel 3+: botón más pequeño
  if (nivel >= 3) btnJugador.style.transform = "scale(0.5)";

  // Nivel 4+: giro
  if (nivel >= 4) btnJugador.classList.add("girando");

  // Nivel 6+: parpadeo enemigo
  if (nivel >= 6) {
    parpadeoInterval = setInterval(() => {
      btnJugador.style.opacity = btnJugador.style.opacity === "0.3" ? "1" : "0.3";
    }, 500);
  }

  // Nivel 8: parpadeo jugador
  if (nivel === 8) {
    parpadeoInterval = setInterval(() => {
      btnJugador.style.opacity = btnJugador.style.opacity === "0" ? "1" : "0";
    }, 500);
  }

  // Nivel 9: movimiento más rápido y errático
  moverBotonInterval = setInterval(() => {
    let randomX, randomY;
    if (nivel === 9) {
      randomX = Math.floor(Math.random() * maxX);
      randomY = Math.floor(Math.random() * maxY);
    } else if (nivel >= 7) {
      // Movimiento sinusoidal normal
      randomX = Math.floor((Math.sin(Date.now() / 100) * maxX) / 2 + maxX / 2);
      randomY = Math.floor((Math.cos(Date.now() / 100) * maxY) / 2 + maxY / 2);
    } else {
      randomX = Math.floor(Math.random() * maxX);
      randomY = Math.floor(Math.random() * maxY);
    }

    btnJugador.style.position = "absolute";
    btnJugador.style.left = `${randomX}px`;
    btnJugador.style.top = `${randomY}px`;
  }, intervaloMovimiento);

  console.log(`🏃 Movimiento cada ${intervaloMovimiento}ms en rango ${maxX}x${maxY}px`);

  // --- 5. TIEMPOS PARA EL ENEMIGO ---
  const tiempoMaximoBase = Math.random() * 3000 + 2000;
  let tiempoMaximo = tiempoMaximoBase - (nivel - 1) * 100; // CPU más rápida progresivamente
  tiempoMaximo = Math.max(tiempoMaximo, 1000);

  return {
    tiempoEsperaMin,
    tiempoEsperaMax,
    tiempoMaximo
  };
}

// Función para iniciar la ronda
btnIniciar.addEventListener("click", () => {
  console.log("Iniciando el juego...");
  mensaje.textContent = "Preparado... espera la señal...";
  btnIniciar.disabled = true;

  clearTimeout(timeoutReaccion);
  btnJugador.disabled = false;
  btnCubrirse.disabled = true;
  puedeDisparar = false;
  disparoJugador = false;
  disparoCPU = false;
  cubierto = false;
  sndInicio.currentTime = 0;
  sndInicio.play().catch((error) => {
    console.warn("No se pudo reproducir el sonido de inicio:", error);
  });

  // Aplicar dificultad según el nivel actual
  const { tiempoEsperaMin, tiempoEsperaMax } = aumentarDificultad();
  const tiempoEspera =
    Math.random() * (tiempoEsperaMax - tiempoEsperaMin) + tiempoEsperaMin;

  setTimeout(() => {
    console.log("¡Es hora de disparar!");
    mensaje.textContent = "¡DISPARA!";
    sndDisparo.play();
    puedeDisparar = true;
    btnCubrirse.disabled = false;

    const tiempoMaximo =
      Math.random() * (tiempoEsperaMax - tiempoEsperaMin) + tiempoEsperaMin;

    timeoutReaccion = setTimeout(() => {
      console.log("⏱︎ Se ha acabado el tiempo para disparar...");

      if (!disparoJugador && !cubierto) {
        const mejoras = obtenerMejorasActivas();  // Obtener las mejoras activas

        // Verificar si el chaleco antibalas está activo y si es el primer disparo
        if (mejoras.chalecoAntibalas && !chalecoActivo) {
          console.log("❤︎ ¡Sobrevives al disparo gracias al chaleco antibalas!");
          chalecoActivo = true; // Desactivar el chaleco después del primer impacto
          mensaje.textContent = "❤︎ ¡Sobrevives al disparo gracias al chaleco antibalas!";
          return; // Terminar la función para evitar que se ejecute el código de derrota
        }

        mensaje.textContent = "☠︎ La máquina te disparó primero...";
        sndDerrota.play();
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
        efectoDisparoPantalla();
        disparoCPU = true;

        derrotasSeguidas++; // Aumentamos derrotas

        const mejorasActuales = obtenerMejorasActivas();
        const limiteDerrotas = mejoras.instintoSupervivencia ? 5 : 3;

        if (derrotasSeguidas >= limiteDerrotas) {
          mostrarGameOver();
          return;
        }

        if (experiencia > 1) {
          experiencia--;
          mensaje.textContent += " Has perdido un punto de experiencia...";
        }

        spanNivel.textContent = nivel;
        spanExp.textContent = experiencia;
      }

      const tiempoMaximoBase = Math.random() * 3000 + 2000;
      let tiempoMaximo = tiempoMaximoBase;

      if (nivel >= 5) {
        tiempoMaximo = Math.max(tiempoMaximoBase - 1000, 1000); // CPU más rápida
      }
    }, tiempoMaximo);
    btnIniciar.disabled = false;
  }, tiempoEspera);
});

// Función para cuando el jugador se cubra
btnCubrirse.addEventListener("click", () => {
  console.log("Jugador se cubre");


  if (disparoCPU) {
    const mejoras = obtenerMejorasActivas();  // Obtener las mejoras activas

    // Verificar si el chaleco antibalas está activo y si es el primer disparo
    if (mejoras.chalecoAntibalas && !chalecoActivo) {
      console.log("❤︎ ¡Chaleco antibalas activado! Sobrevives al primer disparo enemigo");
      chalecoActivo = true; // Desactivar el chaleco después del primer impacto
      mensaje.textContent = "❤︎ ¡Sobrevives al disparo gracias al chaleco antibalas!";
      return; // Terminar la función para evitar que se ejecute el código de derrota
    }

    mensaje.textContent =
      "☠︎ Te cubriste demasiado tarde... ¡La máquina ya había disparado!";
    sndDerrota.play();
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
    btnJugador.disabled = true;
    btnCubrirse.disabled = true;

    if (experiencia > 1) {
      experiencia--;
      mensaje.textContent += " Has perdido un punto de experiencia...";
    }

    spanNivel.textContent = nivel;
    spanExp.textContent = experiencia;
    return;
  }

  cubierto = true;
  clearTimeout(timeoutReaccion);
  btnJugador.disabled = true;
  btnCubrirse.disabled = true;
  mensaje.textContent = "☮ Te has cubierto. Ganaste 2 balas extra.";
  sndCubrirse.play();
  disparosRestantes = Math.min(disparosRestantes + 2, 6);
  spanDisparos.textContent = disparosRestantes;
});

// Función para cuando el jugador dispare
btnJugador.addEventListener("click", () => {
  const mejoras = obtenerMejorasActivas();

  console.log("Jugador disparó");

  if (puedeDisparar && !disparoJugador && !disparoCPU &&
    (disparosRestantes > 0 || mejoras.noRecarga)) {

    disparoJugador = true;
    clearTimeout(timeoutReaccion);
    derrotasSeguidas = 0; // Reinicia derrotas al ganar

    if (!mejoras.noRecarga) {
      disparosRestantes--;
    }

    mensaje.textContent = "𒀭 ¡Disparaste primero! Has ganado el duelo.";
    btnJugador.disabled = true;
    btnCubrirse.disabled = true;
    sndVictoria.play();

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

      // Activar tienda en niveles 5 y 10
      if ((nivel === 5 || nivel === 10) && btnTienda.dataset.used === "false") {
        btnTienda.disabled = false;
        btnTienda.dataset.used = "true";
        mensaje.textContent += " ¡Puedes usar la tienda!";
        sndTienda.play();
      }
    }

    spanNivel.textContent = nivel;
    spanExp.textContent = experiencia;
    spanDisparos.textContent = mejoras.noRecarga ? 6 : disparosRestantes;

  } else if (!puedeDisparar) {
    const mejoras = obtenerMejorasActivas();

    if (mejoras.menteFria && !disparoAntesDeTiempoUsado) {
      // Primera vez, no pierdes experiencia
      disparoAntesDeTiempoUsado = true;
      mensaje.textContent = "֍ Mente Fría te protege de perder experiencia esta vez.";
    } else {
      // Pierdes experiencia normalmente
      mensaje.textContent = "𒀯 ¡Disparaste antes de tiempo!";
      sndDerrota.play();
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }

      if (experiencia > 0) experiencia--;
      mensaje.textContent += "◉ Has perdido 1 de experiencia.";
    }

    btnJugador.disabled = true;
    btnCubrirse.disabled = true;
    spanNivel.textContent = nivel;
    spanExp.textContent = experiencia;
    spanDisparos.textContent = mejoras.noRecarga ? 6 : disparosRestantes;
    btnIniciar.disabled = false;
  }
});


btnTienda.addEventListener("click", () => {
  if (nivel >= 5) {
    const mejora = aplicarMejoraAleatoria(nivel);
    if (mejora) {
      mensaje.textContent = `⚒︎ ¡Has obtenido: ${mejora.nombre} (${mejora.descripcion ?? ""})!`;
    } else {
      mensaje.textContent = "𒉽 Ya tienes todas las mejoras disponibles.";
    }
    btnTienda.disabled = true;
  }
});


function animarSlideIn(elemento) {
  elemento.classList.remove("anim-slide-in");
  void elemento.offsetWidth; // Fuerza el reinicio de la animación
  elemento.classList.add("anim-slide-in");
}

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
  spanNivel.textContent = nivel;
  spanExp.textContent = experiencia;

  // Si se llega a nivel 5 o 10 con contraseña, activar tienda si no se ha usado
  btnTienda.dataset.used = "false"; // Permitir usar tienda nuevamente si nivel se establece por contraseña
  if ((nivel === 5 || nivel === 10) && btnTienda.dataset.used === "false") {
    btnTienda.disabled = false;
    btnTienda.dataset.used = "true";
    mensaje.textContent = "☄︎ ¡Puedes usar la tienda!";
    sndTienda.play();
  }

  aumentarDificultad();
}

function verificarPassword(pass) {
  const passwordsValidas = {
    "truco": 5,
    "trato": 10,
    "game over": 99
  };

  if (passwordsValidas[pass] !== undefined) {
    establecerNivel(passwordsValidas[pass]);
    mostrarMensaje("ღ ¡Nivel desbloqueado!");
  } else {
    mostrarMensaje("𒉽 Contraseña incorrecta");
  }

  function mostrarMensaje(texto) {
    mensaje.textContent = texto;
    animarSlideIn(mensaje);
  }
}

function efectoDisparoPantalla() {

  flash.style.animation = "flash-disparo 0.6s ease-in-out";
  setTimeout(() => {
    flash.style.animation = "none";
  }, 700);
}

// Efecto cuando es GAME OVER
function mostrarGameOver() {
  juegoTerminado = true;
  mensaje.textContent = "☠︎ GAME OVER - Has perdido el juego";
  sndGameOver.currentTime = 0;  // Rebobina al principio para evitar duplicados
  sndGameOver.play();

  btnJugador.disabled = true;
  btnCubrirse.disabled = true;
  btnIniciar.disabled = true;
  btnTienda.disabled = true;

  clearInterval(moverBotonInterval);
  clearInterval(parpadeoInterval);
  clearTimeout(timeoutReaccion);

  // Mostrar el cartel
  const cartel = document.getElementById("cartel-gameover");
  cartel.style.display = "flex";

  // Asegurar que clase para animar se aplica después de renderizar
  setTimeout(() => {
    cartel.classList.add("mostrar");
  }, 50);
}

document.getElementById("btnReiniciar").addEventListener("click", () => {
  const cartel = document.getElementById("cartel-gameover");
  cartel.classList.remove("mostrar");
  setTimeout(() => {
    cartel.style.display = "none";
    reiniciarJuego(); // Asegúrate de tener esta función implementada
  }, 500);
});

function reiniciarJuego() {
  console.log("♻︎ Reiniciando juego...");

  // Reiniciar estado
  nivel = 1;
  experiencia = 0;
  disparosRestantes = 6;
  derrotasSeguidas = 0;
  juegoTerminado = false;

  resetearMejoras();

  // Reiniciar flags
  puedeDisparar = false;
  disparoJugador = false;
  disparoCPU = false;
  cubierto = false;
  disparoAntesDeTiempoUsado = false;

  // Actualizar UI
  mensaje.textContent = "Presiona Iniciar Duelo";
  spanNivel.textContent = nivel;
  spanExp.textContent = experiencia;
  spanDisparos.textContent = disparosRestantes;

  // Botones
  [btnJugador, btnCubrirse].forEach(btn => btn.disabled = true);
  btnIniciar.disabled = false;
  btnTienda.disabled = true;
  btnTienda.dataset.used = "false";

  // Limpiar estilos
  Object.assign(btnJugador.style, {
    position: "static",
    transform: "",
    opacity: "1",
    left: "",
    top: ""
  });
  btnJugador.classList.remove("girando");

  // Limpiar timers y efectos
  [moverBotonInterval, parpadeoInterval].forEach(clearInterval);
  clearTimeout(timeoutReaccion);
  moverBotonInterval = parpadeoInterval = null;
  flash.style.animation = "none";

  // Reaplicar dificultad inicial
  aumentarDificultad();
}