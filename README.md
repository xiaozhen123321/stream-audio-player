# Streaming Audio Player

一个基于 **MediaSource API** 和 **Web Audio API** 的流式音频播放器库，支持 MP3、WAV 和 PCM 格式，自动选择最佳播放方式，支持播放控制、暂停、恢复 等功能。

## 特性
    - 支持 MP3、WAV 和 PCM 格式
    - 自动选择最佳播放方式（MediaSource 或 AudioContext）
    - 提供音频播放控制功能，如暂停和恢复等

## Demo
demo地址：[https://stream-audio-player.vercel.app/](demo)

## 安装

```bash
npm install streaming-audio-player
# 或者使用 yarn
yarn add streaming-audio-player

```

## Usages

```js
const streamAudioPlayer = new StreamAudioPlayer({
  type: 'mp3'
});

// 音频准备就绪，可以播放
streamAudioPlayer.on('audioReadyToPlay', () => {
  console.log('audioReadyToPlay');
  // 监听到可以播放音频了，可以使用play开始播放音频
  streamAudioPlayer.play();
});

// 音频播放开始
streamAudioPlayer.on('audioPlayStart', () => {
  console.log('audioPlayStart');
})

// 音频播放结束
streamAudioPlayer.on('audioPlayEnd', () => {
  console.log('audioPlayEnd');
})

// 音频暂停后恢复播放
streamAudioPlayer.on('audioResumePlay', () => {
  console.log('audioResumePlay');
})

// 音频暂停
streamAudioPlayer.on('audioPause', () => {
  console.log('audioPause');
});

// 手动塞入一段段流式音频数据
streamAudioPlayer.appendBuffer(buffer1);
streamAudioPlayer.appendBuffer(buffer2);

// 暂停播放音频
streamAudioPlayer.pause();

// 恢复播放音频，暂停之后使用此方法恢复播放
streamAudioPlayer.resume();

// 销毁播放器
streamAudioPlayer.dispose();
```

## API


### options
| 参数                 | 类型        | 说明                         |
| ------------------ | --------- | -------------------------- |
| `type`             | 'pcm'，'mp3'，'wav'    | 默认'mp3'                      
| `useAudioContext?` | `boolean` | 默认关闭，是否强制使用 AudioContext 播放（可选） | 
| `sampleRate?`      | `number`  | PCM 时必填，采样率                |  
| `channels?`        | `number`  | PCM 时必填，音频通道数              |  
| `bitDepth?`        | `number`  | PCM 时必填，位深                 |   

### methods

##### play
开始播放音频，用于第一次播放音频时使用。

##### pause
暂停播放音频

##### resume
恢复播放音频（暂停后使用）

##### appendBuffer(buffer: ArrayBuffer)
手动塞入一段流式音频数据，支持多种格式的音频文件。

##### dispose
销毁播放器，释放资源

##### on(event: string, callback: Function)
监听事件，支持的事件类型有：`audioReadyToPlay`, `audioPlayStart`, `audioPlayEnd`, `audioResumePlay`, `audioPause`

##### off(event: string, callback: Function)
移除事件监听

### Fields

##### audioPlayMode
当前使用的音频播放模式，`mse` 或 `audioContext`。
使用mediaSource扩展播放音频还是使用AudioContext扩展播放音频。

##### audioElement
获取音频元素实例，使用者可以操控所有关于 HTMLAudioElement 的音频播放相关操作。例如快进，倍速等。注意：只有在 mse 模式下才会有 audioElement，因为 AudioContext 需要自己实现相关操作。

### events
| 事件                   | 说明             |
| -------------------- | -------------- |
| `audioReadyToPlay`   | 音频准备就绪可以播放     |
| `audioPlayStart`     | 音频播放开始     |
| `audioPlayEnd`       | 音频播放结束     |
| `audioResumePlay`    | 音频暂停后恢复播放 |
| `audioPause`         | 音频暂停         |


## FQA
 