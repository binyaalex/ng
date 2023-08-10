const mongoose = require('mongoose');
const mongoURI = "mongodb+srv://binyaalex:b8r9Xem8hxdBE6ny@cluster0.ejsuui1.mongodb.net/?retryWrites=true&w=majority";
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});
