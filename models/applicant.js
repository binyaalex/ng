const mongoose = require('mongoose');
const applicantSchema = new mongoose.Schema({
  firstName: { type: String, default: null },
  lastName: { type: String, default: null },
  email: { type: String, default: null },
  id: { type: String, default: null },
  linkedin: { type: String, default: null },
  mobile: { type: String, default: null },
  rawData: Buffer, // Store the raw PDF file content as a Buffer
});

const Applicant = mongoose.model('Applicant', applicantSchema);

module.exports = Applicant;
