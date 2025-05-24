import { 
  Page, 
  Card, 
  Layout, 
  Text, 
  Image,
  Spinner, 
  BlockStack, 
  InlineStack,
  Badge,
  Icon,
  Button,
  Divider,
  Toast,
   Frame,
  TextField
} from '@shopify/polaris';
// import { authenticate } from '../shopify.server';
import { useNavigate, useNavigation,useSubmit } from '@remix-run/react';
//  import { json } from '@remix-run/node';
import { NoteIcon } from '@shopify/polaris-icons';
 import { useState,useEffect,useCallback } from 'react';


export default function ProductsDetail({ product, error, actionData }) {
    const navigate = useNavigate();
    // const [toggle, setToggle] = useState(false);
      const [active, setActive] = useState(false);
  const toggleActive = useCallback(() => setActive((active) => !active), []);
    const navigation = useNavigation();
    const submit = useSubmit();
    const [editingVariant, setEditingVariant] = useState(null);
  const [price, setPrice] = useState('');
  const [inventory, setInventory] = useState('');
    const handleEditVariant = (variant) => {
    setEditingVariant(variant);
    setPrice(variant.price);
    setInventory(variant.inventoryQuantity.toString());
  };

  const handleCancelEdit = () => {
    setEditingVariant(null);
    setPrice('');
    setInventory('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('variantId', editingVariant.id);
    formData.append('variantItemId', editingVariant.inventoryItem.id);
    formData.append('price', price);
    formData.append('inventory', inventory);
    formData.append('inventoryQuantity', editingVariant.inventoryQuantity);
    
    submit(formData, { method: 'post' });
  };
  // Show toast after action completes

 useEffect(() => {
  if (actionData?.success || actionData?.error) {
    setActive(true);
    if (actionData?.success) { 
      setEditingVariant(null);
    }
  }
}, [actionData]);
    const formatPrice = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);    
    }  
     if (navigation.state === 'loading') {
    return (
      <Page title="Loading...">
        <Card sectioned>
          <InlineStack align="center" gap="400">
            <Spinner size="large" />
            <Text variant="bodyMd" as="span">
              Loading product details...
            </Text>
          </InlineStack>
        </Card>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title="Error">
        <Card sectioned>
          <InlineStack align="center" gap="400">
            <Icon source={ NoteIcon} tone="critical" />
            <Text variant="bodyMd" color="critical">
              {error}
            </Text>
          </InlineStack>
          <div style={{ marginTop: '16px' }}>
            <Button onClick={() => navigate('/app/products')}>
              Back to products
            </Button>
          </div>
        </Card>
      </Page>
    );
  }
   return (  
      <Frame>
    <Page
      title={product.title}
      backAction={{ content: 'Back to products', onAction: () => navigate('/app/products') }}
      secondaryActions={[
        {
          content: 'Edit',
          onAction: () => console.log('Edit clicked'), // Add your edit handler
        },
      ]}
    >
          
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <Text variant="headingMd" as="h2">
                  {product.title}
                </Text>
                <Badge tone={product.status === 'ACTIVE' ? 'success' : 'warning'}>
                  {product.status}
                </Badge>
              </InlineStack>

              {product.featuredImage ? (
                <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                  <Image
                    source={product.featuredImage.url}
                    alt={product.featuredImage.altText || product.title}
                    style={{ borderRadius: '8px', border: '1px solid #dfe3e8' }}
                    width="100%"
                  />
                </div>
              ) : (
                <div style={{
                  width: '100%',
                  maxWidth: '400px',
                  height: '300px',
                  margin: '0 auto',
                  borderRadius: '8px',
                  backgroundColor: '#f8f8f8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px dashed #dfe3e8'
                }}>
                  <Text as="span" color="subdued">
                    No product image
                  </Text>
                </div>
              )}

              <Divider />

              <BlockStack gap="200">
                <Text variant="headingSm" as="h3">Description</Text>
                {product.descriptionHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
                ) : (
                  <Text color="subdued">No description available</Text>
                )}
              </BlockStack>

              <Divider />

              <BlockStack gap="200">
                <Text variant="headingMd" as="h3">Pricing</Text>
                <InlineStack align="space-between">
                  <Text as="span" variant="headingMd">Price range:</Text>
                  <Text as="span" fontWeight="medium">
                    {formatPrice(product.priceRange.minVariantPrice.amount)}
                    {product.priceRange.minVariantPrice.amount !== product.priceRange.maxVariantPrice.amount && 
                      ` - ${formatPrice(product.priceRange.maxVariantPrice.amount)}`}
                  </Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text variant="headingMd" as="span">Total inventory:</Text>
                  <Text as="span" fontWeight="medium">
                    {product.totalInventory || 0}
                  </Text>
                </InlineStack>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section secondary>
          <Card title="Variants">
            <BlockStack gap="400">
              {product.variants?.edges?.length > 0 ? (
                product.variants.edges.map(({ node: variant }) => (
                  <Card key={variant.id} sectioned>
                     {editingVariant?.id === variant.id ? (
                    <form onSubmit={handleSubmit}>
                      <BlockStack gap="400">
                        <Text variant="headingSm" as="h3" fontWeight="medium">
                          {variant.title}
                        </Text>
                        
                        <TextField
                          label="Price"
                          type="number"
                          value={price}
                          onChange={(value) => setPrice(value)}
                          autoComplete="off"
                          step="0.01"
                          min="0"
                        />
                        
                        <TextField
                          label="Inventory"
                          type="number"
                          value={inventory}
                          onChange={(value) => setInventory(value)}
                          autoComplete="off"
                          min="0"
                        />
                        
                        <InlineStack gap="200">
                          <Button submit loading={navigation.state === 'submitting'}>
                            Save
                          </Button>
                          <Button onClick={handleCancelEdit} disabled={navigation.state === 'submitting'}>
                            Cancel
                          </Button>
                        </InlineStack>
                      </BlockStack>
                    </form>
                  ) : (
                    <BlockStack gap="200">
                      <Text variant="headingLg" as="h4" fontWeight="medium">
                        {variant.title}
                      </Text>
                      
                      <InlineStack align="space-between">
                        <Text as="span" variant="headingMd">Price:</Text>
                        <Text as="span" fontWeight="medium">
                          {formatPrice(variant.price)}
                        </Text>
                      </InlineStack>
                      
                      <InlineStack align="space-between">
                        <Text as="span" variant="headingMd">Inventory:</Text>
                        <Text as="span" fontWeight="medium">
                          {variant.inventoryQuantity}
                        </Text>
                      </InlineStack>
                      
                      {variant.sku ? (
                        <InlineStack align="space-between">
                          <Text as="span" variant="headingMd">SKU:</Text>
                          <Text as="span" fontWeight="medium">
                            {variant.sku}
                          </Text>
                        </InlineStack>
                      ): (
                        <InlineStack align="space-between">
                          <Text as="span" variant="headingMd">SKU:</Text>
                          <Text as="span" fontWeight="medium" color="subdued">
                            No SKU available
                          </Text>
                        </InlineStack>
                      )}
                      
                      {variant.weight > 0 && (
                        <InlineStack align="space-between">
                          <Text as="span">Weight:</Text>
                          <Text as="span" fontWeight="medium">
                            {variant.weight} {variant.weightUnit}
                          </Text>
                        </InlineStack>
                      )}
                       <div style={{ marginTop: '16px' }}>
                        <Button onClick={() => handleEditVariant(variant)}>
                          Update Price/Inventory
                        </Button>
                      </div>
                    </BlockStack>
                    )}
                  </Card>
                ))
              ) : (
                <Text variant="bodyMd" as="p" color="subdued">
                  No variants available
                </Text>
              )}
            </BlockStack>
          </Card>

          <Card title="Product Details" sectioned>
            <BlockStack gap="200">
              <InlineStack align="space-between">
                <Text as="span" variant="headingMd">Created:</Text>
                <Text as="span" fontWeight="medium">
                  {new Date(product.createdAt).toLocaleString()}
                </Text>
              </InlineStack>
              
              <InlineStack align="space-between">
                <Text as="span" variant="headingMd">Last updated:</Text>
                <Text as="span" fontWeight="medium">
                  {new Date(product.updatedAt).toLocaleString()}
                </Text>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
      {active && (
       <Toast content={actionData?.success ? 'Cập nhật thành công' : actionData?.error} onDismiss={toggleActive} />
        )}
    </Page>
          </Frame>
    
  );
}