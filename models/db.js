const mongoose = require('mongoose');
const mongoURI = "mongodb+srv://binyaalex:b8r9Xem8hxdBE6ny@cluster0.ejsuui1.mongodb.net/?retryWrites=true&w=majority";

const connectDB = () => {
  return new Promise((resolve, reject) => {
    mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const db = mongoose.connection;

    db.on('error', (error) => {
      console.error('MongoDB connection error:', error);
      reject(error); // Reject the promise if there's an error
    });

    db.once('open', () => {
      console.log('Connected to MongoDB');
      resolve(); // Resolve the promise when the connection is open
    });
  });
};

module.exports = connectDB;
