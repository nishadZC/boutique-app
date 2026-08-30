export const getSizeOptions = (product: { name: string; category?: string }): string[] => {
  const name = product.name.toLowerCase();
  const category = (product.category || '').toLowerCase();
  const isShirtLike =
    name.includes('shirt') ||
    name.includes('top') ||
    name.includes('blouse') ||
    category.includes('shirt') ||
    category.includes('topwear') ||
    category.includes('formal shirt');

  const isPantLike =
    name.includes('pant') ||
    name.includes('trouser') ||
    name.includes('jean') ||
    name.includes('chino') ||
    category.includes('pant') ||
    category.includes('trouser') ||
    category.includes('jeans');

  const isShoeLike =
    name.includes('shoe') ||
    name.includes('sandal') ||
    name.includes('loafer') ||
    name.includes('heel') ||
    name.includes('boot') ||
    name.includes('sneaker') ||
    name.includes('slipper') ||
    name.includes('moccasin') ||
    name.includes('flip') ||
    name.includes('flat') ||
    name.includes('footwear') ||
    name.includes('oxford') ||
    name.includes('brogue') ||
    name.includes('derby') ||
    name.includes('monk') ||
    name.includes('pump') ||
    name.includes('wedge') ||
    name.includes('espadrille') ||
    name.includes('stiletto') ||
    name.includes('ballet') ||
    category.includes('shoe') ||
    category.includes('sandal') ||
    category.includes('boot') ||
    category.includes('footwear') ||
    category.includes('sneaker');

  if (isShirtLike) {
    return ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  }

  if (isPantLike) {
    return ['28', '30', '32', '34', '36', '38', '40', '42'];
  }

  if (isShoeLike) {
    return ['6', '7', '8', '9', '10', '11', '12'];
  }

  if (name.includes('gown') || name.includes('coat') || name.includes('dress') || name.includes('tie') || category === 'outerwear' || category === 'dresses') {
    return ['XS', 'S', 'M', 'L', 'XL'];
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
