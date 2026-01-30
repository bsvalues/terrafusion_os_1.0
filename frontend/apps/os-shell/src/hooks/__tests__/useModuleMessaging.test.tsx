import { act, renderHook } from '@testing-library/react';
import { useMessageBusStore } from '../../stores/messageBusStore';
import { useModuleMessaging } from '../useModuleMessaging';

describe('useModuleMessaging', () => {
  beforeEach(() => {
    useMessageBusStore.setState({ messages: [], listeners: [] });
  });

  it('should allow a module to send and receive broadcast messages', () => {
    const senderId = 'sender-module';
    const receiverId = 'receiver-module';
    const eventName = 'TEST_EVENT';
    const payload = { data: 'hello' };

    // Setup receiver
    const { result: receiverResult } = renderHook(() => useModuleMessaging(receiverId));
    const receivedMessages: any[] = [];

    // Setup subscription
    renderHook(() =>
      receiverResult.current.useSubscription(eventName, (p, s) => {
        receivedMessages.push({ payload: p, source: s });
      })
    );

    // Setup sender
    const { result: senderResult } = renderHook(() => useModuleMessaging(senderId));

    // Send message
    act(() => {
      senderResult.current.sendMessage(eventName, payload);
    });

    // Verify
    expect(receivedMessages).toHaveLength(1);
    expect(receivedMessages[0]).toEqual({ payload, source: senderId });
  });

  it('should filter out messages sent by itself', () => {
    const moduleId = 'self-talker';
    const eventName = 'ECHO';

    const { result } = renderHook(() => useModuleMessaging(moduleId));
    const receivedMessages: any[] = [];

    renderHook(() =>
      result.current.useSubscription(eventName, (p) => {
        receivedMessages.push(p);
      })
    );

    act(() => {
      result.current.sendMessage(eventName, { data: 'echo' });
    });

    expect(receivedMessages).toHaveLength(0);
  });

  it('should handle direct messages correctly', () => {
    const senderId = 'sender';
    const targetId = 'target';
    const otherId = 'bystander';
    const eventName = 'SECRET';

    // Target setup
    const { result: targetResult } = renderHook(() => useModuleMessaging(targetId));
    const targetReceived: any[] = [];
    renderHook(() =>
      targetResult.current.useSubscription(eventName, (p) => targetReceived.push(p))
    );

    // Bystander setup
    const { result: bystanderResult } = renderHook(() => useModuleMessaging(otherId));
    const bystanderReceived: any[] = [];
    renderHook(() =>
      bystanderResult.current.useSubscription(eventName, (p) => bystanderReceived.push(p))
    );

    // Sender setup
    const { result: senderResult } = renderHook(() => useModuleMessaging(senderId));

    // Send direct message to target
    act(() => {
      senderResult.current.sendMessage(eventName, { secret: 'code' }, targetId);
    });

    expect(targetReceived).toHaveLength(1);
    expect(bystanderReceived).toHaveLength(0);
  });
});
