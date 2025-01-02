import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as posenet from '@tensorflow-models/posenet';

export class PoseEstimator {
  private net: posenet.PoseNet | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private isEstimating: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get canvas context');
    this.ctx = context;
    console.log('PoseEstimator: Initialized with canvas context');
  }

  async initialize() {
    try {
      console.log('PoseEstimator: Setting up TensorFlow backend...');
      
      // First, explicitly set and initialize the WebGL backend
      await tf.setBackend('webgl');
      await tf.ready();
      console.log('PoseEstimator: TensorFlow backend initialized:', tf.getBackend());

      // Configure and load PoseNet with optimal settings for real-time processing
      console.log('PoseEstimator: Loading PoseNet model...');
      this.net = await posenet.load({
        architecture: 'MobileNetV1',
        outputStride: 16,
        inputResolution: { width: 640, height: 480 },
        multiplier: 0.75,
        quantBytes: 2
      });
      
      this.isEstimating = true;
      console.log('PoseEstimator: Model loaded successfully');
      return true;
    } catch (error) {
      console.error('PoseEstimator: Error during initialization:', error);
      throw new Error('Failed to initialize PoseNet model');
    }
  }

  async estimatePose(video: HTMLVideoElement): Promise<posenet.Pose | null> {
    if (!this.net || !this.isEstimating) {
      console.error('PoseEstimator: Model not initialized or estimation stopped');
      return null;
    }

    try {
      // Ensure video dimensions are set
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.error('PoseEstimator: Video dimensions not ready');
        return null;
      }

      console.log('PoseEstimator: Estimating pose from video frame');
      const pose = await this.net.estimateSinglePose(video, {
        flipHorizontal: false
      });
      
      console.log('PoseEstimator: Pose estimated:', {
        score: pose.score,
        keypoints: pose.keypoints.length
      });
      
      return pose;
    } catch (error) {
      console.error('PoseEstimator: Error estimating pose:', error);
      return null;
    }
  }

  drawPose(pose: posenet.Pose) {
    if (!this.ctx) return;

    // Clear previous drawings
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    // Draw keypoints
    pose.keypoints.forEach(keypoint => {
      if (keypoint.score > 0.5) {
        this.ctx!.beginPath();
        this.ctx!.arc(keypoint.position.x, keypoint.position.y, 5, 0, 2 * Math.PI);
        this.ctx!.fillStyle = 'rgba(255, 0, 0, 0.7)';
        this.ctx!.fill();
      }
    });

    // Draw skeleton
    const adjacentKeyPoints = posenet.getAdjacentKeyPoints(
      pose.keypoints,
      0.5
    );

    adjacentKeyPoints.forEach(([from, to]) => {
      this.ctx!.beginPath();
      this.ctx!.moveTo(from.position.x, from.position.y);
      this.ctx!.lineTo(to.position.x, to.position.y);
      this.ctx!.lineWidth = 2;
      this.ctx!.strokeStyle = 'rgba(0, 0, 255, 0.7)';
      this.ctx!.stroke();
    });
  }

  detectGestures(pose: posenet.Pose): string[] {
    const gestures: string[] = [];
    const keypoints = pose.keypoints;

    // Get relevant keypoints for gesture detection
    const leftWrist = keypoints.find(kp => kp.part === 'leftWrist');
    const rightWrist = keypoints.find(kp => kp.part === 'rightWrist');
    const leftShoulder = keypoints.find(kp => kp.part === 'leftShoulder');
    const rightShoulder = keypoints.find(kp => kp.part === 'rightShoulder');
    const leftElbow = keypoints.find(kp => kp.part === 'leftElbow');
    const rightElbow = keypoints.find(kp => kp.part === 'rightElbow');

    if (!leftWrist || !rightWrist || !leftShoulder || !rightShoulder || !leftElbow || !rightElbow) {
      console.log('PoseEstimator: Missing required keypoints for gesture detection');
      return gestures;
    }

    // Detect hands raised above shoulders
    if (leftWrist.position.y < leftShoulder.position.y - 100) {
      console.log('PoseEstimator: Detected left hand raised');
      gestures.push('leftHandRaised');
    }
    if (rightWrist.position.y < rightShoulder.position.y - 100) {
      console.log('PoseEstimator: Detected right hand raised');
      gestures.push('rightHandRaised');
    }

    // Detect pointing gestures based on arm extension
    const isLeftArmExtended = this.calculateArmExtension(leftShoulder, leftElbow, leftWrist) > 0.8;
    const isRightArmExtended = this.calculateArmExtension(rightShoulder, rightElbow, rightWrist) > 0.8;

    if (isLeftArmExtended || isRightArmExtended) {
      console.log('PoseEstimator: Detected pointing gesture');
      gestures.push('pointing');
    }

    // Detect open palm gestures
    if (leftWrist.position.y < leftElbow.position.y || rightWrist.position.y < rightElbow.position.y) {
      console.log('PoseEstimator: Detected open palm gesture');
      gestures.push('openPalm');
    }

    return gestures;
  }

  private calculateArmExtension(
    shoulder: posenet.Keypoint,
    elbow: posenet.Keypoint,
    wrist: posenet.Keypoint
  ): number {
    const upperArmLength = this.distance(shoulder.position, elbow.position);
    const forearmLength = this.distance(elbow.position, wrist.position);
    const totalExtension = this.distance(shoulder.position, wrist.position);
    
    return totalExtension / (upperArmLength + forearmLength);
  }

  private distance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }

  start() {
    this.isEstimating = true;
    console.log('PoseEstimator: Started estimation');
  }

  stop() {
    this.isEstimating = false;
    console.log('PoseEstimator: Stopped estimation');
    // Clean up TensorFlow resources
    tf.disposeVariables();
  }

  isActive(): boolean {
    return this.isEstimating;
  }
}