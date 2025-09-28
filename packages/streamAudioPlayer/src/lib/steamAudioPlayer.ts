/**
 * @file 流式音频播放核心类
 */
import {isSupportMediaSource, isSupportAudioContext} from './utils';
import {IOptions, IAppendBufferParams, AudioType} from './type';
import {MseStreamAudioPlayer} from './mseStreamAudioPlayer';
import {AudioContextStreamAudioPlayer} from './audioContextStreamAudioPlayer';

export class StreamAudioPlayer {
    /** 是否支持mse的方式播放流式音频 */
    static isSupportMediaSource = isSupportMediaSource;

    /** 是否支持webAudio的方式播放流式音频 */
    static isSupportAudioContext = isSupportAudioContext;

    /** 默认配置 */
    private readonly options: IOptions = {
        type: AudioType.MP3,
        sampleRate: 8000,
        channels: 1,
        bitDepth: 16,
    };

    /** 播放器实例 */
    private msePlayer: MseStreamAudioPlayer | null = null;

    /** 播放器实例 */
    private audioContextPlayer: AudioContextStreamAudioPlayer | null = null;
    
    /** 事件发射器 */
    private readonly eventEmitter: EventTarget = new EventTarget();

    /**
     * 当前使用的视频播放模式
     * mse: 使用MediaSource扩展
     * audioContext: 使用AudioContext扩展进行音频播放
     * */
    readonly audioPlayMode: 'mse' | 'audioContext' | null = null;

    /**
     * 获取音频元素实例
     * 可自己操控所有关于HTMLAudioElement的音频播放相关操作。例如快进，倍速
     * 注意：只有在mse模式下才会有audioElement，因为AudioContext不支持操控音频播放相关操作
     * */
    get audioElement(): HTMLAudioElement | null {
        if (this.msePlayer) {
            return this.msePlayer.audioElement;
        }

        return null;
    }

    constructor(options: IOptions) {
        // 初始化播放器
        this.options = options;

        if (
            StreamAudioPlayer.isSupportMediaSource
            && (this.options.type === AudioType.MP3 || this.options.type === AudioType.AAC)
            && !this.options.useAudioContext
        ) {
            // 如果支持mse，并且是mp3或wav格式，则使用MseStreamAudioPlayer
            // 因为mse不支持pcm格式，所以这里要排除掉pcm格式
            this.msePlayer = new MseStreamAudioPlayer();
            this.msePlayer.init();
            this.msePlayer.eventEmitter = this.eventEmitter;
            this.audioPlayMode = 'mse';
            return;
        }

        if (StreamAudioPlayer.isSupportAudioContext) {
            // 如果支持webAudio，则使用AudioContextStreamAudioPlayer
            // 例如ios系统不支持mse，但是支持webAudio，所以这里要使用webAudio来播放音频
            // 以及pcm格式也需要使用webAudio来播放
            this.audioContextPlayer = new AudioContextStreamAudioPlayer();
            this.audioContextPlayer.sampleRate = this.options.sampleRate ?? this.audioContextPlayer.sampleRate;
            this.audioContextPlayer.channels = this.options.channels ?? this.audioContextPlayer.channels;
            this.audioContextPlayer.bitDepth = this.options.bitDepth ?? this.audioContextPlayer.bitDepth;
            this.audioContextPlayer.type = this.options.type as AudioType;
            this.audioContextPlayer.eventEmitter = this.eventEmitter;
            this.audioPlayMode = 'audioContext';
            return;
        }
    }

    /** 外部绑定事件 */
    on = (event: string, func: EventListenerOrEventListenerObject) => {
        this.eventEmitter.addEventListener(event, func);
    };

    /** 外部取消事件 */
    off = (event: string, func?: EventListenerOrEventListenerObject) => {
        this.eventEmitter.removeEventListener(event, func || null);
    };

    /** 增加音频数据到播放队列 */
    appendBuffer = (param: IAppendBufferParams) => {
        if (this.msePlayer) {
            this.msePlayer.appendBuffer({
                buffer: param.buffer,
                bufferId: param.bufferId || Math.random().toString(36).slice(2)
            });
        }
        
        if (this.audioContextPlayer) {
            this.audioContextPlayer.appendBuffer({
                buffer: param.buffer,
                bufferId: param.bufferId || Math.random().toString(36).slice(2)
            });
        }

        return;
    }

    /**
     * 第一次开始播放音频
     * 只用于第一次播放音频，暂停后在播放需要调用resume方法
     * */
    play = () => {
        if (this.msePlayer) {
            this.msePlayer.play();
        }

        if (this.audioContextPlayer) {
            this.audioContextPlayer.play();
        }
    }

    /** 暂停音频 */
    pause = () => {
        if (this.msePlayer) {
            this.msePlayer.pause();
        }

        if (this.audioContextPlayer) {
            this.audioContextPlayer.pause();
        }
    }

    /** 恢复音频播放 */
    resume = () => {
        if (this.msePlayer) {
            this.msePlayer.resume();
        }

        if (this.audioContextPlayer) {
            this.audioContextPlayer.resume();
        }
    }

    /** dispose 销毁所有 */
    dispose = () => {
        if (this.msePlayer) {
            this.msePlayer.dispose();
        }

        if (this.audioContextPlayer) {
            this.audioContextPlayer.dispose();
        }
    }
}