// Test script for agent message functionality
import { MemStorage } from '../../server/storage';
import { MessageEventType, MessagePriority, EntityType } from '@shared/schema';

async function testAgentMessages() {
  console.log('Testing agent message functionality...');

  // Create a new storage instance
  const storage = new MemStorage();

  // Create a test message
  const testMessage = {
    senderAgentId: 'data_quality',
    receiverAgentId: 'compliance',
    messageType: MessageEventType.EVENT,
    priority: MessagePriority.NORMAL,
    subject: 'Test Message',
    content: 'Test message content',
    entityType: EntityType.PROPERTY,
    entityId: 'PROP-123',
    status: 'pending',
    messageId: `msg-${Date.now()}`,
    conversationId: null,
  };

  try {
    // Test message creation
    console.log('Creating test message...');
    const createdMessage = await storage.createAgentMessage(testMessage);
    console.log('Message created:', createdMessage);

    // Test message retrieval by ID
    console.log('\nRetrieving message by ID...');
    const retrievedMessage = await storage.getAgentMessageById(createdMessage.id);
    console.log('Retrieved message:', retrievedMessage);

    // Test message retrieval by type
    console.log('\nRetrieving messages by type...');
    const messagesByType = await storage.getAgentMessagesByType(MessageEventType.EVENT);
    console.log('Messages by type:', messagesByType);

    // Test message retrieval by source agent
    console.log('\nRetrieving messages by source agent...');
    const messagesBySource = await storage.getAgentMessagesBySourceAgent('data_quality');
    console.log('Messages by source agent:', messagesBySource);

    // Test message retrieval by target agent
    console.log('\nRetrieving messages by target agent...');
    const messagesByTarget = await storage.getAgentMessagesByTargetAgent('compliance');
    console.log('Messages by target agent:', messagesByTarget);

    // Test message status update
    console.log('\nUpdating message status...');
    const updatedMessage = await storage.updateAgentMessageStatus(createdMessage.id, 'processed');
    console.log('Updated message:', updatedMessage);

    // Test entity-related message retrieval
    console.log('\nRetrieving messages for entity...');
    const entityMessages = await storage.getAgentMessagesForEntity(EntityType.PROPERTY, 'PROP-123');
    console.log('Entity messages:', entityMessages);

    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the tests
testAgentMessages().catch(error => {
  console.error('Error in test:', error);
});
