import { json } from '@remix-run/node';
import { authenticate } from '../shopify.server';

export async function action({ request }) {
  const { admin } = await authenticate.admin(request);
try {
const response = await admin.graphql(
  `#graphql
  mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
    webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
      webhookSubscription {
        id
        topic
        filter
        format
        endpoint {
          __typename
          ... on WebhookHttpEndpoint {
            callbackUrl
          }
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
      "topic": "PRODUCTS_DELETE",
      "webhookSubscription": {
        "callbackUrl": "https://means-status-drag-ipaq.trycloudflare.com/webhooks/app/products-delete",
        "format": "JSON",
      }
    },
  },
);



    const { data, errors } = await response.json();
    if (errors) {
      throw new Error(errors.map((e) => e.message).join(', '));
    }
    if (data.webhookSubscriptionCreate.userErrors.length > 0) {
      throw new Error(data.webhookSubscriptionCreate.userErrors.map((e) => e.message).join(', '));
    }


    return json({ success: true, webhookId: data.webhookSubscriptionCreate.webhookSubscription.id });
  } catch (error) {
    console.error('Webhook registration error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}