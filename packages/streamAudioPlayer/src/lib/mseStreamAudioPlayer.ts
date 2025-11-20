/**
 * 基于MediaSource API实现的流式音频播放器
 */
import {IAppendBufferParams} from './type';

export class MseStreamAudioPlayer {
    isPlaying: boolean = false;
    eventEmitter: EventTarget = new EventTarget();
    /** 音频元素实例 */
    audioElement: HTMLAudioElement = new Audio();

    /** MediaSource 动态生成音频流 */
    mediaSource: MediaSource | null = null;

    /** sourcebuffer对象 */
    sourceBuffer: SourceBuffer | null = null;

    /** 是否正在更新sourcebuffer */
    sourceBufferUpdating: boolean = false;

    /** 待添加的sourcebuffer对象队列 */
    arrayBufferQueue: IAppendBufferParams[] = [];

    init = () => {
        this.mediaSource = new MediaSource();

        // 设置音频元素的源
        this.audioElement.src = URL.createObjectURL(this.mediaSource);

        // 绑定相关事件
        this.bindEvent();
    };

    /** sourcebuffer更新开始 */
    sourceBufferUpdateStart = () => {
        this.sourceBufferUpdating = true;
    };

    /** sourcebuffer更新结束 */
    sourceBufferUpdateEnd = () => {
        if (!this.mediaSource) {
            throw new Error('MediaSource is null');
        }

        this.sourceBufferUpdating = false;

        // 当前更新结束，则添加下一个sourcebuffer对象
        if (this.arrayBufferQueue.length > 0 && this.sourceBuffer) {
            const buffer: IAppendBufferParams = this.arrayBufferQueue.shift()!;
            this.sourceBuffer.appendBuffer(buffer.buffer);
            return;
        }

        // sourcebuffer没有更新中 并且readyState为open 后续没有buffer数据进来了，则结束流
        if (
            this.sourceBuffer &&
            !this.sourceBuffer.updating &&
            this.mediaSource.readyState === 'open'
        ) {
            this.mediaSource.endOfStream();
        }
    };

    /**  创建MediaSource对象 */
    sourceOpen = () => {
        if (!this.mediaSource) {
            throw new Error('MediaSource is null');
        }

        // 没有时候创建sourcebuffer对象
        if (!this.sourceBuffer) {
            // 创建sourcebuffer对象
            this.sourceBuffer = this.mediaSource.addSourceBuffer('audio/mpeg');

            // 绑定更新开始事件
            this.sourceBuffer.addEventListener('updatestart', this.sourceBufferUpdateStart);

            // 绑定更新结束事件
            this.sourceBuffer.addEventListener('updateend', this.sourceBufferUpdateEnd);
        }
    };

    /** 音频准备就绪，可以开始播放 */
    audioReadyToPlay = () => {
        if (this.isPlaying) {
            return;
        }
        // 音频可以播放了，发布消息
        this.eventEmitter.dispatchEvent(new CustomEvent('audioReadyToPlay'));
    };

    /** 音频播放结束 */
    audioEnd = () => {
        this.isPlaying = false;
        // 音频播放结束，发布消息
        this.eventEmitter.dispatchEvent(new CustomEvent('audioPlayEnd'));
    };

    /** 播放音频的监听 */
    play = () => {
        this.eventEmitter.dispatchEvent(new CustomEvent('audioPlayStart'));
        this.audioElement.currentTime = 0;

        this.audioElement
            .play()
            .then(() => {
                this.isPlaying = true;
                // 音频开始播放，发布消息
                this.eventEmitter.dispatchEvent(new CustomEvent('audioPlayStart'));
            })
            .catch(err => {
                console.error('音频播放失败', err);
                throw new Error('音频播放失败');
            });
    };

    /** 暂停播放 */
    pause = () => {
        this.audioElement.pause();
        this.eventEmitter.dispatchEvent(new CustomEvent('audioPause'));
        this.isPlaying = false;
    };

    resume(): void {
        this.audioElement
            .play()
            .then(() => {
                this.isPlaying = true;
                this.eventEmitter.dispatchEvent(new CustomEvent('audioResumePlay'));
                // 音频开始播放，发布消息
            })
            .catch(() => {
                throw new Error('音频播放失败');
            });
    }

    /** 增加音频数据到sourcebuffer */
    appendBuffer = (buffer: IAppendBufferParams): void => {
        if (!this.sourceBuffer) {
            return;
        }
        if (
            this.sourceBufferUpdating ||
            this.arrayBufferQueue.length > 0 ||
            this.sourceBuffer.updating
        ) {
            // 如果正在更新sourcebuffer或者队列中有数据，则将数据放入队列中
            this.arrayBufferQueue.push(buffer);
        } else {
            this.sourceBufferUpdating = true;
            this.sourceBuffer.appendBuffer(buffer.buffer);
        }
    };

    /** dispose */
    dispose = () => {
        this.isPlaying = false;
        this.unbindEvent();
        this.audioElement.src = '';
        this.sourceBuffer = null;
    };

    constructor() {}

    /** 绑定相关事件 */
    bindEvent = () => {
        if (this.mediaSource) {
            this.mediaSource.addEventListener('sourceopen', this.sourceOpen);
        }

        this.audioElement.addEventListener('canplay', this.audioReadyToPlay);
        this.audioElement.addEventListener('ended', this.audioEnd);
    };

    /** 解除相关事件 */
    unbindEvent = () => {
        if (this.mediaSource) {
            this.mediaSource.removeEventListener('sourceopen', this.sourceOpen);
        }

        if (this.sourceBuffer) {
            this.sourceBuffer.removeEventListener('updatestart', this.sourceBufferUpdateStart);
            this.sourceBuffer.removeEventListener('updateend', this.sourceBufferUpdateEnd);
        }

        this.audioElement.removeEventListener('canplay', this.audioReadyToPlay);
        this.audioElement.removeEventListener('ended', this.audioEnd);
    };
}
