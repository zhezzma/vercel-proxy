# Vercel Proxy

一个基于 Vercel Edge Functions 构建的高性能请求代理服务。支持 URL 编码、错误处理、超时保护等特性。

## 特性

- ⚡️ 基于 Vercel Edge Functions，全球节点加速
- 🔄 支持所有 HTTP 方法（GET、POST、PUT、DELETE 等）
- 🌐 完整的 CORS 支持
- ⏱️ 30 秒超时保护
- 🛡️ 内置错误处理和友好提示
- 📝 支持编码后的 URL
- 🔍 URL 合法性验证

## 快速开始

### 部署到 Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/zhezzma/vercel-proxy)

### 本地开发

```bash
# 克隆项目
git clone https://github.com/zhezzma/vercel-proxy.git

# 安装依赖
npm install

# 本地运行
npm run start
```

## API 使用说明

### 基本用法

```http
GET https://your-vercel-domain.vercel.app/api?url=https://api.example.com/data
```

### 编码的 URL

```http
GET https://your-vercel-domain.vercel.app/api?url=https%3A%2F%2Fapi.example.com%2Fdata%3Fkey%3Dvalue
```

### POST 请求示例

```http
POST https://your-vercel-domain.vercel.app/api?url=https://api.example.com/submit
Content-Type: application/json

{
    "data": "example"
}
```

## 错误处理

所有错误都会返回标准的 JSON 响应：

```json
{
    "error": "错误描述信息",
    "status": 400-599
}
```

### 状态码说明

- 400 - 请求参数错误（如缺少 url 参数）
- 405 - 方法不被允许
- 502 - 目标服务器连接错误
- 504 - 请求超时

## 配置说明

代理服务的主要配置参数（在 api/index.ts 中）：

```typescript
const CONFIG = {
    TIMEOUT_MS: 30000,  // 请求超时时间（毫秒）
    MAX_REDIRECTS: 5,   // 最大重定向次数
    ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
};
```

## 安全说明

- 仅支持 http/https 协议的 URL
- 自动过滤敏感请求头
- 内置超时保护
- CORS 安全配置

## 贡献

欢迎提交 Pull Request 或创建 Issue！

## 许可证

MIT
