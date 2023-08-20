const mongoose = require('mongoose');
console.log("applicant1")
const applicantSchema = new mongoose.Schema({
  firstName: { type: String, default: null },
  lastName: { type: String, default: null },
  email: { type: String, default: null },
  id: { type: String, default: null },
  linkedin: { type: String, default: null },
  mobile: { type: String, default: null },
  rawData: Buffer, // Store the raw PDF file content as a Buffer
});
console.log("applicant2")

const Applicant = mongoose.model('Applicant', applicantSchema);
console.log("applicant3")

module.exports = Applicant;
console.log("applicant4")
