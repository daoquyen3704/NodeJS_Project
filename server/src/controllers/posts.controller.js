const modelPost = require('../models/post.model');
const modelUser = require('../models/users.model');
const modelFavourite = require('../models/favourite.model');

const { OK, Created } = require('../core/success.response');
const { BadRequestError } = require('../core/error.response');
const SendMailApprove = require('../utils/SendMail/SendMailApprove');
const SendMailReject = require('../utils/SendMail/SendMailReject');

const pricePostVip = [
    { date: 3, price: 50000 },
    { date: 7, price: 315000 },
    { date: 30, price: 1200000 },
];

const pricePostNormal = [
    { date: 3, price: 10000 },
    { date: 7, price: 60000 },
    { date: 30, price: 1000000 },
];

// Giá gia hạn 7 ngày
const priceExtend = {
    normal: 50000,   // Giá gia hạn 7 ngày cho tin thường
    vip: 250000,     // Giá gia hạn 7 ngày cho tin VIP
};

class controllerPosts {
    async createPost(req, res) {
        const { id } = req.user;
        const {
            title,
            description,
            price,
            images,
            category,
            area,
            username,
            phone,
            options,
            location,
            endDate,
            typeNews,
            dateEnd,
        } = req.body;
        if (
            !title ||
            !description ||
            !price ||
            !images ||
            !category ||
            !area ||
            !username ||
            !phone ||
            !options ||
            !location ||
            !endDate ||
            !typeNews ||
            !dateEnd
        ) {
            throw new BadRequestError('Vui lòng nhập đầy đủ thông tin');
        }

        const user = await modelUser.findById(id);
        if (!user) {
            throw new BadRequestError('User not found');
        }

        const pricePost =
            typeNews === 'vip'
                ? pricePostVip.find((item) => item.date === dateEnd)
                : pricePostNormal.find((item) => item.date === dateEnd);

        if (user.balance < pricePost.price) {
            throw new BadRequestError('Số dư không đủ');
        }

        const post = await modelPost.create({
            title,
            description,
            price,
            location,
            images,
            category,
            area,
            username,
            phone,
            options,
            status: 'inactive',
            userId: id,
            endDate: endDate ? endDate : null,
            typeNews,
        });
        await modelUser.findByIdAndUpdate(id, { $inc: { balance: -pricePost.price } });
        return new Created({
            message: 'Post created successfully',
            metadata: post,
        }).send(res);
    }

    async getPosts(req, res) {
        const { category, priceRange, areaRange, typeNews, province } = req.query;

        const now = new Date();
        const filter = {
            status: 'active',
            endDate: { $gte: now } // Chỉ lấy bài viết chưa hết hạn
        };

        if (category) {
            filter.category = category;
        }

        if (typeNews) {
            filter.typeNews = typeNews;
        }

        if (province) {
            // Tìm kiếm location chứa tên tỉnh/thành phố
            filter.location = { $regex: new RegExp(province, 'i') };
        }

        if (priceRange) {
            const priceConditions = {
                'duoi-1-trieu': { $lt: 1000000 },
                'tu-1-2-trieu': { $gte: 1000000, $lt: 2000000 },
                'tu-2-3-trieu': { $gte: 2000000, $lt: 3000000 },
                'tu-3-5-trieu': { $gte: 3000000, $lt: 5000000 },
                'tu-5-7-trieu': { $gte: 5000000, $lt: 7000000 },
                'tu-7-10-trieu': { $gte: 7000000, $lt: 10000000 },
                'tu-10-15-trieu': { $gte: 10000000, $lt: 15000000 },
                'tren-15-trieu': { $gte: 15000000 },
            };
            if (priceConditions[priceRange]) {
                filter.price = priceConditions[priceRange];
            }
        }

        // Implement area filtering now that 'area' field is Number type
        if (areaRange) {
            const areaConditions = {
                'duoi-20': { $lt: 20 },
                'tu-20-30': { $gte: 20, $lt: 30 },
                'tu-30-50': { $gte: 30, $lt: 50 },
                'tu-50-70': { $gte: 50, $lt: 70 },
                'tu-70-90': { $gte: 70, $lt: 90 },
                'tren-90': { $gte: 90 },
            };
            if (areaConditions[areaRange]) {
                filter.area = areaConditions[areaRange];
            }
        }

        const dataPost = await modelPost.find(filter).sort({ createdAt: -1 });

        const data = await Promise.all(
            dataPost.map(async (item) => {
                const user = await modelUser.findById(item.userId);
                return { ...item._doc, user: { _id: user._id, fullName: user.fullName, avatar: user.avatar } };
            }),
        );

        return new OK({
            message: 'Posts fetched successfully',
            metadata: data,
        }).send(res);
    }

    async getPostById(req, res) {
        const { id } = req.query;
        const data = await modelPost.findById(id);
        const findUser = await modelUser.findById(data.userId);
        const findFavourite = await modelFavourite.find({ postId: id });

        const userFavourite = findFavourite.map((item) => item.userId);

        const lengthPost = await modelPost.countDocuments({ userId: data.userId });
        let statusUser = '';
        const socket = global.usersMap.get(findUser._id.toString());

        if (socket) {
            statusUser = 'Đang hoạt động';
        } else {
            statusUser = 'Đang offline';
        }
        const dataUser = {
            _id: findUser._id,
            username: findUser.fullName,
            avatar: findUser.avatar,
            createdAt: findUser.createdAt,
            phone: findUser.phone,
            lengthPost,
            status: statusUser,
        };

        return new OK({
            message: 'Post fetched successfully',
            metadata: {
                data,
                dataUser,
                userFavourite,
            },
        }).send(res);
    }

    async getPostByUserId(req, res) {
        const { id } = req.user;
        const data = await modelPost.find({ userId: id });
        return new OK({
            message: 'Post fetched successfully',
            metadata: data,
        }).send(res);
    }

    async getNewPost(req, res) {
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 3);
        const now = new Date();

        const data = await modelPost
            .find({
                createdAt: { $gte: fiveDaysAgo },
                status: 'active',
                endDate: { $gte: now }, // Chỉ lấy bài viết chưa hết hạn
            })
            .sort({ createdAt: -1 })
            .limit(8);

        return new OK({
            message: 'Post fetched successfully',
            metadata: data,
        }).send(res);
    }

    async getPostVip(req, res) {
        const now = new Date();
        const data = await modelPost.find({
            typeNews: 'vip',
            status: 'active',
            endDate: { $gte: now }, // Chỉ lấy bài viết chưa hết hạn
        }).limit(5);
        return new OK({
            message: 'Post fetched successfully',
            metadata: data,
        }).send(res);
    }

    async deletePost(req, res) {
        const { id } = req.body;
        const findPost = await modelPost.findById(id);
        if (!findPost) {
            throw new BadRequestError('Post not found');
        }
        await modelPost.findByIdAndDelete(id);
        await modelFavourite.deleteMany({ postId: id });
        await modelUser.findByIdAndUpdate(findPost.userId, { $inc: { balance: findPost.price } });
        return new OK({
            message: 'Xoá bài viết thành công',
            metadata: findPost,
        }).send(res);
    }

    async getAllPosts(req, res) {
        try {
            const { status } = req.query;

            // Khởi tạo filter đúng cách
            let filter = {};

            if (status) {
                filter.status = status;
            }

            // Populate user để lấy tên + phone
            const posts = await modelPost
                .find(filter)
                .populate("userId", "fullName phone");

            // Chuẩn hóa dữ liệu trả về
            const data = posts.map((post) => ({
                _id: post._id,
                title: post.title,
                username: post.username || post.userId?.fullName || "Không rõ",
                phone: post.phone || post.userId?.phone || "",
                category: post.category,
                price: post.price,
                area: post.area,
                location: post.location,
                typeNews: post.typeNews,
                status: post.status,
                createdAt: post.createdAt,
                endDate: post.endDate,
                images: post.images,
                description: post.description,
                options: post.options || [],
            }));

            return new OK({
                message: "Lấy bài viết thành công",
                metadata: data,
            }).send(res);

        } catch (err) {
            console.error("getAllPosts error:", err);
            throw new BadRequestError("Lỗi khi lấy danh sách bài viết");
        }
    }

    async deletePostUser(req, res) {
        const { id } = req.body;

        const post = await modelPost.findById(id);
        if (!post) throw new BadRequestError("Post not found");

        if (String(post.userId) !== String(req.user.id)) {
            throw new BadRequestError("Không có quyền xoá bài viết");
        }

        await modelPost.findByIdAndDelete(id);

        return new OK({
            message: "Xóa bài viết thành công",
            metadata: post
        }).send(res);
    }

    async approvePost(req, res) {
        const { id } = req.body;

        const post = await modelPost.findById(id);
        if (!post) throw new BadRequestError("Post not found");

        const user = await modelUser.findById(post.userId);

        // --- TÍNH NGÀY HẾT HẠN MỚI ---
        const now = new Date();
        const addDays = post.dateEnd || 7; // Nếu không có dateEnd thì mặc định +7 ngày

        const newEndDate = new Date(now);
        newEndDate.setDate(now.getDate() + addDays);

        // --- CẬP NHẬT BÀI VIẾT ---
        const updatedPost = await modelPost.findByIdAndUpdate(
            id,
            {
                status: "active",
                endDate: newEndDate,
            },
            { new: true }
        );

        // --- GỬI MAIL ---
        await SendMailApprove(user.email, updatedPost);

        return new OK({
            message: "Duyệt bài viết thành công",
            metadata: updatedPost,
        }).send(res);
    }

    async rejectPost(req, res) {
        const { id, reason } = req.body;
        const findPost = await modelPost.findById(id);
        const findUser = await modelUser.findById(findPost.userId);
        await modelPost.findByIdAndUpdate(id, { status: 'cancel' });
        await SendMailReject(findUser.email, findPost, reason);
        return new OK({
            message: 'Từ chối bài viết thành công',
            metadata: findPost,
        }).send(res);
    }

    async extendPost(req, res) {
        const { id } = req.body;
        const { id: userId } = req.user;

        if (!id) throw new BadRequestError("Missing post ID");

        const post = await modelPost.findById(id);
        if (!post) throw new BadRequestError("Post not found");

        // Kiểm tra quyền sở hữu
        if (String(post.userId) !== String(userId)) {
            throw new BadRequestError("Bạn không có quyền gia hạn bài viết này");
        }

        // Tính giá gia hạn
        const extendPrice = post.typeNews === 'vip'
            ? priceExtend.vip
            : priceExtend.normal;

        // Kiểm tra số dư
        const user = await modelUser.findById(userId);
        if (user.balance < extendPrice) {
            throw new BadRequestError(`Số dư không đủ. Cần ${extendPrice.toLocaleString('vi-VN')} VNĐ để gia hạn`);
        }

        // Trừ tiền
        user.balance -= extendPrice;
        await user.save();

        // Tính ngày hết hạn mới (từ endDate hiện tại hoặc từ hôm nay nếu đã hết hạn)
        const now = new Date();
        const currentEndDate = post.endDate && post.endDate > now ? post.endDate : now;
        const newEndDate = new Date(currentEndDate);
        newEndDate.setDate(newEndDate.getDate() + 7);

        // Cập nhật bài viết: active + endDate mới
        post.status = 'active';
        post.endDate = newEndDate;
        await post.save();

        return new OK({
            message: `Gia hạn bài viết thêm 7 ngày thành công. Đã trừ ${extendPrice.toLocaleString('vi-VN')} VNĐ`,
            metadata: post
        }).send(res);
    }


    async postSuggest(req, res) {
        const now = new Date();

        // Kiểm tra xem user có đăng nhập không
        if (req.user && req.user.id) {
            const { id } = req.user;
            const findUser = await modelUser.findById(id);
            const address = findUser?.address;

            if (address) {
                // Lấy phần quận/huyện + tỉnh/thành
                const addressParts = address.split(',');
                const districtCity = addressParts.slice(-2).join(',').trim(); // "Hoàng Mai, Hà Nội"

                // Tìm bài viết có location chứa "Hoàng Mai, Hà Nội"
                const data = await modelPost.find({
                    location: { $regex: new RegExp(districtCity, 'i') },
                    status: 'active',
                    endDate: { $gte: now }, // Chỉ lấy bài viết chưa hết hạn
                }).limit(10);

                return new OK({
                    message: 'Post fetched successfully',
                    metadata: data.length ? data : await modelPost.find({
                        status: 'active',
                        endDate: { $gte: now }
                    }).limit(10),
                }).send(res);
            }
        }

        // Nếu không có user hoặc không có address, trả về bài viết random
        const data = await modelPost.find({
            status: 'active',
            endDate: { $gte: now } // Chỉ lấy bài viết chưa hết hạn
        }).limit(10);

        return new OK({
            message: 'Post fetched successfully',
            metadata: data,
        }).send(res);
    }

    async updatePost(req, res) {
        const { id, ...updateData } = req.body;

        if (!id) throw new BadRequestError("Missing post ID");

        const updated = await modelPost.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        if (!updated) throw new BadRequestError("Post not found");

        return new OK({
            message: "Update post successfully",
            metadata: updated,
        }).send(res);
    }

    async updatePostUser(req, res) {
        const { id, ...updateData } = req.body;
        const { id: userId } = req.user;

        if (!id) throw new BadRequestError("Missing post ID");

        // Kiểm tra quyền sở hữu
        const post = await modelPost.findById(id);
        if (!post) throw new BadRequestError("Post not found");

        if (String(post.userId) !== String(userId)) {
            throw new BadRequestError("Bạn không có quyền chỉnh sửa bài viết này");
        }

        // Cập nhật bài viết
        const updated = await modelPost.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        return new OK({
            message: "Cập nhật bài viết thành công",
            metadata: updated,
        }).send(res);
    }

    async deletePostAdmin(req, res) {
        const { id } = req.body;

        if (!id) throw new BadRequestError("Missing post ID");

        const findPost = await modelPost.findById(id);
        if (!findPost) throw new BadRequestError("Post not found");

        await modelPost.findByIdAndDelete(id);
        await modelFavourite.deleteMany({ postId: id });

        return new OK({
            message: "Delete post successfully",
            metadata: findPost,
        }).send(res);
    }

}

module.exports = new controllerPosts();
