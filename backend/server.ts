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
});// 6. Contratar Barbero (NUEVO)
app.post('/barbers', async (req, res) => {
  try {
    const { name } = req.body;
    const newBarber = await prisma.barber.create({
      data: { name, isActive: true }
    });
    res.json(newBarber);
  } catch (error) {
    res.status(500).json({ error: 'No se pudo crear el barbero' });
  }
});

// 7. Despedir Barbero (NUEVO)
app.delete('/barbers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Primero borramos sus citas para que no de error
    await prisma.appointment.deleteMany({ where: { barberId: Number(id) } });
    // Luego borramos al barbero
    await prisma.barber.delete({ where: { id: Number(id) } });
    res.json({ message: 'Barbero eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'No se pudo eliminar' });
  }
});
// 8. Crear Servicio Nuevo (Precio editable)
app.post('/services', async (req, res) => {
  try {
    const { name, price } = req.body;
    // Creamos el servicio (Duración por defecto 30 min para facilitar)
    const newService = await prisma.service.create({
      data: { name, price: Number(price), duration: 30 }
    });
    res.json(newService);
  } catch (error) {
    res.status(500).json({ error: 'No se pudo crear el servicio' });
  }
});

// 9. Eliminar Servicio
app.delete('/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Primero borramos citas de este servicio para evitar errores
    await prisma.appointment.deleteMany({ where: { serviceId: Number(id) } });
    // Luego borramos el servicio
    await prisma.service.delete({ where: { id: Number(id) } });
    res.json({ message: 'Servicio eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'No se pudo eliminar servicio' });
  }
});
app.listen(PORT, () => {
  console.log(`🚀 SERVIDOR LISTO en http://localhost:${PORT}`);
});// despertando al servidor