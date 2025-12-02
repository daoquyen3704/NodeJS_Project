// server/scripts/uploadGeminiFile.js

require("dotenv").config();
const fs = require("fs");
const axios = require("axios");
const path = require("path");

const apiKey = process.env.GOOGLE_API_KEY;
const filePath = path.join(__dirname, "../data/rooms.json");

async function uploadToGemini() {
    try {
        const fileData = fs.readFileSync(filePath);

        console.log("⏳ Đang upload file lên Gemini...");

        const response = await axios.post(
            "https://generativelanguage.googleapis.com/upload/v1beta/files",
            fileData,
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": apiKey
                }
            }
        );

        console.log("🎉 Upload thành công!");
        console.log("📌 FULL RESPONSE:");
        console.log(JSON.stringify(response.data, null, 2));

        const fileId = response.data.file?.name;   // LẤY FILE ID ĐÚNG
        console.log("➡ FILE ID:", fileId);

    } catch (err) {
        console.error("❌ Upload lỗi:", err.response?.data || err.message);
    }
}

uploadToGemini();
