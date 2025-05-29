export const getAllMedia = (product) => {
  const media = [];
  product.variants?.edges?.forEach(({ node: variant }) => {
    variant.media?.edges?.forEach(({ node: mediaItem }) => {
      if (mediaItem.mediaContentType === 'IMAGE' && mediaItem.image?.url) {
        media.push({
          url: mediaItem.image.url,
          alt: mediaItem.alt || `Product image ${media.length + 1}`
        });
      }
    });
  });
  return media;
};