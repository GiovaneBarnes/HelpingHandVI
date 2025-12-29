import pg from 'pg';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// PRODUCTION SAFETY CHECK
if (process.env.NODE_ENV === 'production') {
  console.error('❌ ERROR: This script generates demo data and should NEVER be run in production!');
  console.error('This script is for development/testing only.');
  process.exit(1);
}

console.log('🟡 WARNING: This script will add demo providers to the database.');
console.log('Only run this in development/testing environments.');

// Realistic business data for Virgin Islands
const businessNames = {
  'Electrician': [
    'St. Thomas Electrical Services',
    'Caribbean Power Solutions',
    'Island Electric Co.',
    'Tropical Wiring Specialists',
    'USVI Electrical Contractors',
    'Paradise Electricians',
    'Sunshine Electrical Services',
    'Island Spark Electric',
    'Caribbean Current Solutions',
    'Virgin Islands Power Pros'
  ],
  'Plumber': [
    'Blue Water Plumbing',
    'Island Flow Plumbing',
    'Tropical Pipes & Drains',
    'Caribbean Plumbing Solutions',
    'USVI Water Works',
    'Paradise Plumbing Co.',
    'Sunshine Drain Cleaning',
    'Island Plumbing Masters',
    'Caribbean Leak Solutions',
    'Virgin Islands Pipe Pros'
  ],
  'AC Technician': [
    'Island Breeze HVAC',
    'Tropical Cooling Systems',
    'Caribbean Air Conditioning',
    'USVI Climate Control',
    'Paradise AC Services',
    'Sunshine Cooling Solutions',
    'Island Comfort Systems',
    'Caribbean Climate Pros',
    'Virgin Islands AC Masters',
    'Tropical Temperature Control'
  ],
  'Handyman': [
    'Island Fix-It-All',
    'Tropical Home Repairs',
    'Caribbean Handyman Services',
    'USVI General Contractors',
    'Paradise Home Solutions',
    'Sunshine Repair Pros',
    'Island Maintenance Masters',
    'Caribbean Fix-It Services',
    'Virgin Islands Handymen',
    'Tropical Repair Specialists'
  ],
  'Cleaning Service': [
    'Island Shine Cleaning',
    'Tropical Clean Homes',
    'Caribbean Cleaning Co.',
    'USVI Clean Living',
    'Paradise Cleaning Services',
    'Sunshine Clean Pros',
    'Island Fresh Cleaning',
    'Caribbean Spotless',
    'Virgin Islands Cleaners',
    'Tropical Shine Services'
  ],
  'Beauty Services': [
    'Island Beauty Salon',
    'Tropical Spa & Beauty',
    'Caribbean Hair Studio',
    'USVI Beauty Boutique',
    'Paradise Beauty Center',
    'Sunshine Hair & Nails',
    'Island Glamour Spa',
    'Caribbean Beauty Lounge',
    'Virgin Islands Beauty Bar',
    'Tropical Beauty Treatments'
  ],
  'Carpenter': [
    'Island Wood Works',
    'Tropical Carpentry',
    'Caribbean Wood Crafts',
    'USVI Fine Carpentry',
    'Paradise Wood Solutions',
    'Sunshine Carpentry Co.',
    'Island Timber Masters',
    'Caribbean Woodworkers',
    'Virgin Islands Carpentry',
    'Tropical Wood Specialists'
  ],
  'Painter': [
    'Island Color Solutions',
    'Tropical Paint Pros',
    'Caribbean Painting Co.',
    'USVI Paint Masters',
    'Paradise Color Services',
    'Sunshine Paint & Decor',
    'Island Paint Specialists',
    'Caribbean Color Pros',
    'Virgin Islands Painters',
    'Tropical Paint Solutions'
  ],
  'Landscaping': [
    'Island Garden Paradise',
    'Tropical Landscape Design',
    'Caribbean Garden Services',
    'USVI Lawn & Garden',
    'Paradise Landscaping',
    'Sunshine Garden Pros',
    'Island Green Solutions',
    'Caribbean Landscape Co.',
    'Virgin Islands Gardens',
    'Tropical Outdoor Design'
  ],
  'Pest Control': [
    'Island Pest Solutions',
    'Tropical Pest Control',
    'Caribbean Bug Busters',
    'USVI Pest Masters',
    'Paradise Pest Control',
    'Sunshine Exterminators',
    'Island Pest Pros',
    'Caribbean Pest Control',
    'Virgin Islands Bug Control',
    'Tropical Pest Solutions'
  ]
};

const descriptions = {
  'Electrician': [
    'Licensed electrician serving St. Thomas with 15+ years experience. Residential and commercial electrical work.',
    'Full-service electrical contractor. Wiring, panel upgrades, generator installation, and emergency repairs.',
    'Professional electrical services for homes and businesses. Licensed and insured with competitive rates.',
    'Expert electrician specializing in solar panel installation, electrical repairs, and safety inspections.',
    'Reliable electrical contractor offering 24/7 emergency services and scheduled maintenance.'
  ],
  'Plumber': [
    'Master plumber with 20 years experience. Leak repairs, drain cleaning, water heater installation.',
    'Full plumbing services including pipe repairs, fixture installation, and emergency plumbing.',
    'Licensed plumber serving residential and commercial properties. Free estimates and honest pricing.',
    'Expert plumbing contractor specializing in water systems, drainage, and fixture repairs.',
    'Professional plumber offering same-day service for leaks, clogs, and plumbing emergencies.'
  ],
  'AC Technician': [
    'HVAC specialist with EPA certification. AC repair, installation, and maintenance services.',
    'Full-service air conditioning contractor. Cooling system repairs, ductwork, and energy efficiency.',
    'Licensed AC technician serving the Virgin Islands. Emergency repairs and scheduled maintenance.',
    'Professional HVAC services including system installation, repairs, and preventive maintenance.',
    'Expert air conditioning contractor with 10+ years experience in tropical climate systems.'
  ],
  'Handyman': [
    'General contractor offering home repairs, maintenance, and improvement services.',
    'Multi-skilled handyman for all your home repair needs. Licensed and insured.',
    'Professional handyman services including painting, carpentry, electrical, and plumbing repairs.',
    'Reliable contractor for home maintenance, repairs, and small renovation projects.',
    'Experienced handyman offering comprehensive home repair and maintenance services.'
  ],
  'Cleaning Service': [
    'Professional cleaning services for homes and offices. Deep cleaning, regular maintenance.',
    'Residential and commercial cleaning. Eco-friendly products and thorough cleaning.',
    'Expert cleaning services including deep cleaning, move-in/move-out, and regular maintenance.',
    'Professional cleaners offering detailed cleaning for homes, condos, and vacation rentals.',
    'Reliable cleaning service with experienced staff and satisfaction guarantee.'
  ],
  'Beauty Services': [
    'Full-service beauty salon offering hair styling, nails, facials, and spa treatments.',
    'Professional beauty services including haircuts, coloring, manicures, pedicures, and facials.',
    'Luxury beauty salon with experienced stylists and estheticians. Walk-ins welcome.',
    'Complete beauty services from hair styling to skin care treatments and nail art.',
    'Professional beauty boutique offering personalized services in a relaxing atmosphere.'
  ],
  'Carpenter': [
    'Custom carpentry and woodworking services. Furniture, cabinets, and home improvements.',
    'Professional carpenter specializing in custom woodwork, repairs, and installations.',
    'Expert carpentry services for residential and commercial projects. Quality craftsmanship.',
    'Licensed carpenter offering furniture repair, custom builds, and home improvement projects.',
    'Skilled carpenter providing custom woodworking, repairs, and installation services.'
  ],
  'Painter': [
    'Professional painting services for interior and exterior. Quality work and fair prices.',
    'Expert painter offering residential and commercial painting. Licensed and insured.',
    'Professional painting contractor specializing in interior/exterior painting and staining.',
    'Reliable painting services with attention to detail and clean, professional results.',
    'Experienced painter offering color consultation, prep work, and quality finishes.'
  ],
  'Landscaping': [
    'Full landscaping services including design, installation, and maintenance.',
    'Professional landscaper offering lawn care, irrigation, and garden design services.',
    'Complete landscaping solutions for residential and commercial properties.',
    'Expert landscaping services including lawn mowing, trimming, and garden maintenance.',
    'Professional landscape design and installation with ongoing maintenance services.'
  ],
  'Pest Control': [
    'Licensed pest control services for homes and businesses. Safe and effective treatments.',
    'Professional exterminator offering pest control for roaches, ants, termites, and more.',
    'Expert pest control services with eco-friendly options and satisfaction guarantee.',
    'Reliable pest control contractor serving residential and commercial properties.',
    'Professional pest management services with preventive treatments and emergency response.'
  ]
};

async function generateDemoProviders() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/virgin_islands_providers'
  });

  try {
    console.log('🎯 Generating 100 realistic demo providers...');

    // Get existing categories and areas
    const categoriesRes = await pool.query('SELECT id, name FROM categories ORDER BY id');
    const areasRes = await pool.query('SELECT id, name, island FROM areas ORDER BY id');

    const categories = categoriesRes.rows;
    const areas = areasRes.rows;

    console.log(`📊 Found ${categories.length} categories and ${areas.length} areas`);

    const islands = ['STT', 'STJ', 'STX'];
    const statuses = ['OPEN_NOW', 'BUSY_LIMITED', 'NOT_TAKING_WORK'];
    const contactPreferences = ['PHONE', 'EMAIL', 'BOTH'];
    const plans = ['FREE', 'PREMIUM'];
    const badges = ['VERIFIED', 'GOV_APPROVED', 'EMERGENCY_READY'];

    let providerCount = 0;

    // Generate providers by category
    for (const category of categories) {
      const categoryName = category.name;
      if (!businessNames[categoryName]) continue;

      const names = businessNames[categoryName];
      const descs = descriptions[categoryName] || ['Professional service provider.'];

      // Generate 8-12 providers per category
      const numProviders = Math.floor(Math.random() * 5) + 8;

      for (let i = 0; i < numProviders && providerCount < 100; i++) {
        const name = names[i % names.length] + (i >= names.length ? ` ${i - names.length + 1}` : '');
        const description = descs[i % descs.length];
        const island = islands[Math.floor(Math.random() * islands.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const contactPreference = contactPreferences[Math.floor(Math.random() * contactPreferences.length)];
        const preferredContactMethod = ['CALL', 'WHATSAPP', 'SMS'][Math.floor(Math.random() * 3)];
        const plan = Math.random() < 0.3 ? 'PREMIUM' : 'FREE'; // 30% premium
        const isPremium = plan === 'PREMIUM';

        // Generate realistic phone and email
        const phoneBase = Math.floor(Math.random() * 900000) + 100000;
        const phone = `340-774-${phoneBase.toString().padStart(4, '0')}`;
        const email = `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`;

        // Hash password (using a simple one for demo)
        const salt = crypto.randomBytes(16).toString('hex');
        const passwordHash = crypto.pbkdf2Sync('demo123', salt, 1000, 64, 'sha512').toString('hex');
        const hashedPassword = `${salt}:${passwordHash}`;

        // Trial dates for premium users
        const trialStart = isPremium ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null;
        const trialEnd = trialStart ? new Date(trialStart.getTime() + 30 * 24 * 60 * 60 * 1000) : null;

        const client = await pool.connect();
        try {
          await client.query('BEGIN');

          // Insert provider
          const providerResult = await client.query(`
            INSERT INTO providers (
              name, email, password_hash, phone, whatsapp, island, plan, plan_source, trial_start_at, trial_end_at,
              contact_call_enabled, contact_whatsapp_enabled, contact_sms_enabled, preferred_contact_method,
              emergency_calls_accepted, contact_preference, status, profile,
              lifecycle_status, created_at, last_updated_at, status_last_updated_at,
              archived, typical_hours, is_disputed, disputed_at, reset_token, reset_token_expires
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
            RETURNING id
          `, [
            name, email, hashedPassword, phone, null, island, plan,
            isPremium ? 'TRIAL' : 'FREE', trialStart, trialEnd,
            true, true, true, preferredContactMethod,
            Math.random() < 0.7, contactPreference, status, JSON.stringify({ description }),
            'ACTIVE', new Date(), new Date(), new Date(),
            false, null, false, null, null, null
          ]);

          const providerId = providerResult.rows[0].id;

          // Add category
          await client.query('INSERT INTO provider_categories (provider_id, category_id) VALUES ($1, $2)',
            [providerId, category.id]);

          // Add 1-3 random areas in the same island
          const islandAreas = areas.filter(a => a.island === island);
          const numAreas = Math.floor(Math.random() * 3) + 1;
          const selectedAreas = islandAreas.sort(() => 0.5 - Math.random()).slice(0, numAreas);

          for (const area of selectedAreas) {
            await client.query('INSERT INTO provider_areas (provider_id, area_id) VALUES ($1, $2)',
              [providerId, area.id]);
          }

          // Add badges (20% chance for each)
          const providerBadges = badges.filter(() => Math.random() < 0.2);
          for (const badge of providerBadges) {
            await client.query('INSERT INTO provider_badges (provider_id, badge) VALUES ($1, $2)',
              [providerId, badge]);
          }

          // Add some activity events (1-20 events)
          const numEvents = Math.floor(Math.random() * 20) + 1;
          const eventTypes = ['LOGIN', 'PROFILE_UPDATED', 'STATUS_UPDATED', 'CUSTOMER_CALL', 'CUSTOMER_SMS', 'PROFILE_VIEW'];

          for (let j = 0; j < numEvents; j++) {
            const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
            const eventDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000); // Last 90 days

            await client.query('INSERT INTO activity_events (provider_id, event_type, created_at) VALUES ($1, $2, $3)',
              [providerId, eventType, eventDate]);
          }

          await client.query('COMMIT');
          providerCount++;

          if (providerCount % 10 === 0) {
            console.log(`✅ Created ${providerCount} providers...`);
          }

        } catch (error) {
          await client.query('ROLLBACK');
          console.error(`❌ Failed to create provider ${name}:`, error.message);
        } finally {
          client.release();
        }
      }
    }

    console.log(`🎉 Successfully created ${providerCount} demo providers!`);


  } catch (error) {
    console.error('❌ Failed to generate demo providers:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

generateDemoProviders().catch(console.error);