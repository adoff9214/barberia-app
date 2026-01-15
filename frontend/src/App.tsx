import { useEffect, useState } from 'react'
import './App.css'

function App() {
  // --- ESTADOS (MEMORIA) ---
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
  const [view, setView] = useState('cliente')
  
  // GESTIÓN DE BARBEROS (Con la Trampa Maestra)
  const [newBarberName, setNewBarberName] = useState('')
  const [newBarberDayOff, setNewBarberDayOff] = useState('1') // 1 = Lunes por defecto
  
  // Variables para crear servicios
  const [newServiceName, setNewServiceName] = useState('')
  const [newServicePrice, setNewServicePrice] = useState('')
  const [newServiceDuration, setNewServiceDuration] = useState('30')

  const API_URL = 'https://barberia-cerebro.onrender.com'

  // Días de la semana para mostrar bonito
  const daysLabels = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
    "18:00", "18:30"
  ]

  useEffect(() => {
    fetchBarbers()
    fetchServices()
    refreshAppointments()
  }, [])

  const fetchBarbers = () => fetch(`${API_URL}/barbers`).then(r => r.json()).then(setBarbers)
  const fetchServices = () => fetch(`${API_URL}/services`).then(r => r.json()).then(setServices)
  const refreshAppointments = () => fetch(`${API_URL}/appointments`).then(r => r.json()).then(setAppointments)

  // --- LÓGICA DE DISPONIBILIDAD ---
  const checkAvailability = (time: string) => {
    if (!selectedBarber || !selectedDate) return true;

    // A. ENCONTRAR BARBERO Y SU DÍA LIBRE
    const barberObj = barbers.find(b => b.id == selectedBarber);
    if (!barberObj) return true;

    // "Desencriptar" el día libre (ej: "Darwin|1" -> 1)
    const parts = barberObj.name.split('|');
    const dayOffCode = parts.length > 1 ? parseInt(parts[1]) : -1;

    // B. VERIFICAR SI LA FECHA SELECCIONADA ES SU DÍA LIBRE
    const dayOfWeek = new Date(`${selectedDate}T00:00:00`).getDay();

    if (dayOfWeek === dayOffCode) {
      return false; // BLOQUEADO: Es su día de descanso
    }

    // C. VERIFICAR CITAS EXISTENTES
    const slotDate = new Date(`${selectedDate}T${time}`);
    const isBusy = appointments.some(appt => {
      if (appt.barberId != selectedBarber) return false;
      const start = new Date(appt.date);
      const end = appt.endDate ? new Date(appt.endDate) : new Date(start.getTime() + 30*60000); 
      return slotDate >= start && slotDate < end;
    });

    return !isBusy;
  }

  // --- NUEVA LÓGICA CON WHATSAPP ---
  const handleBooking = async () => {
    // 1. Validar datos
    if (!selectedBarber || !selectedService || !selectedDate || !selectedTime || !name) {
      alert("⚠️ Faltan datos (Elige barbero, servicio, día, hora y tu nombre)")
      return
    }
    const finalDate = new Date(`${selectedDate}T${selectedTime}`)
    
    try {
      // 2. Guardar en servidor
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
      const data = await response.json() 
      
      if (response.ok) {
        // --- 3. ABRIR WHATSAPP ---
        const serviceObj = services.find(s => s.id == selectedService);
        const serviceName = serviceObj ? serviceObj.name : 'Corte';
        
        const mensaje = `Hola! Soy *${name}*. Acabo de reservar en la web:
📅 *Fecha:* ${selectedDate}
⏰ *Hora:* ${selectedTime}
✂️ *Servicio:* ${serviceName}

¿Me confirmas la cita?`;

        // TU NÚMERO DE TELÉFONO
        const tuNumeroTelefono = "15615246564"; 

        const url = `https://wa.me/${tuNumeroTelefono}?text=${encodeURIComponent(mensaje)}`;
        window.open(url, '_blank');
        
        // --- FINALIZAR ---
        alert("✅ ¡Reserva enviada! Se abrirá WhatsApp para confirmar.")
        setName('')
        setPhone('')
        refreshAppointments() 
      } else {
        alert(data.error || "❌ Hubo un error al reservar")
      }
    } catch (error) {
      console.error(error)
      alert("Error de conexión")
    }
  }

  // --- FUNCIONES DE ADMIN ---

  const hireBarber = async () => {
    if (!newBarberName) return alert('Escribe un nombre')
    
    // TRUCO: Guardamos "Darwin|1"
    const nameWithCode = `${newBarberName}|${newBarberDayOff}`

    await fetch(`${API_URL}/barbers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nameWithCode })
    })
    setNewBarberName('')
    fetchBarbers() 
  }

  const fireBarber = async (id: any) => {
    if (!confirm('¿Seguro que quieres despedir a este barbero?')) return
    await fetch(`${API_URL}/barbers/${id}`, { method: 'DELETE' })
    fetchBarbers() 
  }

  const blockDay = async (barberId: any, dateVal: string, reason: string) => {
    if(!dateVal) return alert('Selecciona una fecha primero');
    if(!confirm(`¿Bloquear el día ${dateVal} por ${reason}?`)) return;

    // Cita falsa de 9 AM
    const start = new Date(`${dateVal}T09:00:00`);
    const fakeServiceId = services.length > 0 ? services[0].id : 1; 
    
    await fetch(`${API_URL}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barberId: barberId,
          serviceId: fakeServiceId, 
          clientName: `⛔ ${reason.toUpperCase()}`, 
          clientPhone: '000',
          date: start
        }),
      });
      alert('Bloqueo creado');
      refreshAppointments();
  }

  const handleDelete = async (id: any) => {
    if (!confirm('¿Borrar esta cita?')) return
    await fetch(`${API_URL}/appointments/${id}`, { method: 'DELETE' })
    refreshAppointments()
  }

  const addService = async () => {
    if (!newServiceName || !newServicePrice) return alert('Faltan datos')
    await fetch(`${API_URL}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: newServiceName, 
        price: newServicePrice,
        duration: Number(newServiceDuration) 
      })
    })
    setNewServiceName('')
    setNewServicePrice('')
    setNewServiceDuration('30') 
    fetchServices()
  }

  const deleteService = async (id: any) => {
    if (!confirm('¿Borrar servicio?')) return
    await fetch(`${API_URL}/services/${id}`, { method: 'DELETE' })
    fetchServices()
  }

  // --- HTML ---
  return (
    <div style={styles.container}>
      
      {/* HEADER */}
      <div style={{textAlign: 'center', marginBottom: '30px'}}>
        <h1 style={{fontSize: '2.5rem', margin: '0'}}>💈 BARBER PRO 💈</h1>
        <p style={{color: '#888'}}>Sistema de Gestión Premium</p>
        
        <div style={{background: '#222', display: 'inline-flex', borderRadius: '20px', padding: '5px', marginTop: '10px'}}>
          <button onClick={() => setView('cliente')} style={view === 'cliente' ? styles.activeTab : styles.tab}>🧔 CLIENTE</button>
          <button 
            onClick={() => {
              const pass = prompt('Contraseña de Admin:')
              if (pass === '2604') setView('admin')
              else alert('Contraseña incorrecta')
            }}
            style={view === 'admin' ? styles.activeTab : styles.tab}
          >🛡️ ADMIN</button>
        </div>
      </div>

      {/* VISTA CLIENTE */}
      {view === 'cliente' && (
        <div style={styles.card}>
          <h2>Nueva Reserva</h2>
          
          <label style={styles.label}>BARBERO</label>
          <select style={styles.select} onChange={e => setSelectedBarber(e.target.value)} value={selectedBarber}>
            <option value="">Selecciona un experto...</option>
            {barbers.map((b: any) => (
              // LIMPIEZA VISUAL
              <option key={b.id} value={b.id}>{b.name.split('|')[0]}</option>
            ))}
          </select>

          <label style={styles.label}>SERVICIO</label>
          <select style={styles.select} onChange={e => setSelectedService(e.target.value)} value={selectedService}>
            <option value="">Selecciona el corte...</option>
            {services.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name} - ${s.price} ({s.duration} min)</option>
            ))}
          </select>

          <div style={{display: 'flex', gap: '10px'}}>
            <div style={{flex: 1}}>
               <label style={styles.label}>DÍA</label>
               <input type="date" min={new Date().toISOString().split('T')[0]} style={styles.input} onChange={e => setSelectedDate(e.target.value)} />
            </div>
            <div style={{flex: 1}}>
               <label style={styles.label}>HORA</label>
               <select style={styles.select} onChange={e => setSelectedTime(e.target.value)}>
                 <option value="">Selecciona hora...</option>
                 {timeSlots.map(time => {
                   const isAvailable = checkAvailability(time);
                   const [h, m] = time.split(':')
                   const hour = parseInt(h)
                   const ampm = hour >= 12 ? 'PM' : 'AM'
                   const hour12 = hour % 12 || 12
                   const displayTime = `${hour12}:${m} ${ampm}`
                   return (
                     <option key={time} value={time} disabled={!isAvailable} style={!isAvailable ? {color: '#ff4444'} : {}}>
                       {displayTime} {isAvailable ? '' : '(Ocupado)'}
                     </option>
                   )
                 })}
               </select>
            </div>
          </div>

          <label style={styles.label}>TU NOMBRE</label>
          <input style={styles.input} placeholder="Tu nombre completo" value={name} onChange={e => setName(e.target.value)} />
          <label style={styles.label}>TELÉFONO</label>
          <input style={styles.input} placeholder="(555) 000-0000" value={phone} onChange={e => setPhone(e.target.value)} />
          <button style={styles.mainButton} onClick={handleBooking}>🔥 RESERVAR Y CONFIRMAR</button>
        </div>
      )}

      {/* VISTA ADMIN */}
      {view === 'admin' && (
        <>
          <div style={styles.card}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <h2>Agenda en Vivo 📅</h2>
              <button onClick={refreshAppointments} style={styles.button}>🔄 Actualizar</button>
            </div>
            {/* Lista de citas */}
            <div style={{marginTop: '20px'}}>
              {appointments.length === 0 ? <p style={{color: '#666'}}>No hay citas aún.</p> : null}
              {appointments.map((cita: any) => (
                <div key={cita.id} style={{display: 'flex', padding: '10px', borderBottom: '1px solid #333', alignItems: 'center', justifyContent:'space-between'}}>
                   <div>
                      <span style={{color: '#4CAF50', fontWeight: 'bold'}}>
                        {new Date(cita.date).toLocaleDateString()} - {new Date(cita.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                      <br/>
                      {cita.clientName.includes('⛔') 
                        ? <b style={{color:'orange'}}>{cita.clientName}</b> 
                        : `${cita.clientName} (${cita.service?.name})`
                      }
                   </div>
                   <button onClick={() => handleDelete(cita.id)} style={{background: 'red', border: 'none', padding: '5px', borderRadius: '4px'}}>🗑️</button>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.card}>
             <h3>💈 Equipo y Días Libres</h3>
             
             {/* FORMULARIO DE CONTRATACIÓN */}
             <div style={{display: 'flex', gap: '5px', marginBottom: '15px'}}>
               <input 
                 style={{...styles.input, flex: 2}} 
                 placeholder="Nombre..." 
                 value={newBarberName} 
                 onChange={(e) => setNewBarberName(e.target.value)}
               />
               <select 
                  style={{...styles.select, flex: 1.5}} 
                  value={newBarberDayOff} 
                  onChange={(e) => setNewBarberDayOff(e.target.value)}
               >
                 {daysLabels.map((label, idx) => (
                   <option key={idx} value={idx}>Libre: {label}</option>
                 ))}
               </select>
               <button style={styles.button} onClick={hireBarber}>➕</button>
             </div>

             {/* LISTA DE BARBEROS */}
             {barbers.map((b: any) => {
               const realName = b.name.split('|')[0];
               const dayCode = b.name.split('|')[1];
               const dayLabel = dayCode ? daysLabels[parseInt(dayCode)] : 'Ninguno';

               return (
                <div key={b.id} style={{borderTop: '1px solid #444', padding: '10px 0', marginTop:'10px'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems:'center'}}>
                    <span>
                      <strong>{realName}</strong> 
                      <span style={{fontSize: '0.8rem', color: '#888', marginLeft: '8px'}}>
                         (Descansa: {dayLabel})
                      </span>
                    </span>
                    <button onClick={() => fireBarber(b.id)} style={{background: '#ff4444', border: 'none', borderRadius: '5px', padding:'5px 10px', color:'white'}}>Despedir 🗑️</button>
                  </div>
                  
                  {/* GESTIÓN DE EXCEPCIONES */}
                  <div style={{marginTop: '8px', display:'flex', gap:'5px', alignItems:'center', background:'#222', padding:'5px', borderRadius:'5px'}}>
                    <span style={{fontSize:'0.7rem', color:'#aaa'}}>Bloquear:</span>
                    <input type="date" id={`date-${b.id}`} style={{...styles.input, width:'110px', padding:'4px', fontSize:'0.8rem'}} />
                    <button 
                      onClick={() => {
                         const el = document.getElementById(`date-${b.id}`) as HTMLInputElement;
                         if(el) blockDay(b.id, el.value, 'Enfermedad');
                      }} 
                      style={{background: '#FFA500', border:'none', borderRadius:'3px', cursor:'pointer', fontSize:'0.7rem', padding:'4px 8px'}}>
                      🤒 Enf
                    </button>
                    <button 
                      onClick={() => {
                         const el = document.getElementById(`date-${b.id}`) as HTMLInputElement;
                         if(el) blockDay(b.id, el.value, 'Vacaciones');
                      }}
                      style={{background: '#00C853', border:'none', borderRadius:'3px', cursor:'pointer', fontSize:'0.7rem', padding:'4px 8px'}}>
                      ✈️ Vac
                    </button>
                  </div>
                </div>
               )
             })}
          </div>

          {/* SERVICIOS */}
          <div style={styles.card}>
            <h3>💰 Servicios</h3>
            <div style={{display: 'flex', gap: '5px', marginBottom: '10px'}}>
              <input placeholder="Corte..." style={{...styles.input, flex: 2}} value={newServiceName} onChange={e => setNewServiceName(e.target.value)}/>
              <input placeholder="$$" type="number" style={{...styles.input, width: '50px'}} value={newServicePrice} onChange={e => setNewServicePrice(e.target.value)}/>
              <select style={{...styles.select, width: '70px'}} value={newServiceDuration} onChange={e => setNewServiceDuration(e.target.value)}>
                <option value="15">15m</option>
                <option value="30">30m</option>
                <option value="45">45m</option>
                <option value="60">1h</option>
              </select>
              <button style={styles.button} onClick={addService}>➕</button>
            </div>
            {services.map((s:any) => (
              <div key={s.id} style={{display:'flex', justifyContent:'space-between', padding:'10px', borderBottom:'1px solid #333'}}>
                <span>{s.name} (${s.price}) - {s.duration} min</span>
                <button onClick={() => deleteService(s.id)} style={{background:'red', border:'none', borderRadius:'5px', padding:'5px'}}>🗑️</button>
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
  label: { display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '5px', marginTop: '15px' },
  input: { width: '100%', padding: '12px', background: '#333', border: '1px solid #444', borderRadius: '8px', color: 'white', boxSizing: 'border-box' as const },
  select: { width: '100%', padding: '12px', background: '#333', border: '1px solid #444', borderRadius: '8px', color: 'white', boxSizing: 'border-box' as const },
  mainButton: { width: '100%', padding: '15px', background: 'linear-gradient(45deg, #00C853, #64DD17)', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 'bold', marginTop: '25px', cursor: 'pointer' },
  button: { padding: '10px 15px', background: '#007AFF', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer' },
  tab: { padding: '10px', background: 'transparent', border: 'none', color: '#666', fontWeight: 'bold', cursor: 'pointer' },
  activeTab: { padding: '10px', background: '#007AFF', border: 'none', borderRadius: '15px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }
}

export default App