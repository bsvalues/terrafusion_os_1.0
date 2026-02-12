declare module 'node-wav' {
  export interface WavFileData {
    sampleRate: number;
    bitDepth: number;
    channels: number;
    length: number;
    channelData: Float32Array[];
  }

  export function decode(buffer: Buffer): WavFileData;
  export function encode(
    channelData: Float32Array[],
    options: { sampleRate: number; bitDepth: number; channels: number }
  ): Buffer;
}
