import { json } from '@remix-run/node';
import { authenticate } from '../shopify.server';
import { GET_PRODUCT_QUERY, UPDATE_PRICE_MUTATION, UPDATE_INVENTORY_MUTATION } from '../utils/shopifyQueries';

export async function getProductDetail(request, id) {
  const { admin } = await authenticate.admin(request);

  try {
    const response = await admin.graphql(GET_PRODUCT_QUERY, {
      variables: { id: `gid://shopify/Product/${id}` },
    });

    const { data, errors } = await response.json();
    if (errors) throw new Error(errors.map((e) => e.message).join(', '));
    if (!data.product) throw new Error('Product not found');

    const metafields = data.product.metafields.edges.reduce((acc, edge) => {
      acc[edge.node.key] = edge.node.value;
      return acc;
    }, {});

    return json({ product: data.product, metafields });
  } catch (error) {
    console.error('Product detail error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}

export async function updateProduct(request, params, formData) {
  const { id } = params;
  const { admin } = await authenticate.admin(request);

  const variantId = formData.get('variantId');
  const variantItemId = formData.get('variantItemId'); // Đã thêm vào formData
  const price = formData.get('price');
  const inventory = formData.get('inventory');
  const inventoryQuantity = formData.get('inventoryQuantity');
  const location = formData.get('location');

  const metafields = {};
  for (let [key, value] of formData.entries()) {
    if (key.startsWith('metafield_')) {
      const metafieldKey = key.replace('metafield_', '');
      metafields[metafieldKey] = value;
    }
  }

  try {
    if (!variantId || !price || !inventory || !variantItemId || !inventoryQuantity || !location) {
      throw new Error('Missing required fields');
    }

    if (isNaN(parseFloat(price))) throw new Error('Price must be a number');
    if (isNaN(variantItemId.split('/').pop())) throw new Error('inventoryItemId không đúng');
    if (isNaN(variantId.split('/').pop())) throw new Error('variantId không đúng');
    if (isNaN(location.split('/').pop())) throw new Error('location không đúng');
    if (isNaN(parseInt(inventory)) || parseInt(inventory) !== parseFloat(inventory)) {
      throw new Error('Inventory must be a whole number and Integer');
    }
    

    // Update price
    const priceUpdate = await admin.graphql(UPDATE_PRICE_MUTATION, {
      variables: {
        productId: `gid://shopify/Product/${id}`,
        variants: [{ id: `gid://shopify/ProductVariant/${variantId.split('/').pop()}`, price: parseFloat(price).toFixed(2) }],
      },
    });

  

    const inventoryUpdate = await admin.graphql(UPDATE_INVENTORY_MUTATION, {
      variables: {
        input: {
          name: 'available',
          reason: 'correction',
          quantities: [
            {
              inventoryItemId: `gid://shopify/InventoryItem/${variantItemId.split('/').pop()}`,
              locationId: `gid://shopify/Location/${location.split('/').pop()}`,
              quantity: parseInt(inventory),
              compareQuantity: parseInt(inventoryQuantity) || 0,
            },
          ],
        },
      },
    });

    const updateResult = await inventoryUpdate.json();
    if (updateResult.data.inventorySetQuantities.userErrors.length > 0) {
      console.error('Inventory update errors:', updateResult.data.inventorySetQuantities.userErrors);
    }

    const priceResult = await priceUpdate.json();
    if (priceResult.errors || updateResult.errors) throw new Error('Failed to update product');

    return json({ success: true });
  } catch (error) {
    console.error('Update error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}