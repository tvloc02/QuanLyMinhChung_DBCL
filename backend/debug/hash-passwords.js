// test-password.js - Chạy script này để test password
const bcrypt = require('bcryptjs');

const testPasswords = async () => {
    const storedHash = "$2a$10$rU4bY7VFuRkbJfEZQ8Kt.l34SxQJcHgGjGjJYKQcR4bPmS6kP5S"; // Hash từ DB

    const testCases = [
        "123456",
        "admin",
        "manager1",
        "password",
        "123",
        "admin123",
        "Quản trị viên hệ thống@123", // Default password pattern
        "Admin@123",
        "$2a$10$rU4bY7VFuRkbJfEZQ8Kt.l34SxQJcHgGjGjJYKQcR4bPmS6kP5S"
    ];

    console.log("Testing passwords against stored hash...");

    for (const testPassword of testCases) {
        try {
            const isMatch = await bcrypt.compare(testPassword, storedHash);
            console.log(`Password "${testPassword}": ${isMatch ? 'MATCH ✅' : 'NO MATCH ❌'}`);
        } catch (error) {
            console.log(`Password "${testPassword}": ERROR - ${error.message}`);
        }
    }

    // Test với plaintext
    console.log("\n--- Testing plaintext comparison ---");
    const plaintextFromDB = "$2a$10$rU4bY7VFuRkbJfEZQ8Kt.l34SxQJcHgGjGjJYKQcR4bPmS6kP5S";

    for (const testPassword of testCases) {
        const isPlaintextMatch = (testPassword === plaintextFromDB);
        console.log(`Plaintext "${testPassword}": ${isPlaintextMatch ? 'MATCH ✅' : 'NO MATCH ❌'}`);
    }
};

// Chạy test
testPasswords().catch(console.error);

// Tạo hash mới cho password
const createNewHash = async (password) => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    console.log(`\nNew hash for "${password}": ${hash}`);
    return hash;
};

// Uncomment để tạo hash mới
// createNewHash("123456");
// createNewHash("admin");