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
  TextField,
  Select
} from '@shopify/polaris';
import { useNavigate, useNavigation, useSubmit, useFetcher, useRevalidator } from '@remix-run/react';
import { NoteIcon } from '@shopify/polaris-icons';
import { useState, useEffect, useCallback } from 'react';
import { formatPrice, getColorOptions } from '../utils/productUtils';
import {getAllMedia} from '../utils/mediaImage';
// import { color } from 'chart.js/helpers';
// import { use } from 'react';

export default function ProductsDetail({ product, error, actionData }) {
  const navigate = useNavigate();
  const [active, setActive] = useState(false);
  const fetcher = useFetcher();
  const revalidator = useRevalidator();
  const toggleActive = useCallback(() => setActive((active) => !active), []);
  const navigation = useNavigation();
  const [editingVariant, setEditingVariant] = useState(null);
  const [price, setPrice] = useState('');
  const [inventory, setInventory] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
 const [inventoryQuantity,setInventoryQuantity] = useState('');

  const [selectedColor, setSelectedColor] = useState(null);

const productMedia = getAllMedia(product);
  // Hàm lọc variants theo màu được chọn
  const getFilteredVariants = () => {
    if (!selectedColor) return product.variants?.edges || [];
    
    return product.variants.edges.filter(({ node: variant }) => {
      const colorOption = variant.selectedOptions.find(opt => 
        opt.name.toLowerCase() === 'color' && opt.value === selectedColor
      );
      return !!colorOption;
    });
  };

   const colorOptions = getColorOptions(product.variants);
  const filteredVariants = getFilteredVariants();

  const handleEditVariant = (variant) => {
    setEditingVariant(variant);
    setPrice(variant.price);
    
    const firstLocation = variant.inventoryItem.inventoryLevels.edges[0]?.node;
    if (firstLocation) {
      setSelectedLocationId(firstLocation.location.id);
      console.log(selectedLocationId)
      const availableQuantity = firstLocation.quantities.find(q => q.name === "available")?.quantity || 0;
      setInventory(availableQuantity);
      setInventoryQuantity(availableQuantity);
    }
  };

  const handleCancelEdit = () => {
    setEditingVariant(null);
    setPrice('');
    setInventory('');
    setSelectedLocationId('');
  }

  const handleLocationChange = (locationId) => {
    setSelectedLocationId(locationId);
    console.log(selectedLocationId)
    if (!editingVariant) return;

    const selectedLevel = editingVariant.inventoryItem.inventoryLevels.edges.find(
      (edge) => edge.node.location.id === locationId
    );

    if (selectedLevel) {
      const availableQuantity = selectedLevel.node.quantities.find(q => q.name === "available")?.quantity || 0;
      setInventory(availableQuantity);
      setInventoryQuantity(availableQuantity);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('variantId', editingVariant.id);
    formData.append('variantItemId', editingVariant.inventoryItem.id);
    formData.append('price', price);
    formData.append('inventory', inventory);
    formData.append('inventoryQuantity', inventoryQuantity);
    formData.append('location', selectedLocationId);
    formData.append('inventorylevel', editingVariant.inventoryItem.inventoryLevels.edges[0]?.node.id || '');
    
    fetcher.submit(formData, { method: 'post', preventScrollReset: true });
  };

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data?.success) {
      setActive(true);
      setEditingVariant(null);
      revalidator.revalidate();
    } else if (fetcher.state === 'idle' && fetcher.data?.error) {
      setActive(true);
    }
  }, [fetcher.state, fetcher.data]);


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
            <Icon source={NoteIcon} tone="critical" />
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
            onAction: () => console.log('Edit clicked'),
          },
        ]}
      >
        <Layout>
          {/* Phần ảnh và variants trên cùng một hàng */}
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

                <InlineStack align="start" gap="400" blockAlign="start">
                  {/* Phần ảnh sản phẩm và mô tả */}
                  <div style={{ flex: '0 0 500px'  }}>
                    {product.featuredImage ? (
                      <Image
                        source={product.featuredImage.url}
                        alt={product.featuredImage.altText || product.title}
                        style={{ borderRadius: '8px', border: '1px solid #dfe3e8' }}
                        width="100%"
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '300px',
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
                     {/* Gallery từ variant media */}
                      {productMedia.length > 0 && (
                        <div style={{ marginBottom: '16px' }}>
                          <Text variant="headingSm" as="h4">Product Gallery</Text>
                          <div style={{ 
                            display: 'flex',
                            gap: '16px',
                            overflowX: 'auto',
                            padding: '8px 0'
                          }}>
                            {productMedia.map((media, index) => (
                              <div key={index} style={{ flex: '0 0 auto', width: '150px' }}>
                                <Image
                                  source={media.url}
                                  alt={media.alt}
                                  style={{ 
                                    borderRadius: '8px', 
                                    border: '1px solid #dfe3e8',
                                    width: '100%',
                                    height: 'auto'
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    {/* Phần mô tả sản phẩm */}
                    <div style={{ marginTop: "20px", width: '100%' }}>
                      <BlockStack gap="200">
                        <Text variant="headingLg" as="h3">Description</Text>
                        {product.descriptionHtml ? (
                          <div 
                            style={{ 
                              maxWidth: '100%',
                              overflow: 'hidden',
                              wordBreak: 'break-word',
                        
                            }}
                            dangerouslySetInnerHTML={{ 
                              __html: `
                                <style>
                                  img { max-width: 100%; height: auto; }
                                  iframe, video { max-width: 100%; }
                                  table { width: 100% !important; }
                                </style>
                                ${product.descriptionHtml}
                              ` 
                            }} 
                          />
                        ) : (
                          <Text color="subdued">No description available</Text>
                        )}
                      </BlockStack>
                    </div>
                  </div>
                 
                  {/* Phần variants */}
                  <div style={{ flex: '1' }}>
                    <Card title="Variants">
                       
                        {/* Danh sách màu để filter */}
                      <div style={{ marginBottom: '16px' }}>
                        <InlineStack gap="200" align="start" blockAlign="center">
                          <Text as="span" variant="bodyMd" fontWeight="medium">Filter by color:</Text>
                          <InlineStack gap="100">
                            {/* Nút "All" */}
                            <Button
                              size="slim"
                              tone={!selectedColor ? 'success' : 'default'}
                              onClick={() => setSelectedColor(null)}
                            >
                              All
                            </Button>
                            
                            {/* Các nút màu */}
                            {colorOptions.map(({ label, value }) => (
                              <Button
                                key={value}
                                size="slim"
                                tone={selectedColor === value ? 'success' : 'default'}
                                onClick={() => setSelectedColor(value)}
                              >
                                <InlineStack gap="100" align="center">
                                  <div style={{
                                    width: '16px',
                                    height: '16px',
                                    backgroundColor: value.toLowerCase(),
                                    borderRadius: '50%',
                                    border: '1px solid #ddd'
                                  }} />
                                  {label}
                                </InlineStack>
                              </Button>
                            ))}
                          </InlineStack>
                        </InlineStack>
                      </div>

                      <BlockStack gap="400">
                      {filteredVariants.length > 0 ? (
                            filteredVariants.map(({ node: variant }) => (
                          
                            <Card key={variant.id} sectioned>
                              {editingVariant?.id === variant.id ? (
                                <fetcher.Form onSubmit={handleSubmit}>
                                  <BlockStack gap="400">
                                    <Text variant="headingSm" color={variant.selectedOptions.find(opt => opt.name === "Color")?.value || '#000000'} as="h3" fontWeight="medium">
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
                                      label="Available Quantity"
                                      type="number"
                                      value={inventory}
                                      onChange={(value) => setInventory(value)}
                                      autoComplete="off"
                                      min="0"
                                    />
                                  
                                    {variant.inventoryItem.inventoryLevels.edges.length > 0 && (
                                      <Select
                                        label="Location"
                                        options={variant.inventoryItem.inventoryLevels.edges.map((edge) => ({
                                          label: edge.node.location.name,
                                          value: edge.node.location.id,
                                        }))}
                                        value={selectedLocationId}
                                        onChange={(value) => handleLocationChange(value)}
                                      />
                                    )}
                                    
                                    <InlineStack gap="200">
                                      <Button submit loading={fetcher.state === 'submitting'}>
                                        Save
                                      </Button>
                                      <Button
                                        onClick={handleCancelEdit}
                                        disabled={fetcher.state === 'submitting'}
                                      >
                                        Cancel
                                      </Button>
                                    </InlineStack>
                                  </BlockStack>
                                </fetcher.Form>
                              ) : (
                                <BlockStack gap="200">
                                  <Text variant="headingLg" as="h4" fontWeight="medium">
                                    <span style={{color:variant.selectedOptions.find(opt => opt.name === "Color")?.value || '#000000'}}>{variant.title}</span>
                                    {variant.selectedOptions && variant.selectedOptions.length > 0 && (
                                      <span
                                        style={{
                                          backgroundColor: variant.selectedOptions.find(opt => opt.name === "Color")?.value || '#000000',
                                          borderRadius: '50%',
                                          width: '25px',
                                          height: '25px',
                                          display: 'inline-block',
                                          verticalAlign: 'middle',
                                          marginLeft: '8px',
                                        }}
                                      />
                                    )}
                                  </Text>
                                                        
                                  <InlineStack align="space-between">
                                    <Text as="span" variant="headingMd">Price:</Text>
                                    <Text as="span" fontWeight="medium">
                                      {formatPrice(variant.price)}
                                    </Text>
                                  </InlineStack>
                                  
                                  <InlineStack align="space-between">
                                    <Text as="span" variant="headingMd">Inventory Quantity:</Text>
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
                                  ) : (
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
                                  {variant.createdAt && (
                                    <InlineStack align="space-between">
                                      <Text as="span">Ngày tạo:</Text>
                                      <Text as="span" fontWeight="medium">
                                        {variant.createdAt}
                                      </Text>
                                    </InlineStack>
                                  )}
                                  {variant.updatedAt && (
                                    <InlineStack align="space-between">
                                      <Text as="span">Ngày cập nhật:</Text>
                                      <Text as="span" fontWeight="medium">
                                        {variant.updatedAt}
                                      </Text>
                                    </InlineStack>
                                  )}
                                  <div style={{ marginTop: '16px'}}>
                                    <Button variant="primary" onClick={() => handleEditVariant(variant)}> 
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
                  </div>
                </InlineStack>

                <Divider />

                <BlockStack gap="200">
                  <Text variant="headingLg" as="h3">Pricing</Text>
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

          {/* Phần thông tin chi tiết sản phẩm */}
          <Layout.Section secondary>
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
          <Toast
            content={fetcher.data?.success ? 'Cập nhật thành công' : fetcher.data?.error}
            onDismiss={toggleActive}
          />
        )}
      </Page>
    </Frame>
  );
}