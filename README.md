# Salty Sol

A crypto-style betting platform with zero risk. Place your bets, watch epic battles, and climb the leaderboard!

## Features

- Real-time battles with animated fighters
- Live betting system
- Chat functionality
- Leaderboard tracking
- Beautiful UI with modern design
- Responsive layout for all devices

## Tech Stack

- Next.js 13+
- TypeScript
- Tailwind CSS
- Firebase (Realtime Database & Authentication)
- Phaser.js for game engine
- WebSocket for real-time updates

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/superduperrusobear/salty-sol.git
cd salty-sol
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
- Copy `.env.example` to `.env.local`
- Fill in your Firebase and other configuration details

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

This project is configured for deployment on Vercel:

1. Push your code to GitHub
2. Import your repository in Vercel
3. Configure environment variables in Vercel's project settings
4. Deploy!

## Environment Variables

Required environment variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_DATABASE_URL
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
