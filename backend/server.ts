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

// 3. Agendar Cita (INTELIGENTE: Tiempos variables + Choques + Regla 70%)
app.post('/appointments', async (req, res) => {
  try {
    const { barberId, serviceId, clientName, clientPhone, date } = req.body;

    // A. Buscar servicio y su duración real
    const service = await prisma.service.findUnique({ where: { id: Number(serviceId) } });
    if (!service) return res.status(400).json({ error: 'Servicio no encontrado' });

    // B. Calcular hora de fin según la duración (30, 45, 60 min...)
    const fechaInicio = new Date(date);
    const duracion = service.duration || 30; // Si no tiene, usa 30
    const fechaFin = new Date(fechaInicio.getTime() + duracion * 60000);

    // C. Validar Horarios (Domingo cerrado, etc)
    const dia = fechaInicio.getDay(); 
    const hora = fechaInicio.getHours();

    if (dia === 0) return res.status(400).json({ error: '🚫 Los Domingos estamos cerrados.' });
    if (dia === 6 && (hora < 9 || hora >= 17)) return res.status(400).json({ error: '🚫 Sábados: 9am - 5pm.' });
    if (dia >= 1 && dia <= 5 && (hora < 9 || hora >= 19)) return res.status(400).json({ error: '🚫 Lunes a Viernes: 9am - 7pm.' });

    // D. PROTECCIÓN DE CHOQUES
    const choqueCita = await prisma.appointment.findFirst({
      where: {
        barberId: Number(barberId),
        date: { lt: fechaFin },
        endDate: { gt: fechaInicio }
      }
    });
    if (choqueCita) return res.status(409).json({ error: '❌ Este barbero ya está ocupado a esa hora.' });

    // E. REGLA DEL 70% (Walk-ins)
    const totalBarberos = await prisma.barber.count({ where: { isActive: true } });
    const barberosOcupados = await prisma.appointment.count({
      where: { date: { lt: fechaFin }, endDate: { gt: fechaInicio } }
    });

    if (totalBarberos > 0 && (barberosOcupados / totalBarberos) * 100 >= 70) {
       return res.status(409).json({ error: '🚫 Alta demanda: Reservado para Walk-ins.' });
    }

    // F. Guardar
    const newAppointment = await prisma.appointment.create({
      data: {
        barberId: Number(barberId),
        serviceId: Number(serviceId),
        clientName,
        clientPhone,
        date: fechaInicio,
        endDate: fechaFin
      }
    });
    res.json(newAppointment);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// 4. Ver Citas
app.get('/appointments', async (req, res) => {
  const appointments = await prisma.appointment.findMany({
    include: { barber: true, service: true },
    orderBy: { date: 'desc' }
  });
  res.json(appointments);
});

// 5. Borrar Cita
app.delete('/appointments/:id', async (req, res) => {
  try {
    await prisma.appointment.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Cita eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al borrar' });
  }
});

// 6. Contratar Barbero
app.post('/barbers', async (req, res) => {
  try {
    const newBarber = await prisma.barber.create({ data: { name: req.body.name, isActive: true } });
    res.json(newBarber);
  } catch (error) {
    res.status(500).json({ error: 'Error' });
  }
});

// 7. Despedir Barbero
app.delete('/barbers/:id', async (req, res) => {
  try {
    await prisma.appointment.deleteMany({ where: { barberId: Number(req.params.id) } });
    await prisma.barber.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error' });
  }
});

// 8. Crear Servicio (CON DURACIÓN)
app.post('/services', async (req, res) => {
  try {
    const { name, price, duration } = req.body;
    const newService = await prisma.service.create({
      data: { 
        name, 
        price: Number(price), 
        duration: Number(duration) || 30 
      }
    });
    res.json(newService);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear servicio' });
  }
});

// 9. Eliminar Servicio
app.delete('/services/:id', async (req, res) => {
  try {
    await prisma.appointment.deleteMany({ where: { serviceId: Number(req.params.id) } });
    await prisma.service.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 SERVIDOR LISTO en http://localhost:${PORT}`);
});