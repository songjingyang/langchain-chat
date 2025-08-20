// ImgBB上传服务 - 超简单的免费图床服务

export interface ImgBBUploadResult {
  id: string;
  title: string;
  url_viewer: string;
  url: string;
  display_url: string;
  width: number;
  height: number;
  size: number;
  time: number;
  expiration: number;
  image: {
    filename: string;
    name: string;
    mime: string;
    extension: string;
    url: string;
  };
  thumb: {
    filename: string;
    name: string;
    mime: string;
    extension: string;
    url: string;
  };
  medium: {
    filename: string;
    name: string;
    mime: string;
    extension: string;
    url: string;
  };
  delete_url: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export class ImgBBUploader {
  private static instance: ImgBBUploader;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY || '';
    if (!this.apiKey) {
      console.warn('ImgBB API key not found. Please set NEXT_PUBLIC_IMGBB_API_KEY in your environment variables.');
    }
  }

  public static getInstance(): ImgBBUploader {
    if (!ImgBBUploader.instance) {
      ImgBBUploader.instance = new ImgBBUploader();
    }
    return ImgBBUploader.instance;
  }

  /**
   * 检查文件是否为支持的图片格式
   */
  private isImageFile(file: File): boolean {
    const supportedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/tiff'
    ];
    return supportedTypes.includes(file.type);
  }

  /**
   * 将文件转换为Base64
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // 移除data:image/jpeg;base64,前缀
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  /**
   * 上传图片到ImgBB
   */
  async uploadImage(
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<ImgBBUploadResult> {
    try {
      if (!this.apiKey) {
        throw new Error('ImgBB API key not configured');
      }

      if (!this.isImageFile(file)) {
        throw new Error('只支持图片文件上传 (jpg, png, gif, webp, bmp, tiff)');
      }

      // 检查文件大小 (ImgBB限制32MB)
      const maxSize = 32 * 1024 * 1024; // 32MB
      if (file.size > maxSize) {
        throw new Error('文件大小不能超过32MB');
      }

      // 转换为Base64
      const base64 = await this.fileToBase64(file);

      // 创建FormData
      const formData = new FormData();
      formData.append('key', this.apiKey);
      formData.append('image', base64);
      formData.append('name', file.name);

      // 使用XMLHttpRequest支持进度回调
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // 进度监听
        if (onProgress) {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress: UploadProgress = {
                loaded: event.loaded,
                total: event.total,
                percentage: Math.round((event.loaded / event.total) * 100),
              };
              onProgress(progress);
            }
          });
        }

        // 完成监听
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (response.success) {
                resolve(response.data);
              } else {
                reject(new Error(response.error?.message || '上传失败'));
              }
            } catch (error) {
              reject(new Error('响应格式错误'));
            }
          } else {
            reject(new Error(`上传失败，状态码: ${xhr.status}`));
          }
        });

        // 错误监听
        xhr.addEventListener('error', () => {
          reject(new Error('网络错误'));
        });

        // 超时监听
        xhr.addEventListener('timeout', () => {
          reject(new Error('上传超时'));
        });

        // 配置请求
        xhr.timeout = 60000; // 60秒超时
        xhr.open('POST', 'https://api.imgbb.com/1/upload');

        // 发送请求
        xhr.send(formData);
      });
    } catch (error) {
      console.error('ImgBB upload error:', error);
      throw error;
    }
  }

  /**
   * 批量上传图片
   */
  async uploadImages(
    files: File[],
    onProgress?: (fileIndex: number, progress: UploadProgress) => void,
    onFileComplete?: (fileIndex: number, result: ImgBBUploadResult) => void
  ): Promise<ImgBBUploadResult[]> {
    const results: ImgBBUploadResult[] = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const result = await this.uploadImage(files[i], (progress) => {
          onProgress?.(i, progress);
        });
        
        results.push(result);
        onFileComplete?.(i, result);
      } catch (error) {
        console.error(`Failed to upload file ${i}:`, error);
        throw error;
      }
    }

    return results;
  }

  /**
   * 删除图片（需要delete_url）
   */
  async deleteImage(deleteUrl: string): Promise<void> {
    try {
      const response = await fetch(deleteUrl, {
        method: 'GET', // ImgBB使用GET请求删除
      });

      if (!response.ok) {
        throw new Error('删除失败');
      }
    } catch (error) {
      console.error('Failed to delete image:', error);
      throw error;
    }
  }
}

// 导出单例实例
export const imgbbUploader = ImgBBUploader.getInstance();
