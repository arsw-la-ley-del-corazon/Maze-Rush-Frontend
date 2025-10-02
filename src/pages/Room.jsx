/*
Pantalla de la sala/juego en tiempo real
Aquí se carga el laberinto
El jugador ve a los demás en el mapa
Se aplican poderes, movimientos y gana quien llegue primero
*/

export default function Room() {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="p-6 bg-white rounded shadow">
          <h1 className="text-2xl font-bold text-green-600">Sala de Juego 🏁</h1>
          <p className="mt-2 text-gray-600">
            Aquí se mostrará el laberinto y la partida en tiempo real.
          </p>
        </div>
      </div>
    )
  }
  