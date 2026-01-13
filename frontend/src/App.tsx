import { useEffect, useState } from 'react'
import './App.css'

function App() {
  // --- ESTADOS (MEMORIA) ---
  // Tipos any[] para evitar errores estrictos de TypeScript
  const [barbers, setBarbers] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])

  // Datos del formulario de Cliente
  const [selectedBarber, setSelectedBarber] = useState('')
  const [selectedService, setSelectedService] = useState('')
  const [selectedDate, setSelectedDate] = useState('') 
  const [selectedTime, setSelectedTime] = useState('') 
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  // Datos para gestión de Admin
  const [view, setView] = useState('cliente') // 'cliente' o 'admin'
  const [newBarberName, setNewBarberName] = useState('')
  
  // NUEVO: Variables para crear servicios/precios
  const [newServiceName, setNewServiceName] = useState('')
  const [newServicePrice, setNewServicePrice] = useState('')

  // ☁️ URL DEL SERVIDOR (EN LA NUBE)
  const API_URL = 'https://barberia-cerebro.onrender.com'

  // LISTA DE HORAS
  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
    "18:00", "18:30"
  ]

  // AL CARGAR LA PÁGINA
  useEffect(() => {
    fetchBarbers()
    fetchServices()
    refreshAppointments()
  }, [])

  // --- FUNCIONES DE LECTURA ---
  const fetchBarbers = () => {
    fetch(`${API_URL}/barbers`).then(r => r.json()).then(setBarbers)
  }
  
  const fetchServices = () => {
    fetch(`${API_URL}/services`).then(r => r.json()).then(setServices)
  }

  const refreshAppointments = () => {
    fetch(`${API_URL}/appointments`).then(r => r.json()).then(setAppointments)
  }

  // --- FUNCIONES DE CLIENTE (RESERVAR) ---
  const handleBooking = async () => {
    if (!selectedBarber || !selectedService || !selectedDate || !selectedTime || !name) {
      alert("⚠️ Faltan datos (Elige barbero, servicio, día, hora y tu nombre)")
      return
    }

    const finalDate = new Date(`${selectedDate}T${selectedTime}`)

    try {
      const response = await fetch(`${API_URL}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barberId: selectedBarber,
          serviceId: selectedService,
          clientName: name,
          clientPhone: phone,
          date: finalDate 
        }),
      })

      if (response.ok) {
        alert("✅ ¡Cita reservada con éxito!")
        setName('')
        setPhone('')
        refreshAppointments() 
      } else {
        alert("❌ Hubo un error al reservar")
      }
    } catch (error) {
      console.error(error)
      alert("Error de conexión")
    }
  }

  // --- FUNCIONES DE ADMIN (JEFE) ---

  // 1. Borrar Cita
  const handleDelete = async (id: any) => {
    if (!confirm('¿Borrar esta cita?')) return
    await fetch(`${API_URL}/appointments/${id}`, { method: 'DELETE' })
    refreshAppointments()
  }

  // 2. Contratar Barbero
  const hireBarber = async () => {
    if (!newBarberName) return alert('Escribe un nombre')
    await fetch(`${API_URL}/barbers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newBarberName })
    })
    setNewBarberName('')
    // Actualización silenciosa (sin recargar página)
    fetchBarbers() 
  }

  // 3. Despedir Barbero
  const fireBarber = async (id: any) => {
    if (!confirm('¿Seguro que quieres despedir a este barbero? Se borrarán sus citas.')) return
    await fetch(`${API_URL}/barbers/${id}`, { method: 'DELETE' })
    fetchBarbers() 
  }

  // 4. Crear Nuevo Servicio (Corte/Precio) - ¡NUEVO!
  const addService = async () => {
    if (!newServiceName || !newServicePrice) return alert('Faltan datos del servicio')
    await fetch(`${API_URL}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: newServiceName, 
        price: newServicePrice,
        duration: 30 // Por defecto 30 min (puedes cambiarlo si quieres)
      })
    })
    setNewServiceName('')
    setNewServicePrice('')
    fetchServices()
  }

  // 5. Borrar Servicio - ¡NUEVO!
  const deleteService = async (id: any) => {
    if (!confirm('¿Borrar este servicio del menú?')) return
    await fetch(`${API_URL}/services/${id}`, { method: 'DELETE' })
    fetchServices()
  }

  // --- PARTE VISUAL (HTML) ---
  return (
    <div style={styles.container}>
      
      {/* HEADER */}
      <div style={{textAlign: 'center', marginBottom: '30px'}}>
        <h1 style={{fontSize: '2.5rem', margin: '0'}}>💈 BARBER PRO 💈</h1>
        <p style={{color: '#888'}}>Sistema de Gestión Premium</p>
        
        <div style={{background: '#222', display: 'inline-flex', borderRadius: '20px', padding: '5px', marginTop: '10px'}}>
          <button 
            onClick={() => setView('cliente')}
            style={view === 'cliente' ? styles.activeTab : styles.tab}
          >
            🧔 CLIENTE
          </button>
          <button 
            onClick={() => {
              const pass = prompt('Contraseña de Admin:')
              if (pass === '2604') setView('admin') // AQUÍ ESTÁ TU CONTRASEÑA
              else alert('Contraseña incorrecta')
            }}
            style={view === 'admin' ? styles.activeTab : styles.tab}
          >
            🛡️ ADMIN
          </button>
        </div>
      </div>

      {/* --- VISTA DE CLIENTE --- */}
      {view === 'cliente' && (
        <div style={styles.card}>
          <h2>Nueva Reserva</h2>

          <label style={styles.label}>BARBERO</label>
          <select 
            style={styles.select} 
            onChange={e => setSelectedBarber(e.target.value)}
            value={selectedBarber}
          >
            <option value="">Selecciona un experto...</option>
            {barbers.map((b: any) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <label style={styles.label}>SERVICIO</label>
          <select 
            style={styles.select} 
            onChange={e => setSelectedService(e.target.value)}
            value={selectedService}
          >
            <option value="">Selecciona el corte...</option>
            {services.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.name} - ${s.price} ({s.duration} min)
              </option>
            ))}
          </select>

          {/* DÍA Y HORA */}
          <div style={{display: 'flex', gap: '10px'}}>
            <div style={{flex: 1}}>
               <label style={styles.label}>DÍA</label>
               <input 
                 type="date"
                 min={new Date().toISOString().split('T')[0]} 
                 style={styles.input}
                 onChange={e => setSelectedDate(e.target.value)}
               />
            </div>
            <div style={{flex: 1}}>
               <label style={styles.label}>HORA</label>
               <select 
                 style={styles.select}
                 onChange={e => setSelectedTime(e.target.value)}
               >
                 <option value="">Selecciona hora...</option>
                 {timeSlots.map(time => {
                   // CONVERTIDOR VISUAL A AM/PM
                   const [h, m] = time.split(':')
                   const hour = parseInt(h)
                   const ampm = hour >= 12 ? 'PM' : 'AM'
                   const hour12 = hour % 12 || 12
                   const displayTime = `${hour12}:${m} ${ampm}`
                   return (
                     <option key={time} value={time}>{displayTime}</option>
                   )
                 })}
               </select>
            </div>
          </div>

          <label style={styles.label}>TU NOMBRE</label>
          <input 
            style={styles.input} 
            placeholder="Tu nombre completo"
            value={name}
            onChange={e => setName(e.target.value)}
          />

          <label style={styles.label}>TELÉFONO</label>
          <input 
            style={styles.input} 
            placeholder="(555) 000-0000"
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />

          <button style={styles.mainButton} onClick={handleBooking}>
            🔥 CONFIRMAR CITA
          </button>
        </div>
      )}

      {/* --- VISTA DE ADMIN --- */}
      {view === 'admin' && (
        <>
          {/* TARJETA 1: AGENDA */}
          <div style={styles.card}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <h2>Agenda en Vivo 📅</h2>
              <button onClick={refreshAppointments} style={styles.button}>🔄 Actualizar</button>
            </div>

            <div style={{marginTop: '20px'}}>
              <div style={{display: 'flex', padding: '10px', background: '#333', borderRadius: '5px', fontWeight: 'bold', fontSize: '0.9rem'}}>
                <div style={{flex: 1}}>Hora</div>
                <div style={{flex: 1}}>Cliente</div>
                <div style={{flex: 1}}>Barbero</div>
                <div style={{flex: 1}}>Servicio</div>
                <div style={{width: '40px'}}></div>
              </div>

              {appointments.length === 0 && <p style={{textAlign: 'center', color: '#666', marginTop: '20px'}}>No hay citas aún.</p>}

              {appointments.map((cita: any) => (
                <div key={cita.id} style={{display: 'flex', padding: '15px 10px', borderBottom: '1px solid #333', alignItems: 'center', fontSize: '0.9rem'}}>
                  <div style={{flex: 1}}>
                    {new Date(cita.date).toLocaleDateString()} <br/>
                    <span style={{color: '#4CAF50', fontWeight: 'bold'}}>
                      {new Date(cita.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true})}
                    </span>
                  </div>
                  <div style={{flex: 1}}>{cita.clientName}</div>
                  <div style={{flex: 1}}>{cita.barber?.name || 'Desconocido'}</div>
                  <div style={{flex: 1}}>{cita.service?.name || 'Vario'}</div>
                  <div style={{width: '40px'}}>
                    <button onClick={() => handleDelete(cita.id)} style={{background: 'red', border: 'none', cursor: 'pointer', padding: '5px', borderRadius: '4px'}}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TARJETA 2: GESTIÓN DE EQUIPO */}
          <div style={styles.card}>
            <h3>💈 Mi Equipo</h3>
            <div style={{display: 'flex', gap: '10px', marginBottom: '20px'}}>
              <input
                style={styles.input}
                placeholder="Nuevo barbero..."
                value={newBarberName}
                onChange={(e) => setNewBarberName(e.target.value)}
              />
              <button style={styles.button} onClick={hireBarber}>CONTRATAR</button>
            </div>

            {barbers.map((b: any) => (
              <div key={b.id} style={{display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #333', alignItems: 'center'}}>
                <span style={{fontSize: '1rem', fontWeight: 'bold'}}>{b.name}</span>
                <button 
                  onClick={() => fireBarber(b.id)}
                  style={{background: '#ff4444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', padding: '5px 10px'}}
                >
                  DESPEDIR
                </button>
              </div>
            ))}
          </div>

          {/* TARJETA 3: GESTIÓN DE PRECIOS (¡NUEVO!) */}
          <div style={styles.card}>
            <h3>💰 Mis Servicios y Precios</h3>
            <div style={{display: 'flex', gap: '10px', marginBottom: '20px'}}>
              <input 
                placeholder="Ej: Corte + Barba" 
                style={styles.input} 
                value={newServiceName}
                onChange={e => setNewServiceName(e.target.value)}
              />
              <input 
                placeholder="$$" 
                type="number"
                style={{...styles.input, width:'80px'}} 
                value={newServicePrice}
                onChange={e => setNewServicePrice(e.target.value)}
              />
              <button style={styles.button} onClick={addService}>AGREGAR</button>
            </div>

            {services.map((s:any) => (
              <div key={s.id} style={{display:'flex', justifyContent:'space-between', padding:'10px', borderBottom:'1px solid #333'}}>
                <span style={{color:'white'}}>{s.name} - <span style={{color:'#4CAF50'}}>${s.price}</span></span>
                <button onClick={() => deleteService(s.id)} style={{background:'red', border:'none', borderRadius:'5px', padding:'5px 10px', cursor:'pointer'}}>BORRAR</button>
              </div>
            ))}
          </div>

        </>
      )}

    </div>
  )
}

const styles = {
  container: { maxWidth: '500px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif', color: 'white' },
  card: { background: '#1a1a1a', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', marginBottom: '20px' },
  label: { display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '5px', marginTop: '15px', textTransform: 'uppercase' as const, letterSpacing: '1px' },
  input: { width: '100%', padding: '12px', background: '#333', border: '1px solid #444', borderRadius: '8px', color: 'white', fontSize: '1rem', boxSizing: 'border-box' as const },
  select: { width: '100%', padding: '12px', background: '#333', border: '1px solid #444', borderRadius: '8px', color: 'white', fontSize: '1rem', boxSizing: 'border-box' as const },
  mainButton: { width: '100%', padding: '15px', background: 'linear-gradient(45deg, #00C853, #64DD17)', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 'bold', fontSize: '1.1rem', marginTop: '25px', cursor: 'pointer' },
  button: { padding: '10px 20px', background: '#007AFF', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer' },
  tab: { padding: '10px 20px', background: 'transparent', border: 'none', color: '#666', fontWeight: 'bold', cursor: 'pointer' },
  activeTab: { padding: '10px 20px', background: '#007AFF', border: 'none', borderRadius: '15px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }
}

export default App