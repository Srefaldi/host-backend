import db from "./config/LOGIN/Database.js";
import User from "./models/LOGIN/UserModel.js";

async function fixUserStatus() {
  try {
    // Pastikan koneksi database
    await db.authenticate();
    console.log("Database connected for status synchronization");

    // Mulai transaksi
    await db.transaction(async (t) => {
      // Ambil semua pengguna dengan role "user"
      const users = await User.findAll({
        where: { role: "user" },
        transaction: t,
      });

      // Perbarui status berdasarkan progress
      for (const user of users) {
        const newStatus = user.progress === 100 ? "SELESAI" : "BELUM SELESAI";
        if (user.status !== newStatus) {
          await User.update(
            { status: newStatus },
            { where: { uuid: user.uuid }, transaction: t }
          );
          console.log(
            `Updated user ${user.name} (UUID: ${user.uuid}): status set to ${newStatus}`
          );
        }
      }
    });

    console.log("Status synchronization completed.");
  } catch (error) {
    console.error("Error synchronizing user status:", error.message);
  } finally {
    await db.close();
  }
}

fixUserStatus();
