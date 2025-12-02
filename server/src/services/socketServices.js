const usersMap = new Map();
global.usersMap = usersMap;

const cookie = require("cookie");
const { verifyToken } = require("./tokenSevices");

class SocketServices {

    connection(socket) {
        try {
            const cookies = socket.handshake.headers.cookie || "";
            const { token } = cookie.parse(cookies);

            if (!token) return socket.disconnect();

            verifyToken(token).then((decoded) => {
                if (!decoded) return socket.disconnect();

                const userId = decoded.id.toString();

                // Lưu đúng socket.io instance
                usersMap.set(userId, socket);

                console.log(`User ${userId} connected`);

                socket.on("disconnect", () => {
                    console.log(`User ${userId} disconnected`);
                    usersMap.delete(userId);
                });
            })
            .catch(err => {
                console.log("Socket verify error:", err);
                socket.disconnect();
            });

        } catch (err) {
            console.log("Socket connection error:", err);
            socket.disconnect();
        }
    }
}

module.exports = new SocketServices();
