import { json } from '@remix-run/node';
// import { authenticate } from '../shopify.server';
import fs from 'fs';
import path from 'path';

export async function action({ request }) {
    console.log('Received webhook request:', request.url);
  try {
        console.log('Received webhook request:', request.url);
        

    const body = await request.json();
    console.log('Webhook body:', body);
    const productId = body.webhookId || body.id;
    if (!productId) {
      return json({ error: 'Missing productId' }, { status: 400 });
    }

    // Ghi log vào file
    const logMessage = `Product deleted: ${productId} at ${new Date().toISOString()}\n`;
    console.log('Logging product deletion:', logMessage.trim());
    const logFilePath = path.join(process.cwd(), 'logs', 'product-delete.log');
    fs.appendFileSync(logFilePath, logMessage);
  
    console.log(logMessage.trim());
    // Trả về phản hồi thành công
    return json({ success: true, productId });
  } catch (error) {
   // Ghi lỗi vào file
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    const errorLogMessage = `Webhook error: ${error.message} at ${new Date().toISOString()}\n`;
    const errorLogFilePath = path.join(logsDir, 'product-delete-error.log');
    fs.appendFileSync(errorLogFilePath, errorLogMessage);
    console.error('Webhook processing error:', error);

    if (error instanceof Response) {
      throw error;
    }
    return json({ error: String(error) }, { status: 500 });
    
  }
}