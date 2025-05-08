console.log("script.js cargado correctamente");

const btnIniciar = document.getElementById("btnIniciar");
const btnJugador = document.getElementById("btnJugador");
const btnCubrirse = document.getElementById("btnCubrirse");
const mensaje = document.getElementById("mensaje");

const sndInicio = document.getElementById("sndInicio");
const sndDisparo = document.getElementById("sndDisparo");
const sndVictoria = document.getElementById("sndVictoria");
const sndDerrota = document.getElementById("sndDerrota");

let puedeDisparar = false;
let disparoJugador = false;
let disparoCPU = false;
let cubierto = false; // Si el jugador se cubrió
let nivel = 1;
let experiencia = 0;
let disparosRestantes = 6; // Cargador inicial con 6 disparos
let timeoutReaccion; // Controla el tiempo de reacción del jugador

const spanNivel = document.getElementById("nivel");
const spanExp = document.getElementById("exp");
const spanDisparos = document.getElementById("disparos"); // Para mostrar los disparos restantes


let moverBotonInterval = null;

function aumentarDificultad() {
  // Reducimos más rápido el tiempo de espera a medida que sube el nivel
  const tiempoEsperaMin = Math.max(1500 - (nivel - 1) * 200, 800);  // Reducción más pronunciada
  const tiempoEsperaMax = Math.max(2500 - (nivel - 1) * 300, 1500);  // Menor rango de espera

  console.log(`🎯 Nivel ${nivel} - Tiempo de espera entre ${tiempoEsperaMin}ms y ${tiempoEsperaMax}`);

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

  // Mover el botón a partir del nivel 2
  if (nivel >= 2) {
    const intervaloMovimiento = nivel >= 5 ? 400 : 800; // Más rápido a partir del nivel 3
    moverBotonInterval = setInterval(() => {
      const randomX = Math.floor(Math.random() * 500);
      const randomY = Math.floor(Math.random() * 500);
      btnJugador.style.position = "absolute";
      btnJugador.style.left = `${randomX}px`;
      btnJugador.style.top = `${randomY}px`;
    }, intervaloMovimiento);

    // A partir del nivel 4, hacer que el botón gire
    if (nivel >= 5) {
      btnJugador.classList.add("girando");
    }
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
  sndInicio.play();

  // Aplicar dificultad según el nivel actual
  const { tiempoEsperaMin, tiempoEsperaMax } = aumentarDificultad();
  const tiempoEspera = Math.random() * (tiempoEsperaMax - tiempoEsperaMin) + tiempoEsperaMin;

  setTimeout(() => {
    console.log("¡Es hora de disparar!");
    mensaje.textContent = "¡DISPARA!";
    sndDisparo.play();
    puedeDisparar = true;
    btnCubrirse.disabled = false;

    const tiempoMaximo = Math.random() * (tiempoEsperaMax - tiempoEsperaMin) + tiempoEsperaMin;

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
    mensaje.textContent = "💀 Te cubriste demasiado tarde... ¡La máquina ya había disparado!";
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
  disparosRestantes = Math.min(disparosRestantes + 2, 6);
  spanDisparos.textContent = disparosRestantes;
});

// Función para cuando el jugador dispare
btnJugador.addEventListener("click", () => {
  console.log("Jugador disparó");

  if (puedeDisparar && !disparoJugador && !disparoCPU && disparosRestantes > 0) {
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