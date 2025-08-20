// 语音识别服务

export interface SpeechRecognitionConfig {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  grammars?: string[];
}

export interface RecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  alternatives?: Array<{
    transcript: string;
    confidence: number;
  }>;
}

export interface RecognitionState {
  isListening: boolean;
  isProcessing: boolean;
  error?: string;
  lastResult?: RecognitionResult;
}

// SpeechRecognition类型定义
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  grammars: any;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  serviceURI: string;

  // 事件处理器
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror:
    | ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any)
    | null;
  onnomatch:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any)
    | null;
  onresult:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any)
    | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;

  // 方法
  abort(): void;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

export class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private config: Required<SpeechRecognitionConfig>;
  private isInitialized = false;

  private onResult?: (result: RecognitionResult) => void;
  private onStateChange?: (state: RecognitionState) => void;
  private onError?: (error: string) => void;

  constructor(
    config: SpeechRecognitionConfig = {},
    callbacks: {
      onResult?: (result: RecognitionResult) => void;
      onStateChange?: (state: RecognitionState) => void;
      onError?: (error: string) => void;
    } = {}
  ) {
    this.config = {
      language: "zh-CN",
      continuous: true,
      interimResults: true,
      maxAlternatives: 3,
      grammars: [],
      ...config,
    };

    this.onResult = callbacks.onResult;
    this.onStateChange = callbacks.onStateChange;
    this.onError = callbacks.onError;

    this.initialize();
  }

  // 检查浏览器支持
  static isSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  // 获取支持的语言列表
  static getSupportedLanguages(): string[] {
    return [
      "zh-CN", // 中文（简体）
      "zh-TW", // 中文（繁体）
      "en-US", // 英语（美国）
      "en-GB", // 英语（英国）
      "ja-JP", // 日语
      "ko-KR", // 韩语
      "fr-FR", // 法语
      "de-DE", // 德语
      "es-ES", // 西班牙语
      "it-IT", // 意大利语
      "pt-BR", // 葡萄牙语（巴西）
      "ru-RU", // 俄语
      "ar-SA", // 阿拉伯语
      "hi-IN", // 印地语
    ];
  }

  // 初始化语音识别
  private initialize(): void {
    if (!SpeechRecognitionService.isSupported()) {
      this.handleError("浏览器不支持语音识别功能");
      return;
    }

    try {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();

      // 配置识别器
      this.recognition.lang = this.config.language;
      this.recognition.continuous = this.config.continuous;
      this.recognition.interimResults = this.config.interimResults;
      this.recognition.maxAlternatives = this.config.maxAlternatives;

      // 设置事件监听器
      this.recognition.onstart = () => {
        this.updateState({
          isListening: true,
          isProcessing: false,
        });
      };

      this.recognition.onresult = (event) => {
        this.handleResult(event);
      };

      this.recognition.onerror = (event) => {
        this.handleError(this.getErrorMessage(event.error));
      };

      this.recognition.onend = () => {
        this.updateState({
          isListening: false,
          isProcessing: false,
        });
      };

      this.recognition.onspeechstart = () => {
        this.updateState({
          isListening: true,
          isProcessing: true,
        });
      };

      this.recognition.onspeechend = () => {
        this.updateState({
          isListening: true,
          isProcessing: false,
        });
      };

      this.isInitialized = true;
    } catch (error) {
      this.handleError("语音识别初始化失败: " + (error as Error).message);
    }
  }

  // 开始语音识别
  start(): void {
    if (!this.isInitialized || !this.recognition) {
      this.handleError("语音识别未初始化");
      return;
    }

    try {
      this.recognition.start();
    } catch (error) {
      this.handleError("无法开始语音识别: " + (error as Error).message);
    }
  }

  // 停止语音识别
  stop(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  // 中止语音识别
  abort(): void {
    if (this.recognition) {
      this.recognition.abort();
    }
  }

  // 更改语言
  setLanguage(language: string): void {
    this.config.language = language;
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }

  // 获取当前状态
  getState(): RecognitionState {
    return {
      isListening: false,
      isProcessing: false,
    };
  }

  // 处理识别结果
  private handleResult(event: SpeechRecognitionEvent): void {
    const results = event.results;
    const lastResultIndex = results.length - 1;
    const lastResult = results[lastResultIndex];

    if (lastResult) {
      const transcript = lastResult[0].transcript;
      const confidence = lastResult[0].confidence;
      const isFinal = lastResult.isFinal;

      // 收集所有候选结果
      const alternatives = [];
      for (
        let i = 0;
        i < Math.min(lastResult.length, this.config.maxAlternatives);
        i++
      ) {
        alternatives.push({
          transcript: lastResult[i].transcript,
          confidence: lastResult[i].confidence,
        });
      }

      const result: RecognitionResult = {
        transcript: transcript.trim(),
        confidence,
        isFinal,
        alternatives,
      };

      this.updateState({
        isListening: true,
        isProcessing: !isFinal,
        lastResult: result,
      });

      this.onResult?.(result);
    }
  }

  // 处理错误
  private handleError(message: string): void {
    console.error("SpeechRecognition Error:", message);

    this.updateState({
      isListening: false,
      isProcessing: false,
      error: message,
    });

    this.onError?.(message);
  }

  // 获取错误消息
  private getErrorMessage(error: string): string {
    const errorMessages: Record<string, string> = {
      "no-speech": "没有检测到语音输入",
      aborted: "语音识别被中止",
      "audio-capture": "无法捕获音频",
      network: "网络错误",
      "not-allowed": "麦克风权限被拒绝",
      "service-not-allowed": "语音识别服务不可用",
      "bad-grammar": "语法错误",
      "language-not-supported": "不支持的语言",
    };

    return errorMessages[error] || `未知错误: ${error}`;
  }

  // 更新状态
  private updateState(state: Partial<RecognitionState>): void {
    this.onStateChange?.(state as RecognitionState);
  }

  // 清理资源
  cleanup(): void {
    if (this.recognition) {
      this.recognition.abort();
      this.recognition = null;
    }
    this.isInitialized = false;
  }
}

// 语音转文字的便捷函数
export async function transcribeAudio(
  audioBlob: Blob,
  config: SpeechRecognitionConfig = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    const recognition = new SpeechRecognitionService(config, {
      onResult: (result) => {
        if (result.isFinal) {
          resolve(result.transcript);
        }
      },
      onError: (error) => {
        reject(new Error(error));
      },
    });

    // 注意：Web Speech API 不能直接处理音频文件
    // 这里需要播放音频并同时进行识别
    const audio = new Audio(URL.createObjectURL(audioBlob));
    audio.play();
    recognition.start();

    audio.onended = () => {
      recognition.stop();
    };
  });
}

// 实时语音转文字
export class RealTimeSpeechRecognition {
  private recognition: SpeechRecognitionService;
  private currentTranscript = "";
  private finalTranscript = "";

  constructor(
    config: SpeechRecognitionConfig = {},
    private onTranscriptUpdate: (interim: string, final: string) => void
  ) {
    this.recognition = new SpeechRecognitionService(
      { ...config, continuous: true, interimResults: true },
      {
        onResult: this.handleResult.bind(this),
        onError: (error) => console.error("实时识别错误:", error),
      }
    );
  }

  start(): void {
    this.currentTranscript = "";
    this.finalTranscript = "";
    this.recognition.start();
  }

  stop(): void {
    this.recognition.stop();
  }

  private handleResult(result: RecognitionResult): void {
    if (result.isFinal) {
      this.finalTranscript += result.transcript + " ";
      this.currentTranscript = "";
    } else {
      this.currentTranscript = result.transcript;
    }

    this.onTranscriptUpdate(this.currentTranscript, this.finalTranscript);
  }

  getFinalTranscript(): string {
    return this.finalTranscript.trim();
  }
}
