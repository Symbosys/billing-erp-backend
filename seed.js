import { PrismaClient } from './generated/prisma/index.js';
import "dotenv/config";
import bcrypt from 'bcryptjs';
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({ url: "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

async function seed() {
  try {
    const hashedPassword = await bcrypt.hash("password123", 12);
    await prisma.login.upsert({
      where: { email: "admin@symbosys.com" },
      update: {},
      create: {
        email: "admin@symbosys.com",
        password: hashedPassword,
        role: "ADMIN"
      }
    });
    console.log("Admin user seeded.");
  } catch (e) {
    console.error("SEED ERROR:", e);
  }
}
seed();
