require('dotenv').config();

const express = require('express');
const app = express();
const port = 3000;

// HTTP + SOCKET
const server = require('http').createServer(app);
const io = require("socket.io")(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ["websocket", "polling"]
});

// ===== LOGGERS =====
const requestLogger = require("./middlewares/requestLogger");
const errorLogger = require("./middlewares/errorLogger");

// ===== LIBS =====
const bodyParser = require('body-parser');
const cookiesParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');

// ===== MODULES =====
const connectDB = require('./config/ConnectDB');
const routes = require('./routes/index');
const socketServices = require('./services/socketServices');
const { askQuestion } = require('./utils/Chatbot/chatbot');
const { AiSearch } = require('./utils/AISearch/AISearch');

// ===== MIDDLEWARE =====
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.static(path.join(__dirname, '../src')));
app.use(cookiesParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ⭐ MUST BE HERE → Log mọi request
app.use(requestLogger);

// DB
connectDB();

// Socket attach
app.use((req, res, next) => {
    req.io = io;
    next();
});

io.on("connection", (socket) => {
    socketServices.connection(socket);
});

// ROUTES
routes(app);

// CHATBOT API
app.post('/chat', async (req, res) => {
    try {
        const answer = await askQuestion(req.body.question);
        return res.status(200).json({
            success: true,
            answer: answer.answer
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            answer: "Xin lỗi! Tôi đang gặp lỗi xử lý. Vui lòng thử lại."
        });
    }
});

// AI SEARCH
app.get('/ai-search', async (req, res) => {
    const data = await AiSearch(req.query.question);
    return res.status(200).json(data);
});



// ⭐ PHẢI ĐỂ CUỐI CÙNG
app.use(errorLogger);

server.listen(port, () => {
    console.log(`Backend running on port ${port}`);
});

// ===== TỰ ĐỘNG INACTIVE BÀI VIẾT HẾT HẠN =====
const modelPost = require('./models/post.model');

// Chạy mỗi giờ để kiểm tra và inactive bài viết hết hạn
setInterval(async () => {
    try {
        const now = new Date();
        const result = await modelPost.updateMany(
            {
                status: 'active',
                endDate: { $lt: now }
            },
            {
                status: 'inactive'
            }
        );
        if (result.modifiedCount > 0) {
            console.log(`Đã tự động inactive ${result.modifiedCount} bài viết hết hạn`);
        }
    } catch (error) {
        console.error('Lỗi khi tự động inactive bài viết hết hạn:', error);
    }
}, 60 * 60 * 1000); // Chạy mỗi 60 phút