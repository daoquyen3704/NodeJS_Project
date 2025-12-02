const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// SỬ DỤNG MODEL HỢP LỆ CHO API V1
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash"
});

const modelPost = require("../../models/post.model");

async function askQuestion(question) {
    try {
        const products = await modelPost.find({}, "title price").limit(15);

        const productData = products
            .map(p => `• ${p.title} — ${p.price} VNĐ`)
            .join("\n");

        const prompt = `
        Bạn là trợ lý bán hàng.
        Danh sách sản phẩm:
        ${productData}

        Câu hỏi từ khách: "${question}"
        Hãy trả lời tự nhiên và gợi ý chính xác.
        `;

        const result = await model.generateContent(prompt);
        const answer = result.response.text();

        return { answer };

    } catch (error) {
        console.error("🔥 Lỗi Gemini:", error);
        return { answer: "Lỗi Gemini: " + error.message };
    }
}

module.exports = { askQuestion };
