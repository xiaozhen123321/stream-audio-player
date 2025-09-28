/**
 * 基于 AudioContext 实现的流式音频播放器
 */
import {AbstractStreamAudioPlayer} from './abstractStreamAudioPlayer';
import {IAppendBufferParams, AudioType} from './type';

export class AudioContextStreamAudioPlayer extends AbstractStreamAudioPlayer {
    /** 用于处理音频的 AudioContext */
    // @ts-ignore
    audioContext: AudioContext = new (window.AudioContext || window.webkitAudioContext)();

    /** 用于处理音频流的源节点 */
    audioSourceNode: AudioBufferSourceNode | null = null;

    /** 用于处理音频缓冲区队列 */
    audioBufferQueue: Array<{audioBuffer: AudioBuffer, id?: string}> = [];

    private readonly convertBufferToAudioBuffer = (buffer: ArrayBuffer): AudioBuffer  => {
        let pcmData = null;

        if (this.bitDepth === 8) {
            pcmData = new Int8Array(buffer);
        }
        else if (this.bitDepth === 16) {
            pcmData = new Int16Array(buffer);
        }
        else if (this.bitDepth === 32) {
            pcmData = new Int32Array(buffer);
        }
        else {
            throw new Error('Unsupported bit depth');
        }

        const audioBuffer = this.audioContext.createBuffer(
            this.channels,
            pcmData.length, // 总样本数
            this.sampleRate
        );

        // 填充每个通道
        for (let channel = 0; channel < this.channels; channel++) {
            const channelData = audioBuffer.getChannelData(channel); // Float32Array
            let sampleIndex = channel;

            for (let i = 0; i < channelData.length; i++) {
                const intSample = pcmData[sampleIndex];

                if (this.bitDepth === 8) {
                    // Int8 范围 -128 ~ 127
                    channelData[i] = intSample / 128;
                } else if (this.bitDepth === 16) {
                    // Int16 范围 -32768 ~ 32767
                    channelData[i] = intSample / 32768;
                } else if (this.bitDepth === 32) {
                    // Int32 范围 -2147483648 ~ 2147483647
                    channelData[i] = intSample / 2147483648;
                }

                sampleIndex += this.channels; // 跳到下一个该通道的数据
            }
        }

        return audioBuffer;
    };

    /** 增加音频数据到播放队列 */
    override appendBuffer = (buffer: IAppendBufferParams) => {
        if (this.type === AudioType.PCM) {
            if (this.audioBufferQueue.length === 0) {
                // 如果audioBufferQueue为空，说明还没有播放过音频数据,添加完成即可以播放
                this.eventEmitter.dispatchEvent(new CustomEvent('audioReadyToPlay'));
            }
            const audioBuffer = this.convertBufferToAudioBuffer(buffer.buffer);
            this.audioBufferQueue.push({
                audioBuffer,
                id: buffer.bufferId
            });
        }
        else {
            this.audioContext.decodeAudioData(buffer.buffer).then(decodedBuffer => {
                if (this.audioBufferQueue.length === 0) {
                    // 如果audioBufferQueue为空，说明还没有播放过音频数据,添加完成即可以播放
                    this.eventEmitter.dispatchEvent(new CustomEvent('audioReadyToPlay'));
                }
                this.audioBufferQueue.push({
                    audioBuffer: decodedBuffer,
                    id: buffer.bufferId
                });
                
            })
        }        

    };

    play(): void {
        if (!this.isPlaying) {
            this.eventEmitter.dispatchEvent(new CustomEvent('audioPlayStart'));
            // 如果没在播放直接播放
            this.playNextBuffer();
        }
    }

    /** 暂停音频播放 */
    override pause = (): void => {
        this.audioContext.suspend()
            .then(() => {
                this.isPlaying = false;
            })
            .catch(() => {
                throw new Error('Failed to suspend audio context');
            });
    };

    override resume = (): void => {
        this.audioContext.resume()
            .then(() => {
                this.eventEmitter.dispatchEvent(new CustomEvent('audioResumePlay'));
                this.isPlaying = true;
            })
            .catch(() => {
                throw new Error('Failed to resume audio context');
            });
    }

    /** 停止播放器并清除资源 */
    override dispose = (): void => {
        this.isPlaying = false;
        this.audioSourceNode = null;
        this.audioBufferQueue = [];
    };

    /** 播放下一个音频片段 */
    private readonly playNextBuffer = () => {
        console.log(this.audioBufferQueue);
        if (this.audioBufferQueue.length === 0) {
            // 没有音频数据了 则置空并停止播放
            this.isPlaying = false;
            this.eventEmitter.dispatchEvent(new CustomEvent('audioPlayEnd'));
            return;
        }

        if (this.audioSourceNode) {
            // 如果有正在播放的音频则先断联
            this.audioSourceNode.disconnect();
            this.audioSourceNode.removeEventListener('ended', this.playNextBuffer);
        }

        this.isPlaying = true;

        // 取出下一个音频片段
        const nextBuffer = this.audioBufferQueue.shift()!;

        // 创建一个播放节点并连接至音频输出
        this.audioSourceNode = this.audioContext.createBufferSource();
        this.audioSourceNode.buffer = nextBuffer.audioBuffer;
        this.audioSourceNode.connect(this.audioContext.destination);

        // 绑定播放结束事件，即播放结束时再调用 playNextBuffer 方法继续播放下一个音频片段
        this.audioSourceNode.addEventListener('ended', () => {
            console.log(111, this.audioBufferQueue);
            this.playNextBuffer();
        });

        // 开始播放
        this.audioSourceNode.start();
    };

    constructor() {
        super();
    }

    /** 初始化播放器 */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    override init() {}
}
