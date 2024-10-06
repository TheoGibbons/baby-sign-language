const jsdom = require("jsdom");
const { PrismaClient } = require("@prisma/client");
const { JSDOM } = jsdom;
require('dotenv').config(); // Load environment variables

const SIGN_INDEX_URL = "https://babysignlanguage.com/dictionary-letter/?letter=#";

// Initialize Prisma client
const prisma = new PrismaClient();

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
    };
  });
};

const populateSignData = async function () {
  // Get all signs that need to be updated
  const signs = await prisma.signs.findMany({
    where: { description: null },
    orderBy: { slug: 'asc' },
    take: 2,
    select: {
      id: true,
      url: true,
    },
  });

  // Loop through signs and update them with new data
  for (const sign of signs) {
    try {
      // Fetch the sign page
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
      await prisma.signs.update({
        where: { id: sign.id },
        data: {
          name,
          description,
          image_url: imageUrl,
          youtube_url: youtubeLink,
          updated_at: new Date(),
        },
      });
    } catch (error) {
      console.error(`Error processing sign with ID ${sign.id}: `, error);
    }
  }
};

// Add or update signs in the database
const addToDatabase = async function (signUrls) {
  return Promise.all(
    signUrls.map(async (sign) => {
      // Check if the sign exists
      const existingSign = await prisma.signs.findUnique({
        where: { slug: sign.slug },
      });

      if (existingSign) {
        // Update existing sign
        await prisma.signs.update({
          where: { slug: sign.slug },
          data: {
            name: sign.name,
            url: sign.url,
            thumbnail_url: sign.thumbnailUrl,
            updated_at: new Date(),
          },
        });
      } else {
        // Insert new sign
        await prisma.signs.create({
          data: {
            name: sign.name,
            slug: sign.slug,
            url: sign.url,
            thumbnail_url: sign.thumbnailUrl,
            updated_at: new Date(),
          },
        });
      }
    })
  );
};

async function main() {
  // Fetch and process sign URLs
  let signUrls = await getSignUrls();

  // Add these signs to the database
  await addToDatabase(signUrls);

  // Populate more data for the signs
  await populateSignData();
}

main()
  .then(() => {
    console.log("done");
    prisma.$disconnect(); // Ensure Prisma disconnects when script is finished
  })
  .catch((e) => {
    console.error(e);
    prisma.$disconnect(); // Ensure Prisma disconnects on error
  });
