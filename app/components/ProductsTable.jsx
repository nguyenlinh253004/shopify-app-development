import {
  DataTable,
  TextField,
  Button,
  Spinner,
  Text,
  Select,
  InlineStack,
  Page,
  Card,
  Link,
  Badge,
} from '@shopify/polaris';
import { useDebounce } from 'use-debounce';

import { useState, useEffect } from 'react';
import { Form,useNavigate, useNavigation, useSubmit } from '@remix-run/react';

export function ProductsTable({
  products: initialProducts,
  pageInfo: initialPageInfo,
  searchTerm: initialSearchTerm = '',
  sortConfig: initialSortConfig = { key: 'TITLE', direction: 'ASC' },
  error: initialError = null,
}) {
  const navigation = useNavigation();
  const navigate = useNavigate();
  const submit = useSubmit();

  const [products, setProducts] = useState(initialProducts || []);
  const [pageInfo, setPageInfo] = useState(
    initialPageInfo || {
      hasNextPage: false,
      hasPreviousPage: false,
    }
  );
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);
  const [error, setError] = useState(initialError);
  const [sortConfig, setSortConfig] = useState(initialSortConfig);

  useEffect(() => {
    if (
      debouncedSearchTerm !== initialSearchTerm ||
      sortConfig.key !== initialSortConfig.key ||
      sortConfig.direction !== initialSortConfig.direction
    ) {
      const formData = new FormData();
      formData.append('searchQuery', debouncedSearchTerm);
      formData.append('actionType', 'search');
      formData.append('sortKey', sortConfig.key);
      formData.append('reverse', sortConfig.direction === 'DESC');
      submit(formData, {
        method: 'post',
      });
    }
  }, [debouncedSearchTerm, sortConfig, submit, initialSearchTerm, initialSortConfig]);

  useEffect(() => {
    setProducts(initialProducts || []);
    setPageInfo(
      initialPageInfo || {
        hasNextPage: false,
        hasPreviousPage: false,
      }
    );
    setError(initialError);
    if (initialSortConfig) {
      setSortConfig(initialSortConfig);
    }
  }, [initialProducts, initialPageInfo, initialError, initialSortConfig]);

  const isLoading = navigation.state === 'submitting';

  // Chuẩn bị dữ liệu cho DataTable
  const rows = products.map(({ id, title, featuredImage, createdAt }) => [
    featuredImage ? (
      <img 
        src={featuredImage.url} 
        alt={title} 
        width="40" 
        style={{ borderRadius: '4px' }}
      />
    ) : (
      <Badge tone="subdued">No image</Badge>
    ),
  id.split('/').pop(),
  title,
  new Date(createdAt).toLocaleDateString(),
  <InlineStack gap="200">
    <Link url={`/app/productsDetail/${id.split('/').pop()}`} style={{ textDecoration: 'none' }}>
      <Button plain>View</Button>
    </Link>
    <Link url={`/app/products/${id.split('/').pop()}/edit`} style={{ textDecoration: 'none' }}>
      <Button plain>Edit</Button>
    </Link>
    <Link url={`/app/products/${id.split('/').pop()}/delete`} style={{ textDecoration: 'none' }}>
      <Button plain destructive>Delete</Button>
    </Link>
  </InlineStack>,
  ]);
  return (
    <Page title="Products">
      <Card>
        {error && (
          <div style={{ marginBottom: '16px', color: 'var(--p-color-text-critical)' }}>
            <Text variant="bodyMd" color="critical">
              Error: {error}
            </Text>
          </div>
        )}

        <InlineStack gap="400" align="space-between">
          <Form method="post">
            <TextField
              label="Search products"
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search by title..."
              autoComplete="off"
              disabled={isLoading}
            />
            <input type="hidden" name="searchQuery" value={searchTerm} />
            <input type="hidden" name="actionType" value="search" />
            <input type="hidden" name="sortKey" value={sortConfig.key} />
            <input type="hidden" name="reverse" value={sortConfig.direction === 'DESC'} />
          </Form>

          <Select
            label="Sort by"
            options={[
              { label: 'Title A-Z', value: 'TITLE-ASC' },
              { label: 'Title Z-A', value: 'TITLE-DESC' },
              { label: 'Newest', value: 'CREATED_AT-DESC' },
              { label: 'Oldest', value: 'CREATED_AT-ASC' },
            ]}
            value={`${sortConfig.key}-${sortConfig.direction}`}
            onChange={(value) => {
              const [key, direction] = value.split('-');
              setSortConfig({ key, direction });
            }}
          />
        </InlineStack>

        {isLoading && <Spinner size="small" />}

        <div style={{ marginTop: '20px' }}>
          <DataTable
            columnContentTypes={['text', 'text', 'text', 'text', 'text']}
            headings={['Image', 'ID', 'Title', 'Created At', 'Actions']}
            rows={rows}
            footerContent={`Showing ${products.length} of ${products.length} results`}
          />

          <InlineStack gap="400" align="center" blockAlign="center" padding="400">
            <Form method="post">
              <input type="hidden" name="searchQuery" value={searchTerm} />
              <input 
                type="hidden" 
                name="cursor" 
                value={pageInfo.hasPreviousPage ? pageInfo.startCursor : ''} 
              />
              <input type="hidden" name="actionType" value="loadPrevious" />
              <input type="hidden" name="sortKey" value={sortConfig.key} />
              <input type="hidden" name="reverse" value={sortConfig.direction === 'DESC'} />
              <Button 
                submit 
                disabled={!pageInfo.hasPreviousPage || isLoading} 
                loading={isLoading}
              >
                Previous
              </Button>
            </Form>

            <Form method="post">
              <input type="hidden" name="searchQuery" value={searchTerm} />
              <input 
                type="hidden" 
                name="cursor" 
                value={pageInfo.hasNextPage ? pageInfo.endCursor : ''} 
              />
              <input type="hidden" name="actionType" value="loadMore" />
              <input type="hidden" name="sortKey" value={sortConfig.key} />
              <input type="hidden" name="reverse" value={sortConfig.direction === 'DESC'} />
              <Button 
                submit 
                disabled={!pageInfo.hasNextPage || isLoading} 
                loading={isLoading}
              >
                Next
              </Button>
            </Form>
          </InlineStack>
        </div>
      </Card>
    </Page>
  );
}