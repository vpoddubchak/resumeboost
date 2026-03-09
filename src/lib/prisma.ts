// Database connection singleton
let prisma: any;

declare global {
  var __prisma: any;
}

if (process.env.NODE_ENV === 'production') {
  prisma = require('@prisma/client').PrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = require('@prisma/client').PrismaClient();
  }
  prisma = global.__prisma;
}

export default prisma;
