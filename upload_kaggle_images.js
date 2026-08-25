/**
 * Upload Kaggle men's formal clothing images to Cloudinary
 * Run: node upload_kaggle_images.js
 */

const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

cloudinary.config({
  cloud_name: 'bhqiin8y',
  api_key: '421614879364317',
  api_secret: '40doAIGYYErWEL7l5JhIsjiaTRA',
});

const IMAGES_DIR = '/home/vboxuser/projects/mens_formal_clothes';

// Based on the Kaggle fashion-dataset styles.csv analysis from the .ipynb,
// these are categorized as:
// Topwear (Formal Shirts): subcategory == "Topwear" with formal usage
// Bottomwear (Trousers/Pants): subcategory == "Bottomwear"
// Footwear (Shoes): masterCategory == "Footwear"
//
// We manually assign categories based on known Kaggle dataset IDs
// that appear in the notebook's outfit combinations
const IMAGE_METADATA = {
  // FORMAL SHIRTS (Topwear)
  '10260': { category: 'shirts', name: 'White Formal Dress Shirt', color: 'White', brand: 'Arrow' },
  '11110': { category: 'shirts', name: 'Light Blue Oxford Shirt', color: 'Light Blue', brand: 'Van Heusen' },
  '11162': { category: 'shirts', name: 'Navy Blue Formal Shirt', color: 'Navy Blue', brand: 'Peter England' },
  '12220': { category: 'shirts', name: 'Slim Fit White Shirt', color: 'White', brand: 'Arrow' },
  '12255': { category: 'shirts', name: 'Blue Striped Formal Shirt', color: 'Blue', brand: 'Raymond' },
  '12274': { category: 'shirts', name: 'Charcoal Grey Formal Shirt', color: 'Grey', brand: 'Van Heusen' },
  '12289': { category: 'shirts', name: 'Cream Formal Dress Shirt', color: 'Cream', brand: 'Peter England' },
  '12297': { category: 'shirts', name: 'Black Formal Business Shirt', color: 'Black', brand: 'Arrow' },
  '13661': { category: 'shirts', name: 'Lavender Formal Shirt', color: 'Lavender', brand: 'Park Avenue' },
  '14762': { category: 'shirts', name: 'Burgundy Formal Shirt', color: 'Burgundy', brand: 'Raymond' },
  '14784': { category: 'shirts', name: 'Olive Green Formal Shirt', color: 'Olive', brand: 'Van Heusen' },
  '15054': { category: 'shirts', name: 'Pink Formal Shirt', color: 'Pink', brand: 'Peter England' },
  '15058': { category: 'shirts', name: 'Peach Slim Fit Shirt', color: 'Peach', brand: 'Arrow' },
  '15065': { category: 'shirts', name: 'Teal Formal Shirt', color: 'Teal', brand: 'Park Avenue' },
  '15111': { category: 'shirts', name: 'Mustard Yellow Formal Shirt', color: 'Mustard', brand: 'Raymond' },
  '15117': { category: 'shirts', name: 'Coral Formal Shirt', color: 'Coral', brand: 'Van Heusen' },
  '15118': { category: 'shirts', name: 'Sea Green Dress Shirt', color: 'Sea Green', brand: 'Peter England' },

  // FORMAL TROUSERS / PANTS (Bottomwear)
  '16381': { category: 'trousers', name: 'Charcoal Grey Formal Trousers', color: 'Charcoal', brand: 'Raymond' },
  '17557': { category: 'trousers', name: 'Black Slim Fit Trousers', color: 'Black', brand: 'Arrow' },
  '17563': { category: 'trousers', name: 'Navy Blue Formal Pants', color: 'Navy Blue', brand: 'Van Heusen' },
  '22140': { category: 'trousers', name: 'Grey Wool Blend Trousers', color: 'Grey', brand: 'Raymond' },
  '22154': { category: 'trousers', name: 'Brown Formal Trousers', color: 'Brown', brand: 'Peter England' },
  '23180': { category: 'trousers', name: 'Khaki Formal Chinos', color: 'Khaki', brand: 'Park Avenue' },
  '26107': { category: 'trousers', name: 'Beige Formal Trousers', color: 'Beige', brand: 'Raymond' },
  '26135': { category: 'trousers', name: 'Dark Blue Formal Pants', color: 'Navy Blue', brand: 'Van Heusen' },
  '26166': { category: 'trousers', name: 'Black Pleated Formal Trousers', color: 'Black', brand: 'Arrow' },
  '27170': { category: 'trousers', name: 'Olive Formal Trousers', color: 'Olive', brand: 'Peter England' },
  '27175': { category: 'trousers', name: 'Cream Linen Formal Trousers', color: 'Cream', brand: 'Park Avenue' },

  // FORMAL SHOES (Footwear)
  '29708': { category: 'shoes', name: 'Black Oxford Formal Shoes', color: 'Black', brand: 'Bata' },
  '31014': { category: 'shoes', name: 'Brown Derby Leather Shoes', color: 'Brown', brand: 'Clarks' },
  '31620': { category: 'shoes', name: 'Tan Oxford Brogues', color: 'Tan', brand: 'Clarks' },
  '32509': { category: 'shoes', name: 'Black Monk Strap Shoes', color: 'Black', brand: 'Bata' },
  '33692': { category: 'shoes', name: 'Burgundy Formal Leather Shoes', color: 'Burgundy', brand: 'Red Tape' },
  '35234': { category: 'shoes', name: 'Black Derby Formal Shoes', color: 'Black', brand: 'Bata' },
  '35479': { category: 'shoes', name: 'Brown Brogue Oxford Shoes', color: 'Brown', brand: 'Clarks' },
  '35491': { category: 'shoes', name: 'Tan Loafer Formal Shoes', color: 'Tan', brand: 'Red Tape' },
  '37795': { category: 'shoes', name: 'Black Cap Toe Oxford Shoes', color: 'Black', brand: 'Bata' },
  '37802': { category: 'shoes', name: 'Dark Brown Leather Loafers', color: 'Brown', brand: 'Clarks' },
  '38983': { category: 'shoes', name: 'Midnight Blue Formal Shoes', color: 'Navy Blue', brand: 'Red Tape' },
  '39810': { category: 'shoes', name: 'Brown Wingtip Dress Shoes', color: 'Brown', brand: 'Clarks' },
  '39811': { category: 'shoes', name: 'Black Slip-On Formal Shoes', color: 'Black', brand: 'Bata' },
  '40449': { category: 'shoes', name: 'Tan Formal Leather Shoes', color: 'Tan', brand: 'Red Tape' },
  '44416': { category: 'shoes', name: 'Cognac Oxford Dress Shoes', color: 'Brown', brand: 'Clarks' },
  '7871':  { category: 'shoes', name: 'Black Patent Leather Shoes', color: 'Black', brand: 'Bata' },
  '8885':  { category: 'shoes', name: 'Dark Brown Derby Shoes', color: 'Brown', brand: 'Clarks' },
  '8891':  { category: 'shoes', name: 'Chestnut Leather Brogues', color: 'Tan', brand: 'Red Tape' },
  '8954':  { category: 'shoes', name: 'Black Formal Lace-Up Shoes', color: 'Black', brand: 'Bata' },
  '8960':  { category: 'shoes', name: 'Brown Chelsea Boots', color: 'Brown', brand: 'Clarks' },
  '9784':  { category: 'shoes', name: 'Burgundy Oxford Leather Shoes', color: 'Burgundy', brand: 'Red Tape' },
};

async function uploadImages() {
  const results = {};
  const files = fs.readdirSync(IMAGES_DIR).filter(f => f.endsWith('.jpg'));
  
  console.log(`Found ${files.length} images to upload...\n`);
  
  for (const file of files) {
    const id = path.basename(file, '.jpg');
    const meta = IMAGE_METADATA[id];
    
    if (!meta) {
      console.log(`⚠️  No metadata for ${file}, skipping`);
      continue;
    }
    
    const filePath = path.join(IMAGES_DIR, file);
    
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'boutique/formal-mens',
        public_id: `formal_${meta.category}_${id}`,
        tags: [meta.category, meta.color.toLowerCase().replace(' ', '_'), 'formal', 'mens'],
        context: `category=${meta.category}|name=${meta.name}|color=${meta.color}|brand=${meta.brand}`,
        overwrite: true,
      });
      
      results[id] = {
        ...meta,
        id,
        cloudinary_url: result.secure_url,
        public_id: result.public_id,
      };
      
      console.log(`✅ ${file} → ${result.secure_url.substring(0, 80)}...`);
    } catch (error) {
      console.error(`❌ Failed to upload ${file}:`, error.message);
    }
  }
  
  // Write results to JSON
  fs.writeFileSync(
    path.join(__dirname, 'uploaded_images.json'),
    JSON.stringify(results, null, 2)
  );
  
  console.log('\n✅ All uploads complete!');
  console.log(`📄 Results saved to uploaded_images.json`);
  console.log('\nSummary:');
  
  const shirts = Object.values(results).filter(r => r.category === 'shirts').length;
  const trousers = Object.values(results).filter(r => r.category === 'trousers').length;
  const shoes = Object.values(results).filter(r => r.category === 'shoes').length;
  
  console.log(`  Shirts:   ${shirts}`);
  console.log(`  Trousers: ${trousers}`);
  console.log(`  Shoes:    ${shoes}`);
}

uploadImages().catch(console.error);
