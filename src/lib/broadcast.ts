import type { DormState } from "@/data/types";

const CHANNEL_NAME = "dormmate_sync";

let channel: BroadcastChannel | null = null;
let channelClosed = true;

export function initBroadcast(onMessage: (state: DormState) => void): void {
  try {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channelClosed = false;
    channel.onmessage = (event) => {
      if (event.data.type === "state_update") {
        onMessage(event.data.state);
      }
    };
  } catch {
    // BroadcastChannel not supported, fallback to storage event
  }
}

export function broadcastStateUpdate(state: DormState): void {
  if (!channel || channelClosed) return;

  try {
    channel.postMessage({ type: "state_update", state });
  } catch (error) {
    console.warn("Broadcast channel unavailable", error);
  }
}

export function closeBroadcast(): void {
  if (channel) {
    channel.close();
    channelClosed = true;
  }
}
