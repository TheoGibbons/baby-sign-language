# Baby Sign Language

This is a [Next.js](https://nextjs.org/) project

## Getting Started

1. **Update `.env`:**
   ```dotenv
   DATABASE_URL='postgresql://[user[:password]@][host][:port][/dbname][?param1=value1&param2=value2]'
   NEXT_PUBLIC_CACHE_VERSION=1
   ```

2. **Run database migrations:**
   ```sh
   npx prisma migrate dev
   ```

3. **Populate the database:**
   ```sh
   npm run populate-db
   ```

4. **Start the development server:**
   ```sh
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000).

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
```