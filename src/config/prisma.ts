import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/index.js";

// Ensure DATABASE_URL is defined
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in environment variables");
}

// Initialize the Postgres adapter
const adapter = new PrismaPg({ connectionString });

// Initialize Prisma Client with the adapter
const prisma = new PrismaClient({ adapter });

export { prisma };