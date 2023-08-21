require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const connectDB = require('./models/db'); // Import the connectDB model
const Applicant = require('./models/applicant'); // Import the Mongoose model

// for links and email
const PDFExtract = require('pdf.js-extract').PDFExtract;
const pdfExtract = new PDFExtract();
const options = {}; /* see below */

// for mobile and id
const pdfParse = require("pdf-parse");

const app = express();
const port = process.env.PORT || 3000;

// Set up storage for multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

//functions
const { extractMobileAndID, extractLinksAndInfo } = require('./models/functions');

// connectDB()
app.use("/", express.static("public"));
// Use cors middleware to enable cross-origin requests
app.use(cors());

// Route for get the data
app.get('/applicants', async (req, res) => {
  try {
    console.log(1);
    const applicants = await Applicant.find();
    console.log(applicants[0].firstName);
    res.status(200).json(applicants);
    console.log(3);
  } catch (error) {
    console.log(4);
    console.error(error);
    console.log(5);
    res.status(500).json({ message: 'Error fetching applicants' });
    console.log(6);
  }
});  

// Route for file upload
app.post('/upload', upload.single('pdf'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file provided' });
    }

    const applicantObj = {
        firstName: null,
        lastName: null, 
        email: null,
        id: null,
        linkedin: null,
        mobile: null,
    }
    const pdfBuffer = req.file.buffer;
    
    // mobile and id
    const pdfDataParsed = await pdfParse(pdfBuffer);
    const extractedText = pdfDataParsed.text;
    
    // links - for linkdin name and email
    try {
      await extractLinksAndInfo(pdfBuffer, applicantObj, extractedText);

      await extractMobileAndID(pdfBuffer, applicantObj, extractedText);
  
      // Rest of your code
    } catch (error) {
      console.error('Error extracting PDF:', error);
      // Handle the error
    }
    console.log(applicantObj);
    // save to MongoDB
    const applicant = new Applicant({
      firstName: applicantObj.firstName,
      lastName: applicantObj.lastName,
      email: applicantObj.email,
      id: applicantObj.id,
      linkedin: applicantObj.linkedin,
      mobile: applicantObj.mobile,
      rawData: pdfBuffer,
    });

    try {
        await applicant.save();
        console.log("Data saved successfully");
        res.status(200).json(applicant);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error saving data' });
    }
});

// Route for download file
app.get('/download/:id', async (req, res) => {
    try {
      const id = req.params.id; // Get the document's ID from the URL
      const applicant = await Applicant.findById(id);
  
      if (!applicant) {
        return res.status(404).json({ message: 'Applicant not found' });
      }
  
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${applicant.name}.pdf`);
      res.send(applicant.rawData);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching PDF' });
    }
});

connectDB().then(() => {
  console.log('Connected to MongoDB');
  
  // Start the server
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}).catch((error) => {
  console.error('Error connecting to MongoDB:', error);
});
