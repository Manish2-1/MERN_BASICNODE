require('dotenv').config();
const express = require('express');
const connectToDatabase = require('./database');
const fs = require('fs');
const Book = require('./model/bookModel');
const { multer, storage } = require('./middleware/multerConfig');
const upload = multer({ storage: storage });
const cors = require('cors');

const app = express();

app.use(cors({
    origin: [
        "http://localhost:5173",              // dev frontend
        "https://mernfrontend-chi.vercel.app" // deployed frontend
    ],
}));

app.use(express.json());
connectToDatabase();

const BASE_URL = "https://mern-basicnode.onrender.com"; // Render backend URL

// ✅ Serve static files with /storage prefix
app.use("/storage", express.static("./storage"));

app.get("/", (req, res) => {
    res.status(400).json({ message: "how are u" });
});

// CREATE book
app.post("/book", upload.single('image'), async (req, res) => {
    let fileName = req.file
        ? `${BASE_URL}/storage/${req.file.filename}` // ✅ includes /storage
        : "https://cdn.vectorstock.com/i/preview-1x/77/30/default-avatar-profile-icon-grey-photo-placeholder-vector-17317730.jpg";

    const { bookName, bookPrice, isbnNumber, authorName, publishedAt, publication } = req.body;

    await Book.create({
        bookName,
        bookPrice,
        isbnNumber,
        authorName,
        publishedAt,
        publication,
        imageUrl: fileName
    });

    res.status(201).json({ message: "Book Created Successfully" });
});

// READ all books
app.get("/book", async (req, res) => {
    const books = await Book.find();
    res.status(200).json({
        message: "Books fetched successfully",
        data: books
    });
});

// READ single book
app.get("/book/:id", async (req, res) => {
    const id = req.params.id;
    const book = await Book.findById(id);

    if (!book) {
        return res.status(404).json({ message: "Nothing found" });
    }

    res.status(200).json({
        message: "Single Book Fetched Successfully",
        data: book
    });
});

// DELETE book
app.delete("/book/:id", async (req, res) => {
    const id = req.params.id;

    try {
        const book = await Book.findById(id);
        if (!book) {
            return res.status(404).json({ message: "Book not found" });
        }

        // ✅ Delete local image file if it exists
        if (book.imageUrl && book.imageUrl.startsWith(`${BASE_URL}/storage/`)) {
            const imagePath = book.imageUrl.replace(`${BASE_URL}/storage/`, "");
            const filePath = `storage/${imagePath}`;

            if (fs.existsSync(filePath)) {
                fs.unlink(filePath, (err) => {
                    if (err) console.error("Error deleting file:", err);
                    else console.log("Image file deleted successfully");
                });
            } else {
                console.log("File not found, skipping delete:", filePath);
            }
        }

    }

        await Book.findByIdAndDelete(id);
    res.status(200).json({ message: "Book Deleted Successfully" });

} catch (error) {
    console.error("Error deleting book:", error);
    res.status(500).json({ message: "Something went wrong" });
}
});

// UPDATE book
app.patch("/book/:id", upload.single('image'), async (req, res) => {
    const id = req.params.id;
    const { bookName, bookPrice, authorName, publishedAt, publication, isbnNumber } = req.body;

    const oldDatas = await Book.findById(id);
    if (!oldDatas) {
        return res.status(404).json({ message: "Book not found" });
    }

    let fileName = oldDatas.imageUrl;

    if (req.file) {
        // ✅ Delete old image if it was local
        if (oldDatas.imageUrl && oldDatas.imageUrl.startsWith(`${BASE_URL}/storage/`)) {
            const oldImagePath = oldDatas.imageUrl.replace(`${BASE_URL}/storage/`, "");
            fs.unlink(`storage/${oldImagePath}`, (err) => {
                if (err) console.log("Error deleting old file:", err);
                else console.log("Old file deleted successfully");
            });
        }

        // Save new file path
        fileName = `${BASE_URL}/storage/${req.file.filename}`;
    }

    await Book.findByIdAndUpdate(id, {
        bookName,
        bookPrice,
        authorName,
        publication,
        publishedAt,
        isbnNumber,
        imageUrl: fileName,
    });

    res.status(200).json({ message: "Book Updated Successfully" });
});

app.listen(process.env.PORT, () => {
    console.log(`Nodejs Server is running on port ${process.env.PORT}`);
});
