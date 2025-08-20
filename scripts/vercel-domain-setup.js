#!/usr/bin/env node

/**
 * Vercel域名配置自动化脚本
 * 使用方法: node scripts/vercel-domain-setup.js your-domain.com
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 配置参数
const CONFIG = {
  // Vercel项目名称（从package.json获取或手动设置）
  projectName: process.env.VERCEL_PROJECT_NAME || 'langchain-chat',
  
  // Vercel团队ID（可选）
  teamId: process.env.VERCEL_TEAM_ID || null,
  
  // DNS提供商配置
  dnsProvider: process.env.DNS_PROVIDER || 'manual', // 'cloudflare', 'namecheap', 'manual'
};

class VercelDomainManager {
  constructor() {
    this.vercelToken = process.env.VERCEL_TOKEN;
    this.domain = process.argv[2];
    
    if (!this.domain) {
      console.error('❌ 请提供域名参数');
      console.log('使用方法: node scripts/vercel-domain-setup.js your-domain.com');
      process.exit(1);
    }
    
    this.validateEnvironment();
  }

  validateEnvironment() {
    // 检查Vercel CLI是否安装
    try {
      execSync('vercel --version', { stdio: 'ignore' });
    } catch (error) {
      console.error('❌ Vercel CLI未安装');
      console.log('请运行: npm install -g vercel');
      process.exit(1);
    }

    // 检查是否已登录
    try {
      execSync('vercel whoami', { stdio: 'ignore' });
    } catch (error) {
      console.error('❌ 请先登录Vercel');
      console.log('请运行: vercel login');
      process.exit(1);
    }
  }

  async addDomain() {
    console.log(`🚀 开始为项目 ${CONFIG.projectName} 添加域名 ${this.domain}`);
    
    try {
      // 添加域名到Vercel项目
      const command = `vercel domains add ${this.domain} ${CONFIG.projectName}${CONFIG.teamId ? ` --scope ${CONFIG.teamId}` : ''}`;
      
      console.log('📝 执行命令:', command);
      const output = execSync(command, { encoding: 'utf8' });
      console.log('✅ 域名添加成功');
      console.log(output);
      
      return true;
    } catch (error) {
      console.error('❌ 添加域名失败:', error.message);
      return false;
    }
  }

  async getDomainInfo() {
    try {
      const command = `vercel domains ls${CONFIG.teamId ? ` --scope ${CONFIG.teamId}` : ''}`;
      const output = execSync(command, { encoding: 'utf8' });
      
      console.log('📋 当前域名列表:');
      console.log(output);
      
      return output;
    } catch (error) {
      console.error('❌ 获取域名信息失败:', error.message);
      return null;
    }
  }

  generateDNSInstructions() {
    const isRootDomain = !this.domain.includes('www') && this.domain.split('.').length === 2;
    
    console.log('\n📋 DNS配置说明:');
    console.log('=' * 50);
    
    if (isRootDomain) {
      console.log(`🌐 根域名配置 (${this.domain}):`);
      console.log('类型: A');
      console.log('名称: @');
      console.log('值: 76.76.19.19');
      console.log('TTL: 3600');
      console.log('');
      console.log('类型: A');
      console.log('名称: @');
      console.log('值: 76.223.126.88');
      console.log('TTL: 3600');
      
      // 同时配置www子域名
      console.log('\n📌 建议同时配置www子域名:');
      console.log('类型: CNAME');
      console.log('名称: www');
      console.log('值: cname.vercel-dns.com');
      console.log('TTL: 3600');
    } else {
      console.log(`🌐 子域名配置 (${this.domain}):`);
      const subdomain = this.domain.split('.')[0];
      console.log('类型: CNAME');
      console.log(`名称: ${subdomain}`);
      console.log('值: cname.vercel-dns.com');
      console.log('TTL: 3600');
    }
    
    console.log('\n⚠️  重要提示:');
    console.log('1. DNS记录生效可能需要几分钟到几小时');
    console.log('2. 建议TTL设置为3600秒（1小时）');
    console.log('3. 配置完成后可使用验证命令检查状态');
  }

  async verifyDomain() {
    console.log(`\n🔍 验证域名 ${this.domain} 配置状态...`);
    
    try {
      // 检查DNS解析
      const nslookupCommand = `nslookup ${this.domain}`;
      console.log('📝 执行DNS查询:', nslookupCommand);
      const dnsOutput = execSync(nslookupCommand, { encoding: 'utf8' });
      console.log('DNS解析结果:');
      console.log(dnsOutput);
      
      // 检查HTTP访问
      const curlCommand = `curl -I https://${this.domain} --max-time 10`;
      console.log('📝 检查HTTPS访问:', curlCommand);
      try {
        const httpOutput = execSync(curlCommand, { encoding: 'utf8' });
        console.log('✅ HTTPS访问正常');
        console.log(httpOutput.split('\n')[0]); // 只显示状态行
      } catch (httpError) {
        console.log('⚠️  HTTPS访问暂时不可用（可能DNS还在生效中）');
      }
      
    } catch (error) {
      console.error('❌ 域名验证失败:', error.message);
    }
  }

  generateConfigFile() {
    const configData = {
      domain: this.domain,
      project: CONFIG.projectName,
      configuredAt: new Date().toISOString(),
      dnsRecords: this.generateDNSRecords(),
      verificationCommands: [
        `nslookup ${this.domain}`,
        `curl -I https://${this.domain}`,
        `vercel domains ls`
      ]
    };
    
    const configPath = path.join(process.cwd(), 'vercel-domain-config.json');
    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
    
    console.log(`\n📄 配置文件已保存: ${configPath}`);
  }

  generateDNSRecords() {
    const isRootDomain = !this.domain.includes('www') && this.domain.split('.').length === 2;
    
    if (isRootDomain) {
      return [
        { type: 'A', name: '@', value: '76.76.19.19', ttl: 3600 },
        { type: 'A', name: '@', value: '76.223.126.88', ttl: 3600 },
        { type: 'CNAME', name: 'www', value: 'cname.vercel-dns.com', ttl: 3600 }
      ];
    } else {
      const subdomain = this.domain.split('.')[0];
      return [
        { type: 'CNAME', name: subdomain, value: 'cname.vercel-dns.com', ttl: 3600 }
      ];
    }
  }

  async run() {
    console.log('🎯 Vercel域名配置工具');
    console.log('=' * 30);
    
    // 1. 添加域名
    const success = await this.addDomain();
    if (!success) {
      console.log('❌ 域名添加失败，请检查配置');
      return;
    }
    
    // 2. 显示DNS配置说明
    this.generateDNSInstructions();
    
    // 3. 生成配置文件
    this.generateConfigFile();
    
    // 4. 显示后续步骤
    console.log('\n📋 后续步骤:');
    console.log('1. 在您的域名注册商处配置上述DNS记录');
    console.log('2. 等待DNS生效（通常需要几分钟到几小时）');
    console.log(`3. 运行验证命令: node scripts/vercel-domain-setup.js ${this.domain} --verify`);
    console.log('4. 访问您的域名检查是否正常工作');
    
    console.log('\n✅ 域名配置完成！');
  }

  async verify() {
    await this.verifyDomain();
    await this.getDomainInfo();
  }
}

// 主程序
async function main() {
  const manager = new VercelDomainManager();
  
  // 检查是否是验证模式
  if (process.argv.includes('--verify')) {
    await manager.verify();
  } else {
    await manager.run();
  }
}

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的Promise拒绝:', reason);
  process.exit(1);
});

// 运行主程序
main().catch(console.error);
