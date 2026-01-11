import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [view, setView] = useState('cliente')
  const [barbers, setBarbers] = useState([])
  const [services, setServices] = useState([])
  const [appointments, setAppointments] = useState([])
  
  const [selectedBarber, setSelectedBarber] = useState('')
  const [selectedService, setSelectedService] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  // URL DEL SERVIDOR (IP DE TU PC)
  // URL DEL SERVIDOR (EN LA NUBE)
const API_URL = 'https://barberia-app-b5yd.onrender.com'

  useEffect(() => {
    fetch(`${API_URL}/barbers`).then(r => r.json()).then(setBarbers)
    fetch(`${API_URL}/services`).then(r => r.json()).then(setServices)
    refreshAppointments()
  }, [])

  const refreshAppointments = () => {
    fetch(`${API_URL}/appointments`).then(r => r.json()).then(setAppointments)
  }

  const handleBooking = async () => {
    if (!selectedBarber || !selectedService || !name) {
      alert("⚠️ Faltan datos")
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
          clientPhone: phone
        })
      })
      if (response.ok) {
        alert(`✅ ¡Cita Agendada!`)
        refreshAppointments()
        setName(''); setPhone('')
      } else { alert("❌ Error") }
    } catch (error) { alert("❌ Error de conexión") }
  }

  // ESTILOS
  const styles: any = {
    container: { fontFamily: "'Segoe UI', sans-serif", minHeight: '100vh', background: '#121212', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px' },
    nav: { marginBottom: '40px', background: '#1e1e1e', padding: '10px', borderRadius: '50px', display: 'flex', gap: '10px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
    btn: (active: boolean) => ({ background: active ? 'linear-gradient(45deg, #00d2ff, #3a7bd5)' : 'transparent', color: active ? 'white' : '#888', border: 'none', padding: '12px 30px', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold', transition: '0.3s', fontSize: '16px' }),
    card: { background: '#1e1e1e', padding: '40px', borderRadius: '20px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', border: '1px solid #333' },
    input: { width: '100%', padding: '15px', background: '#2a2a2a', border: '1px solid #444', color: 'white', borderRadius: '10px', marginBottom: '15px', fontSize: '16px', outline: 'none', boxSizing: 'border-box' },
    label: { display: 'block', marginBottom: '8px', color: '#aaa', fontSize: '14px', fontWeight: '600' },
    actionBtn: { width: '100%', padding: '18px', background: 'linear-gradient(45deg, #11998e, #38ef7d)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer', marginTop: '10px', boxShadow: '0 10px 20px rgba(56, 239, 125, 0.2)' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '20px' },
    th: { textAlign: 'left', padding: '15px', color: '#666', borderBottom: '1px solid #333', fontSize: '14px' },
    td: { padding: '20px 15px', borderBottom: '1px solid #2a2a2a', fontSize: '16px' },
    badge: { background: 'rgba(56, 239, 125, 0.1)', color: '#38ef7d', padding: '5px 10px', borderRadius: '5px', fontSize: '14px', fontWeight: 'bold' }
  }

  return (
    <div style={styles.container}>
      <h1 style={{ marginBottom: '10px', fontSize: '2.5rem', background: '-webkit-linear-gradient(45deg, #eee, #999)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>💈 BARBER PRO 💈</h1>
      <p style={{ color: '#666', marginBottom: '40px' }}>Sistema de Gestión Premium</p>

      <div style={styles.nav}>
        <button onClick={() => setView('cliente')} style={styles.btn(view === 'cliente')}>🧔 CLIENTE</button>
        <button onClick={() => setView('admin')} style={styles.btn(view === 'admin')}>🛡️ ADMIN</button>
      </div>

      {view === 'cliente' ? (
        <div style={styles.card}>
          <h2 style={{ marginBottom: '25px', textAlign: 'center' }}>Nueva Reserva</h2>
          
          <label style={styles.label}>BARBERO</label>
          <select onChange={e => setSelectedBarber(e.target.value)} style={styles.input}>
            <option value="">Selecciona un experto...</option>
            {barbers.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>

          <label style={styles.label}>SERVICIO</label>
          <select onChange={e => setSelectedService(e.target.value)} style={styles.input}>
            <option value="">Selecciona el corte...</option>
            {services.map((s: any) => <option key={s.id} value={s.id}>{s.name} - ${s.price}</option>)}
          </select>

          <label style={styles.label}>TU NOMBRE</label>
          <input type="text" placeholder="Tu nombre completo" value={name} onChange={e => setName(e.target.value)} style={styles.input} />

          <label style={styles.label}>TELÉFONO</label>
          <input type="text" placeholder="(555) 000-0000" value={phone} onChange={e => setPhone(e.target.value)} style={styles.input} />

          <button onClick={handleBooking} style={styles.actionBtn}>🔥 CONFIRMAR CITA</button>
        </div>
      ) : (
        <div style={{ ...styles.card, maxWidth: '900px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h2 style={{ margin: 0 }}>Agenda en Vivo</h2>
            <button onClick={refreshAppointments} style={{ background: '#333', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer' }}>🔄 Refrescar</button>
          </div>

          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>HORA</th>
                <th style={styles.th}>CLIENTE</th>
                <th style={styles.th}>BARBERO</th>
                <th style={styles.th}>SERVICIO</th>
                <th style={styles.th}>PRECIO</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((cita: any) => (
                <tr key={cita.id}>
                  <td style={{ ...styles.td, color: '#888' }}>
                    {new Date(cita.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ ...styles.td, fontWeight: 'bold' }}>{cita.clientName}</td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✂️</div>
                      {cita.barber ? cita.barber.name : '...'}
                    </div>
                  </td>
                  <td style={styles.td}>{cita.service ? cita.service.name : '...'}</td>
                  <td style={styles.td}><span style={styles.badge}>${cita.service ? cita.service.price : '0'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {appointments.length === 0 && <p style={{ textAlign: 'center', color: '#555', marginTop: '30px' }}>No hay citas hoy. A descansar. 😴</p>}
        </div>
      )}
    </div>
  )
}

export default App