//connect to database
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



const express = require('express');
const multer = require('multer');
const Applicant = require('./models/applicant'); // Import the Mongoose model

// for links and email
const PDFExtract = require('pdf.js-extract').PDFExtract;
const pdfExtract = new PDFExtract();
const fs = require('fs');
const buffer = fs.readFileSync("./pdf/CV.pdf");
const options = {}; /* see below */

// for mobile and id
const pdfParse = require("pdf-parse");

const app = express();
const port = process.env.PORT || 3000;

// Set up storage for multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use("/", express.static("public"));

// Route for get the data
app.get('/applicants', async (req, res) => {
    try {
      const applicants = await Applicant.find();
      res.status(200).json(applicants);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching applicants' });
    }
});  

// Route for file upload
app.post('/upload', upload.single('pdf'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file provided' });
    }

    const applicantObj = {
        name: null,
        email: null,
        id: null,
        linkedin: null,
        mobile: null,
    }
    const pdfBuffer = req.file.buffer;
    
    // linkdin name and email
    pdfExtract.extractBuffer(pdfBuffer, options, (err, data) => {
        if (err) return console.log(err);
        data.pages[0].links.forEach(element => {
            // console.log(element);
            if (element.includes("linkedin")) {
                console.log(element);
                applicantObj.linkedin = element
                applicantObj.name = element.slice(element.indexOf("in/")+3, element.lastIndexOf("-"))
            }
            
            if (element.includes("mailto") && element.includes("@")) {
                console.log(element);
                applicantObj.email = element.slice(element.indexOf(":")+1, element.length-1)
            }
        });
    });


    // mobile and id
    const pdfDataParsed = await pdfParse(pdfBuffer);
    const extractedText = pdfDataParsed.text;
    const mobileRe = /(?:[-+() ]*\d){10,13}/gm; 
    const idRe = /(?:[ ]*\d){9,9}/gm; 
    applicantObj.mobile = extractedText.match(mobileRe)?.map(function(s){return s.trim();})[0] || null;
    applicantObj.id = extractedText.match(idRe)?.map(function(s){return s.trim();})[0] || null;

    // save to MongoDB
    console.log(applicantObj);
    const applicant = new Applicant({
        name: applicantObj.name,
        email: applicantObj.email,
        id: applicantObj.id,
        linkedin: applicantObj.linkedin,
        mobile: applicantObj.mobile,
        rawData: pdfBuffer,
    });

    try {
    await applicant.save();
        res.status(200).json({ message: 'Data saved successfully' });
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
  

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
