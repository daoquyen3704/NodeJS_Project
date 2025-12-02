const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const modelPost = require('../../models/post.model');

async function AiSearchKeyword(question) {
    try {
        console.log('🔍 AiSearchKeyword called with:', question);

        // Validate API key
        if (!process.env.GOOGLE_API_KEY) {
            console.error('❌ GOOGLE_API_KEY is not defined in .env');
            return [];
        }

        const prompt = `
        Bạn là một trợ lý thông minh chuyên hỗ trợ tìm kiếm phòng trọ tại Việt Nam.

        Người dùng nhập: "${question}"

        Hãy phân tích và trả về **10 gợi ý tìm kiếm phù hợp nhất** dưới dạng mảng JSON, mỗi phần tử là một object có dạng:
        [
        { "title": "..." },
        { "title": "..." },
        ...
        ]

        Chỉ trả về đúng mảng JSON như trên, không thêm giải thích hay định dạng markdown nào.
        `;

        console.log('📞 Calling Gemini API...');
        const result = await model.generateContent(prompt);
        let text = result.response.text();
        console.log('✅ Gemini API response received');

        // Dọn markdown nếu có
        text = text.replace(/```json|```/g, '').trim();
        console.log('📄 Cleaned response:', text.substring(0, 200) + '...');

        const suggestions = JSON.parse(text);
        console.log('✅ Parsed suggestions count:', suggestions.length);
        return suggestions;
    } catch (error) {
        console.error('❌ Lỗi trong AiSearchKeyword:');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Stack:', error.stack);
        return [];
    }
}

async function AiSearch(question) {
    console.log('question', question);
    try {
        const posts = await modelPost.find({}).limit(20); // Hoặc query trước nếu có AI location
        const postData = posts.map((post) => JSON.stringify(post)).join(',\n');

        const prompt = `
        Dưới đây là danh sách các bài đăng phòng trọ (mỗi bài là 1 JSON object):
        [
        ${postData}
        ]

        Câu hỏi người dùng: "${question}"

        Dựa trên thông tin người dùng đưa ra, hãy chọn các bài đăng phù hợp nhất và trả về mảng JSON gồm toàn bộ object gốc của từng bài đăng.

        Chỉ trả về mảng JSON, không thêm bất kỳ chú thích nào.
        `;

        const result = await model.generateContent(prompt);
        const text = result.response
            .text()
            .replace(/```json|```/g, '')
            .trim();
        const parsed = JSON.parse(text);
        return parsed;
    } catch (err) {
        console.error('Lỗi AI search:', err);
        return [];
    }
}

module.exports = { AiSearchKeyword, AiSearch };
