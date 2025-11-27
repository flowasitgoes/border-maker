// Vercel Serverless Function to handle /uploads/* requests
// This prevents Angular Router from intercepting /uploads/ paths
// In Vercel, uploaded files are not persisted to the file system
// Files are only available as base64 in the upload API response

export default async function handler(req, res) {
  // Return 404 with proper headers to prevent Angular Router from handling this
  res.status(404).setHeader('Content-Type', 'application/json');
  res.json({
    error: 'File not found',
    message: 'In Vercel environment, files are not persisted. Use the base64 data from the upload API response instead.'
  });
}

