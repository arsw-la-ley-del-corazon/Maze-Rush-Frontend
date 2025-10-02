/*
Pantalla de sala de espera
Muestra los jugadores conectados
Lista de salas disponibles para unirse
Botón para crear una nueva sala
*/

export default function Lobby() {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="p-6 bg-white rounded shadow">
          <h1 className="text-2xl font-bold text-green-600">Lobby de Maze Rush 🎮</h1>
          <p className="mt-2 text-gray-600">
            Aquí se mostrarán los jugadores conectados y las salas disponibles.
          </p>
        </div>
      </div>
    )
  }
  