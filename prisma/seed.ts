import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed your database here
  console.log("Seeding database...");
  
  // Example seed data
  // await prisma.example.create({
  //   data: {
  //     name: "Example",
  //   },
  // });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



