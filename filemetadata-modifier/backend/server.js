const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const sharp = require('sharp');
const exifr = require('exifr');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Extract metadata from a file
app.get('/api/metadata/:filePath', async (req, res) => {
  try {
    const filePath = decodeURIComponent(req.params.filePath);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    const fileExtension = path.extname(filePath).toLowerCase();
    let metadata = {};
    
    // Handle PDF files
    if (fileExtension === '.pdf') {
      const pdfBytes = fs.readFileSync(filePath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      
      // Extract PDF metadata
      metadata = {
        title: pdfDoc.getTitle() || 'No title',
        author: pdfDoc.getAuthor() || 'No author',
        subject: pdfDoc.getSubject() || 'No comments',
        type: 'pdf'
      };
    }
    // Handle image files
    else if (['.jpg', '.jpeg', '.png', '.gif'].includes(fileExtension)) {
      try {
        // For PNG files, we'll use a different approach
        if (fileExtension === '.png') {
          // Try to read metadata from a companion JSON file
          const jsonPath = filePath + '.metadata.json';
          if (fs.existsSync(jsonPath)) {
            try {
              const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
              metadata = {
                title: jsonData.title || 'No title',
                author: jsonData.author || 'No author',
                comments: jsonData.comments || 'No comments',
                type: 'image'
              };
            } catch (error) {
              console.error('Error reading JSON metadata:', error);
            }
          }
          
          // If no JSON file or error reading it, use default values
          if (!metadata.title) {
            metadata = {
              title: 'No title',
              author: 'No author',
              comments: 'No comments',
              type: 'image'
            };
          }
        } else {
          // For JPEG and other formats, try to extract EXIF data
          const exifData = await exifr.parse(filePath);
          
          metadata = {
            title: exifData?.ImageDescription || 'No title',
            author: exifData?.Artist || 'No author',
            comments: exifData?.UserComment || exifData?.ImageDescription || 'No comments',
            type: 'image'
          };
        }
      } catch (error) {
        console.error('Error extracting image metadata:', error);
        // Fallback to basic metadata
        metadata = {
          title: 'No title',
          author: 'No author',
          comments: 'No comments',
          type: 'image'
        };
      }
    } else {
      return res.status(400).json({ message: 'Unsupported file type' });
    }
    
    return res.json({ metadata });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'Error extracting file metadata' });
  }
});

// Edit an existing comment
app.put('/api/metadata/:filePath', async (req, res) => {
  const filePath = decodeURIComponent(req.params.filePath);
  const { commentIndex, newComment } = req.body;

  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    const fileExtension = path.extname(filePath).toLowerCase();
    
    // Handle PDF files
    if (fileExtension === '.pdf') {
      const pdfBytes = fs.readFileSync(filePath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      
      // Get existing subject/comments
      const existingSubject = pdfDoc.getSubject() || '';
      
      // Split comments by double newlines
      const comments = existingSubject.split('\n\n');
      
      // Check if the index is valid
      if (commentIndex < 0 || commentIndex >= comments.length) {
        return res.status(400).json({ message: 'Invalid comment index' });
      }
      
      // Extract timestamp if it exists
      const commentParts = comments[commentIndex].split(': ');
      let timestamp = '';
      let commentText = comments[commentIndex];
      
      if (commentParts.length > 1) {
        timestamp = commentParts[0];
        commentText = commentParts.slice(1).join(': ');
      }
      
      // Update the comment
      comments[commentIndex] = timestamp 
        ? `${timestamp}: ${newComment}`
        : newComment;
      
      // Join comments back together
      const updatedSubject = comments.join('\n\n');
      
      // Update PDF metadata
      pdfDoc.setTitle(pdfDoc.getTitle() || 'Document with Comments');
      pdfDoc.setAuthor(pdfDoc.getAuthor() || 'Metadata Modifier');
      pdfDoc.setSubject(updatedSubject);
      
      const modifiedPdfBytes = await pdfDoc.save();
      fs.writeFileSync(filePath, modifiedPdfBytes);
      
      return res.json({ message: 'Comment updated successfully' });
    }
    
    // Handle image files
    if (['.jpg', '.jpeg', '.png', '.gif'].includes(fileExtension)) {
      try {
        // For PNG files, we'll use a companion JSON file
        if (fileExtension === '.png') {
          // Read or create JSON metadata file
          const jsonPath = filePath + '.metadata.json';
          let jsonData = {};
          
          if (fs.existsSync(jsonPath)) {
            try {
              jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
            } catch (error) {
              console.error('Error reading JSON metadata:', error);
            }
          }
          
          // Get existing comments
          let existingComments = jsonData.comments || '';
          
          // Split comments by double newlines
          const comments = existingComments ? existingComments.split('\n\n') : [];
          
          // Check if the index is valid
          if (commentIndex < 0 || commentIndex >= comments.length) {
            return res.status(400).json({ message: 'Invalid comment index' });
          }
          
          // Extract timestamp if it exists
          const commentParts = comments[commentIndex].split(': ');
          let timestamp = '';
          let commentText = comments[commentIndex];
          
          if (commentParts.length > 1) {
            timestamp = commentParts[0];
            commentText = commentParts.slice(1).join(': ');
          }
          
          // Update the comment
          comments[commentIndex] = timestamp 
            ? `${timestamp}: ${newComment}`
            : newComment;
          
          // Join comments back together
          const updatedComments = comments.join('\n\n');
          
          // Update JSON metadata
          jsonData.comments = updatedComments;
          fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
          
          return res.json({ message: 'Comment updated successfully' });
        } else {
          // For JPEG and other formats, use EXIF
          // Read the image
          const imageBuffer = fs.readFileSync(filePath);
          
          // Get existing metadata
          let existingComments = '';
          try {
            const exifData = await exifr.parse(filePath);
            existingComments = exifData?.UserComment || exifData?.ImageDescription || '';
          } catch (error) {
            console.error('Error reading EXIF data:', error);
          }
          
          // Split comments by double newlines
          const comments = existingComments ? existingComments.split('\n\n') : [];
          
          // Check if the index is valid
          if (commentIndex < 0 || commentIndex >= comments.length) {
            return res.status(400).json({ message: 'Invalid comment index' });
          }
          
          // Extract timestamp if it exists
          const commentParts = comments[commentIndex].split(': ');
          let timestamp = '';
          let commentText = comments[commentIndex];
          
          if (commentParts.length > 1) {
            timestamp = commentParts[0];
            commentText = commentParts.slice(1).join(': ');
          }
          
          // Update the comment
          comments[commentIndex] = timestamp 
            ? `${timestamp}: ${newComment}`
            : newComment;
          
          // Join comments back together
          const updatedComments = comments.join('\n\n');
          
          // Update image metadata using sharp
          await sharp(imageBuffer)
            .withMetadata({
              exif: {
                IFD0: {
                  ImageDescription: updatedComments
                },
                IFD1: {
                  ImageDescription: updatedComments
                },
                ExifIFD: {
                  UserComment: updatedComments
                }
              }
            })
            .toFile(filePath + '.temp');
          
          // Replace original file with modified one
          fs.unlinkSync(filePath);
          fs.renameSync(filePath + '.temp', filePath);
          
          return res.json({ message: 'Comment updated successfully' });
        }
      } catch (error) {
        console.error('Error updating image metadata:', error);
        return res.status(500).json({ message: 'Error updating image metadata' });
      }
    }
    
    return res.status(400).json({ message: 'Unsupported file type' });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'Error updating comment' });
  }
});

app.post('/api/metadata', async (req, res) => {
  const { filePath, comments } = req.body;

  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    const fileExtension = path.extname(filePath).toLowerCase();
    
    // Handle PDF files
    if (fileExtension === '.pdf') {
      const pdfBytes = fs.readFileSync(filePath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      
      // Get existing subject/comments
      const existingSubject = pdfDoc.getSubject() || '';
      
      // Combine existing comments with new comments
      const updatedComments = existingSubject 
        ? `${existingSubject}\n\n${new Date().toLocaleString()}: ${comments}`
        : `${new Date().toLocaleString()}: ${comments}`;
      
      // Add comments as document metadata
      pdfDoc.setTitle(pdfDoc.getTitle() || 'Document with Comments');
      pdfDoc.setAuthor(pdfDoc.getAuthor() || 'Metadata Modifier');
      pdfDoc.setSubject(updatedComments);
      
      const modifiedPdfBytes = await pdfDoc.save();
      fs.writeFileSync(filePath, modifiedPdfBytes);
      
      return res.json({ message: 'PDF metadata updated successfully' });
    }
    
    // Handle image files
    if (['.jpg', '.jpeg', '.png', '.gif'].includes(fileExtension)) {
      try {
        // For PNG files, we'll use a companion JSON file
        if (fileExtension === '.png') {
          // Read or create JSON metadata file
          const jsonPath = filePath + '.metadata.json';
          let jsonData = {};
          
          if (fs.existsSync(jsonPath)) {
            try {
              jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
            } catch (error) {
              console.error('Error reading JSON metadata:', error);
            }
          }
          
          // Get existing comments
          const existingComments = jsonData.comments || '';
          
          // Combine existing comments with new comments
          const updatedComments = existingComments 
            ? `${existingComments}\n\n${new Date().toLocaleString()}: ${comments}`
            : `${new Date().toLocaleString()}: ${comments}`;
          
          // Update JSON metadata
          jsonData.comments = updatedComments;
          jsonData.title = jsonData.title || 'Image with Comments';
          jsonData.author = jsonData.author || 'Metadata Modifier';
          
          fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
          
          return res.json({ message: 'Image metadata updated successfully' });
        } else {
          // For JPEG and other formats, use EXIF
          // Read the image
          const imageBuffer = fs.readFileSync(filePath);
          
          // Get existing metadata
          let existingComments = '';
          try {
            const exifData = await exifr.parse(filePath);
            existingComments = exifData?.UserComment || exifData?.ImageDescription || '';
          } catch (error) {
            console.error('Error reading EXIF data:', error);
          }
          
          // Combine existing comments with new comments
          const updatedComments = existingComments 
            ? `${existingComments}\n\n${new Date().toLocaleString()}: ${comments}`
            : `${new Date().toLocaleString()}: ${comments}`;
          
          // Update image metadata using sharp with more specific EXIF settings
          await sharp(imageBuffer)
            .withMetadata({
              exif: {
                IFD0: {
                  ImageDescription: updatedComments
                },
                IFD1: {
                  ImageDescription: updatedComments
                },
                ExifIFD: {
                  UserComment: updatedComments
                }
              }
            })
            .toFile(filePath + '.temp');
          
          // Replace original file with modified one
          fs.unlinkSync(filePath);
          fs.renameSync(filePath + '.temp', filePath);
          
          return res.json({ message: 'Image metadata updated successfully' });
        }
      } catch (error) {
        console.error('Error updating image metadata:', error);
        return res.status(500).json({ message: 'Error updating image metadata' });
      }
    }
    
    return res.status(400).json({ message: 'Unsupported file type' });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'Error updating file metadata' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 