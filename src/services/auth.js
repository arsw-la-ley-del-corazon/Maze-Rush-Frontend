// temporal: simulamos login
export async function login(username, password) {
    if(!username) throw new Error('usuario requerido')
    // simular peticion al backend
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ token: 'mock-token-123', user: { id: username, name: username }})
      }, 300)
    })
  }
  