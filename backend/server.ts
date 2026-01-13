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

// 3. Agendar Cita (SUPER INTELIGENTE: Horarios + Choques + Regla 70%)
app.post('/appointments', async (req, res) => {
  try {
    const { barberId, serviceId, clientName, clientPhone, date } = req.body;

    // --- PASO 1: Calcular tiempos exactos ---
    const service = await prisma.service.findUnique({ where: { id: Number(serviceId) } });
    if (!service) return res.status(400).json({ error: 'Servicio no encontrado' });

    const fechaInicio = new Date(date);
    // Usamos la duración del servicio (ej: 60 min)
    const fechaFin = new Date(fechaInicio.getTime() + service.duration * 60000);

    // --- PASO 2: Validar Horarios de la Tienda (El Portero) ---
    const dia = fechaInicio.getDay(); // 0 = Domingo
    const hora = fechaInicio.getHours();

    // Domingo Cerrado
    if (dia === 0) {
        return res.status(400).json({ error: '🚫 Lo sentimos, los Domingos estamos cerrados.' });
    }
    // Sábados (9am - 5pm)
    if (dia === 6) {
        if (hora < 9 || hora >= 17) return res.status(400).json({ error: '🚫 El horario de Sábado es de 9am a 5pm.' });
    }
    // Lunes a Viernes (9am - 7pm)
    if (dia >= 1 && dia <= 5) {
        if (hora < 9 || hora >= 19) return res.status(400).json({ error: '🚫 Entre semana abrimos de 9am a 7pm.' });
    }

    // --- PASO 3: PROTECCIÓN DE CHOQUES (¿El barbero está libre?) ---
    const choqueCita = await prisma.appointment.findFirst({
      where: {
        barberId: Number(barberId),
        date: { lt: fechaFin },
        endDate: { gt: fechaInicio }
      }
    });

    if (choqueCita) {
      return res.status(409).json({ error: '❌ Este barbero ya está ocupado a esa hora.' });
    }

    // --- PASO 4: REGLA DEL 70% (Reservar espacio para Walk-ins) ---
    const totalBarberos = await prisma.barber.count({ where: { isActive: true } });
    
    // Contamos barberos ocupados A ESA HORA
    const barberosOcupados = await prisma.appointment.count({
      where: {
        date: { lt: fechaFin },
        endDate: { gt: fechaInicio }
      }
    });

    const porcentajeOcupacion = (barberosOcupados / totalBarberos) * 100;

    // Si el 70% o más está ocupado, bloqueamos la app
    if (porcentajeOcupacion >= 70) {
       return res.status(409).json({ error: '🚫 Alta demanda: Horario reservado solo para Walk-ins.' });
    }

    // --- PASO 5: SI PASA TODO, GUARDAMOS LA CITA ---
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
    // Por defecto duración 30, pero tú puedes editarlo en la base de datos si quieres
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