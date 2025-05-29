import { Card } from '@shopify/polaris';
import { json } from '@remix-run/node';
import {  useActionData, useLoaderData } from '@remix-run/react';
import { authenticate } from '../shopify.server';
import { ProductsTable } from '../components/ProductsTable';
// import {authenticateToken} from '../middleware/checkToken'
export async function loader({ request }) {
  // throw new Error('Lỗi test từ loader'); 
//  const token=   await authenticateToken(request);
//    if(!token){
//      console.log("lỗi thiếu accesstoken");
//    }
  const { admin,session } = await authenticate.admin(request);
  console.log(session)
     const {shop,accessToken} = session;
     if (!shop || !accessToken) {
       console.log("lỗi thiếu accesstoken");
      throw new Error('Phiên không hợp lệ: Thiếu shop hoặc accessToken');
    }
  const response = await admin.graphql(
    `#graphql
    query($first: Int, $sortKey: ProductSortKeys, $reverse: Boolean) {
      products(first: $first, sortKey: $sortKey, reverse: $reverse) {
        edges {
          node {
            id
            title
            createdAt
            featuredImage { url }
          }
          cursor
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
    }`,
    {
      variables: {
        first: 5,
        sortKey: 'TITLE',
        reverse: false,
      },
    }
  );

  const { data, errors } = await response.json();
  if (errors) throw new Error(errors.map((e) => e.message).join(', '));

  return json({
    products: data.products.edges.map((edge) => edge.node),
    pageInfo: data.products.pageInfo,
  });
}

export async function action({ request }) {
  try {
    const { admin } = await authenticate.admin(request);
    const formData = await request.formData();

    const searchQuery = formData.get('searchQuery') || '';
    const cursor = formData.get('cursor') || null;
    const actionType = formData.get('actionType');
    const sortKey = formData.get('sortKey') || 'TITLE';
    const reverse = formData.get('reverse') === 'true';
    const variables = {
      sortKey,
      reverse,
    };
    
    if (actionType === 'loadMore') {
      variables.first = 5;
      variables.after = cursor;
    }
    if (actionType === 'loadPrevious') {
      variables.last = 5;
      variables.before = cursor;
    }
    else {
      variables.first = 5;
    }
    
    if (searchQuery) {
      variables.query = `title:*${searchQuery}*`;
    }

    const response = await admin.graphql(
      `#graphql
      query($first: Int, $last: Int, $after: String, $before: String, $query: String, $sortKey: ProductSortKeys, $reverse: Boolean) {
        products(first: $first, last: $last, after: $after, before: $before, query: $query, sortKey: $sortKey, reverse: $reverse) {
          edges {
            node {
              id
              title
              createdAt
              featuredImage { url }
            }
            cursor
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
        }
      }`,
      {
        variables
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
    }

    let result;
    try {
      result = await response.json();
    } catch (jsonError) {
      throw new Error('Failed to parse API response as JSON');
    }

    const { data, errors } = result;
    if (errors) {
      throw new Error(errors.map((e) => e.message).join(', '));
    }
    if (!data || !data.products) {
      throw new Error('No products data returned from API');
    }

    return json({
      products: data.products.edges.map((edge) => edge.node),
      pageInfo: data.products.pageInfo,
      searchQuery,
      actionType,
      sortConfig: { key: sortKey, direction: reverse ? 'DESC' : 'ASC' },
    });
  } catch (error) {
    console.error('Action error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}

export default function AdminProducts() {
  const loaderData = useLoaderData();
  const actionData = useActionData();

  return (
  
      <ProductsTable
        products={actionData?.products || loaderData.products}
        pageInfo={actionData?.pageInfo || loaderData.pageInfo}
        searchTerm={actionData?.searchQuery || ''}
        sortConfig={actionData?.sortConfig || { key: 'TITLE', direction: 'ASC' }}
        error={actionData?.error}
      />

  );
}