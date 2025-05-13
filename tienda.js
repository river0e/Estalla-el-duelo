let mejorasActivas = {
  noRecarga: false,
  experienciaRapida: false,
  botonGrande: false
};

const mejorasDisponibles = [
  {
    nombre: "🔫 No necesitas recargar",
    descripcion: "Siempre tendrás 6 balas disponibles",
    efecto: () => {
      mejorasActivas.noRecarga = true;
      console.log("🛠️ Mejora aplicada: No necesitas recargar");
    }
  },
  {
    nombre: "⚡ Experiencia rápida",
    descripcion: "Subes de nivel con solo 3 puntos de experiencia",
    efecto: () => {
      mejorasActivas.experienciaRapida = true;
      console.log("🛠️ Mejora aplicada: Experiencia rápida");
    }
  },
  {
    nombre: "🔼 Botón de disparo más grande",
    descripcion: "El botón de disparo aumenta su tamaño",
    efecto: () => {
      mejorasActivas.botonGrande = true;
      console.log("🛠️ Mejora aplicada: Botón de disparo más grande");
    }
  }
];

function aplicarMejoraAleatoria(nivel) {
  if (nivel < 5) return null;

  const mejorasPosibles = mejorasDisponibles.filter(mejora => {
    const clave = mejora.nombre.split(" ")[1];
    return !mejorasActivas[clave];
  });

  if (mejorasPosibles.length === 0) return null;

  const mejoraSeleccionada = mejorasPosibles[Math.floor(Math.random() * mejorasPosibles.length)];
  mejoraSeleccionada.efecto();

  return mejoraSeleccionada;
}

function obtenerMejorasActivas() {
  return mejorasActivas;
}

export { aplicarMejoraAleatoria, obtenerMejorasActivas };
