#!/usr/bin/env node

/**
 * 域名配置验证工具
 * 使用方法: node scripts/verify-domain.js your-domain.com
 */

const { execSync } = require('child_process');
const https = require('https');
const dns = require('dns').promises;

class DomainVerifier {
  constructor(domain) {
    this.domain = domain;
    this.results = {
      dns: { status: 'pending', details: [] },
      ssl: { status: 'pending', details: [] },
      http: { status: 'pending', details: [] },
      vercel: { status: 'pending', details: [] }
    };
  }

  async verifyDNS() {
    console.log('🔍 检查DNS解析...');
    
    try {
      // 检查A记录
      try {
        const addresses = await dns.resolve4(this.domain);
        this.results.dns.details.push({
          type: 'A记录',
          status: 'success',
          values: addresses,
          message: `解析到IP: ${addresses.join(', ')}`
        });
      } catch (error) {
        this.results.dns.details.push({
          type: 'A记录',
          status: 'error',
          message: '未找到A记录'
        });
      }

      // 检查CNAME记录（如果是子域名）
      if (this.domain.split('.').length > 2) {
        try {
          const cnames = await dns.resolveCname(this.domain);
          this.results.dns.details.push({
            type: 'CNAME记录',
            status: 'success',
            values: cnames,
            message: `CNAME指向: ${cnames.join(', ')}`
          });
        } catch (error) {
          this.results.dns.details.push({
            type: 'CNAME记录',
            status: 'error',
            message: '未找到CNAME记录'
          });
        }
      }

      // 检查是否指向Vercel
      const vercelIPs = ['76.76.19.19', '76.223.126.88'];
      const vercelCNAME = 'cname.vercel-dns.com';
      
      let pointsToVercel = false;
      for (const detail of this.results.dns.details) {
        if (detail.status === 'success') {
          if (detail.values) {
            if (detail.values.some(v => vercelIPs.includes(v))) {
              pointsToVercel = true;
            }
            if (detail.values.some(v => v.includes('vercel-dns.com'))) {
              pointsToVercel = true;
            }
          }
        }
      }

      this.results.dns.status = pointsToVercel ? 'success' : 'warning';
      
      if (pointsToVercel) {
        console.log('✅ DNS解析正确指向Vercel');
      } else {
        console.log('⚠️  DNS可能未正确配置或还在生效中');
      }

    } catch (error) {
      this.results.dns.status = 'error';
      this.results.dns.details.push({
        type: '解析错误',
        status: 'error',
        message: error.message
      });
      console.log('❌ DNS解析失败:', error.message);
    }
  }

  async verifySSL() {
    console.log('🔍 检查SSL证书...');
    
    return new Promise((resolve) => {
      const options = {
        hostname: this.domain,
        port: 443,
        method: 'HEAD',
        timeout: 10000
      };

      const req = https.request(options, (res) => {
        const cert = res.socket.getPeerCertificate();
        
        if (cert && cert.subject) {
          this.results.ssl.status = 'success';
          this.results.ssl.details.push({
            issuer: cert.issuer.CN,
            validFrom: cert.valid_from,
            validTo: cert.valid_to,
            subject: cert.subject.CN
          });
          console.log('✅ SSL证书有效');
          console.log(`   颁发者: ${cert.issuer.CN}`);
          console.log(`   有效期: ${cert.valid_from} - ${cert.valid_to}`);
        } else {
          this.results.ssl.status = 'warning';
          console.log('⚠️  SSL证书信息不完整');
        }
        resolve();
      });

      req.on('error', (error) => {
        this.results.ssl.status = 'error';
        this.results.ssl.details.push({ error: error.message });
        console.log('❌ SSL检查失败:', error.message);
        resolve();
      });

      req.on('timeout', () => {
        this.results.ssl.status = 'timeout';
        console.log('⏱️  SSL检查超时');
        resolve();
      });

      req.end();
    });
  }

  async verifyHTTP() {
    console.log('🔍 检查HTTP访问...');
    
    try {
      const curlCommand = `curl -I https://${this.domain} --max-time 10 -s`;
      const output = execSync(curlCommand, { encoding: 'utf8' });
      
      const lines = output.split('\n');
      const statusLine = lines[0];
      
      if (statusLine.includes('200')) {
        this.results.http.status = 'success';
        console.log('✅ HTTP访问正常');
        console.log(`   状态: ${statusLine.trim()}`);
      } else if (statusLine.includes('301') || statusLine.includes('302')) {
        this.results.http.status = 'redirect';
        console.log('🔄 HTTP重定向');
        console.log(`   状态: ${statusLine.trim()}`);
      } else {
        this.results.http.status = 'warning';
        console.log('⚠️  HTTP响应异常');
        console.log(`   状态: ${statusLine.trim()}`);
      }
      
      this.results.http.details = { statusLine, headers: lines.slice(1) };
      
    } catch (error) {
      this.results.http.status = 'error';
      this.results.http.details = { error: error.message };
      console.log('❌ HTTP访问失败:', error.message);
    }
  }

  async verifyVercel() {
    console.log('🔍 检查Vercel配置...');
    
    try {
      const output = execSync('vercel domains ls', { encoding: 'utf8' });
      
      if (output.includes(this.domain)) {
        this.results.vercel.status = 'success';
        console.log('✅ 域名已在Vercel中配置');
        
        // 提取域名状态信息
        const lines = output.split('\n');
        const domainLine = lines.find(line => line.includes(this.domain));
        if (domainLine) {
          this.results.vercel.details = { configLine: domainLine.trim() };
          console.log(`   配置: ${domainLine.trim()}`);
        }
      } else {
        this.results.vercel.status = 'error';
        console.log('❌ 域名未在Vercel中找到');
      }
      
    } catch (error) {
      this.results.vercel.status = 'error';
      this.results.vercel.details = { error: error.message };
      console.log('❌ Vercel检查失败:', error.message);
    }
  }

  generateReport() {
    console.log('\n📊 验证报告');
    console.log('=' * 50);
    
    const statusIcon = (status) => {
      switch (status) {
        case 'success': return '✅';
        case 'warning': return '⚠️ ';
        case 'error': return '❌';
        case 'timeout': return '⏱️ ';
        case 'redirect': return '🔄';
        default: return '❓';
      }
    };
    
    console.log(`DNS解析: ${statusIcon(this.results.dns.status)} ${this.results.dns.status}`);
    console.log(`SSL证书: ${statusIcon(this.results.ssl.status)} ${this.results.ssl.status}`);
    console.log(`HTTP访问: ${statusIcon(this.results.http.status)} ${this.results.http.status}`);
    console.log(`Vercel配置: ${statusIcon(this.results.vercel.status)} ${this.results.vercel.status}`);
    
    // 总体状态
    const allSuccess = Object.values(this.results).every(r => r.status === 'success' || r.status === 'redirect');
    const hasErrors = Object.values(this.results).some(r => r.status === 'error');
    
    console.log('\n🎯 总体状态:');
    if (allSuccess) {
      console.log('✅ 域名配置完全正常！');
    } else if (hasErrors) {
      console.log('❌ 域名配置存在问题，需要检查');
    } else {
      console.log('⚠️  域名配置基本正常，但有一些警告');
    }
    
    // 建议
    this.generateSuggestions();
  }

  generateSuggestions() {
    console.log('\n💡 建议:');
    
    if (this.results.dns.status === 'error' || this.results.dns.status === 'warning') {
      console.log('• 检查DNS记录是否正确配置');
      console.log('• DNS生效可能需要几分钟到几小时');
    }
    
    if (this.results.ssl.status === 'error') {
      console.log('• SSL证书可能还在申请中，请稍后再试');
    }
    
    if (this.results.http.status === 'error') {
      console.log('• 检查域名是否正确解析到Vercel');
      console.log('• 确认Vercel项目部署正常');
    }
    
    if (this.results.vercel.status === 'error') {
      console.log('• 确认域名已添加到Vercel项目');
      console.log('• 检查Vercel CLI登录状态');
    }
    
    console.log('\n🔧 故障排除命令:');
    console.log(`• nslookup ${this.domain}`);
    console.log(`• dig ${this.domain}`);
    console.log(`• curl -I https://${this.domain}`);
    console.log('• vercel domains ls');
  }

  async verify() {
    console.log(`🎯 验证域名: ${this.domain}`);
    console.log('=' * 40);
    
    await this.verifyDNS();
    await this.verifySSL();
    await this.verifyHTTP();
    await this.verifyVercel();
    
    this.generateReport();
    
    return this.results;
  }
}

// 主程序
async function main() {
  const domain = process.argv[2];
  
  if (!domain) {
    console.error('❌ 请提供域名参数');
    console.log('使用方法: node scripts/verify-domain.js your-domain.com');
    process.exit(1);
  }
  
  const verifier = new DomainVerifier(domain);
  await verifier.verify();
}

main().catch(console.error);
