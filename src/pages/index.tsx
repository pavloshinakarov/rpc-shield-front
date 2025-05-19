import { useState, useEffect, useRef } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import styles from './Home.module.css';

type UserData = {
  email: string;
  name: string;
  picture: string;
  sub: string;
  token?: string;
};

type MethodInfo = {
  id: number;
  method: string;
  address: string;
  enabled: boolean;
  counter: number;
};

type RpcPool = {
  id: number;
  url: string;
  counter: number;
};

type RpcAccount = {
  sub: string;
  mode: boolean;
  counter: number;
};

export default function Home() {
  const [user, setUser] = useState<UserData | null>(null);
  const [methods, setMethods] = useState<MethodInfo[]>([]);
  const [newPoolUrl, setNewPoolUrl] = useState('');
  const [pools, setPools] = useState<RpcPool[]>([]);
  const [account, setAccount] = useState<RpcAccount>({ sub: "", mode: false, counter: 0 });
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchMethods = async () => {
    if (!user?.token) return;

    // fetch account
    const resAccount = await fetch('https://api.rpc-shield.com/api/account', {
      headers: { Authorization: `Bearer ${user.token}` },
    });
    if (resAccount.ok) {
      const data = await resAccount.json();
      console.log(data);
      if (data.ok) setAccount(data.account);
    } else {
      if (resAccount.status == 401){
        handleLogout();
      }
      console.error('Error al obtener account');
    }

    // fetch pools
    const resPools = await fetch('https://api.rpc-shield.com/api/pool', {
      headers: { Authorization: `Bearer ${user.token}` },
    });
    if (resPools.ok) {
      const data = await resPools.json();
      if (data.ok) setPools(data.pools);
    } else {
      if (resPools.status == 401){
        handleLogout();
      }      
      console.error('Error al obtener pools');
    }

    // fetch methods
    const resMethods = await fetch('https://api.rpc-shield.com/api/methods', {  // corregí la URL si hace falta
      headers: { Authorization: `Bearer ${user.token}` },
    });
    if (resMethods.ok) {
      const data = await resMethods.json();
      setMethods(data.methods);
    } else {
      if (resMethods.status == 401){
        handleLogout();
      }
      console.error('Error al obtener métodos');
    }
  };

  useEffect(() => {
    fetchMethods();
  }, [user]);

  type CredentialResponse = {
    credential?: string;
    select_by?: string;
    clientId?: string;
  };

  const handleLoginSuccess = async (credentialResponse: CredentialResponse) => {
    const token = credentialResponse.credential;

    const res = await fetch('https://api.rpc-shield.com/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    const data = await res.json();
    if (data.ok) {
      const userData = { ...data, token };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } else {
      if (res.status == 401){
        handleLogout();
      }
      alert('Error al verificar el token');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setMethods([]);
    localStorage.removeItem('user');
    setMenuOpen(false);
  };

  const handleDeletePool = async (id: number) => {
    if (!user) {
      return;
    }
    try {
      const response = await fetch(`https://api.rpc-shield.com/api/pool/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        }        
      });

      if (!response.ok) {
        if (response.status == 401){
          handleLogout();
        }
        throw new Error('Error al eliminar el pool');
      }

      // Actualizar el estado para quitar el pool eliminado
      setPools((prevPools) => prevPools.filter((p) => p.id !== id));
    } catch (error) {
      console.error('Error:', error);
      alert('Hubo un problema al eliminar el pool.');
    }
  };

/*  const handleDeleteMethod = async (id) => {
    try {
      const response = await fetch(`https://api.rpc-shield.com/api/pool/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        }        
      });

      if (!response.ok) {
        if (response.status == 401){
          handleLogout();
        }        
        throw new Error('Error al eliminar el pool');
      }

      // Actualizar el estado para quitar el pool eliminado
      setPools((prevPools) => prevPools.filter((p) => p.id !== id));
    } catch (error) {
      console.error('Error:', error);
      alert('Hubo un problema al eliminar el pool.');
    }
  };*/

  return (
    <div className={styles.body}>
      <div className={styles.header}>
        <div className={styles.logo}>🛡️ RPC Shield</div>
        <div style={{ position: 'relative' }} ref={menuRef}>
          {!user ? (
            <GoogleLogin
              onSuccess={handleLoginSuccess}
              onError={() => console.log('Error al iniciar sesión')}
            />
          ) : (
            <>
              <img
                src={user.picture}
                alt="Avatar"
                className={styles.avatar}
                onClick={() => setMenuOpen(!menuOpen)}
              />
              {menuOpen && (
                <div className={styles.menu}>
                  <button onClick={handleLogout} className={styles.menuItem}>
                    Cerrar sesión
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {!user ? (
        <>
          <div className={styles.panel}>
            <h1 style={{ marginBottom: 10 }}>Bienvenido a RPC Shield</h1>
            <p style={{ color: '#555' }}>
              Protege tus endpoints RPC con autenticación segura y control de acceso inteligente.
            </p>
          </div>
        </>
      ) : null}

      {user && (
        <div className={styles.panel}>
          <h2 style={{ marginBottom: 10 }}>Tu cuenta</h2>
          <div style={{ marginBottom: 20 }}>
            <div>
              Shield: {account.mode ? "Enabled" : "Disabled"}
              <button
                onClick={async () => {
                  const url = account.mode
                    ? "https://api.rpc-shield.com/api/account/disable"
                    : "https://api.rpc-shield.com/api/account/enable";

                  const res = await fetch(url, {
                    method: "GET",
                    headers: { Authorization: `Bearer ${user.token}` },
                  });

                  if (res.ok) {
                    setAccount({ ...account, mode: !account.mode });
                  } else {
                    if (res.status == 401){
                      handleLogout();
                    }
                    console.error("Error al cambiar el estado del shield");
                  }
                }}
              >
                {account.mode ? "Desactivar Shield" : "Activar Shield"}
              </button>
            </div>
            <div>Credits: {account.counter}</div>
            <div>RPC Proxy URL: https://api.rpc-shield.com/{account.sub}</div>
          </div>
        </div>
      )}


      {user && (
        <div className={styles.panel}>
          <h2 style={{ marginBottom: 10 }}>Tus pools registrados</h2>
          <div style={{ marginBottom: 20 }}>
            <h3>Agregar nuevo pool</h3>
            <input
              type="text"
              placeholder="https://nuevo-pool-url.com"
              value={newPoolUrl}
              onChange={(e) => setNewPoolUrl(e.target.value)}
              style={{ width: '60%', padding: 6, marginRight: 8 }}
            />
            <button
              onClick={async () => {
                if (!newPoolUrl) return alert('Ingrese la URL del pool');

                const res = await fetch('https://api.rpc-shield.com/api/pool', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`,
                  },
                  body: JSON.stringify({ url: newPoolUrl }),
                });

                if (res.ok) {
                  const data = await res.json();
                  if (data.ok) {
                    setPools((prev) => [...prev, { id: Date.now(), sub: user.sub, url: newPoolUrl, counter: 0 }]);
                    setNewPoolUrl('');
                  } else {
                    alert('Error: ' + (data.error || 'No se pudo agregar pool'));
                  }
                } else {
                  if (res.status == 401){
                    handleLogout();
                  }
                  alert('Error al agregar pool');
                }
              }}
              style={{ padding: '6px 12px', cursor: 'pointer' }}
            >
              Agregar Pool
            </button>
          </div>          
          {pools.length === 0 ? (
            <p>No hay pools registrados aún.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <th style={{ padding: 8, textAlign: 'left' }}>URL</th>
                  <th style={{ padding: 8 }}>Counter</th>
                  <th style={{ padding: 8 }}>Acciones</th> {/* Nueva columna */}
                </tr>
              </thead>
              <tbody>
                {pools.map((p) => (
                  <tr key={p.id}>
                    <td style={{ padding: 8, textAlign: 'left', wordBreak: 'break-all' }}>{p.url}</td>
                    <td style={{ padding: 8, textAlign: 'center' }}>{p.counter}</td>
                    <td style={{ padding: 8, textAlign: 'center' }}>
                      <button
                        onClick={() => handleDeletePool(p.id)}
                        style={{
                          backgroundColor: '#ff4d4f',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: 4,
                          cursor: 'pointer',
                        }}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {user && (
        <div className={styles.panel}>
          <h2 style={{ marginBottom: 10 }}>Tus métodos registrados</h2>
          {methods.length === 0 ? (
            <p>No hay métodos registrados aún.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <th style={{ padding: 8, textAlign: 'left' }}>Method</th>
                  <th style={{ padding: 8, textAlign: 'left' }}>Address</th>
                  <th style={{ padding: 8 }}>Universal</th>
                  <th style={{ padding: 8 }}>Enabled</th>
                  <th style={{ padding: 8 }}>Counter</th>
                  <th style={{ padding: 8 }}>Eliminar</th>
                </tr>
              </thead>
              <tbody>
                {methods.map((m) => (
                  <tr key={m.id}>
                    <td style={{ padding: 8 }}>{m.method}</td>
                    <td className={styles.wrapAddress} style={{ padding: 8 }}>
                      {m.address}
                    </td>
                    <td style={{ padding: 8, textAlign: 'center' }}>
                      <button
                        onClick={async () => {
                          if (!confirm("¿Estás seguro de que querés permitir cualquier address en este método?")) return;

                          const res = await fetch(`https://api.rpc-shield.com/api/methods/universal/${m.id}`, {
                            method: 'POST',
                            headers: {
                              Authorization: `Bearer ${user?.token}`,
                            },
                          });

                          if (res.ok) {
                            fetchMethods();                            
                          } else {
                            if (res.status == 401){
                              handleLogout();
                            }                            
                            alert('Error al editar el método');
                          }
                        }}
                        style={{ cursor: 'pointer', color: 'red' }}
                      >
                        🌐
                      </button>
                    </td>                    
                    <td style={{ padding: 8, textAlign: 'center' }}>
                      <button
                        onClick={async () => {
                          const endpoint = m.enabled ? 'disable' : 'enable';
                          const res = await fetch(`https://api.rpc-shield.com/api/methods/${endpoint}/${m.id}`, {
                            method: 'POST',
                            headers: {
                              Authorization: `Bearer ${user?.token}`,
                            },
                          });

                          if (res.ok) {
                            setMethods((prev) =>
                              prev.map((method) =>
                                method.id === m.id ? { ...method, enabled: !method.enabled } : method
                              )
                            );
                          } else {
                            if (res.status == 401){
                              handleLogout();
                            }                            
                            alert('Error al cambiar estado del método');
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        {m.enabled ? '✅' : '❌'}
                      </button>
                    </td>
                    <td style={{ padding: 8, textAlign: 'center' }}>{m.counter}</td>
                    <td style={{ padding: 8, textAlign: 'center' }}>
                      <button
                        onClick={async () => {
                          if (!confirm("¿Estás seguro de que querés eliminar este método?")) return;

                          const res = await fetch(`https://api.rpc-shield.com/api/methods/delete/${m.id}`, {
                            method: 'POST',
                            headers: {
                              Authorization: `Bearer ${user?.token}`,
                            },
                          });

                          if (res.ok) {
                            setMethods((prev) => prev.filter((method) => method.id !== m.id));
                          } else {
                            if (res.status == 401){
                              handleLogout();
                            }                            
                            alert('Error al eliminar el método');
                          }
                        }}
                        style={{ cursor: 'pointer', color: 'red' }}
                      >
                        🗑️
                      </button>
                    </td>                    
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
