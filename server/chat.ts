import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { storage } from "./storage";
import { InsertMessage } from "@shared/schema";

interface ChatMessage {
  type: string;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp: Date;
}

interface Client {
  userId: number;
  socket: WebSocket;
}

export function setupWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  const clients: Client[] = [];

  wss.on('connection', (ws: WebSocket) => {
    let userId: number | null = null;

    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        
        // Handle authentication
        if (data.type === 'auth') {
          userId = data.userId;
          clients.push({ userId, socket: ws });
          ws.send(JSON.stringify({ type: 'auth_success' }));
          return;
        }
        
        // Ensure user is authenticated before allowing other operations
        if (!userId) {
          ws.send(JSON.stringify({ type: 'error', message: 'You must authenticate first' }));
          return;
        }

        // Handle chat messages
        if (data.type === 'message') {
          const messageData: InsertMessage = {
            receiverId: data.receiverId,
            content: data.content,
          };
          
          // Store message in database
          const savedMessage = await storage.createMessage(messageData, userId);
          
          // Prepare message for sending to clients
          const chatMessage: ChatMessage = {
            type: 'message',
            senderId: userId,
            receiverId: data.receiverId,
            content: data.content,
            timestamp: savedMessage.createdAt,
          };
          
          // Send to sender to confirm receipt
          ws.send(JSON.stringify(chatMessage));
          
          // Send to receiver if online
          const receiverClient = clients.find(client => client.userId === data.receiverId);
          if (receiverClient && receiverClient.socket.readyState === WebSocket.OPEN) {
            receiverClient.socket.send(JSON.stringify(chatMessage));
          }
        }
        
        // Handle message history requests
        if (data.type === 'get_messages') {
          const { otherUserId } = data;
          const messages = await storage.getMessages(userId, otherUserId);
          
          ws.send(JSON.stringify({
            type: 'message_history',
            messages: messages.map(msg => ({
              senderId: msg.senderId,
              receiverId: msg.receiverId,
              content: msg.content,
              timestamp: msg.createdAt,
              isRead: msg.isRead,
            })),
          }));
        }
      } catch (error) {
        console.error('Error processing message:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Failed to process message' }));
      }
    });

    ws.on('close', () => {
      if (userId) {
        const index = clients.findIndex(client => client.userId === userId);
        if (index !== -1) {
          clients.splice(index, 1);
        }
      }
    });
  });

  return wss;
}
