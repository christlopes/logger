# Logger

A Next.js application with Prisma and shadcn/ui.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up your environment variables:
```bash
cp .env.sample .env
```

The `.env` file is already configured for Docker. If you're using Docker (recommended), you don't need to change the `DATABASE_URL`.

3. Start the Docker database:
```bash
npm run docker:up
```

This will start a PostgreSQL 16 container named `logger-postgres` on port 5432.

4. Set up the database:
```bash
npm run prisma:migrate
npm run prisma:generate
```

5. (Optional) Seed the database:
```bash
npm run prisma:seed
```

6. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Docker Commands

- `npm run docker:up` - Start the database container
- `npm run docker:down` - Stop and remove the database container
- `npm run docker:logs` - View database logs
- `npm run docker:restart` - Restart the database container
- `npm run db:connect` - Connect to the database via psql

## Available Scripts

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier

### Database (Prisma)
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio
- `npm run prisma:seed` - Seed the database
- `npm run prisma:reset` - Reset the database (WARNING: deletes all data)

### Docker
- `npm run docker:up` - Start the database container
- `npm run docker:down` - Stop and remove the database container
- `npm run docker:logs` - View database logs
- `npm run docker:restart` - Restart the database container
- `npm run db:connect` - Connect to the database via psql

## Tech Stack

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Prisma** - Database ORM
- **shadcn/ui** - UI components
- **Tailwind CSS** - Styling

