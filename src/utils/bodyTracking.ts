export class BodyTracker {
  private canvas: HTMLCanvasElement;
  private video: HTMLVideoElement;
  private ctx: CanvasRenderingContext2D;
  private isTracking: boolean = false;

  constructor(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
    this.video = video;
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get canvas context');
    this.ctx = context;

    // Listen for video metadata to be loaded
    this.video.addEventListener('loadedmetadata', () => {
      console.log('Video metadata loaded:', {
        width: this.video.videoWidth,
        height: this.video.videoHeight
      });
      this.canvas.width = this.video.videoWidth;
      this.canvas.height = this.video.videoHeight;
    });
  }

  start() {
    // Only start tracking once video is playing
    if (this.video.readyState >= 2) { // HAVE_CURRENT_DATA or better
      console.log('Starting body tracking with video dimensions:', {
        width: this.video.videoWidth,
        height: this.video.videoHeight
      });
      this.isTracking = true;
      this.track();
    } else {
      console.log('Waiting for video to be ready before starting tracking...');
      this.video.addEventListener('canplay', () => {
        console.log('Video can now play, starting tracking');
        this.isTracking = true;
        this.track();
      }, { once: true });
    }
  }

  stop() {
    this.isTracking = false;
    console.log('Body tracking stopped');
  }

  private track() {
    if (!this.isTracking) return;

    // Ensure video dimensions are available
    if (this.video.videoWidth === 0 || this.video.videoHeight === 0) {
      console.log('Video dimensions not yet available, waiting...');
      requestAnimationFrame(() => this.track());
      return;
    }

    // Update canvas size if needed
    if (this.canvas.width !== this.video.videoWidth) {
      console.log('Updating canvas dimensions to match video');
      this.canvas.width = this.video.videoWidth;
      this.canvas.height = this.video.videoHeight;
    }

    // Draw the video frame
    this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

    try {
      // Get image data for analysis
      const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      const data = imageData.data;

      // Simple movement detection by comparing pixel changes
      for (let i = 0; i < data.length; i += 4) {
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];
        
        // Highlight areas with movement (simplified for demonstration)
        if (red > 150 && green > 150 && blue > 150) {
          data[i] = 255;     // Red
          data[i + 1] = 0;   // Green
          data[i + 2] = 0;   // Blue
          data[i + 3] = 255; // Alpha
        }
      }

      // Put the modified image data back
      this.ctx.putImageData(imageData, 0, 0);
    } catch (error) {
      console.error('Error processing video frame:', error);
    }

    // Continue tracking
    requestAnimationFrame(() => this.track());
  }

  // Get a snapshot of the current frame
  captureFrame(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (this.video.videoWidth === 0 || this.video.videoHeight === 0) {
        reject(new Error('Video dimensions not available'));
        return;
      }

      try {
        this.canvas.toBlob(
          (blob) => {
            if (blob) {
              console.log('Frame captured:', blob.size, 'bytes');
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob from canvas'));
            }
          },
          'image/jpeg',
          0.8
        );
      } catch (error) {
        console.error('Error capturing frame:', error);
        reject(error);
      }
    });
  }
}