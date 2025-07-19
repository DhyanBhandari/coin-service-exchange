// Check service categories in database
const { Client } = require('pg');

async function checkCategories() {
  const client = new Client({
    connectionString: 'postgresql://postgres.nqctqporsodscwgoetjj:CWKCmih402sKDZce@aws-0-ap-south-1.pooler.supabase.com:6543/postgres'
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Get category distribution
    const categoryResult = await client.query(`
      SELECT 
        category, 
        COUNT(*) as count,
        AVG(price) as avg_price,
        MIN(price) as min_price,
        MAX(price) as max_price
      FROM services 
      WHERE is_active = true 
      GROUP BY category 
      ORDER BY count DESC, category
    `);

    console.log('\n📊 Service Categories in Database:');
    console.log('==========================================');
    
    let totalServices = 0;
    categoryResult.rows.forEach(cat => {
      totalServices += parseInt(cat.count);
      console.log(`${cat.category.toUpperCase()}`);
      console.log(`  📦 Services: ${cat.count}`);
      console.log(`  💰 Price Range: ${cat.min_price} - ${cat.max_price} coins`);
      console.log(`  📊 Average Price: ${Math.round(cat.avg_price)} coins`);
      console.log('');
    });

    console.log(`🔢 Total Active Services: ${totalServices}`);

    // Get some sample services per category
    console.log('\n📋 Sample Services by Category:');
    console.log('==========================================');
    
    for (const cat of categoryResult.rows) {
      const samplesResult = await client.query(`
        SELECT title, price, rating, booking_count
        FROM services 
        WHERE category = $1 AND is_active = true
        ORDER BY rating DESC, booking_count DESC
        LIMIT 3
      `, [cat.category]);

      console.log(`\n${cat.category.toUpperCase()} (${cat.count} services):`);
      samplesResult.rows.forEach((service, index) => {
        console.log(`  ${index + 1}. ${service.title} - ${service.price} coins (⭐ ${service.rating})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkCategories();