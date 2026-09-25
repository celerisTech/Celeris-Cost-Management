import Pusher from "pusher";

// Make sure to replace these in your .env file
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID || "YOUR_APP_ID",
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || "YOUR_KEY",
  secret: process.env.PUSHER_SECRET || "YOUR_SECRET",
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap2", // Replace with your cluster (e.g. mt1, eu, ap2)
  useTLS: true,
});
