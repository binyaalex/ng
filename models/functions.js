// helpers.js

const PDFExtract = require('pdf.js-extract').PDFExtract;
const pdfExtract = new PDFExtract();
const pdfParse = require("pdf-parse");
const Applicant = require('./applicant');

const applicantObj = {
    firstName: null,
    lastName: null,
    email: null,
    id: null,
    linkedin: null,
    mobile: null,
};

// for mail if its not in links
function extractEmail(extractedText) {
    const emailRe = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
    const match = emailRe.exec(extractedText);
    return match ? match[0].trim() : null;
}

function extractNamesFromText(text) {
    const lines = text.split('\n');
    let potentialNames = [];
    let foundName = false; // Flag to track if a name has been found
    
    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i].trim();
      const nextLine = lines[i + 1].trim();
  
      // Skip empty lines
      if (line === '' || nextLine === '') {
        continue;
      }
  
      // Check if both the current line and next line have only one word
      if (line.split(/\s+/).length === 1 && nextLine.split(/\s+/).length === 1) {
        // Check if both lines are either all uppercase or capitalized
        if (
          (line === line.toUpperCase() || isCapitalized(line)) &&
          (nextLine === nextLine.toUpperCase() || isCapitalized(nextLine))
        ) {
          potentialNames.push(`${line} ${nextLine}`);
          foundName = true; // Set the flag to true
          break; // Stop processing lines
        }
      }
  
      if (foundName) {
        break; // Stop processing lines if a name has been found
      }
  
      const words = line.split(/\s+/);
      for (let j = 0; j < words.length - 1; j++) {
        const word1 = words[j];
        const word2 = words[j + 1];
  
        if (word1.match(/^[A-Z][a-z]*$/) && word2.match(/^[A-Z][a-z]*[,.\\-]?$/)) {
          if (word1.length <= 15 && word2.length <= 15) {
            potentialNames.push(`${word1} ${word2}`);
            foundName = true; // Set the flag to true
            break; // Stop processing lines
          }
        }
  
        if (word1.match(/^[A-Z]+$/) && word2.match(/^[A-Z]+[,.\\-]?$/) && words[j + 2] === undefined) {
          if (word1.length <= 15 && word2.length <= 15) {
            potentialNames.push(`${word1} ${word2}`);
            foundName = true; // Set the flag to true
            break; // Stop processing lines
          }
        }
      }
  
      if (foundName) {
        break; // Stop processing lines if a name has been found
      }
    }
    return potentialNames;
}
  
  
function isCapitalized(str) {
    return str[0] === str[0].toUpperCase() && str.slice(1) === str.slice(1).toLowerCase();
}

async function extractLinksAndInfo(pdfBuffer, applicantObj, extractedText) {
    const options = {};// ... set your options here

    return new Promise((resolve, reject) => {
      pdfExtract.extractBuffer(pdfBuffer,options, async (err, extractedData) => {
        if (err) {
          console.error('Error extracting PDF:', err);
          reject(err);
        } else {
          for (const element of extractedData.pages[0].links) {
            if (element.includes("linkedin")) {
              applicantObj.linkedin = element;
              const nameStartIndex = element.indexOf("in/") + 3;
              const nameEndIndex = element.lastIndexOf("-");
              const fullName = element.slice(nameStartIndex, nameEndIndex);
              applicantObj.firstName = fullName.slice(0, fullName.indexOf("-"));
              applicantObj.lastName = fullName.slice(fullName.indexOf("-") + 1, fullName.length);
            }
    
            if (element.includes("mailto") && element.includes("@")) {
              applicantObj.email = element.slice(element.indexOf(":") + 1);
            }
          }

          if (!applicantObj.email) {
              applicantObj.email = extractEmail(extractedText);
          }

          if (!applicantObj.firstName && !applicantObj.lastName) {
            const extractedNames = extractNamesFromText(extractedText);
            if (extractedNames) {
                const punctuationPattern = /[,.?!\:\{\[\(\)\]}]/g;
                const fullName = extractedNames[0].replace(punctuationPattern, "")
                applicantObj.firstName = fullName.slice(0, fullName.indexOf(" ")).toLocaleLowerCase();
                applicantObj.lastName = fullName.slice(fullName.indexOf(" ")+1, fullName.length).toLocaleLowerCase();
            }
          }

          resolve(applicantObj);
        }
      });
    });
}

async function validateIsraeliID(id) {
    if (!/^\d{9}$/.test(id)) {
      return false; // ID must be exactly 9 digits
    }
  
    const idDigits = id.split('').map(Number);
    const weights = [1, 2, 1, 2, 1, 2, 1, 2, 1];
    let sum = 0;
  
    for (let i = 0; i < 9; i++) {
      const digit = idDigits[i] * weights[i];
      sum += digit >= 10 ? digit - 9 : digit;
    }
  
    return sum % 10 === 0;
}

//work  
async function extractMobileAndID(pdfBuffer, applicantObj, extractedText) {

  // Extract mobile
  const mobileRe = /(?:[-+() ]*\d){10,13}/gm;
  applicantObj.mobile = extractedText.match(mobileRe)?.map(function (s) { return s.trim(); })[0].replace(/[^0-9]/g, '') || null;

  // Extract ID
  const idRe = /\b\d{9}\b/gm;
  const potentialIds = extractedText.match(idRe)?.map(function (s) { return s.trim(); }) || [];
  for (let id of potentialIds) {
    if (validateIsraeliID(id)) {
      applicantObj.id = id;
      break; // Stop after finding a valid ID
    }
  }

  return applicantObj;
}

async function processPDF(pdfBuffer) {
  const applicantObj = await extractLinksAndInfo(pdfBuffer);
  const mobileAndIDInfo = await extractMobileAndID(pdfBuffer);
  Object.assign(applicantObj, mobileAndIDInfo);
  return applicantObj;
}

module.exports = {
    extractLinksAndInfo,
    extractMobileAndID,
    processPDF,
    validateIsraeliID,
};
