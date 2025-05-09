import {
  aplicarMejora,
  disparoDoble,
  balasExtra,
  movimientoLento,
  resetearMejoras,
} from "./tienda.js";

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

let puedeDisparar = false;
let disparoJugador = false;
let disparoCPU = false;
let cubierto = false; // Si el jugador se cubrió
let nivel = 1;
let experiencia = 0;
let disparosRestantes = 6; // Cargador inicial con 6 disparos
let timeoutReaccion; // Controla el tiempo de reacción del jugador
let parpadeoInterval = null;

const spanNivel = document.getElementById("nivel");
const spanExp = document.getElementById("exp");
const spanDisparos = document.getElementById("disparos"); // Para mostrar los disparos restantes

let moverBotonInterval = null;

function aumentarDificultad() {
  // Reducimos más rápido el tiempo de espera a medida que sube el nivel
  const tiempoEsperaMin = Math.max(1500 - (nivel - 1) * 200, 800); // Reducción más pronunciada
  const tiempoEsperaMax = Math.max(2500 - (nivel - 1) * 300, 1500); // Menor rango de espera

  console.log(
    `🎯 Nivel ${nivel} - Tiempo de espera entre ${tiempoEsperaMin}ms y ${tiempoEsperaMax}`
  );

  // Ajuste de disparos restantes al subir de nivel
  if (experiencia === 0) {
    disparosRestantes = Math.max(6 - (nivel - 1), 2);
    spanDisparos.textContent = disparosRestantes;
  }

  // Cancelar cualquier intervalo previo
  clearInterval(moverBotonInterval);
  moverBotonInterval = null;
  btnJugador.style.position = "static";
  btnJugador.classList.remove("girando");

  // Mover el botón y añadir efectos por nivel
  if (nivel >= 2) {
    // Intervalo de movimiento según el nivel
    const intervaloMovimiento = nivel >= 10 ? 300 : 800;

    // Rango de movimiento según el nivel
    let maxX = 200;
    let maxY = 200;

    if (nivel >= 3) {
      maxX = 300;
      maxY = 300;
      btnJugador.style.transform = "scale(0.9)"; // Nivel 3: hacerlo más pequeño
    }

    if (nivel >= 4) {
      maxX = 400;
      maxY = 400;
      btnJugador.classList.add("girando"); // Nivel 4: giro
    }

    if (nivel >= 5) {
      if (parpadeoInterval) clearInterval(parpadeoInterval); // Limpiar si ya había uno
      let visible = true;
      parpadeoInterval = setInterval(() => {
        btnJugador.style.opacity = visible ? "0.3" : "1";
        visible = !visible;
      }, 500);
    }

    // Movimiento del botón
    moverBotonInterval = setInterval(() => {
      let randomX, randomY;

      if (nivel >= 6) {
        // Movimiento en zigzag simulado
        randomX = Math.floor(
          (Math.sin(Date.now() / 100) * maxX) / 2 + maxX / 2
        );
        randomY = Math.floor(
          (Math.cos(Date.now() / 100) * maxY) / 2 + maxY / 2
        );
      } else {
        randomX = Math.floor(Math.random() * maxX);
        randomY = Math.floor(Math.random() * maxY);
      }

      btnJugador.style.position = "absolute";
      btnJugador.style.left = `${randomX}px`;
      btnJugador.style.top = `${randomY}px`;
    }, intervaloMovimiento);
  }

  return { tiempoEsperaMin, tiempoEsperaMax };
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
        disparoCPU = true;

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
  console.log("Jugador disparó");

  if (
    puedeDisparar &&
    !disparoJugador &&
    !disparoCPU &&
    disparosRestantes > 0
  ) {
    disparoJugador = true;
    clearTimeout(timeoutReaccion);
    disparosRestantes--;
    mensaje.textContent = "🏆 ¡Disparaste primero! Has ganado el duelo.";
    btnJugador.disabled = true;
    btnCubrirse.disabled = true;
    sndVictoria.play();

    if (!cubierto) {
      experiencia++;
      if (experiencia >= 5) {
        nivel++;
        experiencia = 0;
        mensaje.textContent += " ¡Subiste de nivel!";
        // Llamar a aumentarDificultad solo si el nivel es 2, 3, 4...
        aumentarDificultad();
      }

      if (nivel >= 5 && btnTienda.dataset.used === "false") {
        btnTienda.disabled = false;
        btnTienda.dataset.used = "true";
        mensaje.textContent += " ¡Puedes usar la tienda!";
        sndTienda.play();
        resetearMejoras(); // Limpia mejoras anteriores
      }
    }

    spanNivel.textContent = nivel;
    spanExp.textContent = experiencia;
    spanDisparos.textContent = disparosRestantes;
  } else if (!puedeDisparar) {
    console.log("Disparo antes de tiempo");
    mensaje.textContent = "😵 ¡Disparaste antes de tiempo!";
    btnJugador.disabled = true;
    btnCubrirse.disabled = true;
    sndDerrota.play();

    // Si el jugador dispara antes de tiempo, solo pierde 1 de experiencia
    if (experiencia > 0) {
      experiencia--; // Perder 1 de experiencia
      mensaje.textContent += " Has perdido 1 de experiencia.";
    }

    spanNivel.textContent = nivel;
    spanExp.textContent = experiencia;
    spanDisparos.textContent = disparosRestantes;

    // Asegúrate de habilitar "Iniciar" incluso cuando se dispara antes de tiempo
    console.log("Habilitando el botón Iniciar tras disparo antes de tiempo");
    btnIniciar.disabled = false;
  }
});


// Función que se llama cuando subimos de nivel
function manejarNivel(nivel) {
  if (nivel >= 5) {
    // Activar el botón de la tienda solo a partir del nivel 5
    btnTienda.disabled = false;
  }
}

// Llamada cuando el jugador sube de nivel
if (nivel >= 5) {
  manejarNivel(nivel);
}

// Función para cuando el jugador hace clic en la tienda
btnTienda.addEventListener("click", () => {
  // Verifica si el jugador está en el nivel 5 o superior
  if (nivel >= 5) {
    aplicarMejora(nivel); // Llamar a la función que asigna una mejora aleatoria

    // Desactivar el botón después de la mejora
    btnTienda.disabled = true;
  }
});
