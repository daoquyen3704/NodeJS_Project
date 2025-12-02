

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

// MODEL PHÒNG TRỌ
const Post = require("../src/models/post.model");

async function exportRooms() {
    try {
        // KẾT NỐI DB
        await mongoose.connect(process.env.CONNECT_DB, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log("📦 Connected to MongoDB");

        // LẤY DỮ LIỆU PHÒNG
        const rooms = await Post.find();

        console.log(`📄 Found ${rooms.length} rooms`);

        // FORMAT JSON — BỎ NHỮNG TRƯỜNG KHÔNG CẦN
        const data = rooms.map(room => ({
            title: room.title,
            price: room.price,
            description: room.description,
            category: room.category,
            location: room.location,
            area: room.area,
            options: room.options,
            status: room.status
        }));

        // NƠI LƯU FILE
        const outputDir = path.join(__dirname, "../data");
        const outputFile = path.join(outputDir, "rooms.json");

        // TẠO FOLDER NẾU CHƯA CÓ
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
        }

        // GHI FILE
        fs.writeFileSync(outputFile, JSON.stringify(data, null, 2), "utf8");

        console.log(`✨ Export thành công: ${outputFile}`);
        process.exit(0);

    } catch (err) {
        console.error("❌ Export Failed:", err);
        process.exit(1);
    }
}

exportRooms();
