// ImgBB文件上传服务 - 专注于图片上传

import { imgbbUploader, ImgBBUploadResult } from "@/lib/imgbb/upload";

export interface UnifiedUploadResult {
  id: string;
  url: string;
  secure_url: string;
  public_id: string;
  format: string;
  resource_type: string;
  bytes: number;
  width?: number;
  height?: number;
  original_filename: string;
  service: "imgbb";
  raw_result: ImgBBUploadResult;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export class ImgBBUploadService {
  private static instance: ImgBBUploadService;

  public static getInstance(): ImgBBUploadService {
    if (!ImgBBUploadService.instance) {
      ImgBBUploadService.instance = new ImgBBUploadService();
    }
    return ImgBBUploadService.instance;
  }

  /**
   * 检测ImgBB服务是否可用
   */
  private checkService(): void {
    const hasImgBB = !!process.env.NEXT_PUBLIC_IMGBB_API_KEY;

    if (!hasImgBB) {
      throw new Error(
        "没有配置ImgBB服务。请配置 NEXT_PUBLIC_IMGBB_API_KEY 环境变量。"
      );
    }
  }

  /**
   * 检查文件是否为图片
   */
  private isImageFile(file: File): boolean {
    return file.type.startsWith("image/");
  }

  /**
   * 转换ImgBB结果为统一格式
   */
  private convertImgBBResult(
    result: ImgBBUploadResult,
    originalFilename: string
  ): UnifiedUploadResult {
    return {
      id: result.id,
      url: result.display_url,
      secure_url: result.display_url,
      public_id: result.id,
      format: result.image.extension,
      resource_type: "image",
      bytes: result.size,
      width: result.width,
      height: result.height,
      original_filename: originalFilename,
      service: "imgbb",
      raw_result: result,
    };
  }

  /**
   * 上传图片文件
   */
  async uploadFile(
    file: File,
    options: {
      onProgress?: (progress: UploadProgress) => void;
    } = {}
  ): Promise<UnifiedUploadResult> {
    try {
      // 检查服务配置
      this.checkService();
      
      // 检查文件类型
      if (!this.isImageFile(file)) {
        throw new Error('ImgBB 只支持图片文件上传 (jpg, png, gif, webp, bmp, tiff)');
      }

      const { onProgress } = options;
      
      // 使用ImgBB上传
      const result = await imgbbUploader.uploadImage(file, onProgress);
      return this.convertImgBBResult(result, file.name);
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  /**
   * 批量上传图片
   */
  async uploadFiles(
    files: File[],
    options: {
      onProgress?: (fileIndex: number, progress: UploadProgress) => void;
      onFileComplete?: (fileIndex: number, result: UnifiedUploadResult) => void;
    } = {}
  ): Promise<UnifiedUploadResult[]> {
    const { onProgress, onFileComplete } = options;
    const results: UnifiedUploadResult[] = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const result = await this.uploadFile(files[i], {
          onProgress: (progress) => onProgress?.(i, progress),
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
   * 删除图片
   */
  async deleteFile(result: UnifiedUploadResult): Promise<void> {
    try {
      const imgbbResult = result.raw_result as ImgBBUploadResult;
      await imgbbUploader.deleteImage(imgbbResult.delete_url);
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  }

  /**
   * 获取服务信息
   */
  getServiceInfo(): {
    available: boolean;
    service: string;
    features: string[];
  } {
    const hasImgBB = !!process.env.NEXT_PUBLIC_IMGBB_API_KEY;
    
    return {
      available: hasImgBB,
      service: 'ImgBB',
      features: [
        '仅支持图片文件',
        '配置超简单',
        '完全免费',
        '稳定可靠',
        'CDN加速',
        '无限制使用',
        '最大32MB文件'
      ]
    };
  }
}

// 导出单例实例
export const uploadService = ImgBBUploadService.getInstance();
