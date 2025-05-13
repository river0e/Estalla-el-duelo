import { aplicarMejoraAleatoria, obtenerMejorasActivas } from "./tienda.js";

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

const overlay = document.getElementById("gameover-overlay");
const flash = document.getElementById("pantalla-flash");


let puedeDisparar = false;
let disparoJugador = false;
let disparoCPU = false;
let cubierto = false; // Si el jugador se cubrió
let nivel = 1;
let experiencia = 0;
let disparosRestantes = 6; // Cargador inicial con 6 disparos
let timeoutReaccion; // Controla el tiempo de reacción del jugador
let parpadeoInterval = null;
let derrotasSeguidas = 0;
let juegoTerminado = false;

const spanNivel = document.getElementById("nivel");
const spanExp = document.getElementById("exp");
const spanDisparos = document.getElementById("disparos"); // Para mostrar los disparos restantes

let moverBotonInterval = null;

function aumentarDificultad() {
  const mejoras = obtenerMejorasActivas(); // Obtener mejoras activas

  // 1. Ajuste de tiempos con mejoras
  let tiempoEsperaMin = Math.max(1500 - (nivel - 1) * 200, 800);
  let tiempoEsperaMax = Math.max(2500 - (nivel - 1) * 300, 1500);

  if (mejoras.movimientoLento) {
    tiempoEsperaMin += 300;
    tiempoEsperaMax += 500;
    console.log("🐌 Mejora: Movimiento lento activo (+300/+500ms)");
  }

  console.log(`🎯 Nivel ${nivel} - Tiempo de espera entre ${tiempoEsperaMin}ms y ${tiempoEsperaMax}ms`);

  // 2. Disparos iniciales con mejoras
  if (experiencia === 0) {
    const baseDisparos = Math.max(6 - (nivel - 1), 2);
    disparosRestantes = mejoras.noRecarga ? 6 : baseDisparos;
    spanDisparos.textContent = disparosRestantes;
    console.log(`🔫 Disparos: ${disparosRestantes} (noRecarga=${mejoras.noRecarga})`);
  }

  // 3. Limpiar intervalos y estilos previos
  clearInterval(moverBotonInterval);
  clearInterval(parpadeoInterval);
  moverBotonInterval = null;
  parpadeoInterval = null;

  btnJugador.style.position = "static";
  btnJugador.classList.remove("girando");
  btnJugador.style.opacity = "1";

  // 4. Aplicar tamaño del botón según mejoras y nivel
  if (nivel >= 3) {
    let maxX = 300;
    let maxY = 300;

    if (mejoras.botonGrande) {
      btnJugador.style.transform = "scale(2.2)";
      console.log("🔼 Mejora: Botón grande activado y persistente");
    } else {
      btnJugador.style.transform = "scale(0.5)";
      console.log("🔍 Nivel 3+: Botón más pequeño sin mejora");
    }

    console.log("🔍 Nivel 3+: Ajuste de tamaño del botón según mejoras");
  } else {
    if (mejoras.botonGrande) {
      btnJugador.style.transform = "scale(2.2)";
      console.log("🔼 Mejora: Botón grande activado (nivel < 3)");
    } else {
      btnJugador.style.transform = ""; // Sin escala si no hay mejora
    }
  }

  // 5. Movimiento y efectos por nivel
  if (nivel >= 2) {
    const intervaloMovimiento = nivel >= 10 ? 300 : 800;
    let maxX = 200;
    let maxY = 200;

    if (nivel >= 3) {
      maxX = 300;
      maxY = 300;
      if (!mejoras.botonGrande) {
        btnJugador.style.transform = "scale(0.5)";
      }
      console.log("🔍 Nivel 3+: Botón más pequeño y mayor rango de movimiento");
    }

    if (nivel >= 4) {
      maxX = 400;
      maxY = 400;
      btnJugador.classList.add("girando");
      console.log("🌀 Nivel 4+: Giro activado");
    }

    if (nivel >= 5) {
      parpadeoInterval = setInterval(() => {
        btnJugador.style.opacity = btnJugador.style.opacity === "0.3" ? "1" : "0.3";
      }, 500);
      console.log("✨ Nivel 5+: Parpadeo activado");
    }

    moverBotonInterval = setInterval(() => {
      let randomX, randomY;

      if (nivel >= 6) {
        randomX = Math.floor((Math.sin(Date.now() / 100) * maxX) / 2 + maxX / 2);
        randomY = Math.floor((Math.cos(Date.now() / 100) * maxY) / 2 + maxY / 2);
        console.log("🔄 Nivel 6+: Movimiento sinusoidal");
      } else {
        randomX = Math.floor(Math.random() * maxX);
        randomY = Math.floor(Math.random() * maxY);
      }

      btnJugador.style.position = "absolute";
      btnJugador.style.left = `${randomX}px`;
      btnJugador.style.top = `${randomY}px`;
    }, intervaloMovimiento);

    console.log(`🏃 Movimiento cada ${intervaloMovimiento}ms en rango ${maxX}x${maxY}px`);
  }

  // 6. Tiempo para enemigo 
  let tiempoMaximoBase = Math.random() * 3000 + 2000;
  let tiempoMaximo = tiempoMaximoBase;

  if (nivel >= 5) {
    tiempoMaximo = Math.max(tiempoMaximoBase - 1000, 1000);
    console.log("⚡ Nivel 5+: Enemigo más rápido");
  }

  if (mejoras.movimientoLento) {
    tiempoMaximo += 500;
    console.log("🐌 Mejora: enemigo más lento por movimientoLento");
  }

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
      console.log("⏰ Se ha acabado el tiempo para disparar...");

      if (!disparoJugador && !cubierto) {
        mensaje.textContent = "💀 La máquina te disparó primero...";
        sndDerrota.play();
        efectoDisparoPantalla();
        disparoCPU = true;

        derrotasSeguidas++; // Aumentamos derrotas
        if (derrotasSeguidas >= 3) {
          mostrarGameOver(); // GAME OVER después de 3 derrotas seguidas
          return;
        }

        if (experiencia > 1) {
          experiencia--;
          mensaje.textContent += " Has perdido un punto de experiecia...";
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
    mensaje.textContent =
      "💀 Te cubriste demasiado tarde... ¡La máquina ya había disparado!";
    sndDerrota.play();
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
  mensaje.textContent = "🧱 Te has cubierto. Ganaste 2 balas extra.";
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

    mensaje.textContent = "🏆 ¡Disparaste primero! Has ganado el duelo.";
    btnJugador.disabled = true;
    btnCubrirse.disabled = true;
    sndVictoria.play();

    if (!cubierto) {
      experiencia++;
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
    console.log("Disparo antes de tiempo");
    mensaje.textContent = "😵 ¡Disparaste antes de tiempo!";
    btnJugador.disabled = true;
    btnCubrirse.disabled = true;
    sndDerrota.play();

    if (experiencia > 0) {
      experiencia--;
      mensaje.textContent += " Has perdido 1 de experiencia.";
    }

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
      mensaje.textContent = `🎁 ¡Has obtenido: ${mejora.nombre} (${mejora.descripcion})!`;

      // Aplicar efectos visuales inmediatos
      if (mejora.nombre.includes("grande")) {
        btnJugador.style.transform = "scale(1.5)";
      }

      // Aplicar balas extra inmediatamente
      if (mejora.nombre.includes("Balas extra")) {
        disparosRestantes = Math.min(disparosRestantes + 2, 6);
        const mejoras = obtenerMejorasActivas();
        spanDisparos.textContent = mejoras.noRecarga ? 6 : disparosRestantes;
      }
    } else {
      mensaje.textContent = "ℹ️ Ya tienes todas las mejoras disponibles.";
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
  if ((nivel === 5 || nivel === 10) && btnTienda.dataset.used === "false") {
    btnTienda.disabled = false;
    btnTienda.dataset.used = "true";
    mostrarMensaje("🛒 ¡Puedes usar la tienda!");
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
    mostrarMensaje("🔓 ¡Nivel desbloqueado!");
  } else {
    mostrarMensaje("❌ Contraseña incorrecta");
  }

  function mostrarMensaje(texto) {
    mensaje.textContent = texto;
    animarSlideIn(mensaje); // Ya existe esta función en tu script
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
  mensaje.textContent = "☠️ GAME OVER - Has perdido el juego";
  sndDerrota.play();

  btnJugador.disabled = true;
  btnCubrirse.disabled = true;
  btnIniciar.disabled = true;
  btnTienda.disabled = true;

  clearInterval(moverBotonInterval);
  clearInterval(parpadeoInterval);
  clearTimeout(timeoutReaccion);

  // Activar telones
  const telonIzq = document.getElementById("telon-izquierdo");
  const telonDer = document.getElementById("telon-derecho");

  telonIzq.classList.add("telon-activo", "telon-izquierdo-activo");
  telonDer.classList.add("telon-activo", "telon-derecho-activo");

  // Mostrar overlay con retraso para dramatismo
  setTimeout(() => {
    const overlay = document.getElementById("gameover-overlay");
    overlay.style.display = "flex";
    overlay.style.pointerEvents = "auto";
    overlay.style.opacity = "1";
  }, 1600);
}