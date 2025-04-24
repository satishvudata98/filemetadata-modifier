# File Metadata Modifier

A web application that allows users to add, edit, and manage metadata (comments, title, author) for PDF and image files (JPEG, PNG, GIF).

## Features

- Add comments to PDF and image files
- Edit existing comments
- View file metadata (title, author, comments)
- Support for multiple file formats:
  - PDF files
  - JPEG/JPG images
  - PNG images
  - GIF images
- Timestamps for all comments
- Persistent metadata storage

## Project Structure

```
filemetadata-modifier/
├── frontend/           # Vue.js frontend
│   ├── src/
│   │   ├── App.vue    # Main application component
│   │   └── main.js    # Vue application entry point
│   ├── package.json   # Frontend dependencies
│   └── vite.config.js # Vite configuration
│
├── backend/           # Node.js backend
│   ├── server.js      # Express server
│   └── package.json   # Backend dependencies
│
├── package.json       # Root package.json for managing both frontend and backend
└── README.md         # Project documentation
```

## Technologies Used

### Frontend
- Vue.js 3
- Vite
- CSS3

### Backend
- Node.js
- Express
- pdf-lib (for PDF metadata)
- sharp (for image processing)
- exifr (for EXIF metadata)

## Setup and Installation

1. Clone the repository:
```bash
git clone https://github.com/satishvudata98/filemetadata-modifier.git
cd filemetadata-modifier
```

2. Install all dependencies (frontend and backend):
```bash
npm run install:all
```

3. Start both frontend and backend servers:
```bash
npm run dev
```

The application will be available at:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

## Available Scripts

- `npm run install:all` - Install dependencies for both frontend and backend
- `npm run dev` - Start both frontend and backend servers concurrently
- `npm run start:frontend` - Start only the frontend server
- `npm run start:backend` - Start only the backend server
- `npm run build` - Build the frontend for production

## Usage

1. Enter the full path to a PDF or image file
2. Click "Get Metadata" to view existing metadata
3. Add new comments in the "New Comment" field
4. Click "Add Comment" to save the comment
5. Edit existing comments by clicking the edit (pencil) icon
6. Save or cancel your edits using the respective buttons

## Notes

- For PNG files, metadata is stored in a companion `.metadata.json` file
- For JPEG files, metadata is stored in the EXIF data
- For PDF files, metadata is stored in the PDF document properties

## License

MIT License 