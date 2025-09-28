/**
 * @file 相关函数
 */

/** 是否支持 MediaSource */
function isMediaSourceSupported() {
    return window.MediaSource !== undefined;
}

export const isSupportMediaSource = isMediaSourceSupported();

/** 是否支持 AudioContext */
function isAudioContextSupported() {
    const isSupportAudioContext = window.AudioContext !== undefined;

    // @ts-ignore
    const isSupportWebkitAudioContext = window.webkitAudioContext !== undefined;
    return isSupportAudioContext || isSupportWebkitAudioContext;
}

export const isSupportAudioContext = isAudioContextSupported();