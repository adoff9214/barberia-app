import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Sembrando datos...')

  // 1. Borramos datos viejos si existieran
  await prisma.appointment.deleteMany()
  await prisma.barber.deleteMany()
  await prisma.service.deleteMany()

  // 2. Creamos los SERVICIOS (Cortes)
// 2. Crear Servicios (Menú nuevo con tiempos diferentes)
  const services = [
    { name: 'Corte Rápido (30 min)', price: 25, duration: 30 },
    { name: 'Corte VIP (1 hora)', price: 50, duration: 60 },
  ]
  for (const s of services) {
    await prisma.service.create({ data: s })
  }

  // 3. Creamos los 10 BARBEROS
  const barbers = [
    "Carlos The Blade", "Ana Styles", "Mike Fade", "Tony Razor", "Sarah Cuts",
    "David Edge", "Javier Trim", "Luis Master", "Sofia Scissor", "Rick Classic"
  ]

  for (const name of barbers) {
    await prisma.barber.create({ data: { name, isActive: true } })
  }

  console.log('✅ ¡Barbería lista! 10 Barberos y Servicios creados.')
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect())
  