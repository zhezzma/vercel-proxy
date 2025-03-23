export const config = {
  runtime: 'edge'
};

// 类型定义
type ProxyError = Error & {
  name?: string;
  message: string;
};

// 常量配置
const CONFIG = {
  TIMEOUT_MS: 30000,  // 30秒超时
  MAX_REDIRECTS: 5,   // 最大重定向次数
  ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
  DEFAULT_CORS_HEADERS: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Max-Age': '86400',
  }
};

// 错误处理函数
function createErrorResponse(message: string, status: number = 400): Response {
  const error = { error: message, status };
  return new Response(JSON.stringify(error), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CONFIG.DEFAULT_CORS_HEADERS
    }
  });
}

// URL 验证函数
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

// 超时处理函数
async function fetchWithTimeout(request: Request, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(request, {
      signal: controller.signal
    });
    clearTimeout(timeout);
    return response;
  } catch (error: unknown) {
    clearTimeout(timeout);
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
    throw new Error('Unknown error occurred');
  }
}

export default async function handler(request: Request) {
  // 处理 OPTIONS 请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: CONFIG.DEFAULT_CORS_HEADERS
    });
  }

  try {
    // 验证请求方法
    if (!CONFIG.ALLOWED_METHODS.includes(request.method)) {
      return createErrorResponse(`Method ${request.method} not allowed`, 405);
    }

    const { searchParams } = new URL(request.url);
    const encodedUrl = searchParams.get('url');

    if (!encodedUrl) {
      return createErrorResponse('Missing url parameter');
    }

    // 解码并验证 URL
    const targetUrl = decodeURIComponent(encodedUrl);
    if (!isValidUrl(targetUrl)) {
      return createErrorResponse('Invalid URL provided');
    }

    // 创建新的请求头，移除一些特殊的头部
    const headers = new Headers(request.headers);
    ['host', 'connection', 'content-length'].forEach(header => {
      headers.delete(header);
    });

    // 创建代理请求
    const proxyRequest = new Request(targetUrl, {
      method: request.method,
      headers: headers,
      body: ['GET', 'HEAD'].includes(request.method) ? null : request.body,
      redirect: 'follow',
    });

    // 发送请求并处理超时
    const response = await fetchWithTimeout(proxyRequest, CONFIG.TIMEOUT_MS);

    // 处理响应头
    const responseHeaders = new Headers(response.headers);
    Object.entries(CONFIG.DEFAULT_CORS_HEADERS).forEach(([key, value]) => {
      responseHeaders.set(key, value);
    });

    // 返回响应
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });

    return newResponse;

  } catch (error: any) {
    console.error('Proxy error:', error);
    
    // 错误分类处理
    if (error.message === 'Request timeout') {
      return createErrorResponse('Request timed out', 504);
    }
    
    if (error.message.includes('fetch failed')) {
      return createErrorResponse('Unable to reach target server', 502);
    }

    if (error instanceof TypeError) {
      return createErrorResponse('Network error occurred', 502);
    }

    return createErrorResponse(
      'An unexpected error occurred while processing your request',
      500
    );
  }
}
