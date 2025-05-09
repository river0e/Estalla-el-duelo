let disparoDoble = false;
let balasExtra = 0;
let movimientoLento = false;

function aplicarMejora(nivel) {
  if (nivel < 5) return; // No se permite la tienda antes del nivel 5

  const mejoras = [
    {
      nombre: "🔫 Bala extra",
      efecto: () => {
        balasExtra++;
        console.log("🛠️ Mejora aplicada: Bala extra. Total: ", balasExtra);
      }
    },
    {
      nombre: "⏱️ Movimiento más lento",
      efecto: () => {
        movimientoLento = true;
        console.log("🛠️ Mejora aplicada: Movimiento más lento activado.");
      }
    },
    {
      nombre: "💥 Disparo doble",
      efecto: () => {
        disparoDoble = true;
        console.log("🛠️ Mejora aplicada: Disparo doble activado.");
      }
    }
  ];

  const recompensa = mejoras[Math.floor(Math.random() * mejoras.length)];
  recompensa.efecto();

  const mensaje = document.getElementById("mensaje");
  mensaje.textContent = `🎁 ¡Has conseguido: ${recompensa.nombre}!`;

  // Deshabilitar el botón de tienda 
  const btnTienda = document.getElementById("btnTienda");
  btnTienda.disabled = true;
}

// Función para resetear las mejoras 
function resetearMejoras() {
  disparoDoble = false;
  balasExtra = 0;
  movimientoLento = false;
  console.log("🔄 Las mejoras han sido reseteadas.");
}

export { aplicarMejora, disparoDoble, balasExtra, movimientoLento, resetearMejoras };