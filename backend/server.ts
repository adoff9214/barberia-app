import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
const PORT = 3000;

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

// 3. Agendar Cita (AHORA ACEPTA FECHA MANUAL)
app.post('/appointments', async (req, res) => {
  try {
    // Recibimos la 'date' (fecha) desde el Frontend
    const { barberId, serviceId, clientName, clientPhone, date } = req.body;
    
    // Si el cliente eligió fecha, usamos esa. Si no, usamos la de hoy.
    const fechaInicio = date ? new Date(date) : new Date();
    const fechaFin = new Date(fechaInicio.getTime() + 30 * 60000); // +30 mins

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

// 4. Ver Citas (Dashboard)
app.get('/appointments', async (req, res) => {
  const appointments = await prisma.appointment.findMany({
    include: { barber: true, service: true },
    orderBy: { date: 'desc' }
  });
  res.json(appointments);
});
// 5. Borrar Cita (NUEVO)
app.delete('/appointments/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.appointment.delete({
      where: { id: Number(id) }
    });
    res.json({ message: 'Cita eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'No se pudo borrar' });
  }
});
app.listen(PORT, () => {
  console.log(`🚀 SERVIDOR LISTO en http://localhost:${PORT}`);
});