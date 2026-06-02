import fs from 'fs';
import path from 'path';

// Helper to ensure dummy pdf storage folder exists
const ensurePdfDir = () => {
  const dir = './uploads/documents';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

export const generateReceiptPDF = (feeRecord, student, classObj) => {
  const dir = ensurePdfDir();
  const filename = `receipt-${feeRecord._id || Date.now()}.txt`; // Using txt for light simulated storage
  const filePath = path.join(dir, filename);
  
  const content = `
=========================================
          EDUNEXUS SCHOOL RECEIPT        
=========================================
Receipt ID: REC-${feeRecord._id || 'TEMP'}
Date: ${new Date().toLocaleDateString()}
Student Name: ${student.name}
Class: ${classObj.className} - Section ${classObj.section}
-----------------------------------------
Tuition Fee Paid:  $${feeRecord.amountPaid}
Status:           ${feeRecord.status}
Payment Method:   ${feeRecord.paymentMethod}
Transaction ID:   ${feeRecord.transactionId || 'N/A'}
-----------------------------------------
Thank you for your payment!
=========================================
  `;
  
  fs.writeFileSync(filePath, content.trim());
  return `/uploads/documents/${filename}`;
};

export const generateReportCardPDF = (student, classObj, examName, resultsList) => {
  const dir = ensurePdfDir();
  const filename = `reportcard-${student._id || Date.now()}.txt`;
  const filePath = path.join(dir, filename);
  
  let subjectsRows = '';
  resultsList.forEach(r => {
    subjectsRows += `${r.subjectName.padEnd(20)} | Marks: ${String(r.marksObtained).padStart(3)}/100 | Grade: ${r.grade}\n`;
  });

  const content = `
=========================================
          EDUNEXUS TERM REPORT CARD      
=========================================
Exam Name:   ${examName}
Date:        ${new Date().toLocaleDateString()}
Student Name: ${student.name}
Class:       ${classObj.className} - Section ${classObj.section}
-----------------------------------------
Subject              | Score          | Grade
-----------------------------------------
${subjectsRows}-----------------------------------------
Overall Performance: Pass
EduNexus Academic Management System
=========================================
  `;
  
  fs.writeFileSync(filePath, content.trim());
  return `/uploads/documents/${filename}`;
};
