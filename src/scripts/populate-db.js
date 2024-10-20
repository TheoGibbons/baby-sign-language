const jsdom = require("jsdom");
const {PrismaClient} = require("@prisma/client");
const {JSDOM} = jsdom;
require('dotenv').config(); // Load environment variables
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const {v4: uuidv4} = require('uuid');
const sharp = require('sharp');

const SIGN_INDEX_URL = "https://babysignlanguage.com/dictionary-letter/?letter=#";
let fetchCount = 0;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Initialize Prisma client
const prisma = new PrismaClient();

/**
 *  Some of the URL's are broken and need to be fixed
 *  EG: .../breastfeed-preview-png.png SHOULD BE .../breast-feed-preview-png.png
 */
const urlFix = function (url) {

  // Failed to fetch URL: http://res.cloudinary.com/spiralyze/image/upload/f_auto,w_auto/BabySignLanguage/DictionaryPages/band_aid-preview-png.png, Status: 404
  url = url.replace(/breastfeed-preview-png.png/g, 'breast-feed-preview-png.png');
  url = url.replace(/band_aid-preview-png.png/g, 'band-aid-preview-png.png');
  url = url.replace(/cereal-preview-png.png/g, 'cereal-preview.png');
  url = url.replace(/cents-preview-png.png/g, 'cents-preview.png');
  url = url.replace(/pacifier-preview-png.png/g, 'pacifier-preview.png');
  url = url.replace(/come-preview-png.png/g, 'come-preview.png');
  url = url.replace(/helicopter-preview-png.png/g, 'helicopter-preview.png');
  url = url.replace(/flower-preview-png.png/g, 'flower-preview.png');

  url = url.replace(/fall_autumn_.svg/g, 'fall_autumn.svg');
  url = url.replace(/fall_verb_.svg/g, 'fall_verb.svg');
  url = url.replace(/hit_a_person_.svg/g, 'hit_a_person.svg');
  url = url.replace(/hit_a_ball_.svg/g, 'hit_a_ball.svg');
  url = url.replace(/letter_mail_.svg/g, 'letter_mail.svg');
  url = url.replace(/march_verb_.svg/g, 'march_verb.svg');
  url = url.replace(/tear_rip_.svg/g, 'tear_rip.svg');
  url = url.replace(/text_sms_.svg/g, 'text_sms.svg');

  return url;
}

const getFileContents = async function (url, asText = true, sleepTime = 0) {

  url = url.startsWith('//') ? `http:${url}` : url;
  const extension = /\/[^\/.]*?\.[a-zA-Z0-9]{1,4}$/.test(url) ? url.split('.').pop() : 'html';

  const cacheKey = url.replace(/[^a-zA-Z0-9]/g, '');
  const cacheDir = path.join(__dirname, '../cache');
  const cachePath = path.join(cacheDir, `${cacheKey}.${extension}`);

  // Ensure the cache directory exists
  if (!fs.existsSync(cacheDir)) {
    const err = `Cache directory does not exist: ${cacheDir}`;
    console.error(err);
    throw new Error(err);
  }

  if (fs.existsSync(cachePath)) {
    return {
      contents: fs.readFileSync(cachePath),
      fromCache: true
    };
  } else {
    if (sleepTime) {
      await sleep(sleepTime);
    }

    const response = await fetch(url);
    fetchCount++;

    if (!response.ok) {
      const err = `Failed to fetch URL: ${url}, Status: ${response.status}`;
      console.error(err);
      throw new Error(err);
    }

    let contents;
    // If it's a binary file (like an image)
    if (asText) {
      contents = await response.text();
    } else {
      contents = Buffer.from(await response.arrayBuffer());
    }

    // Insert into cache
    fs.writeFileSync(cachePath, contents);

    return {
      contents: contents,
      fromCache: false
    };
  }
};

const createOrGetFileFromUrl = async function (url) {

  url = urlFix(url);

  // Check if the file already exists
  const existingFile = await prisma.files.findFirst({
    where: {url},
  });

  if (existingFile) {
    return existingFile;
  }

  const {contents} = await getFileContents(url, false, 2000);
  const fileId = uuidv4();
  const extension = mime.extension(mime.lookup(url));
  const localPath = path.join(__dirname, '../files', `${fileId}.${extension}`);

  // Save the file locally
  fs.writeFileSync(localPath, contents);

  // Get file metadata
  const {size} = fs.statSync(localPath);
  const {width, height} = await sharp(localPath).metadata();

  // Create a new row in the files table
  return await prisma.files.create({
    data: {
      id: fileId,
      url,
      local_path: localPath,
      size: size.toString(),
      width: width.toString(),
      height: height.toString(),
      extension,
      mime: mime.lookup(url),
    },
  });
}

const getSignUrls = async function () {

  // Fetch the index page
  const {contents} = await getFileContents(SIGN_INDEX_URL, true);

  // Convert the HTML string into a document object
  const doc = new JSDOM(contents).window.document;

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
    where: {description: null},
    orderBy: {slug: 'asc'},
    // take: 100,
    select: {
      id: true,
      url: true,
    },
  });

  let count = 0;
  const totalCount = signs.length;

  // Loop through signs and update them with new data
  for (const sign of signs) {
    try {
      const times = {}
      let start;
      start = performance.now();
      const {contents} = await getFileContents(sign.url, true, 2000);
      times.getFileContents = performance.now() - start;

      // Convert the HTML string into a document object
      start = performance.now();
      const doc = new JSDOM(contents).window.document;
      times.JSDOM = performance.now() - start;

      // Extract and populate data
      start = performance.now();
      const name = doc.querySelector('h1.title')?.textContent?.trim() || 'Unknown';
      const description = doc.querySelector('.hero-content')?.textContent?.trim() || 'No description available';
      const imageUrl = doc.querySelector('.hero-right picture img')?.getAttribute('src') || '';
      const youtubeLink = doc.querySelector('#signvideo2')?.getAttribute('src') || '';
      times.extractData = performance.now() - start;

      // Create or retrieve the thumbnail file
      start = performance.now();
      const thumbnailFile = await createOrGetFileFromUrl(imageUrl);
      times.createOrGetFileFromUrl = performance.now() - start;

      start = performance.now();
      // Update the sign in the database
      await prisma.signs.update({
        where: {id: sign.id},
        data: {
          name,
          description,
          youtube_url: youtubeLink,
          updated_at: new Date(),
          imageFile: {
            connect: {id: thumbnailFile.id}, // Connect the existing file by ID
          },
        },
      });
      times.updateSign = Math.round(performance.now() - start);

      count++;

      //order times
      const orderedTimes = Object.keys(times).sort((a, b) => times[b] - times[a]).reduce((obj, key) => {
        obj[key] = times[key];
        return obj;
      }, {});

      console.log(`Updated ${count}/${totalCount} | Network requests (total): ${fetchCount} | time remaining: ${Math.round((totalCount - count) * 2 / 60)} minutes | ${name}`, JSON.stringify(orderedTimes));

      // if (fetchCount > 2000) {
      //   break;
      // }

    } catch (error) {
      console.error(`Error processing sign with ID ${sign.id}: `, error);
    }
  }

  console.log(`\nDone.\n\nSuccessfully updated ${count} signs`);
  if (count === totalCount) {
    console.log(`All ${totalCount} signs have been updated.`);
  } else {
    console.log(`WARNING: NOT ALL SIGNS HAVE BEEN UPDATED. Only ${count} out of ${totalCount} signs have been updated.`);
  }
};

// Add or update signs in the database
const addToDatabase = async function (signUrls, batchSize = 10) {
  // Process in batches to avoid overwhelming the connection pool
  for (let i = 0; i < signUrls.length; i += batchSize) {
    const batch = signUrls.slice(i, i + batchSize); // Create a batch of records

    // Execute the batch
    await Promise.all(
      batch.map(async (sign) => {

        if (sign.slug === 'x-ray') {
          // Xray has some broken images so we skip it
          console.log(`Skipping sign: ${sign.name}`);
          return;
        }

        // Check if the sign exists
        const existingSign = await prisma.signs.findUnique({
          where: {slug: sign.slug},
        });

        // Create or retrieve the thumbnail file
        const thumbnailFile = await createOrGetFileFromUrl(sign.thumbnailUrl);

        // Define sign table data
        const signTableData = {
          name: sign.name,
          slug: sign.slug,
          url: sign.url,
          updated_at: new Date(),
          thumbnailFile: {
            connect: {id: thumbnailFile.id}, // Connect the existing file by ID
          },
        };

        // Perform the update or create logic
        if (existingSign) {
          // Update existing sign
          await prisma.signs.update({
            where: {slug: sign.slug},
            data: signTableData,
          });
          console.log(`Updated sign: ${sign.name}`);
        } else {
          // Insert new sign
          await prisma.signs.create({
            data: signTableData,
          });
          console.log(`Added sign: ${sign.name}`);
        }
      })
    );
  }
};

async function main() {

  const start = Date.now();

  // Fetch and process sign URLs
  console.log('Fetching sign URLs...');
  let signUrls = await getSignUrls();
  console.log(`Fetched ${signUrls.length} sign URLs\n\n`);

  // Add these signs to the database
  console.log('Adding signs to the database...');
  await addToDatabase(signUrls);
  console.log(`Added signs to the database\n\n`);

  // Populate more data for the signs
  console.log('Populating sign data...');
  await populateSignData();
  console.log(`Populated sign data\n\n`);

  console.log(`Total time: ${(Date.now() - start) / 1000}s`);
}

main()
  .then(() => {
    console.log(`Done with ${fetchCount} network requests`);
    prisma.$disconnect(); // Ensure Prisma disconnects when script is finished
  })
  .catch((e) => {
    console.error(e);
    prisma.$disconnect(); // Ensure Prisma disconnects on error
  });
