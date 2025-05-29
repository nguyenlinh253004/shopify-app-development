import { json } from '@remix-run/node';
import { authenticate } from '../shopify.server';

export async function authenticateToken(request) {
  // Xử lý yêu cầu OPTIONS để tránh lỗi CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    // Kiểm tra xác thực Shopify
    const { session } = await authenticate.admin(request);
    const { shop, accessToken } = session;

    if (!shop || !accessToken) {
        console.log("Lỗi thiếu shop hoặc accessToken")
      throw new Error('Phiên không hợp lệ: Thiếu shop hoặc accessToken');
    }

    // Trả về thông tin phiên để sử dụng trong route
    return { shop, accessToken };
  } catch (error) {
    console.error('Lỗi xác thực:', error);
    return json(
      { error: 'Xác thực thất bại: Token không hợp lệ hoặc phiên hết hạn' },
      {
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}