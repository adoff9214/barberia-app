import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// 1. Ver Barberos
app.get('/barbers', async (req, res) => {
  const barbers = await prisma.barber.findMany();
  res.json(barbers);
});

// 2. Ver Servicios
app.get('/services', async (req, res) => {
  const services = await prisma.service.findMany();
  res.json(services);
});

// 3. Agendar Cita (CON HORARIO INTELIGENTE 🧠⏰)
app.post('/appointments', async (req, res) => {
  try {
    const { barberId, serviceId, clientName, clientPhone, date } = req.body;
    
    // --- 🛑 EL PORTERO: Validar Horario ---
    if (date) {
      const fechaCita = new Date(date);
      const dia = fechaCita.getDay(); // 0 = Domingo, 1 = Lunes... 6 = Sábado
      const hora = fechaCita.getHours();

      // REGLA 1: Domingo Cerrado
      if (dia === 0) {
        return res.status(400).json({ error: '🚫 Lo sentimos, los Domingos estamos cerrados.' });
      }

      // REGLA 2: Sábados (9am - 5pm)
      if (dia === 6) {
        if (hora < 9 || hora >= 17) { // 17 es las 5 PM
           return res.status(400).json({ error: '🚫 El horario de Sábado es de 9am a 5pm.' });
        }
      }

      // REGLA 3: Lunes a Viernes (9am - 7pm)
      if (dia >= 1 && dia <= 5) {
        if (hora < 9 || hora >= 19) { // 19 es las 7 PM
           return res.status(400).json({ error: '🚫 Entre semana abrimos de 9am a 7pm.' });
        }
      }
    }
    // ----------------------------------------------------

    // Configurar fechas
    const fechaInicio = date ? new Date(date) : new Date();
    const fechaFin = new Date(fechaInicio.getTime() + 30 * 60000); // 30 min por defecto

    const newAppointment = await prisma.appointment.create({
      data: {
        barberId: Number(barberId),
        serviceId: Number(serviceId),
        clientName: String(clientName),
        clientPhone: String(clientPhone),
        date: fechaInicio,
        endDate: fechaFin
      } as any
    });
    res.json(newAppointment);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear la cita' });
  }
});

// 4. Ver Citas (Dashboard Admin)
app.get('/appointments', async (req, res) => {
  const appointments = await prisma.appointment.findMany({
    include: { barber: true, service: true },
    orderBy: { date: 'desc' }
  });
  res.json(appointments);
});

// 5. Borrar Cita
app.delete('/appointments/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.appointment.delete({ where: { id: Number(id) } });
    res.json({ message: 'Cita eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'No se pudo borrar' });
  }
});

// 6. Contratar Barbero
app.post('/barbers', async (req, res) => {
  try {
    const { name } = req.body;
    const newBarber = await prisma.barber.create({ data: { name, isActive: true } });
    res.json(newBarber);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear barbero' });
  }
});

// 7. Despedir Barbero
app.delete('/barbers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.appointment.deleteMany({ where: { barberId: Number(id) } });
    await prisma.barber.delete({ where: { id: Number(id) } });
    res.json({ message: 'Barbero eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar barbero' });
  }
});

// 8. Crear Servicio (Precios)
app.post('/services', async (req, res) => {
  try {
    const { name, price } = req.body;
    const newService = await prisma.service.create({
      data: { name, price: Number(price), duration: 30 }
    });
    res.json(newService);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear servicio' });
  }
});

// 9. Eliminar Servicio
app.delete('/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.appointment.deleteMany({ where: { serviceId: Number(id) } });
    await prisma.service.delete({ where: { id: Number(id) } });
    res.json({ message: 'Servicio eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar servicio' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 SERVIDOR LISTO en http://localhost:${PORT}`);
});