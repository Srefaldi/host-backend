import argon2 from "argon2";

const hashPassword = async () => {
    try {
        const password = "123456"; // Ganti dengan password yang ingin di-hash
        const hash = await argon2.hash(password);
        console.log("Hash Password:", hash);
    } catch (err) {
        console.error("Error hashing password:", err);
    }
};

hashPassword();
