export function encodeWAV(buffer: AudioBuffer): Blob {
  const numCh = buffer.numberOfChannels, sampleRate = buffer.sampleRate, frames = buffer.length;
  const bytesPerSample = 2, blockAlign = numCh * bytesPerSample, dataSize = frames * blockAlign;
  const headerSize = 44, ab = new ArrayBuffer(headerSize + dataSize), dv = new DataView(ab);
  let p = 0; const writeStr = (s:string)=>{ for(let i=0;i<s.length;i++) dv.setUint8(p++, s.charCodeAt(i)); };
  const writeU32 = (v:number)=>{ dv.setUint32(p, v, true); p+=4; };
  const writeU16 = (v:number)=>{ dv.setUint16(p, v, true); p+=2; };
  writeStr('RIFF'); writeU32(36 + dataSize); writeStr('WAVE'); writeStr('fmt '); writeU32(16);
  writeU16(1); writeU16(numCh); writeU32(sampleRate); writeU32(sampleRate*blockAlign); writeU16(blockAlign); writeU16(16);
  writeStr('data'); writeU32(dataSize);
  // interleave
  const channels = Array.from({length:numCh}, (_,i)=>buffer.getChannelData(i));
  for(let i=0;i<frames;i++){
    for(let ch=0;ch<numCh;ch++){
      let s = Math.max(-1, Math.min(1, channels[ch][i]));
      dv.setInt16(p, s < 0 ? s*0x8000 : s*0x7FFF, true); p+=2;
    }
  }
  return new Blob([ab], { type: 'audio/wav' });
}

