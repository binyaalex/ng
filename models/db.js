require('dotenv').config();
const mongoose = require('mongoose');
const mongoURI = process.env.MONGO_URI;

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
      resolve(); // Resolve the promise when the connection is open
    });
  });
};

module.exports = connectDB;
