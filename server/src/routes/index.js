const userRoutes = require('./users.routes');
const postRoutes = require('./posts.routes');
const paymentsRoutes = require('./payments.routes');
const messengerRoutes = require('./messenger.routes');
const favouriteRoutes = require('./favourite.routes');

const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'src/uploads/images');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

var upload = multer({ storage: storage });

function routes(app) {

    /** USERS */
    app.use('/', userRoutes);

    /** POSTS */
    app.use('/', postRoutes);

    /** PAYMENTS */
    app.use('/', paymentsRoutes);

    /** MESSENGER */
    app.use('/', messengerRoutes);

    /** FAVOURITE */
    app.use('/', favouriteRoutes);

    /** UPLOAD IMAGES */
    app.post('/api/upload-images', upload.array('images'), (req, res) => {
        return res.status(200).json({
            message: 'Images uploaded successfully',
            images: req.files.map((file) => `http://localhost:3000/uploads/images/${file.filename}`),
        });
    });

    app.post('/api/upload-image', upload.single('avatar'), (req, res) => {
        const file = req.file;
        return res.status(200).json({
            message: 'Image uploaded successfully',
            image: `http://localhost:3000/uploads/images/${file.filename}`,
        });
    });

    /** ADMIN CHECK LOGIN */
    app.get('/', userRoutes);
}

module.exports = routes;
