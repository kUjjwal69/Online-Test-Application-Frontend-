import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, interval, Subscription } from 'rxjs';
import { ScreenshotRequest, ViolationRequest, ViolationType, VideoChunkRequest } from '../../shared/models/models';
import { API_ENDPOINTS } from '../config/api-endpoints';

@Injectable({ providedIn: 'root' })
export class ProctoringService {
  private readonly proctoringApiUrl = API_ENDPOINTS.proctoring;

  private screenshotSub?: Subscription;
  private statusPollSub?: Subscription;
  private mediaRecorder?: MediaRecorder;
  private screenStream?: MediaStream;
  private webcamStream?: MediaStream;
  private chunkIndex = 0;

  public violationDetected$ = new Subject<{ type: ViolationType; description: string }>();
  public sessionSuspended$ = new Subject<string>();

  constructor(private http: HttpClient, private ngZone: NgZone) {}

  // ─── Screenshot ────────────────────────────────────────────────────
  sendScreenshot(request: ScreenshotRequest): Observable<void> {
    return this.http.post<void>(`${this.proctoringApiUrl}/screenshot`, request);
  }

  // ─── Violations ────────────────────────────────────────────────────
  logViolation(request: ViolationRequest): Observable<{ violationCount: number; isSuspended: boolean; suspendReason?: string }> {
    return this.http.post<any>(`${this.proctoringApiUrl}/violation`, request);
  }

  // ─── Video Chunks ──────────────────────────────────────────────────
  sendVideoChunk(request: VideoChunkRequest): Observable<void> {
    return this.http.post<void>(`${this.proctoringApiUrl}/video-chunk`, request);
  }

  // ─── Auto Screenshot ───────────────────────────────────────────────
  startAutoScreenshot(sessionId: string, intervalSeconds: number): void {
    this.screenshotSub = interval(intervalSeconds * 1000).subscribe(() => {
      this.captureScreenshot(sessionId);
    });
  }

  stopAutoScreenshot(): void {
    this.screenshotSub?.unsubscribe();
  }

  private captureScreenshot(sessionId: string): void {
    if (this.screenStream) {
      const video = document.createElement('video');
      const track = this.screenStream.getVideoTracks()[0];
      const imageCapture = new (window as any).ImageCapture(track);
      imageCapture.grabFrame().then((bitmap: ImageBitmap) => {
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(bitmap, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
        this.sendScreenshot({ sessionId, imageBase64: base64, capturedAt: new Date().toISOString() }).subscribe();
      }).catch(() => {
        // Fallback: capture visible area via canvas
        this.captureViaCanvas(sessionId);
      });
    } else {
      this.captureViaCanvas(sessionId);
    }
  }

  private captureViaCanvas(sessionId: string): void {
    const canvas = document.createElement('canvas');
    canvas.width = window.screen.width;
    canvas.height = window.screen.height;
    const base64 = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
    if (base64) {
      this.sendScreenshot({ sessionId, imageBase64: base64, capturedAt: new Date().toISOString() }).subscribe();
    }
  }

  // ─── Violation Listeners ───────────────────────────────────────────
  setupViolationListeners(sessionId: string): void {
    document.addEventListener('visibilitychange', this.onVisibilityChange.bind(this, sessionId));
    window.addEventListener('blur', this.onWindowBlur.bind(this, sessionId));
    document.addEventListener('fullscreenchange', this.onFullscreenChange.bind(this, sessionId));
    document.addEventListener('contextmenu', this.onContextMenu.bind(this, sessionId));
    document.addEventListener('keydown', this.onKeydown.bind(this, sessionId));
  }

  removeViolationListeners(sessionId: string): void {
    document.removeEventListener('visibilitychange', this.onVisibilityChange.bind(this, sessionId));
    window.removeEventListener('blur', this.onWindowBlur.bind(this, sessionId));
    document.removeEventListener('fullscreenchange', this.onFullscreenChange.bind(this, sessionId));
    document.removeEventListener('contextmenu', this.onContextMenu.bind(this, sessionId));
    document.removeEventListener('keydown', this.onKeydown.bind(this, sessionId));
  }

  private onVisibilityChange(sessionId: string): void {
    if (document.visibilityState === 'hidden') {
      this.ngZone.run(() => {
        this.violationDetected$.next({ type: 'TabSwitch', description: 'Candidate switched tab or minimized window.' });
        this.logViolation({ sessionId, violationType: 'TabSwitch', description: 'Candidate switched tab/window', occurredAt: new Date().toISOString() })
          .subscribe(res => this.checkSuspension(res));
      });
    }
  }

  private onWindowBlur(sessionId: string): void {
    this.ngZone.run(() => {
      this.violationDetected$.next({ type: 'WindowBlur', description: 'Candidate moved focus away from exam window.' });
      this.logViolation({ sessionId, violationType: 'WindowBlur', description: 'Window lost focus', occurredAt: new Date().toISOString() })
        .subscribe(res => this.checkSuspension(res));
    });
  }

  private onFullscreenChange(sessionId: string): void {
    if (!document.fullscreenElement) {
      this.ngZone.run(() => {
        this.violationDetected$.next({ type: 'FullscreenExit', description: 'Candidate exited fullscreen mode.' });
        this.logViolation({ sessionId, violationType: 'FullscreenExit', description: 'Exited fullscreen', occurredAt: new Date().toISOString() })
          .subscribe(res => this.checkSuspension(res));
      });
    }
  }

  private onContextMenu(sessionId: string, e: Event): void {
    e.preventDefault();
    this.ngZone.run(() => {
      this.violationDetected$.next({ type: 'ContextMenu', description: 'Candidate attempted right-click.' });
      this.logViolation({ sessionId, violationType: 'ContextMenu', description: 'Right-click attempted', occurredAt: new Date().toISOString() })
        .subscribe(res => this.checkSuspension(res));
    });
  }

  private onKeydown(sessionId: string, e: KeyboardEvent): void {
    const forbidden = (e.ctrlKey && ['c', 'v', 'a', 'u', 's', 'p'].includes(e.key.toLowerCase()))
      || e.key === 'F12' || e.key === 'PrintScreen';
    if (forbidden) {
      e.preventDefault();
      this.ngZone.run(() => {
        this.violationDetected$.next({ type: 'KeyboardShortcut', description: `Forbidden key: ${e.key}` });
        this.logViolation({ sessionId, violationType: 'KeyboardShortcut', description: `Key: ${e.key}`, occurredAt: new Date().toISOString() })
          .subscribe(res => this.checkSuspension(res));
      });
    }
  }

  private checkSuspension(res: { isSuspended: boolean; suspendReason?: string }): void {
    if (res?.isSuspended) {
      this.sessionSuspended$.next(res.suspendReason || 'Session suspended due to violations.');
    }
  }

  // ─── Media Recording ───────────────────────────────────────────────
  async startScreenRecording(sessionId: string): Promise<void> {
    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      this.startRecording(this.screenStream, sessionId, 'screen');
    } catch (err) {
      console.warn('Screen recording not available:', err);
    }
  }

  async startWebcamRecording(sessionId: string): Promise<void> {
    try {
      this.webcamStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      this.startRecording(this.webcamStream, sessionId, 'webcam');
    } catch (err) {
      console.warn('Webcam recording not available:', err);
    }
  }

  private startRecording(stream: MediaStream, sessionId: string, source: 'screen' | 'webcam'): void {
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8' });
    let index = 0;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          this.sendVideoChunk({ sessionId, chunkIndex: index++, videoBase64: base64, sourceType: source, capturedAt: new Date().toISOString() }).subscribe();
        };
        reader.readAsDataURL(event.data);
      }
    };
    recorder.start(30000); // 30-second chunks
    this.mediaRecorder = recorder;
  }

  stopRecording(): void {
    this.mediaRecorder?.stop();
    this.screenStream?.getTracks().forEach(t => t.stop());
    this.webcamStream?.getTracks().forEach(t => t.stop());
  }

  // ─── Fullscreen ────────────────────────────────────────────────────
  enterFullscreen(): void {
    document.documentElement.requestFullscreen().catch(() => {});
  }

  exitFullscreen(): void {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }

  cleanup(): void {
    this.stopAutoScreenshot();
    this.stopRecording();
    this.statusPollSub?.unsubscribe();
  }
}
