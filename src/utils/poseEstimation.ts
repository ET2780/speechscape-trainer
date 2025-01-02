import * as tf from '@tensorflow/tfjs';
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
      console.log('PoseEstimator: Loading PoseNet model...');
      this.net = await posenet.load({
        architecture: 'MobileNetV1',
        outputStride: 16,
        inputResolution: { width: 640, height: 480 },
        multiplier: 0.75
      });
      console.log('PoseEstimator: Model loaded successfully');
      return true;
    } catch (error) {
      console.error('PoseEstimator: Error loading model:', error);
      throw new Error('Failed to load PoseNet model');
    }
  }

  async estimatePose(video: HTMLVideoElement): Promise<posenet.Pose | null> {
    if (!this.net) {
      console.error('PoseEstimator: Model not initialized');
      return null;
    }

    try {
      const pose = await this.net.estimateSinglePose(video, {
        flipHorizontal: false
      });
      return pose;
    } catch (error) {
      console.error('PoseEstimator: Error estimating pose:', error);
      return null;
    }
  }

  drawPose(pose: posenet.Pose) {
    if (!this.ctx) return;

    // Draw keypoints
    pose.keypoints.forEach(keypoint => {
      if (keypoint.score > 0.5) {
        this.ctx!.beginPath();
        this.ctx!.arc(keypoint.position.x, keypoint.position.y, 5, 0, 2 * Math.PI);
        this.ctx!.fillStyle = 'red';
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
      this.ctx!.strokeStyle = 'blue';
      this.ctx!.stroke();
    });
  }

  detectGestures(pose: posenet.Pose): string[] {
    const gestures: string[] = [];
    const keypoints = pose.keypoints;

    // Get relevant keypoints
    const leftWrist = keypoints.find(kp => kp.part === 'leftWrist');
    const rightWrist = keypoints.find(kp => kp.part === 'rightWrist');
    const leftShoulder = keypoints.find(kp => kp.part === 'leftShoulder');
    const rightShoulder = keypoints.find(kp => kp.part === 'rightShoulder');

    // Detect hands raised
    if (leftWrist && leftShoulder && leftWrist.position.y < leftShoulder.position.y) {
      gestures.push('leftHandRaised');
    }
    if (rightWrist && rightShoulder && rightWrist.position.y < rightShoulder.position.y) {
      gestures.push('rightHandRaised');
    }

    // Detect pointing (simplified)
    if (leftWrist && rightWrist) {
      const horizontalDiff = Math.abs(leftWrist.position.x - rightWrist.position.x);
      if (horizontalDiff > 100) {
        gestures.push('pointing');
      }
    }

    return gestures;
  }

  start() {
    this.isEstimating = true;
    console.log('PoseEstimator: Started estimation');
  }

  stop() {
    this.isEstimating = false;
    console.log('PoseEstimator: Stopped estimation');
  }

  isActive(): boolean {
    return this.isEstimating;
  }
}