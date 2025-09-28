/**
 *@file 类型定义文件
 */

export enum AudioType {
    PCM = 'pcm',
    MP3 = 'mp3',
    WAV = 'wav',
    AAC = 'aac'
}

 export interface IOptions {
    /** 音频类型 pcm/mp3/wav */
    type: 'pcm' | 'mp3' | 'wav' | 'aac';
    /** 是否直接采用audioContext方式进行播放流式音频 */
    useAudioContext?: boolean;
    /** 音频采样率 pcm需传 */
    sampleRate?: number;
    /** 音频通道数 pcm需传 */
    channels?: number;
    /** 位深 pcm需传 */
    bitDepth?: number;
}

/** appeendbuffer数据的参数 */
export interface IAppendBufferParams {
    /** 流式音频数据 */
    buffer: ArrayBuffer;
    /** bufferid，播放完成会返回此id，不传内部会生成 */
    bufferId?: string;
}