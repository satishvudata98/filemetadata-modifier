# File Metadata Modifier

A web application that allows users to upload files (images and PDFs), view their metadata, and add comments to them.

## Features

- File upload support for images and PDFs
- Automatic metadata extraction
- Comment functionality
- Modern UI with Vuetify
- Responsive design

## Project Structure

```
filemetadata-modifier/
├── backend/           # Node.js backend
│   ├── server.js     # Main server file
│   └── package.json  # Backend dependencies
└── frontend/         # Vue.js frontend
    ├── src/
    │   ├── components/
    │   ├── App.vue
    │   └── main.js
    └── package.json
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm run dev
   ```

The backend server will run on http://localhost:3000

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend application will run on http://localhost:5173

## Usage

1. Open the application in your web browser
2. Click the "Choose file" button to select an image or PDF file
3. The file's metadata will be displayed automatically
4. Add a comment using the text area
5. Click "Add Comment" to save your comment

## Supported File Types

- Images: JPG, JPEG, PNG, GIF
- Documents: PDF

## Technologies Used

- Frontend:
  - Vue.js 3
  - Vuetify
  - Axios

- Backend:
  - Node.js
  - Express
  - Multer
  - Exifr
  - PDF Parse
  - Sharp 