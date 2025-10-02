
/* Pantalla donde el usuario inicia sesión
Cuando el jugador se loguea, se guarda en el contexto (AuthContext) y lo redirige al Lobby
*/

import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login(){
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const { login } = useAuth()
  const nav = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      await login(username, password)
      nav('/lobby')
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="p-6 bg-white rounded shadow w-full max-w-sm">
        <h1 className="text-2xl font-semibold mb-4">Maze Rush — Iniciar sesión</h1>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Usuario" className="w-full p-2 mb-2 border rounded" />
        <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Contraseña" className="w-full p-2 mb-4 border rounded" />
        <button className="w-full py-2 rounded bg-green-600 text-white">Entrar</button>
        <p className="mt-3 text-sm">¿No tienes cuenta? <Link to="/register" className="text-blue-600">Regístrate</Link></p>
      </form>
    </div>
  )
}
