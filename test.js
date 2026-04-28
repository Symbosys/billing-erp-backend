import { PrismaClient } from './generated/prisma/index.js';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import "dotenv/config";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  try {
    const res = await prisma.login.findUnique({ where: { email: "admin@symbosys.com" } });
    console.log(res);
  } catch (e) {
    console.error("FULL ERROR:", e);
  }
}
run();
