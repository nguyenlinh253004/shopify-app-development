export const formatPrice = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const getColorOptions = (variants) => {
  const colors = new Set();
  variants?.edges?.forEach(({ node: variant }) => {
    const colorOption = variant.selectedOptions.find((opt) => opt.name.toLowerCase() === 'color');
    if (colorOption) {
      colors.add(colorOption?.value);
    }
  });
  return Array.from(colors).map((color) => ({
    label: color,
    value: color,
  }));
};