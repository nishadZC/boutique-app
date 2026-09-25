export type GarmentType = 'shirt' | 'trousers' | 'shoes' | 'blazer' | 'suit' | 'waistcoat' | 'coat';

/** Jackets, suits and coats: sized by chest and tailored by the atelier. */
export const TAILORED_GARMENTS: readonly GarmentType[] = ['blazer', 'suit', 'waistcoat', 'coat'];

export const getGarmentType = (product: { name: string; category?: string }): GarmentType | null => {
  const name = product.name.toLowerCase();
  const category = (product.category || '').toLowerCase();

  // Tailoring is checked first: "topcoat" would otherwise match "top", and
  // "waistcoat" must win over both "coat" and the Suits & Waistcoats category.
  if (name.includes('waistcoat') || name.includes('vest')) return 'waistcoat';
  if (name.includes('suit') || name.includes('tuxedo') || category.includes('suit')) return 'suit';
  if (name.includes('blazer') || name.includes('jacket') || category.includes('blazer')) return 'blazer';
  if (name.includes('coat') || category.includes('coat')) return 'coat';

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

  if (isShirtLike) return 'shirt';
  if (isPantLike) return 'trousers';
  if (isShoeLike) return 'shoes';
  return null;
};

export const getSizeOptions = (product: { name: string; category?: string }): string[] => {
  const name = product.name.toLowerCase();
  const category = (product.category || '').toLowerCase();
  const garmentType = getGarmentType(product);

  if (garmentType === 'shirt') {
    return ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  }

  if (garmentType === 'trousers') {
    return ['28', '30', '32', '34', '36', '38', '40', '42'];
  }

  if (garmentType === 'shoes') {
    return ['6', '7', '8', '9', '10', '11', '12'];
  }

  if (garmentType && TAILORED_GARMENTS.includes(garmentType)) {
    // Chest size in inches, as on Indian and UK tailoring labels.
    return ['36', '38', '40', '42', '44', '46'];
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
