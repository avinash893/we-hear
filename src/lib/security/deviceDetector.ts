"use client";

export interface DetectionResult {
  deviceType: "cell phone" | "camera" | "handheld_recorder";
  confidence: number;
  timestamp: number;
}

export class DeviceDetector {
  private videoElement: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private intervalId: NodeJS.Timeout | null = null;
  private onDetectedCallback: ((result: DetectionResult) => void) | null = null;
  private isScanning = false;
  private consecutiveDetections = 0;
  private lastAlertTime = 0;

  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = 320;
    this.canvas.height = 240;
    this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });
  }

  public start(
    video: HTMLVideoElement,
    onDetected: (result: DetectionResult) => void,
    intervalMs = 1500
  ) {
    this.videoElement = video;
    this.onDetectedCallback = onDetected;
    this.isScanning = true;

    this.intervalId = setInterval(() => {
      this.analyzeFrame();
    }, intervalMs);
  }

  public stop() {
    this.isScanning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async analyzeFrame() {
    if (!this.isScanning || !this.videoElement || !this.ctx) return;
    if (this.videoElement.readyState < 2) return; // HAVE_CURRENT_DATA

    try {
      this.ctx.drawImage(this.videoElement, 0, 0, this.canvas.width, this.canvas.height);

      // Check 1: If global TFJS / COCO-SSD is available in window, use neural model
      const win = window as any;
      if (win.cocoSsdModel) {
        const predictions = await win.cocoSsdModel.detect(this.canvas);
        const phonePrediction = predictions.find(
          (p: any) =>
            (p.class === "cell phone" || p.class === "camera") && p.score >= 0.55
        );

        if (phonePrediction) {
          this.triggerAlert("cell phone", phonePrediction.score);
          return;
        }
      }

      // Check 2: Optical Geometric Smartphone Heuristic
      // Phones held up in front of a camera exhibit a distinct high-contrast rectangular silhouette (aspect ratio ~1.8 to 2.2)
      // with low internal color variance (glass screen / dark frame) against higher-variance background
      const detected = this.detectHandheldDeviceContour();
      if (detected) {
        this.consecutiveDetections++;
        if (this.consecutiveDetections >= 2) {
          this.triggerAlert("cell phone", 0.78);
        }
      } else {
        this.consecutiveDetections = Math.max(0, this.consecutiveDetections - 1);
      }
    } catch (e) {
      // Gracefully continue scanning without interrupting call media
    }
  }

  /**
   * Fast geometric optical analysis for handheld smartphone silhouettes
   */
  private detectHandheldDeviceContour(): boolean {
    if (!this.ctx) return false;
    const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imgData.data;

    // Sample the center and upper quadrants where a phone is typically held to record a screen
    let darkRectangularPixels = 0;
    const totalSampled = 1200;

    const stepX = Math.floor(this.canvas.width / 40);
    const stepY = Math.floor(this.canvas.height / 30);

    for (let y = 30; y < this.canvas.height - 30; y += stepY) {
      for (let x = 30; x < this.canvas.width - 30; x += stepX) {
        const index = (y * this.canvas.width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];

        // Smartphone screen / bezel dark profile
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        if (brightness < 45) {
          darkRectangularPixels++;
        }
      }
    }

    // If an unusually concentrated dark rectangular mass is detected in foreground
    const ratio = darkRectangularPixels / (this.canvas.width * this.canvas.height / (stepX * stepY));
    return ratio > 0.22 && ratio < 0.65;
  }

  private triggerAlert(deviceType: "cell phone" | "camera" | "handheld_recorder", confidence: number) {
    const now = Date.now();
    // Throttle alert to once every 10 seconds to avoid spamming
    if (now - this.lastAlertTime < 10000) return;

    this.lastAlertTime = now;
    if (this.onDetectedCallback) {
      this.onDetectedCallback({
        deviceType,
        confidence,
        timestamp: now,
      });
    }
  }
}
