import { useEffect, useState } from 'react'
import './App.css'

function App() {
  // --- STATES ---
  const [barbers, setBarbers] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])

  // Client Form Data
  const [selectedBarber, setSelectedBarber] = useState('')
  const [selectedService, setSelectedService] = useState('')
  const [selectedDate, setSelectedDate] = useState('') 
  const [selectedTime, setSelectedTime] = useState('') 
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  // Admin Data
  const [view, setView] = useState('client') // 'client' or 'admin'
  
  // Barber Management (Master Trick)
  const [newBarberName, setNewBarberName] = useState('')
  const [newBarberDayOff, setNewBarberDayOff] = useState('1') // 1 = Monday default
  
  // Service Management
  const [newServiceName, setNewServiceName] = useState('')
  const [newServicePrice, setNewServicePrice] = useState('')
  const [newServiceDuration, setNewServiceDuration] = useState('30')

  const API_URL = 'https://barberia-cerebro.onrender.com'

  const daysLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

  // --- LOGIC 1: GLOBAL SUNDAY CHECK ---
  const isSunday = (dateStr: string) => {
    if (!dateStr) return false;
    const day = new Date(`${dateStr}T00:00:00`).getDay();
    return day === 0; // 0 is Sunday
  }

  // --- LOGIC 2: BARBER WEEKLY DAY OFF ---
  const isBarberDayOff = (dateStr: string) => {
    if (!selectedBarber || !dateStr) return false;
    const barberObj = barbers.find(b => b.id == selectedBarber);
    if (!barberObj) return false;

    const parts = barberObj.name.split('|');
    const dayOffCode = parts.length > 1 ? parseInt(parts[1]) : -1;

    const day = new Date(`${dateStr}T00:00:00`).getDay();
    return day === dayOffCode;
  }

  // --- LOGIC 3: FULL DAY BLOCKING (VACATION/SICK) ---
  const getDayBlockingStatus = (dateStr: string) => {
     if (!selectedBarber || !dateStr) return null;

     const blocker = appointments.find(appt => 
       appt.barberId == selectedBarber && 
       appt.date.startsWith(dateStr) && 
       appt.clientName.includes('⛔')
     );

     if (blocker) {
       const name = blocker.clientName.toUpperCase();
       if (name.includes('VACATION')) return 'VACATION ✈️';
       if (name.includes('SICK')) return 'SICK 🤒';
       return 'UNAVAILABLE ⛔';
     }
     return null;
  }

  // --- LOGIC 4: SPECIFIC TIME SLOT BUSY ---
  const isTimeBusy = (time: string) => {
    if (!selectedBarber || !selectedDate) return false;
    const slotDate = new Date(`${selectedDate}T${time}`);
    
    return appointments.some(appt => {
      if (appt.barberId != selectedBarber) return false;
      // Ignore blocking appointments here, they are handled by getDayBlockingStatus
      if (appt.clientName.includes('⛔')) return false; 

      const start = new Date(appt.date);
      const end = appt.endDate ? new Date(appt.endDate) : new Date(start.getTime() + 30*60000); 
      return slotDate >= start && slotDate < end;
    });
  }

  // --- BOOKING FUNCTION ---
  const handleBooking = async () => {
    if (!selectedBarber || !selectedService || !selectedDate || !selectedTime || !name) {
      alert("⚠️ Missing info (Please select Barber, Service, Date, Time and Name)")
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
      const data = await response.json() 
      if (response.ok) {
        alert("✅ Appointment confirmed!")
        setName('')
        setPhone('')
        refreshAppointments() 
      } else {
        alert(data.error || "❌ Error booking appointment")
      }
    } catch (error) {
      console.error(error)
      alert("Connection Error")
    }
  }

  // --- ADMIN FUNCTIONS ---

  const hireBarber = async () => {
    if (!newBarberName) return alert('Enter a name')
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
    if (!confirm('Are you sure?')) return
    await fetch(`${API_URL}/barbers/${id}`, { method: 'DELETE' })
    fetchBarbers() 
  }

  const blockDay = async (barberId: any, dateVal: string, reason: string) => {
    if(!dateVal) return alert('Select date first');
    
    const daysStr = prompt(`How many days of ${reason}?`, "1");
    const days = parseInt(daysStr || "0");
    
    if (!days || days < 1) return; 
    if(!confirm(`Block ${days} days starting ${dateVal}?`)) return;

    const startDate = new Date(`${dateVal}T09:00:00`); 

    for (let i = 0; i < days; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i); 

        const fakeServiceId = services.length > 0 ? services[0].id : 1;

        await fetch(`${API_URL}/appointments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              barberId: barberId,
              serviceId: fakeServiceId, 
              clientName: `⛔ ${reason.toUpperCase()} (Day ${i+1})`, 
              clientPhone: '000',
              date: currentDate
            }),
          });
    }
      
    alert(`Blocked ${days} days.`);
    refreshAppointments();
  }

  const handleDelete = async (id: any) => {
    if (!confirm('Delete?')) return
    await fetch(`${API_URL}/appointments/${id}`, { method: 'DELETE' })
    refreshAppointments()
  }

  const addService = async () => {
    if (!newServiceName || !newServicePrice) return alert('Missing Data')
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
    if (!confirm('Delete Service?')) return
    await fetch(`${API_URL}/services/${id}`, { method: 'DELETE' })
    fetchServices()
  }

  // --- HTML ---
  return (
    <div style={styles.container}>
      
      {/* HEADER */}
      <div style={{textAlign: 'center', marginBottom: '30px'}}>
        <h1 style={{fontSize: '2.5rem', margin: '0'}}>💈 BARBER PRO 💈</h1>
        <p style={{color: '#888'}}>Premium Booking System</p>
        
        <div style={{background: '#222', display: 'inline-flex', borderRadius: '20px', padding: '5px', marginTop: '10px'}}>
          <button onClick={() => setView('client')} style={view === 'client' ? styles.activeTab : styles.tab}>🧔 CLIENT</button>
          <button 
            onClick={() => {
              const pass = prompt('Admin Password:')
              if (pass === '2604') setView('admin')
              else alert('Wrong Password')
            }}
            style={view === 'admin' ? styles.activeTab : styles.tab}
          >🛡️ ADMIN</button>
        </div>
      </div>

      {/* VIEW: CLIENT */}
      {view === 'client' && (
        <div style={styles.card}>
          <h2>New Booking</h2>
          
          <label style={styles.label}>BARBER</label>
          <select style={styles.select} onChange={e => setSelectedBarber(e.target.value)} value={selectedBarber}>
            <option value="">Select a barber...</option>
            {barbers.map((b: any) => (
              <option key={b.id} value={b.id}>{b.name.split('|')[0]}</option>
            ))}
          </select>

          <label style={styles.label}>SERVICE</label>
          <select style={styles.select} onChange={e => setSelectedService(e.target.value)} value={selectedService}>
            <option value="">Select a service...</option>
            {services.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name} - ${s.price} ({s.duration} min)</option>
            ))}
          </select>

          <div style={{display: 'flex', gap: '10px', alignItems: 'flex-start'}}>
            <div style={{flex: 1}}>
               <label style={styles.label}>DATE</label>
               <input type="date" min={new Date().toISOString().split('T')[0]} style={styles.input} onChange={e => setSelectedDate(e.target.value)} />
            </div>
            <div style={{flex: 1}}>
               <label style={styles.label}>TIME</label>
               <select style={styles.select} onChange={e => setSelectedTime(e.target.value)}>
                 <option value="">Select time...</option>
                 {timeSlots.map(time => {
                   const sunday = isSunday(selectedDate);
                   const dayOff = isBarberDayOff(selectedDate);
                   const dayBlockReason = getDayBlockingStatus(selectedDate);
                   const busy = isTimeBusy(time);
                   
                   let isDisabled = false;
                   let displayText = '';

                   const [h, m] = time.split(':')
                   const hour = parseInt(h)
                   const ampm = hour >= 12 ? 'PM' : 'AM'
                   const hour12 = hour % 12 || 12
                   const prettyTime = `${hour12}:${m} ${ampm}`

                   if (sunday) {
                     displayText = `⛔ CLOSED`;
                     isDisabled = true;
                   } else if (dayOff) {
                     displayText = `🏠 DAY OFF`;
                     isDisabled = true;
                   } else if (dayBlockReason) {
                     displayText = `⛔ ${dayBlockReason}`; 
                     isDisabled = true;
                   } else if (busy) {
                     displayText = `${prettyTime} (Busy)`;
                     isDisabled = true;
                   } else {
                     displayText = prettyTime;
                   }

                   return (
                     <option key={time} value={time} disabled={isDisabled} style={isDisabled ? {background: '#333', color: '#777'} : {}}>
                       {displayText}
                     </option>
                   )
                 })}
               </select>
            </div>
          </div>
          
          {/* --- RED WARNING BOX --- */}
          {(() => {
             const sunday = isSunday(selectedDate);
             const dayOff = isBarberDayOff(selectedDate);
             const blockReason = getDayBlockingStatus(selectedDate);

             if (selectedDate && (sunday || dayOff || blockReason)) {
               return (
                 <div style={{
                   marginTop: '15px', 
                   padding: '15px', 
                   background: '#ff4444', 
                   color: 'white', 
                   borderRadius: '10px', 
                   textAlign: 'center',
                   fontWeight: 'bold',
                   border: '2px solid white'
                 }}>
                   {sunday && "🛑 SORRY, WE ARE CLOSED ON SUNDAYS"}
                   {dayOff && "🏠 THIS BARBER IS OFF TODAY"}
                   {blockReason && `⚠️ UNAVAILABLE: ${blockReason}`}
                 </div>
               )
             }
             return null;
          })()}

          <label style={styles.label}>YOUR NAME</label>
          <input style={styles.input} placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} />
          <label style={styles.label}>PHONE</label>
          <input style={styles.input} placeholder="(555) 000-0000" value={phone} onChange={e => setPhone(e.target.value)} />
          <button style={styles.mainButton} onClick={handleBooking}>🔥 CONFIRM BOOKING</button>
        </div>
      )}

      {/* VIEW: ADMIN */}
      {view === 'admin' && (
        <>
          <div style={styles.card}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <h2>Live Agenda 📅</h2>
              <button onClick={refreshAppointments} style={styles.button}>🔄 Refresh</button>
            </div>
            
            <div style={{marginTop: '20px'}}>
              {appointments.length === 0 ? <p style={{color: '#666'}}>No appointments yet.</p> : null}
              {appointments.map((cita: any) => (
                <div key={cita.id} style={{display: 'flex', padding: '10px', borderBottom: '1px solid #333', alignItems: 'center', justifyContent:'space-between'}}>
                   <div>
                      <span style={{color: '#4CAF50', fontWeight: 'bold'}}>
                        {new Date(cita.date).toLocaleDateString()}
                      </span>
                      <br/>
                      {cita.clientName.includes('⛔') 
                        ? <b style={{color:'orange'}}>{cita.clientName}</b> 
                        : `${cita.clientName} - ${new Date(cita.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
                      }
                   </div>
                   <button onClick={() => handleDelete(cita.id)} style={{background: 'red', border: 'none', padding: '5px', borderRadius: '4px'}}>🗑️</button>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.card}>
             <h3>💈 Team & Days Off</h3>
             
             <div style={{display: 'flex', gap: '5px', marginBottom: '15px'}}>
               <input 
                 style={{...styles.input, flex: 2}} 
                 placeholder="Barber Name..." 
                 value={newBarberName} 
                 onChange={(e) => setNewBarberName(e.target.value)}
               />
               <select 
                  style={{...styles.select, flex: 1.5}} 
                  value={newBarberDayOff} 
                  onChange={(e) => setNewBarberDayOff(e.target.value)}
               >
                 {daysLabels.map((label, idx) => (
                   <option key={idx} value={idx}>Off: {label}</option>
                 ))}
               </select>
               <button style={styles.button} onClick={hireBarber}>➕</button>
             </div>

             {barbers.map((b: any) => {
               const realName = b.name.split('|')[0];
               const dayCode = b.name.split('|')[1];
               const dayLabel = dayCode ? daysLabels[parseInt(dayCode)] : 'None';

               return (
                <div key={b.id} style={{borderTop: '1px solid #444', padding: '10px 0', marginTop:'10px'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems:'center'}}>
                    <span>
                      <strong>{realName}</strong> 
                      <span style={{fontSize: '0.8rem', color: '#888', marginLeft: '8px'}}>
                         (Off: {dayLabel})
                      </span>
                    </span>
                    <button onClick={() => fireBarber(b.id)} style={{background: '#ff4444', border: 'none', borderRadius: '5px', padding:'5px 10px', color:'white'}}>Fire 🗑️</button>
                  </div>
                  
                  <div style={{marginTop: '8px', display:'flex', gap:'5px', alignItems:'center', background:'#222', padding:'5px', borderRadius:'5px'}}>
                    <span style={{fontSize:'0.7rem', color:'#aaa'}}>Block:</span>
                    <input type="date" id={`date-${b.id}`} style={{...styles.input, width:'110px', padding:'4px', fontSize:'0.8rem'}} />
                    <button 
                      onClick={() => {
                         const el = document.getElementById(`date-${b.id}`) as HTMLInputElement;
                         if(el) blockDay(b.id, el.value, 'Sick');
                      }} 
                      style={{background: '#FFA500', border:'none', borderRadius:'3px', cursor:'pointer', fontSize:'0.7rem', padding:'4px 8px', color:'black'}}>
                      🤒 Sick
                    </button>
                    <button 
                      onClick={() => {
                         const el = document.getElementById(`date-${b.id}`) as HTMLInputElement;
                         if(el) blockDay(b.id, el.value, 'Vacation');
                      }}
                      style={{background: '#00C853', border:'none', borderRadius:'3px', cursor:'pointer', fontSize:'0.7rem', padding:'4px 8px', color:'black'}}>
                      ✈️ Vac
                    </button>
                  </div>
                </div>
               )
             })}
          </div>

          <div style={styles.card}>
            <h3>💰 Services</h3>
            <div style={{display: 'flex', gap: '5px', marginBottom: '10px'}}>
              <input placeholder="Service Name..." style={{...styles.input, flex: 2}} value={newServiceName} onChange={e => setNewServiceName(e.target.value)}/>
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