import {
  Box,
  Card,
  Layout,
  Page,
  ResourceList,
  ResourceItem,
  Text,
  BlockStack,
  Spinner,
  Thumbnail,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
      query {
        products(first: 50) {
          nodes {
            id
            title
            status
            totalInventory
            priceRangeV2 {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            images(first: 1) {
              nodes {
                url
              }
            }
          }
        }
      }`
  );

  const {
    data: {
      products: { nodes },
    },
  } = await response.json();

  return json({ products: nodes });
};

export default function AdditionalPage() {
  const { products } = useLoaderData<typeof loader>();

  return (
    <Page>
      <TitleBar title="商品列表" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="500">
              {products ? (
                <ResourceList
                  resourceName={{ singular: "商品", plural: "商品" }}
                  items={products}
                  renderItem={(item) => {
                    const { id, title, status, totalInventory, priceRangeV2, images } = item;
                    const price = priceRangeV2?.minVariantPrice?.amount
                      ? `${priceRangeV2.minVariantPrice.currencyCode} ${priceRangeV2.minVariantPrice.amount}`
                      : "未设置价格";
                    const media = images?.nodes[0]?.url
                      ? <Thumbnail source={images.nodes[0].url} alt={title} />
                      : undefined;

                    return (
                      <ResourceItem
                        id={id}
                        url={`shopify:admin/products/${id.replace("gid://shopify/Product/", "")}`}
                        media={media}
                      >
                        <BlockStack gap="200">
                          <Text as="h3" variant="bodyMd" fontWeight="bold">
                            {title}
                          </Text>
                          <BlockStack gap="200">
                            <Text as="p" variant="bodyMd">价格: {price}</Text>
                            <Text as="p" variant="bodyMd">状态: {status}</Text>
                            <Text as="p" variant="bodyMd">库存: {totalInventory}</Text>
                          </BlockStack>
                        </BlockStack>
                      </ResourceItem>
                    );
                  }}
                />
              ) : (
                <Box padding="400">
                  <BlockStack gap="400" align="center">
                    <Spinner size="large" />
                    <Text as="p" variant="bodyMd">
                      加载商品列表中...
                    </Text>
                  </BlockStack>
                </Box>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
