# Screen Recording Feature Plan

## Goal Description
The user wants to add a screen recording and playback feature to the Whiteboard web application. This will allow users to record their drawing sessions (both video and audio) and playback or download the resulting video within the application.

## User Review Required
- Is it acceptable to use the browser's `navigator.mediaDevices.getDisplayMedia()` which will prompt the user to choose which screen/window to record? This is the standard approach for screen recording on the web.
- Currently, I plan to place the "Record / Stop" button in the `Toolbar` at the bottom right (next to the Users button). Is this placement okay?

## Proposed Changes

### Client Application
#### [MODIFY] [App.jsx](file:///c:/test_ai/Whiteboard/Client/src/App.jsx)
- **Add State:** `isRecording`, `recordedVideoUrl`, `showVideoModal`.
- **Add Refs:** `mediaRecorderRef`, `recordedChunksRef`.
- **Add Functions:** 
  - `startRecording()`: Requests display media (screen/window) and audio, initializes `MediaRecorder`, and starts recording.
  - `stopRecording()`: Stops the `MediaRecorder` and the media tracks, compiles the chunks into a Blob, and generates a URL for playback.
- **Render:** Pass recording states and callbacks to `Toolbar`. Also render `VideoPlayerModal` when `showVideoModal` is true.

#### [MODIFY] [Toolbar.jsx](file:///c:/test_ai/Whiteboard/Client/src/components/Toolbar.jsx)
- **Add Props:** `isRecording` (boolean), `onStartRecord` (function), `onStopRecord` (function).
- **Add UI:** A newly added record button ⏺️ (or stop button ⏹️) located in the toolbar group on the right side.

#### [NEW] [VideoPlayerModal.jsx](file:///c:/test_ai/Whiteboard/Client/src/components/VideoPlayerModal.jsx)
- A new modal component that takes `videoUrl` and `onClose` props.
- Displays a `<video src={videoUrl} controls />` element for playback.
- Includes a "Download" button to save the video as a `.webm` file.

#### [MODIFY] [index.css](file:///c:/test_ai/Whiteboard/Client/src/index.css)
- Add styling for the `.video-modal-overlay` and `.video-modal-content` elements to display the video player elegantly.
- Add styling for the recording button (perhaps a pulsing red dot when recording).

## Verification Plan
### Manual Verification
1. Open the application in the browser.
2. Click the new "Record" button in the toolbar.
3. Accept the browser prompt to share the screen/window.
4. Draw on the canvas.
5. Click the "Stop Recording" button.
6. Verify that the Video Player Modal appears.
7. Play the video to ensure it captured the screen and audio.
8. Click "Download" to ensure the video saves correctly to the local device.
