# Goal Description
We are switching the offline handwriting recognition (Tesseract.js) to the **Google Cloud Vision API** to achieve near-instantaneous and highly accurate Thai handwriting OCR. We will implement this by creating a proxy endpoint on the Node.js server to securely hide the Google API key, and updating the client to send strokes directly to this new `/api/ocr` endpoint.

## User Review Required
> [!IMPORTANT]
> To use this feature, you will need a valid **Google Cloud Vision API Key**. I have created a file at `c:\test_ai\Whiteboard\Server\.env`. You must edit this file and replace `your_google_cloud_api_key_here` with your actual API key, then restart the server.

## Proposed Changes

### Server
#### [MODIFY] c:\test_ai\Whiteboard\Server\server.js
- Apply `cors` middleware to allow requests from the client.
- Create a new POST endpoint at `/api/ocr`.
- Receive base64 image from the client, call the Google Cloud Vision API (`https://vision.googleapis.com/v1/images:annotate`), and return the parsed text.
- Use `dotenv` to safely load the `GOOGLE_VISION_API_KEY`.

### Client
#### [MODIFY] c:\test_ai\Whiteboard\Client\src\components\Canvas.jsx
- Import `axios`.
- Inside `processMagicStrokes`, extract the `dataUrl`, slice off `data:image/png;base64,`, and send it via `POST` to `http://localhost:3000/api/ocr`.
- Handle the text response from the server and convert it into a Text stroke on the canvas.

## Verification Plan
### Automated Tests
- Server and Client will build correctly.
### Manual Verification
1. User provides a valid Google API Key in `Server/.env`.
2. Restart the backend server.
3. Draw a Thai word with the Magic Pen.
4. Wait 1 second, verify that the strokes are replaced almost instantly with highly accurate typed text.
