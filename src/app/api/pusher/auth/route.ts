import { NextRequest, NextResponse } from "next/server";
import { pusherServer } from "@/app/utils/pusher";

export async function POST(req: NextRequest) {
  try {
    const data = await req.text();
    const [socketIdParam, channelNameParam, userIdParam] = data.split('&');
    
    // Parse URL encoded body
    const params = new URLSearchParams(data);
    const socketId = params.get('socket_id');
    const channelName = params.get('channel_name');
    
    // We expect the client to send user_id in the auth request body for presence channels
    const userId = params.get('user_id');

    if (!socketId || !channelName) {
      return new NextResponse("Missing socket_id or channel_name", { status: 400 });
    }

    if (channelName.startsWith("presence-")) {
      if (!userId) {
        return new NextResponse("Missing user_id for presence channel", { status: 400 });
      }
      
      const presenceData = {
        user_id: userId,
        user_info: {
          id: userId
        }
      };
      
      const authResponse = pusherServer.authorizeChannel(socketId, channelName, presenceData);
      return NextResponse.json(authResponse);
    } 
    
    // For private channels
    const authResponse = pusherServer.authorizeChannel(socketId, channelName);
    return NextResponse.json(authResponse);
    
  } catch (error) {
    console.error("Pusher auth error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
