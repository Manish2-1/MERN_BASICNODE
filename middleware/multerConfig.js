const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const allowedFileTypes = ['image/jpg', 'image/png', 'image/jpeg']
        if (!allowedFileTypes.includes(file.mimetype)) {
            cb(new Error('Invalid file type. Only jpg, png, and jpeg are allowed.'));
            return
        }
        cb(null, './storage');  //cb(error, success)
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname)
    }
})

module.exports = {
    multer,
    storage
}