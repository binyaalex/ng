const express = require('express');
const multer = require('multer');
const PDFExtract = require('pdf.js-extract').PDFExtract;
const pdfExtract = new PDFExtract();
const fs = require('fs');
const buffer = fs.readFileSync("./pdf/CV.pdf");
const options = {}; /* see below */
const pdfParse = require("pdf-parse");

const app = express();
const port = process.env.PORT || 3000;

// Set up storage for multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Route for file upload
app.use("/", express.static("public"));
app.post('/upload', upload.single('pdf'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file provided' });
    }
  
    const pdfBuffer = req.file.buffer;
  
    pdfExtract.extractBuffer(pdfBuffer, options, (err, data) => {
        if (err) return console.log(err);
        // console.log(data);
        // console.log(data.pages[0].links);
        data.pages[0].links.forEach(element => {
            if (element.includes("linkedin")) {
                let linkedinUrl = element
                console.log(linkedinUrl);
                let name = element.slice(element.indexOf("in/")+3, element.lastIndexOf("-"))
                console.log(name);
            } else {let linkedinUrl = null}
            
            if (element.includes("mailto") && element.includes("@")) {
                let email = element.slice(element.indexOf(":")+1, element.length-1)
                console.log(email);
            } else {let email = null}
        });
        // console.log(data.pages[0].content);
    });
    const pdfDataParsed = await pdfParse(pdfBuffer);
    const extractedText = pdfDataParsed.text;
    const mobileRe = /(?:[-+() ]*\d){10,13}/gm; 
    const idRe = /(?:[ ]*\d){9,9}/gm; 
    let mobile = extractedText.match(mobileRe)?.map(function(s){return s.trim();}) || null;
    let id = extractedText.match(idRe)?.map(function(s){return s.trim();}) || null;
    console.log(mobile);
    console.log(id);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
