/**
 * 简单流式音频播放器抽象类
 */

import {IAppendBufferParams, AudioType} from './type';

export interface IAbstractStreamAudioPlayer {
    isPlaying: boolean;
    isBufferFull: boolean;
    /** 音频采样率 pcm需传 */
    sampleRate: number;
    /** 音频通道数 pcm需传 */
    channels: number;
    /** 位深 pcm需传 */
    bitDepth: number;
    type: AudioType;
    eventEmitter: EventTarget;
    play(): void;
    init(): void;
    pause(): void;
    resume(): void;
    appendBuffer(buffer: IAppendBufferParams): void;
    dispose(): void;
}

export abstract class AbstractStreamAudioPlayer {
    /** 是否正在播放 */
    isPlaying: boolean = false;
    /** 音频采样率 pcm需传 */
    sampleRate: number = 8000;
    /** 音频通道数 pcm需传 */
    channels: number = 1;
    /** 位深 pcm需传 */
    bitDepth: number = 16;
    type: AudioType = AudioType.MP3;

    /** 是否可能还有新的buffer数据要推进来 */
    isBufferFull: boolean = false;
    eventEmitter: EventTarget = new EventTarget();

    constructor() {}

    /** 初始化 */
    abstract init(): void;

    abstract play(): void;

    /** 暂停 */
    abstract pause(): void;
    abstract resume(): void;
    /** 追加音频buffer */
    abstract appendBuffer(buffer: IAppendBufferParams): void;

    /** dispose */
    abstract dispose(): void;
}
