import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { Shelter, Alert } from '../models/types';

const snsClient = new SNSClient({ region: process.env.AWS_REGION || 'us-east-1' });

export class NotificationService {
  private topicArn = process.env.SHELTER_UPDATES_TOPIC || '';

  async broadcastShelterUpdate(shelter: Shelter, websocketEndpoint?: { domainName: string; stage: string }): Promise<void> {
    try {
      const message = {
        type: 'SHELTER_UPDATE',
        data: shelter,
        timestamp: new Date().toISOString()
      };

      await snsClient.send(new PublishCommand({
        TopicArn: this.topicArn,
        Message: JSON.stringify(message),
        Subject: `Shelter Update: ${shelter.name}`,
        MessageAttributes: {
          shelterId: {
            DataType: 'String',
            StringValue: shelter.shelterId
          },
          status: {
            DataType: 'String',
            StringValue: shelter.status
          },
          type: {
            DataType: 'String',
            StringValue: 'SHELTER_UPDATE'
          }
        }
      }));

      // Send via WebSocket if endpoint provided
      if (websocketEndpoint) {
        try {
          const { broadcastShelterUpdate } = await import('./webSocketService');
          await broadcastShelterUpdate(
            websocketEndpoint.domainName,
            websocketEndpoint.stage,
            shelter,
            shelter.shelterId
          );
        } catch (wsError) {
          console.error('WebSocket broadcast failed for shelter update:', wsError);
          // Don't throw - SNS succeeded, WebSocket is supplementary
        }
      }
    } catch (error) {
      console.error('Error broadcasting shelter update:', error);
      throw error;
    }
  }

  async broadcastAlert(alert: Alert, websocketEndpoint?: { domainName: string; stage: string }): Promise<void> {
    try {
      const message = {
        type: 'ALERT',
        data: alert,
        timestamp: new Date().toISOString()
      };

      await snsClient.send(new PublishCommand({
        TopicArn: this.topicArn,
        Message: JSON.stringify(message),
        Subject: `ALERT: ${alert.title}`,
        MessageAttributes: {
          alertId: {
            DataType: 'String',
            StringValue: alert.alertId
          },
          shelterId: {
            DataType: 'String',
            StringValue: alert.shelterId
          },
          priority: {
            DataType: 'String',
            StringValue: alert.priority
          },
          type: {
            DataType: 'String',
            StringValue: 'ALERT'
          }
        }
      }));

      // Send via WebSocket if endpoint provided
      if (websocketEndpoint) {
        try {
          const { broadcastAlert } = await import('./webSocketService');
          await broadcastAlert(
            websocketEndpoint.domainName,
            websocketEndpoint.stage,
            alert
          );
        } catch (wsError) {
          console.error('WebSocket broadcast failed for alert:', wsError);
          // Don't throw - SNS succeeded, WebSocket is supplementary
        }
      }
    } catch (error) {
      console.error('Error broadcasting alert:', error);
      throw error;
    }
  }

  async sendDirectNotification(message: string, phoneNumber?: string, email?: string): Promise<void> {
    // Implementation for direct SMS/email notifications
    // This would integrate with SNS for SMS and SES for email
    console.log('Direct notification:', { message, phoneNumber, email });
  }
}