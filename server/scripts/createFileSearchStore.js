require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
  project: process.env.GOOGLE_PROJECT_ID,
  location: "us-central1",
});

async function run() {
  // 1. Tạo store
  const fileSearchStore = await ai.fileSearchStores.create({
    config: { displayName: "rooms-store" }
  });

  console.log("🔥 Store created:", fileSearchStore.name);

  // 2. Upload + Import data
  let operation = await ai.fileSearchStores.uploadToFileSearchStore({
    file: "data/rooms.json",
    fileSearchStoreName: fileSearchStore.name,
    config: { displayName: "rooms.json" }
  });

  console.log("⏳ Đang index...");

  while (!operation.done) {
    await new Promise(r => setTimeout(r, 3000));
    operation = await ai.operations.get({ operation });
  }

  console.log("🎉 Import xong!");
  console.log("⭐ StoreName (để dùng trong chatbot):", fileSearchStore.name);
}

run();
