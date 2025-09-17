// SEO 性能优化工具

export interface PerformanceMetrics {
  fcp: number // First Contentful Paint
  lcp: number // Largest Contentful Paint
  fid: number // First Input Delay
  cls: number // Cumulative Layout Shift
  ttfb: number // Time to First Byte
}

export interface SEOPerformanceConfig {
  enablePreloading: boolean
  enablePrefetching: boolean
  optimizeImages: boolean
  enableCompression: boolean
  enableCaching: boolean
}

// 预加载关键资源
export function preloadCriticalResources() {
  if (typeof window === 'undefined') return

  // 预加载关键字体
  const fontPreloads = [
    '/fonts/geist-sans.woff2',
    '/fonts/geist-mono.woff2'
  ]

  fontPreloads.forEach(font => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = font
    link.as = 'font'
    link.type = 'font/woff2'
    link.crossOrigin = 'anonymous'
    document.head.appendChild(link)
  })

  // 预加载关键图片
  const imagePreloads = [
    '/og-image.png',
    '/favicon.svg'
  ]

  imagePreloads.forEach(image => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = image
    link.as = 'image'
    document.head.appendChild(link)
  })
}

// 预获取下一页资源
export function prefetchNextPageResources(urls: string[]) {
  if (typeof window === 'undefined') return

  urls.forEach(url => {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = url
    document.head.appendChild(link)
  })
}

// 监控 Core Web Vitals
export function monitorCoreWebVitals(): Promise<PerformanceMetrics> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve({
        fcp: 0,
        lcp: 0,
        fid: 0,
        cls: 0,
        ttfb: 0
      })
      return
    }

    const metrics: Partial<PerformanceMetrics> = {}

    // 监控 FCP
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint')
      if (fcpEntry) {
        metrics.fcp = fcpEntry.startTime
      }
    }).observe({ entryTypes: ['paint'] })

    // 监控 LCP
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      if (lastEntry) {
        metrics.lcp = lastEntry.startTime
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] })

    // 监控 FID
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const firstEntry = entries[0]
      if (firstEntry) {
        metrics.fid = firstEntry.processingStart - firstEntry.startTime
      }
    }).observe({ entryTypes: ['first-input'] })

    // 监控 CLS
    let clsValue = 0
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as PerformanceEntry & { hadRecentInput?: boolean }).hadRecentInput) {
          clsValue += (entry as PerformanceEntry & { value: number }).value
        }
      }
      metrics.cls = clsValue
    }).observe({ entryTypes: ['layout-shift'] })

    // 获取 TTFB
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigationEntry) {
      metrics.ttfb = navigationEntry.responseStart - navigationEntry.requestStart
    }

    // 延迟返回结果，确保所有指标都被收集
    setTimeout(() => {
      resolve({
        fcp: metrics.fcp || 0,
        lcp: metrics.lcp || 0,
        fid: metrics.fid || 0,
        cls: metrics.cls || 0,
        ttfb: metrics.ttfb || 0
      })
    }, 3000)
  })
}

// 优化图片加载
export function optimizeImageLoading() {
  if (typeof window === 'undefined') return

  // 使用 Intersection Observer 实现懒加载
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement
        if (img.dataset.src) {
          img.src = img.dataset.src
          img.removeAttribute('data-src')
          imageObserver.unobserve(img)
        }
      }
    })
  })

  // 观察所有带有 data-src 的图片
  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img)
  })
}

// 生成性能报告
export function generatePerformanceReport(metrics: PerformanceMetrics) {
  const report = {
    timestamp: new Date().toISOString(),
    metrics,
    scores: {
      fcp: metrics.fcp < 1800 ? 'good' : metrics.fcp < 3000 ? 'needs-improvement' : 'poor',
      lcp: metrics.lcp < 2500 ? 'good' : metrics.lcp < 4000 ? 'needs-improvement' : 'poor',
      fid: metrics.fid < 100 ? 'good' : metrics.fid < 300 ? 'needs-improvement' : 'poor',
      cls: metrics.cls < 0.1 ? 'good' : metrics.cls < 0.25 ? 'needs-improvement' : 'poor',
      ttfb: metrics.ttfb < 800 ? 'good' : metrics.ttfb < 1800 ? 'needs-improvement' : 'poor'
    },
    recommendations: []
  }

  // 生成优化建议
  if (report.scores.fcp !== 'good') {
    report.recommendations.push('优化首次内容绘制时间：减少阻塞渲染的资源')
  }
  if (report.scores.lcp !== 'good') {
    report.recommendations.push('优化最大内容绘制时间：优化图片和字体加载')
  }
  if (report.scores.fid !== 'good') {
    report.recommendations.push('优化首次输入延迟：减少主线程阻塞')
  }
  if (report.scores.cls !== 'good') {
    report.recommendations.push('优化累积布局偏移：为图片和广告预留空间')
  }
  if (report.scores.ttfb !== 'good') {
    report.recommendations.push('优化首字节时间：优化服务器响应时间')
  }

  return report
}

// 默认性能配置
export const defaultPerformanceConfig: SEOPerformanceConfig = {
  enablePreloading: true,
  enablePrefetching: true,
  optimizeImages: true,
  enableCompression: true,
  enableCaching: true
}
