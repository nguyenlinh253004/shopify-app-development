
import { json } from '@remix-run/node';
import { authenticateToken } from '../middleware/authenticateToken';
import sanitizeHtml from 'sanitize-html';
export async function loader({ request }) {
  // Handle OPTIONS preflight request
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': 'https://quang-linh-ngh-an.myshopify.com',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Shopify-Hmac-Sha256, X-Shopify-Shop-Domain',
      },
    });
  }
  try {
    // Kiểm tra token/HMAC
    await authenticateToken(request);

    const url = new URL(request.url);
    let productId = url.searchParams.get('productId');
    console.log('Request received:', request.url, 'Product ID:', productId);

    
    // Sanitize productId (chỉ cho phép số)
    productId = productId ? productId.replace(/[^0-9]/g, '') : null;
    if (!productId) {
      console.log('Invalid or missing productId, returning 400');
      return json({ error: 'Invalid or missing productId' }, { status: 400 });
    }

    
    if (!productId) {
      console.log('Missing productId, returning 400');
      return json({ error: 'Missing productId' }, { status: 400 });
    }

    const promotionData = {
      promotionPrice: '99 đ',
      inventory: 50,
    };
    console.log('Returning data:', promotionData);

    // Sanitize dữ liệu đầu ra (nếu cần hiển thị HTML)
    //  cân nhắc xử lý OPTIONS là hoàn hảo.
    const sanitizedData = {
      promotionPrice: sanitizeHtml(promotionData.promotionPrice, {
        allowedTags: [],
        allowedAttributes: {},
      }),
      inventory: promotionData.inventory,
    };
    return json(sanitizedData, {
         headers: {
        'Access-Control-Allow-Origin': 'https://quang-linh-ngh-an.myshopify.com',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Shopify-Hmac-Sha256, X-Shopify-Shop-Domain',
      }
    });
  } catch (error) {
    console.error('Error in loader:', error);
    return json({ error: error.message || 'Internal Server Error' }, { status: error.status || 500 });
  }
}