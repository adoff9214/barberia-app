import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Sembrando datos...')

  // 1. Borramos datos viejos si existieran
  await prisma.appointment.deleteMany()
  await prisma.barber.deleteMany()
  await prisma.service.deleteMany()

  // 2. Creamos los SERVICIOS (Cortes)
  const services = [
    { name: "Corte Caballero", duration: 30, price: 30 },
    { name: "Barba", duration: 30, price: 20 },
    { name: "Corte + Barba", duration: 60, price: 45 },
    { name: "Corte Niño", duration: 30, price: 25 },
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
  