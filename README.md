# Salty Sol - Crypto Battle Betting Platform

A SaltyBet-inspired platform for crypto-style betting with fake money. Watch battles unfold in real-time and place bets on your favorite contestants!

## Features

- Real-time battle updates using WebSocket
- Fake cryptocurrency betting system
- User authentication and balance management
- Battle history tracking
- Live odds calculation
- Responsive web interface

## Tech Stack

- Frontend: Next.js with TypeScript
- State Management: Redux Toolkit
- Styling: Tailwind CSS
- Real-time: Socket.IO
- Backend: Firebase (Authentication, Firestore, Realtime Database)

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with your Firebase configuration:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=your-database-url
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

- `/src`
  - `/components` - React components
  - `/store` - Redux store configuration and slices
  - `/services` - WebSocket and Firebase services
  - `/lib` - Utility functions and configurations
  - `/pages` - Next.js pages and API routes

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License.
