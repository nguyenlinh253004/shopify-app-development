export const GET_PRODUCT_QUERY = `#graphql
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
  }
`;

export const UPDATE_PRICE_MUTATION = `#graphql
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
  }
`;

export const UPDATE_INVENTORY_MUTATION = `#graphql
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
  }
`;