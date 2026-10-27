'use strict';

const videoCases = [
  {
    id: 'test-01', number: '01', title: '室内台架测试', type: '实验记录 / 约束台架', duration: '00:36',
    description: '在室内支架与导轨约束下观察样机的姿态、旋翼倾转和升降响应，检查机构与控制的协同工作。',
    focus: '留意旋翼倾转动作和机体姿态变化。该段为受约束台架测试，与室外飞行试验分开展示。',
    meta: '支架约束 · 姿态与升降响应'
  },
  {
    id: 'test-02', number: '02', title: '室外起飞测试', type: '实验记录 / 起飞与爬升', duration: '00:13',
    description: '记录样机从草地起飞并逐步爬升的过程，展示实物平台的飞行响应。',
    focus: '观察离地、低空爬升及空中姿态。此段展示起飞过程，不用于判定对桨断电的具体时刻。',
    meta: '草地起飞 · 空中姿态'
  },
  {
    id: 'test-03', number: '03', title: '双旋翼降级降落', type: '实验记录 / 降级着陆', duration: '00:08',
    description: '展示对桨停转工况下的室外下降与着陆记录，对应项目介绍中的降级飞行试验。',
    focus: '观察下降过程中的机体姿态和最后接地状态。视频未叠加电机转速与控制日志，不能从画面确定精确切换时刻。',
    meta: '对桨停转工况 · 下降与着陆'
  },
  {
    id: 'intro', number: '概览', title: '项目介绍', type: '项目概览 / 结构与原理', duration: '01:38',
    description: '通过结构动画、倾转原理和样机试验剪辑，介绍独立倾转旋翼的设计思路与项目过程。',
    focus: '先看固定桨轴与倾转桨轴的区别，再看对桨停转后的构型。约 00:26 进入结构原理，01:05 后展示实物试验。',
    meta: '设计背景 · 结构动画 · 实物展示'
  }
];

const player = document.getElementById('player');
const playlist = document.getElementById('playlist');
const errorNote = document.getElementById('video-error');
const videoLink = document.getElementById('video-link');
let selectedId = null;

for (const item of videoCases) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'video-item';
  button.dataset.videoId = item.id;
  button.setAttribute('aria-current', 'false');
  button.setAttribute('aria-label', `${item.title}，${item.duration}`);
  button.innerHTML = `<span class="video-thumb"><img src="media/${item.id}.jpg" alt="" width="1280" height="720" loading="lazy"><span class="video-duration">${item.duration}</span></span><span class="video-item-copy"><span class="video-index">${item.id === 'intro' ? '项目介绍' : '实验 ' + item.number}</span><span class="video-item-title">${item.title}</span><span class="video-item-meta">${item.meta}</span></span><span class="video-item-play" aria-hidden="true">↗</span>`;
  button.addEventListener('click', () => selectVideo(item.id, true));
  playlist.appendChild(button);
}

function selectVideo(id, updateLocation = false) {
  const item = videoCases.find(video => video.id === id) || videoCases[0];
  if (selectedId !== item.id) {
    player.pause();
    player.poster = `media/${item.id}.jpg`;
    player.src = `media/${item.id}.mp4`;
    player.setAttribute('aria-label', item.title);
    player.setAttribute('aria-busy', 'true');
    errorNote.hidden = true;
    player.load();
    selectedId = item.id;
  }
  document.getElementById('video-title').textContent = item.title;
  document.getElementById('video-type').textContent = item.type;
  document.getElementById('video-description').textContent = item.description;
  document.getElementById('video-focus').textContent = item.focus;
  videoLink.href = `media/${item.id}.mp4`;
  for (const button of playlist.querySelectorAll('[data-video-id]')) {
    button.setAttribute('aria-current', String(button.dataset.videoId === item.id));
  }
  if (updateLocation && location.protocol !== 'file:') {
    const url = new URL(location.href);
    url.searchParams.set('video', item.id);
    history.replaceState(null, '', url);
  }
}

player.addEventListener('loadedmetadata', () => player.removeAttribute('aria-busy'));
player.addEventListener('error', () => {
  player.removeAttribute('aria-busy');
  errorNote.hidden = false;
});
playlist.addEventListener('keydown', event => {
  const buttons = [...playlist.querySelectorAll('button')];
  const index = buttons.indexOf(document.activeElement);
  if (index < 0) return;
  let next;
  if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % buttons.length;
  if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index - 1 + buttons.length) % buttons.length;
  if (event.key === 'Home') next = 0;
  if (event.key === 'End') next = buttons.length - 1;
  if (next !== undefined) {
    event.preventDefault();
    buttons[next].focus();
    buttons[next].click();
  }
});
document.querySelectorAll('[data-video]').forEach(link => {
  link.addEventListener('click', () => selectVideo(link.dataset.video, true));
});
window.addEventListener('popstate', () => selectVideo(new URLSearchParams(location.search).get('video')));
selectVideo(new URLSearchParams(location.search).get('video'));

const modes = {
  normal: {
    title: '正常构型 · 四旋翼协同',
    description: '四个旋翼参与控制。姿态反馈生成力矩需求，分配器结合各旋翼位置与倾转方向，生成电机和舵机指令。',
    actuators: '4 个电机 + 4 个倾转舵机',
    label: '正常构型示意：四个旋翼均参与控制。'
  },
  degraded: {
    title: '降级构型 · 剩余双旋翼',
    description: '指定对桨停转后，分配器将其移出有效集合。剩余相对的两个旋翼协同调节推力与倾角，以姿态稳定和下降着陆为控制目标。',
    actuators: '2 个电机 + 2 个倾转舵机',
    label: '降级构型示意：1号和3号旋翼停转，2号和4号旋翼参与控制。编号仅用于说明。'
  }
};
for (const button of document.querySelectorAll('[data-mode]')) {
  if (button.tagName !== 'BUTTON') continue;
  button.addEventListener('click', () => setMode(button.dataset.mode));
}
function setMode(mode) {
  if (!modes[mode]) return;
  const item = modes[mode];
  const airframe = document.getElementById('airframe');
  airframe.dataset.mode = mode;
  airframe.setAttribute('aria-label', item.label);
  document.getElementById('mode-title').textContent = item.title;
  document.getElementById('mode-description').textContent = item.description;
  document.getElementById('mode-actuators').textContent = item.actuators;
  document.querySelectorAll('button[data-mode]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
  });
}
setMode('normal');

const shareButton = document.getElementById('share');
if (shareButton) {
  shareButton.addEventListener('click', async () => {
    const label = shareButton.textContent;
    try {
      await navigator.clipboard.writeText(location.href);
      shareButton.textContent = '链接已复制';
    } catch {
      shareButton.textContent = '请复制地址栏链接';
    }
    setTimeout(() => { shareButton.textContent = label; }, 2500);
  });
}
