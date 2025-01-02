export class BodyTracker {
  private canvas: HTMLCanvasElement;
  private video: HTMLVideoElement;
  private ctx: CanvasRenderingContext2D;
  private isTracking: boolean = false;
  private lastProcessedFrame: ImageData | null = null;

  constructor(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
    this.video = video;
    this.canvas = canvas;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Could not get canvas context');
    this.ctx = context;
    console.log('BodyTracker: Initialized with willReadFrequently=true');
  }

  async start() {
    if (this.video.readyState >= 2) {
      console.log('BodyTracker: Starting tracking immediately');
      this.setupTracking();
    } else {
      console.log('BodyTracker: Waiting for video to be ready...');
      await new Promise<void>((resolve) => {
        this.video.addEventListener('canplay', () => {
          console.log('BodyTracker: Video can now play');
          this.setupTracking();
          resolve();
        }, { once: true });
      });
    }
  }

  private setupTracking() {
    console.log('BodyTracker: Setting up tracking with dimensions:', {
      width: this.video.videoWidth,
      height: this.video.videoHeight
    });
    
    this.canvas.width = this.video.videoWidth;
    this.canvas.height = this.video.videoHeight;
    this.isTracking = true;
    this.track();
  }

  stop() {
    this.isTracking = false;
    console.log('BodyTracker: Tracking stopped');
  }

  private track() {
    if (!this.isTracking) {
      console.log('BodyTracker: Tracking stopped, exiting track loop');
      return;
    }

    try {
      this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
      const currentFrame = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      
      if (this.hasMovement(currentFrame)) {
        this.processFrame(currentFrame);
      }
      
      this.lastProcessedFrame = currentFrame;
    } catch (error) {
      console.error('BodyTracker: Error processing video frame:', error);
    }

    requestAnimationFrame(() => this.track());
  }

  private hasMovement(currentFrame: ImageData): boolean {
    if (!this.lastProcessedFrame) return true;

    const threshold = 30;
    const data1 = currentFrame.data;
    const data2 = this.lastProcessedFrame.data;
    let differences = 0;

    for (let i = 0; i < data1.length; i += 4) {
      const diff = Math.abs(data1[i] - data2[i]);
      if (diff > threshold) differences++;
    }

    return differences > (data1.length / 4) * 0.01; // 1% of pixels changed
  }

  private processFrame(imageData: ImageData) {
    const data = imageData.data;
    let movementDetected = false;

    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (brightness > 150) {
        data[i] = 255;     // Red
        data[i + 1] = 0;   // Green
        data[i + 2] = 0;   // Blue
        data[i + 3] = 255; // Alpha
        movementDetected = true;
      }
    }

    if (movementDetected) {
      this.ctx.putImageData(imageData, 0, 0);
    }
  }

  async captureFrame(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        console.log('BodyTracker: Capturing frame...');
        
        // Ensure canvas dimensions match video
        if (this.canvas.width !== this.video.videoWidth) {
          this.canvas.width = this.video.videoWidth;
          this.canvas.height = this.video.videoHeight;
        }

        // Draw current frame
        this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
        
        this.canvas.toBlob(
          (blob) => {
            if (blob && blob.size > 0) {
              console.log('BodyTracker: Frame captured successfully:', blob.size, 'bytes');
              resolve(blob);
            } else {
              const error = 'Failed to create valid blob from canvas';
              console.error('BodyTracker:', error);
              reject(new Error(error));
            }
          },
          'image/jpeg',
          0.85 // Increased quality for better analysis
        );
      } catch (error) {
        console.error('BodyTracker: Error capturing frame:', error);
        reject(error);
      }
    });
  }
}