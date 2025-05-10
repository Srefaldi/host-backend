// seed.js
import db from "./config/LOGIN/Database.js"; // Sesuaikan path jika perlu
import seedUsers from "./20231001-demo-user.js"; // Sesuaikan path jika perlu

const runSeeders = async () => {
  try {
    await db.sync(); // Sinkronisasi model dengan database
    await seedUsers(); // Jalankan seeder
    console.log("Seeding completed!");
  } catch (error) {
    console.error("Error seeding data:", error);
  } finally {
    await db.close(); // Tutup koneksi database
  }
};

runSeeders();
