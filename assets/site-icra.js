'use strict';
document.querySelectorAll('.thought-panel').forEach(panel => {
  const stage=panel.closest('.video-stage'), video=stage.querySelector('video');
  const card=stage.closest('.demo-card'), checkbox=card.querySelector('.thought-toggle input');
  if (video.dataset.reasoningSrc) {
    // Bake the existing artwork into the video so native fullscreen keeps it.
    panel.hidden=true;
    checkbox.addEventListener('change', () => {
      const time=video.currentTime, rate=video.playbackRate, playing=!video.paused;
      const previous=video.currentSrc, checked=checkbox.checked;
      checkbox.disabled=true;
      function failed() {
        video.removeEventListener('loadedmetadata',ready);
        checkbox.checked=!checked;checkbox.disabled=false;
        video.src=previous;video.load();
      }
      function ready() {
        video.removeEventListener('error',failed);
        video.currentTime=Math.min(time,Math.max(0,video.duration-.001));
        video.defaultPlaybackRate=rate;video.playbackRate=rate;
        checkbox.disabled=false;
        if (playing) video.play().catch(()=>{});
      }
      video.addEventListener('loadedmetadata',ready,{once:true});
      video.addEventListener('error',failed,{once:true});
      video.src=checked?video.dataset.reasoningSrc:video.dataset.cleanSrc;
      video.load();
    });
    return;
  }
  const cues=window.THoughts[stage.dataset.record];
  let last=null;
  function update() {
    const cue=cues.findLast(c=>c.time<=video.currentTime);
    panel.hidden=!checkbox.checked || !cue;
    if (!cue || cue===last) return;
    last=cue;
    const image=panel.querySelector('.thought-artwork');
    image.src=cue.image;
    image.alt='Qwen · Navigation Agent\n'+cue.lines.join('\n');
  }
  ['timeupdate','seeked','loadedmetadata'].forEach(event=>video.addEventListener(event,update));
  if(video.requestVideoFrameCallback){
    const tick=()=>{update();video.requestVideoFrameCallback(tick);};
    video.requestVideoFrameCallback(tick);
  }
  checkbox.addEventListener('change',update);
  update();
});
document.querySelectorAll('select[data-video]').forEach(select => {
  select.addEventListener('change', () => {
    const video=select.closest('.demo-card').querySelector('video');
    video.defaultPlaybackRate=Number(select.value);
    video.playbackRate=Number(select.value);
  });
});
document.querySelectorAll('video').forEach(video => {
  video.defaultPlaybackRate = 1;
  video.addEventListener('play', () => {
    const pair = video.closest('[data-play-together]');
    document.querySelectorAll('video').forEach(other => {
      if (other !== video && (!pair || other.closest('[data-play-together]') !== pair)) other.pause();
    });
  });
});
document.querySelectorAll('.pair-play').forEach(button => {
  button.addEventListener('click', async () => {
    const pair=button.closest('[data-play-together]');
    pair.querySelectorAll('select').forEach(select => { select.value='1'; });
    try {
      await Promise.all([...pair.querySelectorAll('video')].map(video => {
        video.defaultPlaybackRate=1;video.playbackRate=1;video.currentTime=0;return video.play();
      }));
    } catch (_) { button.textContent='Use each video’s play button'; }
  });
});
