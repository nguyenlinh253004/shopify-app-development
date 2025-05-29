
import { json } from '@remix-run/node';
import { useActionData, useLoaderData } from '@remix-run/react';
import { authenticate } from '../shopify.server';
import ProductsDetail from '../components/productsDetail';
import { useEffect } from 'react';
// import {  NoteIcon } from '@shopify/polaris-icons';

export async function loader({ request, params }) {
  
  const { admin } = await authenticate.admin(request);
  const { id } = params;

  try {
    const response = await admin.graphql(
      `#graphql
      query getProduct($id: ID!) {
        product(id: $id) {
          id
          title
          descriptionHtml
          createdAt
          updatedAt
          status
          featuredImage {
            url
            altText
          }
          
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
            maxVariantPrice {
              amount
              currencyCode
            }
          }
          totalInventory
          variants(first: 250) {
            edges {
              node {
                id
                selectedOptions {
                  name
                  value
                }
              media(first: 10) {
                      edges {
                        node {
                          mediaContentType
                          alt
                          ... on MediaImage {
                            image {
                              url
                            }
                          }
                        }
                      }
                    }
                createdAt
                updatedAt
                inventoryItem {
                  id   
                  inventoryLevels(first: 10) {
                    edges {
                      node {
                        id   
                         quantities(names: ["available", "incoming", "committed", "damaged", "on_hand", "quality_control", "reserved", "safety_stock"]) {
                          name
                          quantity
                        }          
                        location {
                          id
                          name
                        }
                      }
                    }
                  }
                }
              
                title
                price
                inventoryQuantity
                sku
              }
            }
          }
          metafields(first: 10) {
            edges {
              node {
                id    
                namespace
                key
                value
                type
              }
            }
          }
        }
      }`,
      {
        variables: { id: `gid://shopify/Product/${id}` },
      }
    );

    const { data, errors } = await response.json();
  // Xử lý metafields thành object dễ sử dụng
    const metafields = data.product.metafields.edges.reduce((acc, edge) => {
      acc[edge.node.key] = edge.node.value;
      return acc;
    }, {});
    if (errors) throw new Error(errors.map((e) => e.message).join(', '));
    if (!data.product) throw new Error('Product not found');

    return json({ product: data.product, metafields });
  } catch (error) {
    console.error('Product detail error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
 export async function action({ request , params }) {
  const { id } = params;
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const variantId = formData.get('variantId');
  // const variantId = formData.get('variantId');
  const variantItemId =formData.get("variantItemId");
  const price = formData.get('price');
  const inventory = formData.get('inventory');
  // console.log(variantItemId)


 const inventoryQuantity = formData.get('inventoryQuantity');
 const location = formData.get('location');
//  const inventorylevel = formData.get('inventorylevel');




  // Lấy tất cả các trường metafield từ form
  const metafields = {};
  for (let [key, value] of formData.entries()) {
    if (key.startsWith('metafield_')) {
      const metafieldKey = key.replace('metafield_', '');
      metafields[metafieldKey] = value;
    }
  }

  try {
    // Validate input
    if (!variantId || !price || !inventory || !variantItemId || !inventoryQuantity ||!location  ) {
      throw new Error('Missing required fields');
    }
    
    if (isNaN(parseFloat(price))){
      throw new Error('Price must be a number');
    }
    if(isNaN(variantItemId.split('/').pop())){
       throw new Error('inventoryItemId không đúng');
    }
    if(isNaN(variantId.split('/').pop())){
       throw new Error('variantId không đúng');
    }
    if(isNaN(location.split('/').pop())){
       throw new Error('location không đúng');
    }
    // if (isNaN(variantItemId) || isNaN(parseInt(inventoryQuantity))||isNaN(location)){
    //   throw new Error('lỗi');
    // }
    
    if (isNaN(parseInt(inventory)) || parseInt(inventory)  !== parseFloat(inventory)) { 
      throw new Error('Inventory must be a whole number and Integer');
    }

    // Update price
   const priceUpdate = await admin.graphql(
  `#graphql
 mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
  productVariantsBulkUpdate(productId: $productId, variants: $variants) {
    product {
      id
    }
    productVariants {
      id
      price
    }
    userErrors {
      field
      message
    }
  }
}`,
  {
    variables:{
      productId: `gid://shopify/Product/${id}`,
  variants: [
    {
      id: `gid://shopify/ProductVariant/${variantId.split('/').pop()}`,
     price: parseFloat(price).toFixed(2), // Ensure price is a number
    }
  ]
}

  }
);
        // Step 3: Update inventory
        const inventoryUpdate = await admin.graphql(
          `#graphql
                mutation InventorySet($input: InventorySetQuantitiesInput!) {
                inventorySetQuantities(input: $input) {
                  inventoryAdjustmentGroup {
                    createdAt
                    reason
                    changes {
                      name
                      delta
                    }
                  }
                  userErrors {
                    field
                    message
                  }
                }
              }`,
          {
            variables: {
              input: {
                name: "available",
                reason: "correction",
                // referenceDocumentUri: "logistics://custom-adjustment/script/manual-update",
                quantities: [
                {
                  inventoryItemId: `gid://shopify/InventoryItem/${variantItemId.split('/').pop()}`,
                  locationId: `gid://shopify/Location/${location.split('/').pop()}`, // Use provided location or default to first location
                  quantity: parseInt(inventory),
                  compareQuantity: parseInt(inventoryQuantity) || 0, // Use provided inventoryQuantity or default to 0
                }
              ],
              },
            },
          }
        );

        const updateResult = await inventoryUpdate.json();

        if (updateResult.data.inventorySetQuantities.userErrors.length > 0) {
          console.error("Inventory update errors:", updateResult.data.inventorySetQuantities.userErrors);
        }

    const priceResult = await priceUpdate.json();
    // const inventoryResult = await inventoryUpdate.json();

    if (priceResult.errors  || updateResult.errors) {
      throw new Error('Failed to update product');
    }

    return json({ success: true  });
  } catch (error) {
    console.error('Update error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
export default function ProductDetail() {
  const { product, error } = useLoaderData();
  const actionData = useActionData();
  // console.log('Action data:', product.metafields.edges.map((edge) => edge.node));
//  console.log(product.featuredImage.url.length)
  return (
    <div>
      {error ? (
        <div>
          <h1>Error</h1>
          <p>{error}</p>
        </div>
      ) : (
        <ProductsDetail product={product} error={error} actionData={actionData}/>
      )}
    </div>
  );
}