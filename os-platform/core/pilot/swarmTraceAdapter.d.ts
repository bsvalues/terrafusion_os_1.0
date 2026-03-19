import type { SwarmEventPayload } from '../types/swarm.js';

type SwarmFailurePayload = SwarmEventPayload & { reason: string };

export declare function onSwarmDispatch(payload: SwarmEventPayload): string;
export declare function onSwarmComplete(payload: SwarmEventPayload): void;
export declare function onSwarmFail(payload: SwarmFailurePayload): void;
