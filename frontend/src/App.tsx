import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [newBarberName, setNewBarberName] = useState('')
  const [newServiceName, setNewServiceName] = useState('')
  const [newServicePrice, setNewServicePrice] = useState('')
  const [view, setView] = useState('cliente')
  const [barbers, setBarbers] = useState([])
  const [services, setServices] = useState([])
  const [appointments, setAppointments] = useState([])
  
  // DATOS DEL FORMULARIO
  const [selectedBarber, setSelectedBarber] = useState('')
  const [selectedService, setSelectedService] = useState('')
  const [selectedDate, setSelectedDate] = useState('') 
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  // ☁️ URL DEL SERVIDOR
  const API_URL = 'https://barberia-cerebro.onrender.com'

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

  const handleBooking = async () => {
    if (!selectedBarber || !selectedService || !name || !selectedDate) {
      alert("⚠️ Faltan datos (Elige barbero, servicio, fecha y pon tu nombre)")
      return
    }
    
    try {
      const response = await fetch(`${API_URL}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barberId: selectedBarber,
          serviceId: selectedService,
          clientName: name,
          clientPhone: phone,
          date: selectedDate
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert(`✅ ¡Cita Agendada!`)
        refreshAppointments()
        setName(''); setPhone(''); setSelectedDate('')
      } else { 
        alert(`❌ Error: ${data.error}`) 
      }
    } catch (error) { alert("❌ Error de conexión") }
  }

  // --- FUNCIONES DE ADMIN ---

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

          <label style={styles.label}>FECHA Y HORA</label>
          <input 
            type="datetime-local" 
            style={styles.input} 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />

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
              <div key={b.id} style={styles.row}>
                <span>{b.name}</span>
                <button onClick={() => fireBarber(b.id)} style={{background:'#D32F2F', color:'white', border:'none', borderRadius:'5px'}}>🗑️</button>
              </div>
            ))}
          </div>
          
          <div style={styles.card}>
            <h3>💰 Precios</h3>
            <div style={{display: 'flex', gap: '5px', marginBottom: '10px'}}>
              <input style={styles.input} placeholder="Servicio" value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)} />
              <input style={{...styles.input, width:'80px'}} placeholder="$" type="number" value={newServicePrice} onChange={(e) => setNewServicePrice(e.target.value)} />
              <button style={styles.button} onClick={createService}>➕</button>
            </div>
            {services.map((s: any) => (
              <div key={s.id} style={styles.row}>
                <span>{s.name} - ${s.price}</span>
                <button onClick={() => deleteService(s.id)} style={{background:'#D32F2F', color:'white', border:'none', borderRadius:'5px'}}>🗑️</button>
              </div>
            ))}
          </div>
        </> 
      )}
    </div>
  )
}

export default App