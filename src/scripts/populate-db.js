const jsdom = require("jsdom");
const {neon} = require("@neondatabase/serverless");
const {JSDOM} = jsdom;
require('dotenv').config();  // Load environment variables

const SIGN_INDEX_URL = "https://babysignlanguage.com/dictionary-letter/?letter=#";

const getSignUrls = async function () {

  // Fetch the index page
  const response = await fetch(SIGN_INDEX_URL);

  // Convert the HTML string into a document object
  const html = await response.text();
  const doc = new JSDOM(html).window.document;

  // Get all the sign links
  const cards = doc.querySelectorAll('.list-of-pages .single-letter-card');

  return Array.from(cards).map(card => {

    const href = card.querySelector('a').getAttribute('href');

    return {
      url: href,
      name: card.querySelector('p').textContent.trim(),
      slug: href.replace(/\/+$/g, '').split('/').pop().trim(),
      thumbnailUrl: card.querySelector('img').getAttribute('src')
    }
  });

}

const populateSignData = async function () {
  // get all signs in the database
  const sql = neon(process.env.DATABASE_URL);
  const signs = await sql`
      SELECT id, url
      FROM signs
      WHERE description IS NULL
      ORDER BY slug 
      LIMIT 2
  `;

  // Loop through signs and update them with the new data
  for (const sign of signs) {
    try {
      // Fetch the index page
      const response = await fetch(sign.url);

      if (!response.ok) {
        console.error(`Failed to fetch URL: ${sign.url}, Status: ${response.status}`);
        continue;
      }

      // Convert the HTML string into a document object
      const html = await response.text();
      const doc = new JSDOM(html).window.document;

      // Extract and populate data
      const name = doc.querySelector('h1.title')?.textContent?.trim() || 'Unknown';
      const description = doc.querySelector('.hero-content')?.textContent?.trim() || 'No description available';
      const imageUrl = doc.querySelector('.hero-right picture img')?.getAttribute('src') || '';
      const youtubeLink = doc.querySelector('#signvideo2')?.getAttribute('src') || '';

      // Update the sign in the database
      await sql`
          UPDATE signs
          SET name=${name},
              description=${description},
              image_url=${imageUrl},
              youtube_url=${youtubeLink},
              updated_at=NOW()
          WHERE id = ${sign.id}
      `;
    } catch (error) {
      console.error(`Error processing sign with ID ${sign.id}: `, error);
    }
  }
};

// const truncateSignsFromDatabase = async function () {
//   const sql = neon(process.env.DATABASE_URL);
//   await sql`TRUNCATE TABLE signs CASCADE`;
// }

const addToDatabase = async function (signUrls) {

  const sql = neon(process.env.DATABASE_URL);

  return Promise.all(signUrls.map(async (sign) => {

    const rows = await sql`
        SELECT slug
        FROM signs
        WHERE slug = ${sign.slug}
    `;

    if (rows.length > 0) {
      sql`
          UPDATE signs
          SET name=${sign.name},
              url=${sign.url},
              thumbnail_url=${sign.thumbnailUrl},
              updated_at=NOW()
          WHERE slug = ${sign}
      `
    } else {
      sql`
          INSERT INTO signs (name, slug, url, thumbnail_url, updated_at)
          VALUES (${sign.name}, ${sign.slug}, ${sign.url}, ${sign.thumbnailUrl}, NOW())
      `
    }
  }));

}

async function main() {

  // await truncateSignsFromDatabase();

  // Convert HTML to array of signs
  let signUrls = await getSignUrls();

  // Add these signs to the database
  await addToDatabase(signUrls)

  // populate more data for the signs
  await populateSignData();

}

main()
  .then(() => console.log("done"))
  .catch(e => console.error(e));