const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const { processPDF } = require('./models/functions'); // Import the functions from your helpers module

const pdfFolder = path.join(__dirname, 'pdf'); // Path to the folder containing PDF files
const uploadUrl = 'http://localhost:3000/upload'; // Update with your server URL

async function processPDFFiles() {
  try {
    const pdfFiles = await fs.promises.readdir(pdfFolder);

    for (const pdfFile of pdfFiles) {
      const pdfPath = path.join(pdfFolder, pdfFile);
      const pdfBuffer = await fs.promises.readFile(pdfPath);

      const form = new FormData();
      form.append('pdf', pdfBuffer, pdfFile);

      const headers = {
        ...form.getHeaders(),
      };

      const response = await axios.post(uploadUrl, form, { headers });
      console.log(`Uploaded and processed ${pdfFile}:`, response.data);
    }

    console.log('Processing completed.');
  } catch (error) {
    console.error('Error:', error);
  }
}

processPDFFiles();
