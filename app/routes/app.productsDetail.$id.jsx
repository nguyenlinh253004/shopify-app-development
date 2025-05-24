
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
          variants(first: 10) {
            edges {
              node {
                id
                inventoryItem {
                  id
                }
                title
                price
                inventoryQuantity
                sku
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

    if (errors) throw new Error(errors.map((e) => e.message).join(', '));
    if (!data.product) throw new Error('Product not found');

    return json({ product: data.product });
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
  const variantItemId = formData.get('variantItemId');
  const price = formData.get('price');
  const inventory = formData.get('inventory');
 const inventoryQuantity = formData.get('inventoryQuantity');

  try {
    // Validate input
    if (!variantId || !price || !inventory) {
      throw new Error('Missing required fields');
    }
    
    if (isNaN(parseFloat(price))){
      throw new Error('Price must be a number');
    }
    
    if (isNaN(parseInt(inventory))){ 
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
    // Get inventoryItemId and locationId
    // const variantData = await admin.graphql(
    //   `#graphql
    //   query($variantId: ID!) {
    //     productVariant(id: $variantId) {
    //       id
    //       inventoryItem {
    //         id
    //         inventoryLevels(first: 10) {
    //           edges {
    //             node {
    //               id
    //               quantities(names: ["available"]) {
    //                 name
    //                 quantity
    //               }
    //               location {
    //                 id
    //                 name
    //               }
    //             }
    //           }
    //         }
    //       }
    //     }
    //   }`,
    //   {
    //     variables: {
    //       variantId: `gid://shopify/ProductVariant/${variantId.split('/').pop()}`,
    //     },
    //   }
    // );

    // const variantResult = await variantData.json();
    // if (variantResult.errors) {
    //   throw new Error('GraphQL variant query failed: ' + JSON.stringify(variantResult.errors));
    // }
    //     const inventoryItemId = variantResult.data?.productVariant?.inventoryItem?.id;
    //     const locationId =
    //       variantResult.data?.productVariant?.inventoryItem?.inventoryLevels?.edges[0]?.node?.location?.id;

    //     if (!inventoryItemId || !locationId) {
    //       throw new Error('No inventoryItemId or locationId found');
    //     }
    //     console.log('Inventory Item ID:', inventoryItemId);
    //     console.log('Location ID:', locationId);
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
                  locationId: "gid://shopify/Location/106030006592",
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

    return json({ success: true });
  } catch (error) {
    console.error('Update error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
export default function ProductDetail() {
  const { product, error } = useLoaderData();
  const actionData = useActionData();
   useEffect(() => {
   product && console.log('Product loaded:', product);
    if (error) {
      console.error('Error loading product:', error);
    }
   }, [product]);

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