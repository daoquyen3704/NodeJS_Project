const modelUser = require('../models/users.model');
const modelApiKey = require('../models/apiKey.model');
const modelRechargeUser = require('../models/RechargeUser.model');
const modelPost = require('../models/post.model');
const modelKeyWordSearch = require('../models/keyWordSearch.model');
const modelOtp = require('../models/otp.model');

const sendMailForgotPassword = require('../utils/SendMail/sendMailForgotPassword');
const { BadRequestError } = require('../core/error.response');
const {
    createApiKey,
    createToken,
    createRefreshToken,
    verifyToken,
} = require('../services/tokenSevices');
const { Created, OK } = require('../core/success.response');

const bcrypt = require('bcrypt');
const CryptoJS = require('crypto-js');
const jwt = require('jsonwebtoken');
const otpGenerator = require('otp-generator');
const { jwtDecode } = require('jwt-decode');

// ================= COOKIE CONFIG CHUẨN LOCALHOST ================= //

const cookieConfig = {
    token: {
        httpOnly: true,
        secure: false,     // localhost bắt buộc false
        sameSite: "lax",
        path: "/",
        maxAge: 15 * 60 * 1000, // 15 phút
    },
    logged: {
        httpOnly: false,
        secure: false,
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    },
    refreshToken: {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    }
};

// ================================================================= //

class controllerUsers {

    // ================= REGISTER ================= //
    async register(req, res) {
        const { fullName, email, password, phone } = req.body;

        if (!fullName || !email || !password || !phone)
            throw new BadRequestError("Vui lòng nhập đầy đủ thông tin");

        const userExist = await modelUser.findOne({ email });
        if (userExist) throw new BadRequestError("Email đã tồn tại");

        const hashedPassword = bcrypt.hashSync(password, 10);

        const user = await modelUser.create({
            fullName,
            email,
            password: hashedPassword,
            typeLogin: "email",
            phone,
        });

        await createApiKey(user._id);

        const token = await createToken({ id: user._id });
        const refreshToken = await createRefreshToken({ id: user._id });

        // Cookie
        res.cookie("token", token, cookieConfig.token);
        res.cookie("logged", 1, cookieConfig.logged);
        res.cookie("refreshToken", refreshToken, cookieConfig.refreshToken);

        return new Created({
            message: "Đăng ký thành công",
            metadata: { token, refreshToken }
        }).send(res);
    }

    // ================= LOGIN ================= //
    async login(req, res) {
        const { email, password } = req.body;
        if (!email || !password)
            throw new BadRequestError("Vui lòng nhập đầy đủ thông tin");

        const user = await modelUser.findOne({ email });
        if (!user) throw new BadRequestError("Email hoặc mật khẩu sai");

        const checkPassword = bcrypt.compareSync(password, user.password);
        if (!checkPassword) throw new BadRequestError("Email hoặc mật khẩu sai");

        await createApiKey(user._id);

        const token = await createToken({ id: user._id });
        const refreshToken = await createRefreshToken({ id: user._id });

        res.cookie("token", token, cookieConfig.token);
        res.cookie("logged", 1, cookieConfig.logged);
        res.cookie("refreshToken", refreshToken, cookieConfig.refreshToken);

        return new OK({
            message: "Đăng nhập thành công",
            metadata: { token, refreshToken }
        }).send(res);
    }

    // ================= LOGIN GOOGLE ================= //
    async loginGoogle(req, res) {
        const { credential } = req.body;
        const googleData = jwtDecode(credential);

        let user = await modelUser.findOne({ email: googleData.email });

        if (!user) {
            user = await modelUser.create({
                fullName: googleData.name,
                email: googleData.email,
                typeLogin: "google",
            });
        }

        await createApiKey(user._id);

        const token = await createToken({ id: user._id });
        const refreshToken = await createRefreshToken({ id: user._id });

        res.cookie("token", token, cookieConfig.token);
        res.cookie("logged", 1, cookieConfig.logged);
        res.cookie("refreshToken", refreshToken, cookieConfig.refreshToken);

        return new OK({
            message: "Đăng nhập thành công",
            metadata: { token, refreshToken }
        }).send(res);
    }

    // ================= AUTH USER ================= //
    async authUser(req, res) {
        const user = await modelUser.findById(req.user.id);
        if (!user) throw new BadRequestError("Không tìm thấy người dùng");

        const encrypted = CryptoJS.AES.encrypt(
            JSON.stringify(user),
            process.env.SECRET_CRYPTO
        ).toString();

        return new OK({
            message: "success",
            metadata: { auth: encrypted }
        }).send(res);
    }

    // ================= LOGOUT ================= //
    async logout(req, res) {
        await modelApiKey.deleteOne({ userId: req.user.id });

        res.clearCookie("token", { path: "/" });
        res.clearCookie("refreshToken", { path: "/" });
        res.clearCookie("logged", { path: "/" });

        return new OK({ message: "Đăng xuất thành công" }).send(res);
    }

    // ================= REFRESH TOKEN ================= //
    async refreshToken(req, res) {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) throw new BadRequestError("Không có refresh token");

        const decoded = await verifyToken(refreshToken);
        if (!decoded) throw new BadRequestError("Refresh token không hợp lệ");

        const user = await modelUser.findById(decoded.id);

        const newToken = await createToken({ id: user._id });

        res.cookie("token", newToken, cookieConfig.token);
        res.cookie("logged", 1, cookieConfig.logged);

        return new OK({
            message: "Refresh token thành công",
            metadata: { token: newToken }
        }).send(res);
    }

    // ================= CHANGE PASSWORD ================= //
    async changePassword(req, res) {
        const { oldPassword, newPassword, confirmPassword } = req.body;

        if (!oldPassword || !newPassword || !confirmPassword)
            throw new BadRequestError("Vui lòng nhập đầy đủ thông tin");

        if (newPassword !== confirmPassword)
            throw new BadRequestError("Mật khẩu không trùng khớp");

        const user = await modelUser.findById(req.user.id);

        const checkPassword = bcrypt.compareSync(oldPassword, user.password);
        if (!checkPassword) throw new BadRequestError("Mật khẩu cũ không đúng");

        user.password = bcrypt.hashSync(newPassword, 10);
        await user.save();

        return new OK({ message: "Đổi mật khẩu thành công" }).send(res);
    }


    // ================= OTHER FUNCTIONS KEEP SAME ================= //
    // (Tao không viết lại dài dòng, các phần còn lại m giữ nguyên file cũ)
    async getAdminStats(req, res) {
        try {
            // ===== User statistics =====
            const totalUsers = await modelUser.countDocuments();

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const newUsers = await modelUser.countDocuments({
                createdAt: { $gte: thirtyDaysAgo },
            });

            const previousPeriodUsers = await modelUser.countDocuments({
                createdAt: {
                    $gte: new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000),
                    $lt: thirtyDaysAgo,
                },
            });

            const userGrowth =
                previousPeriodUsers > 0
                    ? ((newUsers / previousPeriodUsers) * 100).toFixed(1)
                    : 100;

            // ===== Post statistics =====
            const totalPosts = await modelPost.countDocuments();
            const activePosts = await modelPost.countDocuments({ status: 'active' });

            const newPosts = await modelPost.countDocuments({
                createdAt: { $gte: thirtyDaysAgo },
            });

            const previousPeriodPosts = await modelPost.countDocuments({
                createdAt: {
                    $gte: new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000),
                    $lt: thirtyDaysAgo,
                },
            });

            const postGrowth =
                previousPeriodPosts > 0
                    ? ((newPosts / previousPeriodPosts) * 100).toFixed(1)
                    : 100;

            // ===== Transaction statistics =====
            const totalTransactions = await modelRechargeUser.countDocuments();

            const totalRevenueAgg = await modelRechargeUser.aggregate([
                { $match: { status: 'success' } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]);
            const totalRevenue =
                totalRevenueAgg.length > 0 ? totalRevenueAgg[0].total : 0;

            const recentTransactions = await modelRechargeUser.countDocuments({
                createdAt: { $gte: thirtyDaysAgo },
            });

            const previousPeriodTransactions = await modelRechargeUser.countDocuments({
                createdAt: {
                    $gte: new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000),
                    $lt: thirtyDaysAgo,
                },
            });

            const transactionGrowth =
                previousPeriodTransactions > 0
                    ? ((recentTransactions / previousPeriodTransactions) * 100).toFixed(1)
                    : 100;

            const recentRevenueAgg = await modelRechargeUser.aggregate([
                {
                    $match: {
                        createdAt: { $gte: thirtyDaysAgo },
                        status: 'success',
                    },
                },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]);
            const recentRevenue =
                recentRevenueAgg.length > 0 ? recentRevenueAgg[0].total : 0;

            const previousPeriodRevenueAgg = await modelRechargeUser.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000),
                            $lt: thirtyDaysAgo,
                        },
                        status: 'success',
                    },
                },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]);

            const previousRevenue =
                previousPeriodRevenueAgg.length > 0
                    ? previousPeriodRevenueAgg[0].total
                    : 0;

            const revenueGrowth =
                previousRevenue > 0
                    ? ((recentRevenue / previousRevenue) * 100).toFixed(1)
                    : 100;

            // ===== Posts data for last 7 days =====
            const last7DaysArray = Array.from({ length: 7 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - i);
                return date.toISOString().split('T')[0];
            }).reverse();

            const last7Days = new Date();
            last7Days.setDate(last7Days.getDate() - 7);

            const postsDataRaw = await modelPost.aggregate([
                { $match: { createdAt: { $gte: last7Days } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        posts: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]);

            const postsData = last7DaysArray.map((date) => {
                const found = postsDataRaw.find((d) => d._id === date);
                return { date, posts: found ? found.posts : 0 };
            });

            // ===== Recent transactions (for bảng trong Dashboard) =====
            const recentTransactionsList = await modelRechargeUser
                .find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('userId', 'fullName');

            const formattedRecentTransactions = recentTransactionsList.map((t) => ({
                _id: t._id.toString(),
                userId: t.userId._id || t.userId,
                username: t.userId.fullName || 'Unknown User',
                amount: t.amount,
                typePayment: t.typePayment,
                status: t.status,
                createdAt: t.createdAt,
            }));

            // ===== Top users by number of posts =====
            const topUsersAgg = await modelPost.aggregate([
                { $group: { _id: '$userId', posts: { $sum: 1 } } },
                { $sort: { posts: -1 } },
                { $limit: 5 },
            ]);

            const topUsers = await Promise.all(
                topUsersAgg.map(async (u) => {
                    const details = await modelUser.findById(u._id);
                    return {
                        id: u._id,
                        name: details ? details.fullName : 'Unknown User',
                        posts: u.posts,
                        avatar: details ? details.avatar : null,
                    };
                }),
            );

            return new OK({
                message: 'Lấy thống kê thành công',
                metadata: {
                    totalUsers,
                    newUsers,
                    userGrowth: parseFloat(userGrowth),

                    totalPosts,
                    activePosts,
                    newPosts,
                    postGrowth: parseFloat(postGrowth),

                    totalTransactions,
                    totalRevenue,
                    recentTransactions,
                    transactionGrowth: parseFloat(transactionGrowth),

                    recentRevenue,
                    revenueGrowth: parseFloat(revenueGrowth),

                    postsData,
                    recentTransactions: formattedRecentTransactions,
                    topUsers,
                },
            }).send(res);
        } catch (error) {
            console.error('Error in getAdminStats:', error);
            throw new BadRequestError('Lỗi khi lấy thống kê');
        }
    }

    async getRechargeUser(req, res) {
        const { id } = req.user;
        const rechargeUser = await modelRechargeUser.find({ userId: id });
        new OK({ message: 'Lấy thông tin nạp tiền thành công', metadata: rechargeUser }).send(res);
    }

    async updateUser(req, res) {
        const { id } = req.user;
        const { fullName, phone, email, address, avatar } = req.body;
        const user = await modelUser.findByIdAndUpdate(id, { fullName, phone, email, address, avatar }, { new: true });
        new OK({ message: 'Cập nhật thông tin thành công', metadata: user }).send(res);
    }

    async getUsers(req, res) {
        const dataUser = await modelUser.find();
        const data = await Promise.all(
            dataUser.map(async (user) => {
                const post = await modelPost.find({ userId: user._id, status: 'active' });
                const totalPost = post.length;
                const totalSpent = post.reduce((sum, post) => sum + post.price, 0);
                return { user, totalPost, totalSpent };
            }),
        );

        new OK({ message: 'Lấy danh sách người dùng thành công', metadata: data }).send(res);
    }

    async getRechargeStats(req, res) {
        try {
            // Get total transactions and revenue
            const totalTransactions = await modelRechargeUser.countDocuments();
            const totalRevenue = await modelRechargeUser.aggregate([
                { $match: { status: 'success' } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]);

            // Get recent transactions (last 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const recentTransactions = await modelRechargeUser.countDocuments({
                createdAt: { $gte: sevenDaysAgo },
            });

            // Get previous period transactions (7-14 days ago)
            const fourteenDaysAgo = new Date();
            fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
            const previousPeriodTransactions = await modelRechargeUser.countDocuments({
                createdAt: {
                    $gte: fourteenDaysAgo,
                    $lt: sevenDaysAgo,
                },
            });

            // Calculate transaction growth
            const transactionGrowth =
                previousPeriodTransactions > 0
                    ? ((recentTransactions / previousPeriodTransactions) * 100 - 100).toFixed(1)
                    : 100;

            // Get recent revenue (last 7 days)
            const recentRevenue = await modelRechargeUser.aggregate([
                {
                    $match: {
                        createdAt: { $gte: sevenDaysAgo },
                        status: 'success',
                    },
                },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]);

            // Get previous period revenue (7-14 days ago)
            const previousPeriodRevenue = await modelRechargeUser.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: fourteenDaysAgo,
                            $lt: sevenDaysAgo,
                        },
                        status: 'success',
                    },
                },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]);

            // Calculate revenue growth
            const revenueGrowth =
                previousPeriodRevenue.length > 0 && previousPeriodRevenue[0].total > 0
                    ? (
                        ((recentRevenue.length > 0 ? recentRevenue[0].total : 0) / previousPeriodRevenue[0].total) *
                        100 -
                        100
                    ).toFixed(1)
                    : 100;

            // Get recent transactions list with user details
            const recentTransactionsList = await modelRechargeUser
                .find()
                .sort({ createdAt: -1 })
                .limit(50)
                .populate('userId', 'fullName');

            const formattedTransactions = recentTransactionsList.map((transaction) => ({
                key: transaction._id.toString(),
                username: transaction.userId?.fullName || 'Unknown User',
                amount: transaction.amount,
                typePayment: transaction.typePayment,
                status: transaction.status,
                createdAt: transaction.createdAt,
            }));

            new OK({
                message: 'Lấy thống kê nạp tiền thành công',
                metadata: {
                    totalTransactions,
                    totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
                    recentTransactions,
                    transactionGrowth: parseFloat(transactionGrowth),
                    recentRevenue: recentRevenue.length > 0 ? recentRevenue[0].total : 0,
                    revenueGrowth: parseFloat(revenueGrowth),
                    transactions: formattedTransactions,
                },
            }).send(res);
        } catch (error) {
            console.error('Error in getRechargeStats:', error);
            throw new BadRequestError('Lỗi khi lấy thống kê nạp tiền');
        }
    }

    async searchKeyword(req, res) {
        const { keyword } = req.query;
        if (!keyword) {
            const hotSearch = await modelKeyWordSearch.find().sort({ count: -1 }).limit(5);
            return new OK({ message: 'Lấy từ khóa tìm kiếm thành công', metadata: hotSearch }).send(res);
        } else {
            // Tìm kiếm thường trong database thay vì dùng AI
            const now = new Date();
            const posts = await modelPost
                .find({
                    title: { $regex: new RegExp(keyword, 'i') }, // Case-insensitive search
                    status: 'active',
                    endDate: { $gte: now }
                })
                .limit(5)
                .select('title');

            // Trả về danh sách titles
            const result = posts.map(post => ({ title: post.title }));
            return new OK({ message: 'Lấy từ khóa tìm kiếm thành công', metadata: result }).send(res);
        }
    }

    async addSearchKeyword(req, res) {
        const { title } = req.body;
        const keyWordSearch = await modelKeyWordSearch.findOne({ title });
        if (keyWordSearch) {
            keyWordSearch.count++;
            await keyWordSearch.save();
        } else {
            await modelKeyWordSearch.create({ title, count: 1 });
        }
        return new OK({ message: 'Thêm từ khóa tìm kiếm thành công' }).send(res);
    }

    async forgotPassword(req, res) {
        const { email } = req.body;
        if (!email) {
            throw new BadRequestError('Vui lòng nhập email');
        }

        const user = await modelUser.findOne({ email });
        if (!user) {
            throw new BadRequestError('Email không tồn tại');
        }

        const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '15m' });
        const otp = await otpGenerator.generate(6, {
            digits: true,
            lowerCaseAlphabets: false,
            upperCaseAlphabets: false,
            specialChars: false,
        });

        const saltRounds = 10;

        bcrypt.hash(otp, saltRounds, async function (err, hash) {
            if (err) {
                console.error('Error hashing OTP:', err);
            } else {
                await modelOtp.create({
                    email: user.email,
                    otp: hash,
                    type: 'forgotPassword',
                });
                await sendMailForgotPassword(email, otp);

                return res
                    .setHeader('Set-Cookie', [
                        `tokenResetPassword=${token};  Secure; Max-Age=300; Path=/; SameSite=Strict`,
                    ])
                    .status(200)
                    .json({ message: 'Gửi thành công !!!' });
            }
        });
    }

    async resetPassword(req, res) {
        const token = req.cookies.tokenResetPassword;
        const { otp, password } = req.body;

        if (!token) {
            throw new BadRequestError('Vui lòng gửi yêu cầu quên mật khẩu');
        }

        const decode = jwt.verify(token, process.env.JWT_SECRET);
        if (!decode) {
            throw new BadRequestError('Sai mã OTP hoặc đã hết hạn, vui lòng lấy OTP mới');
        }

        const findOTP = await modelOtp.findOne({ email: decode.email }).sort({ createdAt: -1 });
        if (!findOTP) {
            throw new BadRequestError('Sai mã OTP hoặc đã hết hạn, vui lòng lấy OTP mới');
        }

        // So sánh OTP
        const isMatch = await bcrypt.compare(otp, findOTP.otp);
        if (!isMatch) {
            throw new BadRequestError('Sai mã OTP hoặc đã hết hạn, vui lòng lấy OTP mới');
        }

        // Hash mật khẩu mới
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Tìm người dùng
        const findUser = await modelUser.findOne({ email: decode.email });
        if (!findUser) {
            throw new BadRequestError('Người dùng không tồn tại');
        }

        // Cập nhật mật khẩu mới
        findUser.password = hashedPassword;
        await findUser.save();

        // Xóa OTP sau khi đặt lại mật khẩu thành công
        await modelOtp.deleteOne({ email: decode.email });
        res.clearCookie('tokenResetPassword');
        return new OK({ message: 'Đặt lại mật khẩu thành công' }).send(res);
    }

    async adminCreateUser(req, res) {
        const { fullName, email, password, phone, address, isAdmin } = req.body;

        const userExist = await modelUser.findOne({ email });
        if (userExist) throw new BadRequestError("Email đã tồn tại");

        const hashedPassword = bcrypt.hashSync(password, 10);

        const user = await modelUser.create({
            fullName,
            email,
            password: hashedPassword,
            phone,
            address,
            isAdmin: !!isAdmin,
            typeLogin: 'email'
        });

        return new Created({
            message: 'Tạo người dùng thành công',
            metadata: user
        }).send(res);
    }

    async adminUpdateUser(req, res) {
        const { id, fullName, phone, email, address, balance, isAdmin, password } = req.body;

        const updateData = { fullName, phone, email, address, balance, isAdmin };

        // Nếu có password, hash nó
        if (password) {
            updateData.password = bcrypt.hashSync(password, 10);
        }

        const user = await modelUser.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        return new OK({
            message: 'Cập nhật thành công',
            metadata: user
        }).send(res);
    }

    async adminDeleteUser(req, res) {
        const { id } = req.body;

        const user = await modelUser.findById(id);
        if (!user) throw new BadRequestError("User không tồn tại");

        await modelUser.findByIdAndDelete(id);

        return new OK({
            message: 'Xoá user thành công'
        }).send(res);
    }

    async adminBanUser(req, res) {
        const { id, isActive } = req.body;

        const user = await modelUser.findByIdAndUpdate(
            id,
            { isActive },
            { new: true }
        );

        return new OK({
            message: isActive ? 'Mở khoá user' : 'Khoá user',
            metadata: user
        }).send(res);
    }

    async adminResetPassword(req, res) {
        const { id } = req.body;

        const user = await modelUser.findById(id);
        if (!user) throw new BadRequestError("User không tồn tại");

        // Hash mật khẩu mặc định
        const hashedPassword = bcrypt.hashSync("123456", 10);
        user.password = hashedPassword;
        await user.save();

        return new OK({
            message: "Đặt lại mật khẩu thành công (mật khẩu mới: 123456)",
            metadata: user
        }).send(res);
    }

}

module.exports = new controllerUsers();
