import { encodeWAV } from "./wav-encoder"; // tiny helper below

export async function renderBoot(tokens:any){
  const ac = new OfflineAudioContext(2, 48000*2, 48000);
  const make = (f:number, t0:number, dur:number, type:OscillatorType='sine', g=0.18)=>{
    const o = ac.createOscillator(), gain = ac.createGain();
    o.type = type; o.frequency.value = f; gain.gain.value = g;
    o.connect(gain).connect(ac.destination);
    o.start(t0); o.stop(t0 + dur);
    gain.gain.setTargetAtTime(0, t0 + dur*0.8, 0.05);
  };
  const base = tokens.baseHz;
  const semis = tokens.bootChord; // [0,7,12]
  semis.forEach((semi:number,i:number) => {
    const f = base*Math.pow(2, semi/12);
    make(f, 0.05 + i*0.09, 0.5 + i*0.1, i===2?'sine':'triangle', 0.18);
  });
  const buf = await ac.startRendering();
  return encodeWAV(buf);
}

// Minimal WAV encoder (PCM16)
export function wavLink(blob: Blob, name='terrafusion-boot.wav'){
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
}

