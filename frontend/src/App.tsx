import { useEffect, useState } from 'react'
import './App.css'

function App() {
  // ==========================================
  // 1. ESTADOS (MEMORIA)
  // ==========================================
  const [barbers, setBarbers] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([]) 
  const [waitlist, setWaitlist] = useState<any[]>([]) 

  const [selectedBarber, setSelectedBarber] = useState('')
  const [selectedService, setSelectedService] = useState('')
  const [selectedDate, setSelectedDate] = useState('') 
  const [selectedTime, setSelectedTime] = useState('') 
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  const [view, setView] = useState('cliente')
  const [moneyFilter, setMoneyFilter] = useState('hoy')
  
  const [newBarberName, setNewBarberName] = useState('')
  const [newBarberDayOff, setNewBarberDayOff] = useState('1') 
  const [newServiceName, setNewServiceName] = useState('')
  const [newServicePrice, setNewServicePrice] = useState('')
  const [blockDateInput, setBlockDateInput] = useState('')

  const API_URL = 'https://barberia-cerebro.onrender.com'
  const daysLabels = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
    "18:00", "18:30", "19:00", "19:30"
  ]

  useEffect(() => {
    fetchBarbers(); fetchServices(); refreshAppointments();
    setReviews([{ id: 1, client: 'Juan M.', stars: 5, comment: 'El mejor fade de Port St. Lucie' }]);
    setWaitlist([]);
  }, [])

  const fetchBarbers = () => fetch(`${API_URL}/barbers`).then(r => r.json()).then(setBarbers)
  const fetchServices = () => fetch(`${API_URL}/services`).then(r => r.json()).then(setServices)
  const refreshAppointments = () => fetch(`${API_URL}/appointments`).then(r => r.json()).then(setAppointments)

  // ==========================================
  // 2. FORMATO AUTOMÁTICO DE TELÉFONO (561-XXX-XXXX)
  // ==========================================
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 1. Eliminar cualquier letra o símbolo, dejando solo números
    const onlyNums = e.target.value.replace(/\D/g, ''); 
    let formatted = onlyNums;

    // 2. Aplicar los guiones automáticamente según la cantidad de números
    if (onlyNums.length <= 3) {
      formatted = onlyNums;
    } else if (onlyNums.length <= 6) {
      formatted = `${onlyNums.slice(0, 3)}-${onlyNums.slice(3)}`;
    } else {
      formatted = `${onlyNums.slice(0, 3)}-${onlyNums.slice(3, 6)}-${onlyNums.slice(6, 10)}`;
    }
    setPhone(formatted);
  };

  const to12h = (time24: string) => {
    const [h, m] = time24.split(':')
    const hour = parseInt(h)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    return `${hour % 12 || 12}:${m} ${ampm}`
  }

  // ==========================================
  // 3. DETECTOR EXACTO DE DÍAS (SOLUCIÓN DEFINITIVA PARA EL DOMINGO)
  // ==========================================
  const getDayStatus = () => {
    if (!selectedBarber || !selectedDate) return 'HIDDEN'; 

    const barberObj = barbers.find(b => b.id == selectedBarber);
    if (!barberObj) return 'HIDDEN';

    // A. ¿Es el día libre fijo? 
    // TRUCO MAESTRO: Agregamos "T12:00:00" para que sea el mediodía exacto. 
    // Así es imposible que el Domingo se confunda con el Sábado en la noche.
    const exactDateObj = new Date(`${selectedDate}T12:00:00`); 
    const dayOfWeek = exactDateObj.getDay(); 
    const dayOffCode = parseInt(barberObj.name.split('|')[1] || '-1');
    
    // Si el día de la semana coincide EXACTAMENTE con el código:
    if (dayOfWeek === dayOffCode) return 'DAY_OFF';

    // B. ¿Es Vacaciones o Enfermedad?
    const blockedAppt = appointments.find(appt => {
      const isSameBarber = appt.barberId == selectedBarber;
      const isBlock = appt.clientName.includes('⛔');
      // Aseguramos que la fecha coincida exactamente en texto (ej. "2026-01-25")
      const apptDateStr = new Date(appt.date).toLocaleDateString('en-CA'); 
      return (isSameBarber && isBlock && apptDateStr === selectedDate);
    });

    if (blockedAppt) {
      const reason = blockedAppt.clientName.toUpperCase();
      if (reason.includes('VACACIONES')) return 'VACACIONES';
      if (reason.includes('ENFERMEDAD')) return 'ENFERMEDAD';
      return 'CERRADO';
    }

    return 'OPEN';
  }

  // Verificador de Horas Pasadas y Choques
  const checkTimeSlot = (time: string) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const [th, tm] = time.split(':').map(Number);
    const slotDate = new Date(y, m - 1, d, th, tm);
    
    // 1. Bloqueo de horas que ya pasaron HOY o en días anteriores
    if (slotDate < new Date()) return { available: false, reason: 'Pasado' };

    // 2. Bloqueo si ya hay cita
    const isBusy = appointments.some(appt => {
      if (appt.barberId != selectedBarber || appt.clientName.includes('⛔')) return false;
      const start = new Date(appt.date);
      const end = new Date(start.getTime() + 30 * 60000); 
      return slotDate >= start && slotDate < end;
    });

    if (isBusy) return { available: false, reason: 'Ocupado' };
    return { available: true, reason: '' };
  }

  // ==========================================
  // 4. WHATSAPP & RESERVA
  // ==========================================
  const handleBooking = async () => {
    if (!selectedBarber || !selectedService || !selectedDate || !selectedTime || !name || phone.length < 12) {
      alert("⚠️ Completa todos los datos y asegúrate de que el teléfono esté completo con guiones (10 dígitos)."); return;
    }
    const [y, m, d] = selectedDate.split('-').map(Number);
    const [th, tm] = selectedTime.split(':').map(Number);
    const finalDate = new Date(y, m - 1, d, th, tm);

    try {
      const response = await fetch(`${API_URL}/appointments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barberId: selectedBarber, serviceId: selectedService, clientName: name, clientPhone: phone, date: finalDate }),
      })
      if (response.ok) {
        const serviceObj = services.find(s => s.id == selectedService);
        const mensaje = `Hola! Soy *${name}*. Reservé:\n📅 ${selectedDate}\n⏰ ${to12h(selectedTime)}\n✂️ ${serviceObj?.name}\n\n¿Me confirmas?`;
        window.open(`https://wa.me/15615246564?text=${encodeURIComponent(mensaje)}`, '_blank');
        alert("✅ Cita Creada."); setName(''); setPhone(''); refreshAppointments();
      } else { alert("❌ Error. Alguien pudo haber tomado el turno.") }
    } catch (e) { alert("Error de conexión") }
  }

  const joinWaitlist = () => {
    if (!name || phone.length < 12 || !selectedDate) return alert("Pon nombre, teléfono completo y fecha.");
    const newEntry = { id: Date.now(), name, phone, date: selectedDate };
    setWaitlist([...waitlist, newEntry]);
    alert(`✅ ${name}, estás en lista de espera para el ${selectedDate}.`); setName(''); setPhone('');
  }
// ==========================================
  // 5. FUNCIONES ADMIN
  // ==========================================
  const hireBarber = async () => { if (!newBarberName) return; await fetch(`${API_URL}/barbers`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name: `${newBarberName}|${newBarberDayOff}` }) }); setNewBarberName(''); fetchBarbers() }
  const fireBarber = async (id: any) => { if (confirm('¿Despedir?')) { await fetch(`${API_URL}/barbers/${id}`, { method: 'DELETE' }); fetchBarbers() } }
  
  const blockDay = async (barberId: any, reason: string) => {
    if(!blockDateInput) return alert('Selecciona una fecha en la ZONA DE BLOQUEO (Admin)');
    const [y, m, d] = blockDateInput.split('-').map(Number);
    // Usamos las 9:00 AM como ancla segura para el bloqueo
    const start = new Date(y, m - 1, d, 9, 0); 
    await fetch(`${API_URL}/appointments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ barberId: barberId, serviceId: services[0]?.id || 1, clientName: `⛔ ${reason.toUpperCase()}`, clientPhone: '000', date: start }), });
    alert(`✅ ${reason} registrada para el día ${blockDateInput}.`); refreshAppointments();
  }

  const handleDelete = async (id: any) => { if (confirm('¿Borrar?')) { await fetch(`${API_URL}/appointments/${id}`, { method: 'DELETE' }); refreshAppointments() } }
  const addService = async () => { if (!newServiceName) return; await fetch(`${API_URL}/services`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name: newServiceName, price: newServicePrice, duration: 30 }) }); setNewServiceName(''); setNewServicePrice(''); fetchServices() }
  const deleteService = async (id: any) => { if (confirm('¿Borrar?')) { await fetch(`${API_URL}/services/${id}`, { method: 'DELETE' }); fetchServices() } }

  // ==========================================
  // 6. INTELIGENCIA Y FINANZAS
  // ==========================================
  const now = new Date();
  const todayStr = now.toLocaleDateString('en-CA');
  
  // Variables para la vista del Cliente
  const dayStatus = getDayStatus(); 
  const isDayFull = dayStatus === 'OPEN' && timeSlots.filter(t => checkTimeSlot(t).available).length === 0;

  const activeAppointments = appointments.filter(a => new Date(a.date) >= now && !a.clientName.includes('⛔'));
  const blockedDays = appointments.filter(a => a.clientName.includes('⛔'));

  const financialData = appointments.filter(appt => {
     if(appt.clientName.includes('⛔')) return false;
     const apptDate = new Date(appt.date);
     const apptStr = apptDate.toLocaleDateString('en-CA');
     if (moneyFilter === 'hoy') return apptStr === todayStr;
     if (moneyFilter === 'semana') { const start = new Date(now); start.setDate(now.getDate() - 7); return apptDate >= start && apptDate <= now; }
     return true; 
  });
  const totalMoney = financialData.reduce((total, cita) => { const service = services.find(s => s.id == cita.serviceId); return total + (service ? parseInt(service.price) : 0); }, 0);

  const clientDB = Object.values(appointments.reduce((acc:any, appt) => {
    if (appt.clientName.includes('⛔')) return acc;
    const p = appt.clientPhone || 'Sin Tlf';
    if (!acc[p]) acc[p] = { name: appt.clientName, phone: p, visits: 0, spent: 0 };
    acc[p].visits += 1;
    const s = services.find(x => x.id == appt.serviceId); acc[p].spent += (s ? parseInt(s.price) : 0);
    return acc;
  }, {})).sort((a:any, b:any) => b.visits - a.visits);

  // ==========================================
  // 7. INTERFAZ GRÁFICA (UI)
  // ==========================================
  return (
    <div className="container">
      {/* HEADER */}
      <div className="header-container">
        <h1 className="brand-title">ELITE CUTS</h1>
        <p className="brand-subtitle">STUDIO & BARBERSHOP</p>
        <div className="nav-wrapper">
           <div className="nav-container">
             <button onClick={() => setView('cliente')} className={`nav-btn ${view === 'cliente' ? 'active' : ''}`}>RESERVAR</button>
             <button onClick={() => { if(prompt('Clave:') === '2604') setView('admin') }} className={`nav-btn ${view === 'admin' ? 'active' : ''}`}>ADMIN</button>
           </div>
        </div>
      </div>

      {/* VISTA CLIENTE */}
      {view === 'cliente' && (
        <div className="card">
          <h2 className="section-title">Tu Cita</h2>
          <div className="input-group">
            <label className="label">Especialista</label>
            <select className="input-field" onChange={e => setSelectedBarber(e.target.value)} value={selectedBarber}>
              <option value="">Selecciona...</option>
              {barbers.map((b: any) => <option key={b.id} value={b.id}>{b.name.split('|')[0]}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="label">Servicio</label>
            <select className="input-field" onChange={e => setSelectedService(e.target.value)} value={selectedService}>
              <option value="">Selecciona...</option>
              {services.map((s: any) => <option key={s.id} value={s.id}>{s.name} - ${s.price}</option>)}
            </select>
          </div>
          
          <div style={{display: 'flex', gap: '10px'}}>
             <div className="input-group" style={{flex:1}}>
               <label className="label">FECHA</label>
               <input type="date" className="input-field" min={todayStr} onChange={e => setSelectedDate(e.target.value)} />
             </div>
             
             {/* 🛑 MAGIA DE LOS BLOQUEOS VISUALES (INCLUYE EL DOMINGO CORREGIDO) */}
             <div className="input-group" style={{flex:1}}>
               <label className="label">HORA</label>
               
               {dayStatus === 'DAY_OFF' && <div style={{background:'#500', color:'white', padding:'12px', borderRadius:'6px', textAlign:'center', fontWeight:'bold', border:'1px solid red'}}>🛑 DAY OFF</div>}
               {dayStatus === 'VACACIONES' && <div style={{background:'#004', color:'white', padding:'12px', borderRadius:'6px', textAlign:'center', fontWeight:'bold', border:'1px solid #4da6ff'}}>✈️ VACACIONES</div>}
               {dayStatus === 'ENFERMEDAD' && <div style={{background:'#530', color:'white', padding:'12px', borderRadius:'6px', textAlign:'center', fontWeight:'bold', border:'1px solid orange'}}>🤒 ENFERMEDAD</div>}
               {dayStatus === 'CERRADO' && <div style={{background:'#333', color:'white', padding:'12px', borderRadius:'6px', textAlign:'center', fontWeight:'bold'}}>⛔ CERRADO</div>}

               {/* Si está abierto, mostramos la lista de horas con los que ya pasaron bloqueados */}
               {dayStatus === 'OPEN' && (
                 <select className="input-field" onChange={e => setSelectedTime(e.target.value)}>
                   <option value="">...</option>
                   {timeSlots.map(time => {
                     const status = checkTimeSlot(time);
                     return <option key={time} value={time} disabled={!status.available} style={!status.available ? {color:'red'} : {}}>
                       {to12h(time)} {!status.available ? `(${status.reason})` : ''}
                     </option>
                   })}
                 </select>
               )}
               {dayStatus === 'HIDDEN' && <div style={{color:'#666', fontSize:'0.8rem', padding:'12px'}}>Selecciona fecha...</div>}
             </div>
          </div>

          <div className="input-group">
             <label className="label">DATOS PERSONALES</label>
             <input className="input-field" placeholder="Nombre completo" value={name} onChange={e => setName(e.target.value)} style={{marginBottom:'5px'}}/>
             {/* 📞 INPUT DE TELÉFONO CON MÁSCARA AUTOMÁTICA (561-XXX-XXXX) */}
             <input 
               className="input-field" 
               placeholder="561-XXX-XXXX" 
               value={phone} 
               onChange={handlePhoneChange} 
               maxLength={12} 
             />
          </div>

          {dayStatus !== 'OPEN' || isDayFull ? (
            <div style={{background:'#220000', padding:'15px', borderRadius:'8px', textAlign:'center'}}>
              <p style={{color:'#ff4444', fontWeight:'bold', margin:'0 0 10px 0'}}>⚠️ Día Lleno o Cerrado</p>
              <button className="btn-small btn-action" onClick={joinWaitlist}>➕ Lista de Espera</button>
            </div>
          ) : (
            <button className="btn-gold" onClick={handleBooking}>CONFIRMAR CITA</button>
          )}

          {/* REVIEWS */}
          <div style={{marginTop:'30px', borderTop:'1px solid #333', paddingTop:'20px'}}>
            <label className="label">Últimas Valoraciones</label>
            {reviews.map(r => (<div key={r.id} style={{fontSize:'0.8rem', color:'#aaa', marginBottom:'5px'}}><b style={{color:'var(--gold)'}}>{"★".repeat(r.stars)}</b> {r.client}: "{r.comment}"</div>))}
          </div>
        </div>
      )}

      {/* VISTA ADMIN */}
      {view === 'admin' && (
        <>
          <div className="filters-container">{['hoy', 'semana', 'total'].map(f => (<button key={f} onClick={()=>setMoneyFilter(f)} className={`filter-btn ${moneyFilter===f?'active':''}`}>{f.toUpperCase()}</button>))}</div>
          <div className="stats-grid">
             <div className="stat-box gold"><h3 className="stat-number">${totalMoney}</h3><span className="stat-label">Ingresos</span></div>
             <div className="stat-box dark"><h3 className="stat-number" style={{color:'white'}}>{financialData.length}</h3><span className="stat-label" style={{color:'#888'}}>Citas</span></div>
          </div>
          
          {/* Citas Activas */}
          <div className="card">
             <div className="section-title"><h3 style={{margin:0}}>🟢 Citas Activas</h3></div>
             {activeAppointments.map((c: any) => (<div key={c.id} className="crm-item"><div><span className="crm-name">{new Date(c.date).toLocaleDateString()} {to12h(new Date(c.date).toLocaleTimeString([], {hour12:false}))} - {c.clientName}</span><span className="crm-detail">{c.service?.name} ({c.clientPhone})</span></div><button onClick={() => handleDelete(c.id)} className="btn-small btn-danger">X</button></div>))}
          </div>

          {/* Lista de Espera */}
          <div className="card">
             <div className="section-title"><h3 style={{margin:0}}>🕒 Lista de Espera</h3></div>
             {waitlist.map((w:any) => (<div key={w.id} className="crm-item"><span className="crm-name">{w.name} ({w.phone}) - {w.date}</span></div>))}
          </div>

          {/* Equipo y ZONA DE BLOQUEO */}
          <div className="card">
             <div className="section-title"><h3 style={{margin:0}}>Equipo & Ausencias</h3></div>
             <div className="input-group" style={{display:'flex', gap:'5px'}}>
               <input className="input-field" placeholder="Nuevo..." value={newBarberName} onChange={e => setNewBarberName(e.target.value)}/>
               <select className="input-field" style={{width:'80px'}} value={newBarberDayOff} onChange={e => setNewBarberDayOff(e.target.value)}>{daysLabels.map((l, i) => <option key={i} value={i}>{l.substring(0,3)}</option>)}</select>
               <button className="btn-small btn-gold" onClick={hireBarber}>+</button>
             </div>
             
             {/* CAJA MAESTRA DE BLOQUEO */}
             <div style={{background:'#1a1a1a', padding:'10px', borderRadius:'8px', marginTop:'15px', border:'1px solid #444'}}>
                <label className="label" style={{color:'orange'}}>⚠️ FECHA A BLOQUEAR</label>
                <input type="date" className="input-field" onChange={e => setBlockDateInput(e.target.value)} />
             </div>

             {barbers.map((b: any) => (
               <div key={b.id} style={{borderTop:'1px solid #222', padding:'10px 0', marginTop:'10px'}}>
                 <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                   <strong style={{color:'white'}}>{b.name.split('|')[0]}</strong>
                   <button onClick={() => fireBarber(b.id)} className="btn-small btn-danger">Despedir</button>
                 </div>
                 <div style={{display:'flex', gap:'5px'}}>
                    <button onClick={() => blockDay(b.id, 'Enfermedad')} className="btn-small btn-action" style={{flex:1}}>🤒 Enf</button>
                    <button onClick={() => blockDay(b.id, 'Vacaciones')} className="btn-small btn-action" style={{flex:1}}>✈️ Vac</button>
                 </div>
               </div>
             ))}

             {/* Mostrar fechas bloqueadas */}
             <div style={{marginTop:'15px', borderTop:'1px solid #333', paddingTop:'10px'}}>
               <p style={{fontSize:'0.7rem', color:'var(--gold)'}}>DÍAS CERRADOS (MANUAL):</p>
               {blockedDays.map((c:any) => (
                 <div key={c.id} style={{display:'flex', justifyContent:'space-between', fontSize:'0.8rem', color:'#ff4444'}}>
                   <span>{new Date(c.date).toLocaleDateString()} - Barbero {c.barberId}</span>
                   <button onClick={() => handleDelete(c.id)} style={{background:'none', border:'none', color:'white', cursor:'pointer'}}>Quitar</button>
                 </div>
               ))}
             </div>
          </div>

          {/* Servicios */}
          <div className="card">
            <div className="section-title"><h3 style={{margin:0}}>Servicios</h3></div>
            <div className="input-group" style={{display:'flex', gap:'5px'}}>
              <input className="input-field" placeholder="Corte..." value={newServiceName} onChange={e => setNewServiceName(e.target.value)}/>
              <input className="input-field" type="number" placeholder="$" style={{width:'60px'}} value={newServicePrice} onChange={e => setNewServicePrice(e.target.value)}/>
              <button className="btn-small btn-gold" onClick={addService}>+</button>
            </div>
            {services.map((s:any) => (<div key={s.id} className="crm-item"><span className="crm-name">{s.name} (${s.price})</span><button onClick={() => deleteService(s.id)} className="btn-small btn-danger">X</button></div>))}
          </div>

          {/* Clientes Top */}
          <div className="card">
             <div className="section-title"><h3 style={{margin:0}}>Clientes Top 👑</h3></div>
             {clientDB.map((c: any, i) => (<div key={i} className="crm-item"><div><span className="crm-name">{c.name} {i<3?'🏆':''}</span><span className="crm-detail">{c.visits} visitas | ${c.spent}</span></div></div>))}
          </div>
        </>
      )}
    </div>
  )
}

export default App