require('dotenv').config();
const express = require('express');
const connectToDatabase = require('./database');
const fs = require('fs')
const Book = require('./model/bookModel');
const { multer, storage } = require('./middleware/multerConfig')
const upload = multer({ storage: storage }); // multer configuration for file uploads

const cors = require('cors');

const app = express();

app.use(cors({
    origin: [
        "http://localhost:5173",             // dev frontend
        "https://mernfrontend-chi.vercel.app" // deployed frontend
    ],
}))

app.use(express.json()); // for parsing application/json

connectToDatabase();

app.get("/", (req, res) => {
    res.status(400).json(
        { "message": "how are u" }
    )
})

// create book
app.post("/book", upload.single('image'), async (req, res) => {
    let fileName;
    if (!req.file) {
        fileName = "https://cdn.vectorstock.com/i/preview-1x/77/30/default-avatar-profile-icon-grey-photo-placeholder-vector-17317730.jpg"
    } else {
        fileName = "http://localhost:3000/" + req.file.filename
    }
    const { bookName, bookPrice, isbnNumber, authorName, publishedAt, publication } = req.body
    await Book.create({
        bookName,
        bookPrice,
        isbnNumber,
        authorName,
        publishedAt,
        publication,
        imageUrl: fileName
    })
    res.status(201).json({
        message: "Book Created Successfully"
    })
})

// all read
app.get("/book", async (req, res) => {
    const books = await Book.find() // return array ma garxa 
    res.status(200).json({
        message: "Books fetched successfully",
        data: books
    })
})

// single read
app.get("/book/:id", async (req, res) => {
    const id = req.params.id
    const book = await Book.findById(id) // return object garxa

    if (!book) {
        res.status(404).json({
            message: "Nothing found"
        })
    } else {
        res.status(200).json({
            message: "Single Book Fetched Successfully",
            data: book
        })
    }
})

//delete operation  
app.delete("/book/:id", async (req, res) => {
    const id = req.params.id;

    try {
        const book = await Book.findById(id);

        if (!book) {
            return res.status(404).json({
                message: "Book not found",
            });
        }

        // Delete image file only if it's stored locally (not placeholder or external link)
        if (book.imageUrl && book.imageUrl.startsWith("http://localhost:3000/")) {
            const localHostUrlLength = "http://localhost:3000/".length;
            const imagePath = book.imageUrl.slice(localHostUrlLength);

            fs.unlink(`storage/${imagePath}`, (err) => {
                if (err) {
                    console.error("Error deleting file:", err);
                } else {
                    console.log("Image file deleted successfully");
                }
            });
        }

        // Delete book from DB
        await Book.findByIdAndDelete(id);

        res.status(200).json({
            message: "Book Deleted Successfully",
        });
    } catch (error) {
        console.error("Error deleting book:", error);
        res.status(500).json({
            message: "Something went wrong",
        });
    }
});

// update operation 
app.patch("/book/:id", upload.single('image'), async (req, res) => {
    const id = req.params.id // kun book update garney id ho yo
    const { bookName, bookPrice, authorName, publishedAt, publication, isbnNumber } = req.body
    const oldDatas = await Book.findById(id)
    if (!oldDatas) {
        return res.status(404).json({ message: "Book not found" });
    }

    let fileName = oldDatas.imageUrl;

    if (req.file) {
        // delete old file if it was not a placeholder image
        if (oldDatas.imageUrl && oldDatas.imageUrl.startsWith("http://localhost:3000/")) {
            const oldImagePath = oldDatas.imageUrl;
            const localHostUrlLength = "http://localhost:3000/".length;
            const newOldImagePath = oldImagePath.slice(localHostUrlLength);

            fs.unlink(`storage/${newOldImagePath}`, (err) => {
                if (err) {
                    console.log("Error deleting old file:", err);
                } else {
                    console.log("Old file deleted successfully");
                }
            });
        }

        // save new file path
        fileName = "http://localhost:3000/" + req.file.filename;
    }
    await Book.findByIdAndUpdate(id, {
        bookName,
        bookPrice,
        authorName,
        publication,
        publishedAt,
        isbnNumber,
        imageUrl: fileName,   //  update image URL if changed
    });

    res.status(200).json({
        message: "Book Updated Successfully"
    });
})

app.use(express.static("./storage/"))

app.listen(process.env.PORT, () => {
    console.log(`Nodejs Server is running on port ${process.env.PORT}`);
})


