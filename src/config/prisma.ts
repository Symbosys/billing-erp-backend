import "dotenv/config";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../../generated/prisma/index.js";

// @prisma/adapter-libsql@7.8.0: PrismaLibSql is a factory that takes a config object
const cwd = process.cwd();
const normalized = cwd.split("\\").join("/");
const dbUrl = "file:///" + normalized + "/dev.db";

const adapter = new PrismaLibSql({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

export { prisma };