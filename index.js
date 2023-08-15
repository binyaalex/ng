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
function extractNamesFromText(text) {
  const lines = text.split('\n');
  let potentialNames = [];

  for (let i = 0; i < lines.length - 1; i++) {
  const line = lines[i].trim();

  // Check if the line contains only uppercase letters and is not too long
  if (/^[A-Z ]{2,}$/.test(line)) {
    potentialNames.push(line);
    continue; // Move to the next line
  }

  const words = line.split(/\s+/);

  for (let j = 0; j < words.length - 1; j++) {
    const word1 = words[j];
    const word2 = words[j + 1];

    if (word1.match(/^[A-Z][a-z]*$/) && word2.match(/^[A-Z][a-z]*$/)) {
      if (word1.length <= 15 && word2.length <= 15) {
        potentialNames.push(`${word1} ${word2}`);
      }
    }

    if (word1.match(/^[A-Z]+$/) && word2.match(/^[A-Z]+$/) && words[j + 2] === undefined) {
      if (word1.length <= 15 && word2.length <= 15) {
        potentialNames.push(`${word1} ${word2}`);
      }
    }
  }
}


  return potentialNames;
}

// Example usage
// const text = /* Your example text here */;
// const potentialNames = extractNamesFromText(text);
// console.log(potentialNames);




connectDB()
app.use("/", express.static("public"));
// Use cors middleware to enable cross-origin requests
app.use(cors());

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
        firstName: null,
        lastName: null, 
        email: null,
        id: null,
        linkedin: null,
        mobile: null,
    }
    const pdfBuffer = req.file.buffer;
    
    // links - linkdin name and email
    try {
      const data = await new Promise((resolve, reject) => {
        pdfExtract.extractBuffer(pdfBuffer, options, (err, extractedData) => {
          if (err) {
            reject(err);
          } else {
            resolve(extractedData);
          }
        });
      });
  
      // console.log("data:");
      // console.log(data.pages[0]);
  
      for (const element of data.pages[0].links) {
        if (element.includes("linkedin")) {
          applicantObj.linkedin = element;
          const nameStartIndex = element.indexOf("in/") + 3;
          const nameEndIndex = element.lastIndexOf("-");
          const fullName = element.slice(nameStartIndex, nameEndIndex);
          console.log(fullName);
          applicantObj.firstName = fullName.slice(0, fullName.indexOf("-"));
          applicantObj.lastName = fullName.slice(fullName.indexOf("-")+1, fullName.length);
          console.log(applicantObj);
        }
  
        if (element.includes("mailto") && element.includes("@")) {
          applicantObj.email = element.slice(element.indexOf(":") + 1);
        }
      }
  
      // Rest of your code
    } catch (error) {
      console.error('Error extracting PDF:', error);
      // Handle the error
    }
    


    // mobile and id
    const pdfDataParsed = await pdfParse(pdfBuffer);
    // console.log(pdfDataParsed);
    const extractedText = pdfDataParsed.text;
    const mobileRe = /(?:[-+() ]*\d){10,13}/gm; 
    applicantObj.mobile = extractedText.match(mobileRe)?.map(function(s){return s.trim();})[0].replace(/[^0-9]/g, '') || null;
    const idRe = /\b\d{9}\b/gm; 
    applicantObj.id = extractedText.match(idRe)?.map(function(s){return s.trim();})[0] || null;

    // mail name and linkdin if it didn't work from the links

    //mail
    if (!applicantObj.email) {
      const emailRe = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
      applicantObj.email = emailRe.exec(extractedText).map(function(s){return s.trim();})[0] || null;
    }

    //name
    if (!applicantObj.firstName && !applicantObj.fullName) {
      console.log(pdfDataParsed);
      const extractedNames = extractNamesFromText(pdfDataParsed.text);
      console.log(extractedNames);
      const fullName = extractedNames[0]
      if (fullName) {
        applicantObj.firstName = fullName.slice(0, fullName.indexOf(" "));
        applicantObj.lastName = fullName.slice(fullName.indexOf(" ")+1, fullName.length);
      }
    }

    // save to MongoDB
    console.log(applicantObj);
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
