// 语音录制服务

export interface AudioRecorderConfig {
  sampleRate?: number;
  channels?: number;
  bitDepth?: number;
  maxDuration?: number; // 最大录制时长（秒）
  minDuration?: number; // 最小录制时长（秒）
  silenceThreshold?: number; // 静音阈值
  silenceTimeout?: number; // 静音超时（毫秒）
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  volume: number;
  error?: string;
}

export interface AudioData {
  blob: Blob;
  duration: number;
  size: number;
  url: string;
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private startTime: number = 0;
  private animationFrame: number = 0;
  private silenceTimer: NodeJS.Timeout | null = null;

  private config: Required<AudioRecorderConfig>;
  private onStateChange?: (state: RecordingState) => void;
  private onDataAvailable?: (data: AudioData) => void;
  private onVolumeChange?: (volume: number) => void;

  constructor(
    config: AudioRecorderConfig = {},
    callbacks: {
      onStateChange?: (state: RecordingState) => void;
      onDataAvailable?: (data: AudioData) => void;
      onVolumeChange?: (volume: number) => void;
    } = {}
  ) {
    this.config = {
      sampleRate: 44100,
      channels: 1,
      bitDepth: 16,
      maxDuration: 300, // 5分钟
      minDuration: 1, // 1秒
      silenceThreshold: 0.01,
      silenceTimeout: 3000, // 3秒静音自动停止
      ...config,
    };

    this.onStateChange = callbacks.onStateChange;
    this.onDataAvailable = callbacks.onDataAvailable;
    this.onVolumeChange = callbacks.onVolumeChange;
  }

  // 检查浏览器支持
  static isSupported(): boolean {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.MediaRecorder &&
      window.AudioContext
    );
  }

  // 请求麦克风权限
  async requestPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('麦克风权限请求失败:', error);
      return false;
    }
  }

  // 开始录制
  async startRecording(): Promise<void> {
    try {
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        return;
      }

      // 获取音频流
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: this.config.channels,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // 创建音频上下文用于音量分析
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.microphone = this.audioContext.createMediaStreamSource(this.stream);
      this.microphone.connect(this.analyser);

      // 创建MediaRecorder
      const options: MediaRecorderOptions = {
        mimeType: this.getSupportedMimeType(),
      };

      this.mediaRecorder = new MediaRecorder(this.stream, options);
      this.chunks = [];
      this.startTime = Date.now();

      // 设置事件监听器
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.handleRecordingStop();
      };

      this.mediaRecorder.onerror = (event) => {
        this.handleError('录制过程中发生错误');
      };

      // 开始录制
      this.mediaRecorder.start(100); // 每100ms收集一次数据
      this.startVolumeMonitoring();
      this.startSilenceDetection();

      this.updateState({
        isRecording: true,
        isPaused: false,
        duration: 0,
        volume: 0,
      });

    } catch (error) {
      this.handleError('无法开始录制: ' + (error as Error).message);
    }
  }

  // 停止录制
  stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.cleanup();
  }

  // 暂停录制
  pauseRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      this.stopVolumeMonitoring();
      this.updateState({
        isRecording: false,
        isPaused: true,
        duration: this.getDuration(),
        volume: 0,
      });
    }
  }

  // 恢复录制
  resumeRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
      this.startVolumeMonitoring();
      this.updateState({
        isRecording: true,
        isPaused: false,
        duration: this.getDuration(),
        volume: 0,
      });
    }
  }

  // 获取当前录制时长
  getDuration(): number {
    if (this.startTime === 0) return 0;
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  // 获取当前状态
  getState(): RecordingState {
    return {
      isRecording: this.mediaRecorder?.state === 'recording' || false,
      isPaused: this.mediaRecorder?.state === 'paused' || false,
      duration: this.getDuration(),
      volume: 0,
    };
  }

  // 清理资源
  cleanup(): void {
    this.stopVolumeMonitoring();
    this.stopSilenceDetection();

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
    this.microphone = null;
    this.mediaRecorder = null;
  }

  // 处理录制停止
  private handleRecordingStop(): void {
    const duration = this.getDuration();
    
    if (duration < this.config.minDuration) {
      this.handleError(`录制时间太短，至少需要${this.config.minDuration}秒`);
      return;
    }

    if (this.chunks.length === 0) {
      this.handleError('没有录制到音频数据');
      return;
    }

    const blob = new Blob(this.chunks, { type: this.getSupportedMimeType() });
    const url = URL.createObjectURL(blob);

    const audioData: AudioData = {
      blob,
      duration,
      size: blob.size,
      url,
    };

    this.updateState({
      isRecording: false,
      isPaused: false,
      duration,
      volume: 0,
    });

    this.onDataAvailable?.(audioData);
  }

  // 开始音量监控
  private startVolumeMonitoring(): void {
    if (!this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateVolume = () => {
      if (!this.analyser) return;

      this.analyser.getByteFrequencyData(dataArray);
      
      // 计算平均音量
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      const volume = average / 255;

      this.onVolumeChange?.(volume);
      this.updateState({
        ...this.getState(),
        volume,
      });

      this.animationFrame = requestAnimationFrame(updateVolume);
    };

    updateVolume();
  }

  // 停止音量监控
  private stopVolumeMonitoring(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = 0;
    }
  }

  // 开始静音检测
  private startSilenceDetection(): void {
    // 实现静音检测逻辑
    // 如果音量持续低于阈值，自动停止录制
  }

  // 停止静音检测
  private stopSilenceDetection(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  // 获取支持的MIME类型
  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/mpeg',
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'audio/webm';
  }

  // 更新状态
  private updateState(state: RecordingState): void {
    this.onStateChange?.(state);
  }

  // 处理错误
  private handleError(message: string): void {
    console.error('AudioRecorder Error:', message);
    this.cleanup();
    this.updateState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      volume: 0,
      error: message,
    });
  }
}
