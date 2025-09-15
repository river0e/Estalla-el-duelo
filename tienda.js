let mejorasActivas = {
  noRecarga: false,
  experienciaRapida: false,
  instintoSupervivencia: false, 
  menteFria: false, 
  chalecoAntibalas: false, 
  municionPerforante: false, 
  vistaAguila: false, 
};

// Flag para Mente Fría
let disparoAntesDeTiempoUsado = false;

const mejorasDisponibles = [
  {
    nombre: "⚙︎ No necesitas recargar",
    clave: "noRecarga",
    descripcion: "Siempre tendrás 6 balas disponibles",
    efecto: () => {
      mejorasActivas.noRecarga = true;
      disparosRestantes = 6;
      spanDisparos.textContent = 6;
      console.log("⚒︎ Mejora aplicada: No necesitas recargar");
      mensaje.textContent += " ⠿ Siempre tendrás 6 balas disponibles.";
    }
  },
  {
    nombre: "⬆︎ Experiencia rápida",
    clave: "experienciaRapida",
    descripcion: "Subes de nivel con solo 3 puntos de experiencia",
    efecto: () => {
      mejorasActivas.experienciaRapida = true;
      console.log("⚒︎ Mejora aplicada: Experiencia rápida");
      mensaje.textContent += " ⬆︎ Ahora solo necesitas 3 puntos para subir de nivel.";
    }
  },
  {
    nombre: "❣ Instinto de Supervivencia",
    clave: "instintoSupervivencia",
    descripcion: "Permite 5 derrotas seguidas antes de perder.",
    efecto: () => {
      mejorasActivas.instintoSupervivencia = true;
      console.log("⚒︎ Mejora aplicada: Instinto de Supervivencia");
      mensaje.textContent += " ❤︎ Ahora puedes perder hasta 5 duelos antes de GAME OVER.";
    }
  },
  {
    nombre: "☄︎ Mente Fría",
    clave: "menteFria",
    descripcion: "No pierdes experiencia si disparas antes de tiempo una vez.",
    efecto: () => {
      mejorasActivas.menteFria = true;
      disparoAntesDeTiempoUsado = false;
      console.log("⚒︎ Mejora aplicada: Mente Fría");
      mensaje.textContent += " 𒀯 Puedes disparar una vez antes de tiempo sin perder experiencia.";
    }
  },
  {
    nombre: "❤︎ Chaleco Antibalas",
    clave: "chalecoAntibalas",
    descripcion: "Sobrevives al primer disparo enemigo.",
    efecto: () => {
      mejorasActivas.chalecoAntibalas = true;
      chalecoActivo = false; // Reinicia el estado del chaleco
      console.log("⚒︎ Mejora aplicada: Chaleco Antibalas");
      mensaje.textContent += " ❤︎ Ahora sobrevives al primer disparo enemigo.";
    }
  },
  {
    nombre: "𒀭 Munición Perforante",
    clave: "municionPerforante",
    descripcion: "Cada disparo cuenta doble para ganar experiencia.",
    efecto: () => {
      mejorasActivas.municionPerforante = true;
      console.log("⚒︎ Mejora aplicada: Munición Perforante");
      mensaje.textContent += " ≛ A partir de ahora ganas doble experiencia por duelo.";
    }
  },
  {
    nombre: "𓄿 Vista de Águila",
    clave: "vistaAguila",
    descripcion: "El botón enemigo parpadea más tiempo antes de desaparecer.",
    efecto: () => {
      mejorasActivas.vistaAguila = true;
      console.log("⚒︎ Mejora aplicada: Vista de Águila");
      clearInterval(parpadeoInterval);
      parpadeoInterval = setInterval(() => {
        btnJugador.style.opacity = btnJugador.style.opacity === "0.3" ? "1" : "0.3";
      }, 800); // Parpadeo más lento
      mensaje.textContent += " 𓄿 El botón enemigo parpadea más lento, tienes más tiempo para reaccionar.";
    }
  }
];


// Aplica una mejora aleatoria si el nivel es >=5
function aplicarMejoraAleatoria(nivel) {
  if (nivel < 5) return null;

  const mejorasPosibles = mejorasDisponibles.filter(mejora => !mejorasActivas[mejora.clave]);
  if (mejorasPosibles.length === 0) return null;

  const mejoraSeleccionada = mejorasPosibles[Math.floor(Math.random() * mejorasPosibles.length)];
  mejoraSeleccionada.efecto();

  return mejoraSeleccionada;
}

// Devuelve el estado actual de las mejoras activas
function obtenerMejorasActivas() {
  return { ...mejorasActivas, disparoAntesDeTiempoUsado }; // incluye flag de Mente Fría
}

// Resetea todas las mejoras
function resetearMejoras() {
  Object.keys(mejorasActivas).forEach(k => mejorasActivas[k] = false);
  disparoAntesDeTiempoUsado = false;
}

export { aplicarMejoraAleatoria, obtenerMejorasActivas, resetearMejoras };
