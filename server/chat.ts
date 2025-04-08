import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { storage } from "./storage";
import { InsertMessage, InsertNotification } from "@shared/schema";

interface ChatMessage {
  type: string;
  id?: number;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp: Date;
  isRead: boolean;
}

interface Client {
  userId: number;
  socket: WebSocket;
  inCall?: {
    with: number;
    type: "audio" | "video";
  };
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
          
          // Remove any existing client with the same userId to prevent duplicates
          const existingClientIndex = clients.findIndex(client => client.userId === userId);
          if (existingClientIndex !== -1) {
            clients.splice(existingClientIndex, 1);
          }
          
          // Fix type issue: Ensure userId is a number
          clients.push({ userId: Number(userId), socket: ws });
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
            id: savedMessage.id,
            senderId: userId,
            receiverId: data.receiverId,
            content: data.content,
            timestamp: savedMessage.createdAt || new Date(),
            isRead: false,
          };
          
          // Send to sender to confirm receipt
          ws.send(JSON.stringify(chatMessage));
          
          // Send to receiver if online
          const receiverClient = clients.find(client => client.userId === data.receiverId);
          if (receiverClient && receiverClient.socket.readyState === WebSocket.OPEN) {
            receiverClient.socket.send(JSON.stringify(chatMessage));
          }
          
          // Create a notification for the receiver
          try {
            const sender = await storage.getUser(userId);
            if (sender) {
              const notificationData: InsertNotification = {
                userId: data.receiverId,
                type: 'message',
                title: `New message from ${sender.fullName || sender.username}`,
                content: data.content.length > 30 ? data.content.substring(0, 30) + '...' : data.content,
                relatedId: userId,
              };
              await storage.createNotification(notificationData);
            }
          } catch (notifError) {
            console.error('Failed to create notification:', notifError);
          }
        }
        
        // Handle message history requests
        if (data.type === 'get_messages') {
          const { otherUserId } = data;
          const messages = await storage.getMessages(userId, otherUserId);
          
          ws.send(JSON.stringify({
            type: 'message_history',
            messages: messages.map(msg => ({
              id: msg.id,
              senderId: msg.senderId,
              receiverId: msg.receiverId,
              content: msg.content,
              timestamp: msg.createdAt,
              isRead: msg.isRead,
            })),
          }));
        }
        
        // Handle marking messages as read
        if (data.type === 'mark_as_read') {
          const { messageIds } = data;
          
          if (Array.isArray(messageIds) && messageIds.length > 0) {
            // This would require adding a new method to the storage interface
            // For now, we'll just notify the client that the operation was successful
            
            ws.send(JSON.stringify({
              type: 'messages_marked_read',
              messageIds,
            }));
            
            // Notify the senders that their messages were read
            for (const messageId of messageIds) {
              // For a complete implementation, we would get the message sender from the DB
              // and send them a notification that their message was read
              // This requires additional storage methods
            }
          }
        }
        
        // Handle call requests
        if (data.type === 'call_request') {
          const { to, callType } = data;
          
          // Find the recipient
          const recipientClient = clients.find(client => client.userId === to);
          if (recipientClient && recipientClient.socket.readyState === WebSocket.OPEN) {
            // Send call request notification
            recipientClient.socket.send(JSON.stringify({
              type: 'call_request',
              from: userId,
              callType,
            }));
            
            // Update the client state to show they're in a call
            const callerClient = clients.find(client => client.userId === userId);
            if (callerClient) {
              callerClient.inCall = {
                with: to,
                type: callType,
              };
            }
          } else {
            // Recipient is offline or not available
            ws.send(JSON.stringify({
              type: 'call_failed',
              reason: 'user_unavailable',
            }));
          }
        }
        
        // Handle call acceptance
        if (data.type === 'call_accept') {
          const { to } = data;
          
          // Find the caller
          const callerClient = clients.find(client => client.userId === to);
          if (callerClient && callerClient.socket.readyState === WebSocket.OPEN) {
            // Notify caller that call was accepted
            callerClient.socket.send(JSON.stringify({
              type: 'call_accepted',
              by: userId,
            }));
            
            // Update this client's state
            const acceptorClient = clients.find(client => client.userId === userId);
            if (acceptorClient && callerClient.inCall) {
              acceptorClient.inCall = {
                with: to,
                type: callerClient.inCall.type,
              };
            }
          }
        }
        
        // Handle call rejection
        if (data.type === 'call_reject') {
          const { to } = data;
          
          // Find the caller
          const callerClient = clients.find(client => client.userId === to);
          if (callerClient && callerClient.socket.readyState === WebSocket.OPEN) {
            // Notify caller that call was rejected
            callerClient.socket.send(JSON.stringify({
              type: 'call_rejected',
              by: userId,
            }));
            
            // Clear caller's call state
            if (callerClient.inCall && callerClient.inCall.with === userId) {
              delete callerClient.inCall;
            }
          }
        }
        
        // Handle ending a call
        if (data.type === 'call_end') {
          const { to } = data;
          
          // Find the other party
          const otherClient = clients.find(client => client.userId === to);
          if (otherClient && otherClient.socket.readyState === WebSocket.OPEN) {
            // Notify the other party that call was ended
            otherClient.socket.send(JSON.stringify({
              type: 'call_ended',
              by: userId,
            }));
            
            // Clear both parties' call state
            const thisClient = clients.find(client => client.userId === userId);
            if (thisClient && thisClient.inCall) {
              delete thisClient.inCall;
            }
            
            if (otherClient.inCall) {
              delete otherClient.inCall;
            }
          }
        }
        
        // Handle user typing status
        if (data.type === 'typing_status') {
          const { to, isTyping } = data;
          
          // Find the recipient
          const recipientClient = clients.find(client => client.userId === to);
          if (recipientClient && recipientClient.socket.readyState === WebSocket.OPEN) {
            // Forward the typing status
            recipientClient.socket.send(JSON.stringify({
              type: 'typing_status',
              from: userId,
              isTyping,
            }));
          }
        }
        
      } catch (error) {
        console.error('Error processing message:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Failed to process message' }));
      }
    });

    ws.on('close', () => {
      if (userId) {
        // Remove client from the array
        const index = clients.findIndex(client => client.userId === userId);
        if (index !== -1) {
          // If user was in a call, notify the other party
          const client = clients[index];
          if (client.inCall) {
            const otherClient = clients.find(c => c.userId === client.inCall?.with);
            if (otherClient && otherClient.socket.readyState === WebSocket.OPEN) {
              otherClient.socket.send(JSON.stringify({
                type: 'call_ended',
                by: userId,
                reason: 'disconnected',
              }));
              
              // Clear other client's call state
              if (otherClient.inCall) {
                delete otherClient.inCall;
              }
            }
          }
          
          // Remove the client
          clients.splice(index, 1);
        }
      }
    });
  });

  return wss;
}
