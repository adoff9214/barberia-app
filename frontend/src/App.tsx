import { useEffect, useState } from 'react'
import './App.css'

function App() {
  // --- ESTADOS (MEMORIA) ---
  const [newBarberName, setNewBarberName] = useState('')
  const [newServiceName, setNewServiceName] = useState('')
  const [newServicePrice, setNewServicePrice] = useState('')
  const [view, setView] = useState('cliente')
  
  // AQUÍ ESTÁ EL ARREGLO DE TIPOS (any[]) PARA QUE NO DE ERROR ROJO
  const [barbers, setBarbers] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])

  // DATOS DEL FORMULARIO DE RESERVA
  const [selectedBarber, setSelectedBarber] = useState('')
  const [selectedService, setSelectedService] = useState('')
  
  // AQUÍ ESTÁN LAS VARIABLES NUEVAS PARA SEPARAR FECHA Y HORA
  const [selectedDate, setSelectedDate] = useState('') 
  const [selectedTime, setSelectedTime] = useState('') 
  
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  // ☁️ URL DEL SERVIDOR
  const API_URL = 'https://barberia-cerebro.onrender.com'

  // ⏰ LISTA DE HORAS FIJAS (BLOQUES)
  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", 
    "18:00", "18:30"
  ]

  // CARGAR DATOS AL INICIO
  useEffect(() => {
    fetch(`${API_URL}/barbers`)
      .then(r => r.json())
      .then(data => { if(Array.isArray(data)) setBarbers(data) })
      .catch(e => console.error("Error barberos:", e))

    fetch(`${API_URL}/services`)
      .then(r => r.json())
      .then(data => { if(Array.isArray(data)) setServices(data) })
      .catch(e => console.error("Error servicios:", e))

    refreshAppointments()
  }, [])

  const refreshAppointments = () => {
    fetch(`${API_URL}/appointments`)
      .then(r => r.json())
      .then(data => { if(Array.isArray(data)) setAppointments(data) })
      .catch(e => console.error("Error citas:", e))
  }

  // --- FUNCIÓN PARA RESERVAR (LOGICA NUEVA) ---
  const handleBooking = async () => {
    // Validamos que haya elegido FECHA y HORA por separado
    if (!selectedBarber || !selectedService || !name || !selectedDate || !selectedTime) {
      alert("⚠️ Faltan datos: Elige barbero, servicio, fecha, hora y tu nombre.")
      return
    }
    
    // UNIMOS FECHA Y HORA (Ej: "2026-02-01" + "T" + "09:30" + ":00")
    const finalDate = new Date(`${selectedDate}T${selectedTime}:00`)

    try {
      const response = await fetch(`${API_URL}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barberId: selectedBarber,
          serviceId: selectedService,
          clientName: name,
          clientPhone: phone,
          date: finalDate // Enviamos la fecha combinada
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert(`✅ ¡Cita Agendada para el ${selectedDate} a las ${selectedTime}!`)
        refreshAppointments()
        // Limpiamos el formulario
        setName(''); setPhone(''); setSelectedDate(''); setSelectedTime('')
      } else { 
        alert(`❌ Error: ${data.error}`) 
      }
    } catch (error) { alert("❌ Error de conexión") }
  }

  // --- FUNCIONES DE ADMIN (ACTUALIZACIÓN SILENCIOSA) ---

  const handleDelete = async (id: any) => {
    if (!confirm("¿Borrar cita?")) return;
    await fetch(`${API_URL}/appointments/${id}`, { method: 'DELETE' });
    refreshAppointments(); 
  }

  const hireBarber = async () => {
    if (!newBarberName) return;
    await fetch(`${API_URL}/barbers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newBarberName })
    })
    setNewBarberName('')
    // Actualiza sin recargar la pagina
    fetch(`${API_URL}/barbers`).then(r => r.json()).then(setBarbers)
  }

  const fireBarber = async (id: any) => {
    if (!confirm('¿Despedir?')) return
    await fetch(`${API_URL}/barbers/${id}`, { method: 'DELETE' })
    fetch(`${API_URL}/barbers`).then(r => r.json()).then(setBarbers)
  }

  const createService = async () => {
    if (!newServiceName || !newServicePrice) return;
    await fetch(`${API_URL}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newServiceName, price: newServicePrice })
    })
    setNewServiceName('')
    setNewServicePrice('')
    fetch(`${API_URL}/services`).then(r => r.json()).then(setServices)
  }

  const deleteService = async (id: any) => {
    if (!confirm('¿Borrar servicio?')) return
    await fetch(`${API_URL}/services/${id}`, { method: 'DELETE' })
    fetch(`${API_URL}/services`).then(r => r.json()).then(setServices)
  }

  const handleAdminEnter = () => {
    const password = prompt("🔒 Contraseña:");
    if (password === "1234") setView('admin');
    else alert("⛔ Incorrecto");
  }

  // ESTILOS
  const styles: any = {
    container: { fontFamily: "sans-serif", minHeight: '100vh', background: '#121212', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' },
    nav: { marginBottom: '20px', background: '#333', padding: '10px', borderRadius: '30px', display: 'flex', gap: '10px' },
    btn: (active: boolean) => ({ background: active ? '#2196F3' : 'transparent', color: active ? 'white' : '#aaa', border: 'none', padding: '10px 20px', borderRadius: '20px', fontWeight: 'bold' }),
    card: { background: '#1e1e1e', padding: '20px', borderRadius: '15px', width: '100%', maxWidth: '500px', marginBottom: '20px', border: '1px solid #333' },
    input: { width: '100%', padding: '12px', background: '#333', border: 'none', color: 'white', borderRadius: '8px', marginBottom: '15px', fontSize: '16px', boxSizing: 'border-box' },
    label: { display: 'block', marginBottom: '5px', color: '#aaa', fontSize: '12px', fontWeight: 'bold' },
    actionBtn: { width: '100%', padding: '15px', background: '#4CAF50', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' },
    button: { padding: '8px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
    row: { display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #333', alignItems: 'center' }
  }

  return (
    <div style={styles.container}>
      <h1 style={{ marginBottom: '10px' }}>💈 BARBER PRO 💈</h1>
      
      <div style={styles.nav}>
        <button onClick={() => setView('cliente')} style={styles.btn(view === 'cliente')}>🧔 CLIENTE</button>
        <button onClick={handleAdminEnter} style={styles.btn(view === 'admin')}>🛡️ ADMIN</button>
      </div>

      {view === 'cliente' ? (
        <div style={styles.card}>
          <h2 style={{ textAlign: 'center' }}>Reserva tu Cita</h2>
          
          <label style={styles.label}>BARBERO</label>
          <select onChange={e => setSelectedBarber(e.target.value)} style={styles.input}>
            <option value="">Selecciona...</option>
            {barbers.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>

          <label style={styles.label}>SERVICIO</label>
          <select onChange={e => setSelectedService(e.target.value)} style={styles.input}>
            <option value="">Selecciona...</option>
            {services.map((s: any) => <option key={s.id} value={s.id}>{s.name} - ${s.price}</option>)}
          </select>

          {/* --- AQUÍ ESTÁ EL CAMBIO VISUAL (CALENDARIO + HORA) --- */}
          
          <label style={styles.label}>FECHA DEL CORTE</label>
          <input 
            type="date" 
            style={styles.input} 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />

          <label style={styles.label}>HORA EXACTA</label>
          <select style={styles.input} onChange={(e) => setSelectedTime(e.target.value)} value={selectedTime}>
              <option value="">Selecciona una hora...</option>
              {timeSlots.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
          </select>

          {/* --------------------------------------------------- */}

          <label style={styles.label}>TU NOMBRE</label>
          <input type="text" placeholder="Nombre" value={name} onChange={e => setName(e.target.value)} style={styles.input} />

          <label style={styles.label}>TELÉFONO</label>
          <input type="text" placeholder="Teléfono" value={phone} onChange={e => setPhone(e.target.value)} style={styles.input} />

          <button onClick={handleBooking} style={styles.actionBtn}>CONFIRMAR CITA ✅</button>
        </div>
      ) : (
        /* VISTA ADMIN */
        <> 
          <div style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3>📅 Agenda</h3>
              <button onClick={refreshAppointments} style={{background:'#444', color:'white', border:'none', borderRadius:'5px'}}>🔄</button>
            </div>

            {/* LISTA DE CITAS */}
            {appointments.length === 0 ? <p style={{color:'#666', textAlign:'center'}}>No hay citas.</p> : null}
            
            {appointments.map((cita: any) => (
              <div key={cita.id} style={styles.row}>
                <div>
                   <div style={{fontWeight:'bold', color:'#2196F3'}}>
                     {new Date(cita.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                   </div>
                   <div style={{fontSize:'12px', color:'#aaa'}}>
                     {new Date(cita.date).toLocaleDateString()}
                   </div>
                   <div>{cita.clientName} ({cita.service?.name})</div>
                </div>
                <button onClick={() => handleDelete(cita.id)} style={{background:'red', border:'none', borderRadius:'5px', padding:'5px'}}>🗑️</button>
              </div>
            ))}
          </div>

          <div style={styles.card}>
            <h3>👥 Equipo</h3>
            <div style={{display: 'flex', gap: '5px', marginBottom: '10px'}}>
              <input style={styles.input} placeholder="Nombre..." value={newBarberName} onChange={(e) => setNewBarberName(e.target.value)} />
              <button style={styles.button} onClick={hireBarber}>➕</button>
            </div>
            {barbers.map((b: any) => (