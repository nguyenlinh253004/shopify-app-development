import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  // useLoaderData,
} from "@remix-run/react";
import { Link } from "@shopify/polaris";
import { json } from '@remix-run/node';
export const loader = async ({ request }) => {
  return json({ title: 'Product Promotion & Stock Manager' });
};

export function ErrorBoundary({ error }) {
  console.error('ErrorBoundary caught:', error);
  //  const data = useLoaderData(); // nếu cần 
  
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Error-Product Promotion & Stock Manager </title>
        <Links />
      </head>
      <body>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h1>Có lỗi xảy ra</h1>
          <p>{error?.message || 'Đã có lỗi không xác định. Vui lòng thử lại sau.'}</p>
           <Link url="/app">Quay lại trang chủ</Link>
        </div>
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
