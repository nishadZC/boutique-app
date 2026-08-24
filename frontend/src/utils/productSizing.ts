export const getSizeOptions = (product: { name: string; category?: string }): string[] => {
  const name = product.name.toLowerCase();
  const category = (product.category || '').toLowerCase();

  if (name.includes('gown') || name.includes('coat') || name.includes('dress') || name.includes('tie') || category === 'outerwear' || category === 'dresses') {
    return ['XS', 'S', 'M', 'L', 'XL'];
  }
  if (name.includes('heel') || name.includes('loafer') || name.includes('shoe') || category === 'shoes') {
    return ['3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  }
  if (name.includes('sunglass') || name.includes('glass') || name.includes('eyewear')) {
    return ['52 mm', '54 mm', '56 mm'];
  }
  if (name.includes('necklace') || name.includes('chain')) {
    return ['16 in', '18 in', '20 in', '22 in'];
  }
  if (name.includes('bracelet') || name.includes('ring') || name.includes('ornament') || category === 'jewelry') {
    return ['Small', 'Medium', 'Large'];
  }
  return ['One Size'];
};

export const productRequiresSize = (product: { name: string; category?: string }): boolean =>
  getSizeOptions(product).length > 1;
