import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// 1. Obtener la URL de conexión de las variables de entorno
const connectionString = process.env.DATABASE_URL;

// 2. Configurar el Pool de conexiones de pg
const pool = new Pool({ connectionString });

// 3. Inicializar el adaptador de Prisma para PostgreSQL
const adapter = new PrismaPg(pool);

// 4. Crear y exportar la instancia única del cliente usando el adaptador
export const prisma = new PrismaClient({ adapter });

export default prisma;
