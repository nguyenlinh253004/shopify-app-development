import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { authenticate } from '../shopify.server';
import { Page, Card, Layout, Text, InlineStack, Spinner, BlockStack } from '@shopify/polaris';
import { Pie, Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

// Đăng ký các thành phần cần thiết của Chart.js
ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export async function loader({ request }) {
  const { admin } = await authenticate.admin(request);

  try {
    const response = await admin.graphql(
      `#graphql
      query getProducts {
        products(first: 250) {
          edges {
            node {
              id
              title
              totalInventory
              variants(first: 250) {
                edges {
                  node {
                    id
                    price
                    compareAtPrice
                  }
                }
              }
            }
          }
        }
      }`
    );

    const { data, errors } = await response.json();
    if (errors) throw new Error(errors.map((e) => e.message).join(', '));

    const products = data.products.edges.map(edge => edge.node);

    const totalProducts = products.length;
    const totalProductsWithVariants = products.reduce((sum, product) => sum + (product.variants.edges.length || 0), 0);
    const totalInventory = products.reduce((sum, product) => sum + (product.totalInventory || 0), 0);
    const productsOnSale = products.filter(product =>
      product.variants.edges.some(variant => {
        const price = parseFloat(variant.node.price);
        const compareAtPrice = parseFloat(variant.node.compareAtPrice || '0');
        return compareAtPrice > 0 && price < compareAtPrice;
      })
    ).length;
    const productsOnSalevariant = products.reduce((sum, product) => {
      return sum + product.variants.edges.filter(variant => {
        const price = parseFloat(variant.node.price);
        const compareAtPrice = parseFloat(variant.node.compareAtPrice || '0');
        return compareAtPrice > 0 && price < compareAtPrice;
      }).length;
    }, 0);

    return json({
      stats: {
        totalProducts,
        totalProductsWithVariants,
        totalInventory,
        productsOnSale,
        productsOnSalevariant,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}

export default function Dashboard() {
  const { stats, error } = useLoaderData();

  if (error) {
    return (
      <Page title="Dashboard">
        <Card sectioned>
          <Text variant="bodyMd" color="critical">
            Error: {error}
          </Text>
        </Card>
      </Page>
    );
  }

  if (!stats) {
    return (
      <Page title="Dashboard">
        <Card sectioned>
          <InlineStack align="center" gap="400">
            <Spinner size="large" />
            <Text variant="bodyMd" as="span">
              Loading statistics...
            </Text>
          </InlineStack>
        </Card>
      </Page>
    );
  }

  // Dữ liệu cho biểu đồ Tổng số sản phẩm
  const totalProductsData = {
    labels: ['Sản phẩm', 'Không có'],
    datasets: [
      {
        data: [stats.totalProducts, 0],
        backgroundColor: ['#2E7D32', '#E0E0E0'],
        borderWidth: 1,
      },
    ],
  };

  // Dữ liệu cho biểu đồ Tổng số biến thể
  const totalProductsWithVariantsData = {
    labels: ['Biến thể', 'Không có'],
    datasets: [
      {
        data: [stats.totalProductsWithVariants, 0],
        backgroundColor: ['#388E3C', '#E0E0E0'],
        borderWidth: 1,
      },
    ],
  };

  // Dữ liệu cho biểu đồ Tổng tồn kho
  const totalInventoryData = {
    labels: ['Tổng tồn kho'],
    datasets: [
      {
        label: 'Số lượng',
        data: [stats.totalInventory],
        backgroundColor: '#0288D1',
        borderColor: '#01579B',
        borderWidth: 1,
      },
    ],
  };

  // Dữ liệu cho biểu đồ Số sản phẩm giảm giá
  const productsOnSaleData = {
    labels: ['Sản phẩm giảm giá', 'Sản phẩm không giảm giá'],
    datasets: [
      {
        data: [stats.productsOnSale, stats.totalProducts - stats.productsOnSale],
        backgroundColor: ['#D32F2F', '#E0E0E0'],
        borderWidth: 1,
      },
    ],
  };

  // Dữ liệu cho biểu đồ Số biến thể giảm giá
  const productsOnSaleVariantData = {
    labels: ['Biến thể giảm giá', 'Biến thể không giảm giá'],
    datasets: [
      {
        data: [stats.productsOnSalevariant, stats.totalProductsWithVariants - stats.productsOnSalevariant],
        backgroundColor: ['#F44336', '#E0E0E0'],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  return (
    <Page title="Dashboard Thống Kê">
      <Layout>
        <Layout.Section>
          <Card title="Tổng số sản phẩm">
            <BlockStack gap="400">
              <InlineStack gap="400" align="space-between">
                <Text variant="headingLg" as="h2">
                  Tổng số sản phẩm
                </Text>
                <Text variant="headingLg" fontWeight="bold">
                  {stats.totalProducts}
                </Text>
              </InlineStack>
              <div style={{ height: '300px' }}>
                <Pie
                  data={totalProductsData}
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      title: {
                        display: true,
                        text: 'Tổng số sản phẩm',
                      },
                    },
                  }}
                />
              </div>
              <InlineStack gap="400" align="space-between">
                <Text variant="headingMd" as="h2">
                  Tổng số biến thể
                </Text>
                <Text variant="headingLg" fontWeight="bold">
                  {stats.totalProductsWithVariants}
                </Text>
              </InlineStack>
              <div style={{ height: '300px' }}>
                <Pie
                  data={totalProductsWithVariantsData}
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      title: {
                        display: true,
                        text: 'Tổng số biến thể',
                      },
                    },
                  }}
                />
              </div>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card title="Tổng tồn kho">
            <BlockStack gap="400">
              <InlineStack gap="400" align="space-between">
                <Text variant="headingLg" as="h2">
                  Tổng tồn kho
                </Text>
                <Text variant="headingLg" fontWeight="bold">
                  {stats.totalInventory}
                </Text>
              </InlineStack>
              <div style={{ height: '300px' }}>
                <Bar
                  data={totalInventoryData}
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      title: {
                        display: true,
                        text: 'Tổng tồn kho',
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </div>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card title="Sản phẩm giảm giá">
            <BlockStack gap="400">
              <InlineStack gap="400" align="space-between">
                <Text variant="headingLg" as="h2">
                  Sản phẩm đang giảm giá
                </Text>
                <Text variant="headingLg" fontWeight="bold">
                  {stats.productsOnSale} sản phẩm
                </Text>
              </InlineStack>
              <div style={{ height: '300px' }}>
                <Doughnut
                  data={productsOnSaleData}
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      title: {
                        display: true,
                        text: 'Sản phẩm đang giảm giá',
                      },
                    },
                  }}
                />
              </div>
              <InlineStack gap="400" align="space-between">
                <Text variant="headingMd" as="h2">
                  Tổng số biến thể đang giảm giá
                </Text>
                <Text variant="headingLg" fontWeight="bold">
                  {stats.productsOnSalevariant} biến thể
                </Text>
              </InlineStack>
              <div style={{ height: '300px' }}>
                <Doughnut
                  data={productsOnSaleVariantData}
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      title: {
                        display: true,
                        text: 'Biến thể đang giảm giá',
                      },
                    },
                  }}
                />
              </div>
              <Text variant="bodyMd" as="p">
                Sản phẩm đang giảm giá là những sản phẩm có giá bán thấp hơn giá so sánh.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}