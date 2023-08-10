const mongoose = require('mongoose');

const applicantSchema = new mongoose.Schema({
  name: String,
  email: String,
  id: String,
  linkedin: String,
  mobile: String,
  rawData: Buffer, // Store the raw PDF file content as a Buffer
});

const Applicant = mongoose.model('Applicant', applicantSchema);

module.exports = Applicant;
