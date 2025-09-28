import React, { useEffect, useMemo, useState } from "react";
import {StreamAudioPlayer} from 'stream-audio-player';

const sampleRate = 16000;
const channels = 1;
const bitDepth = 16;

export const PCMAudioPlayer: React.FC = () => {
    const [audioBuffer, setAudioBuffer] = useState<ArrayBuffer | null>(null);
    const [audioBuffer1, setAudioBuffer1] = useState<ArrayBuffer | null>(null);
    const [isAudioReady, setIsAudioReady] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    const [firstAppendButtonDisabled, setFirstAppendButtonDisabled] = useState(false);
    const [secondAppendButtonDisabled, setSecondAppendButtonDisabled] = useState(true);
    const [playButDisabled, setPlayButDisabled] = useState(true);
    const [pauseButDisabled, setPauseButDisabled] = useState(true);
    const [resumeButDisabled, setResumeButDisabled] = useState(true);

    const audioPlayer = useMemo(() => {
        return new StreamAudioPlayer({
            type: 'pcm',
            sampleRate,
            channels,
            bitDepth
        });
    }, []);

    // 加载并解码 wav文件
    useEffect(() => {
        const loadAudio = async () => {
            const response1 = await fetch('https://bucket123321.bj.bcebos.com/pcm/202509281556_c71f6d.pcm');
            const response = await fetch('https://bucket123321.bj.bcebos.com/pcm/202509281556_3a4fe6.pcm');
            const arrayBuffer = await response.arrayBuffer();
            const arrayBuffer1 = await response1.arrayBuffer();
            console.log('arrayBuffer', arrayBuffer, arrayBuffer1);
            setAudioBuffer(arrayBuffer);
            setAudioBuffer1(arrayBuffer1);
        };

        loadAudio();
    }, []);

    const audioReadyToPlay = () => {
        if (isPlaying) {
            return;
        }
        console.log('音频准备就绪，可以开始播放');
        setIsAudioReady(true);
    };

    const audioPlayStart = () => {
        console.log('音频开始播放');
        setPlayButDisabled(true);
        setPauseButDisabled(false);
        setIsPlaying(true);
    };

    const audioPlayEnd = () => {
        console.log('音频播放结束');
        setPlayButDisabled(true);
        setResumeButDisabled(true);
        setPauseButDisabled(true);
        setIsPlaying(false);
    };

    const audioResumePlay = () => {
        console.log('音频恢复播放');
        setPauseButDisabled(false);
        setIsPlaying(true);
    }

    const audioPause = () => {
        console.log('音频暂停');
        setIsPlaying(false);
        setPauseButDisabled(true);
        setResumeButDisabled(false);
    }

    useEffect(() => {
        audioPlayer.on('audioReadyToPlay', audioReadyToPlay);

        audioPlayer.on('audioPlayStart', audioPlayStart)

        audioPlayer.on('audioPlayEnd', audioPlayEnd)

        audioPlayer.on('audioResumePlay', audioResumePlay)

        audioPlayer.on('audioPause', audioPause)

        return () => {
            audioPlayer.off('audioReadyToPlay', audioReadyToPlay);
            audioPlayer.off('audioPlayStart', audioPlayStart);
            audioPlayer.off('audioPlayEnd', audioPlayEnd);
            audioPlayer.off('audioResumePlay', audioResumePlay);
            audioPlayer.off('audioPause', audioPause);
        }
    }, []);


    if (!audioBuffer || !audioBuffer1) return null;

    return (
        <div>
            <h1>PCM音频流式播放</h1>
            <div>请依次添加第一段音频和第二段音频，并点击播放</div>
            <div>
                <span>当前采样率：{sampleRate}</span>
                <span>当前声道数：{channels}</span>
                <span>当前位深：{bitDepth}</span>
            </div>
            <div>当前使用的播放方案：{audioPlayer.audioPlayMode ? (audioPlayer.audioPlayMode === 'mse' ? 'mediaSource' : 'audioContext') : ''}</div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: 20}}>
                <button
                    disabled={firstAppendButtonDisabled}
                    onClick={
                        () => {
                            if (audioBuffer) {
                                audioPlayer.appendBuffer(audioBuffer);
                                setFirstAppendButtonDisabled(true);
                                setSecondAppendButtonDisabled(false);
                            }
                        }
                    }
                >
                    添加第一段buffer音频
                </button>
                <button
                    disabled={secondAppendButtonDisabled}
                    onClick={
                        () => {
                            if (audioBuffer) {
                                audioPlayer.appendBuffer(audioBuffer1);
                                setSecondAppendButtonDisabled(true);
                                setPlayButDisabled(false);
                            }
                        }
                    }
                >
                    添加第二段buffer音频
                </button>
                <button
                    disabled={playButDisabled}
                    onClick={() => {
                        audioPlayer.play()
                    }}
                >
                    播放
                </button>
                <button
                    disabled={pauseButDisabled}
                    onClick={() => {
                        audioPlayer.pause();
                        setPauseButDisabled(true);
                        setResumeButDisabled(false);
                    }}
                >
                    暂停
                </button>
                <button
                    disabled={resumeButDisabled}
                    onClick={() => audioPlayer.resume()}
                >
                    恢复播放
                </button>
                {
                    audioPlayer.audioPlayMode === 'mse' && (
                        <button
                            disabled={!isPlaying}
                            onClick={() => {
                                audioPlayer.audioElement!.currentTime += 3;
                            }}
                        >
                            快进3s
                        </button>
                    )
                }
            </div>
            {isPlaying ? <div style={{color: 'red'}}>音频正在播放</div> : <div style={{color: 'red'}}>音频未播放</div>}
            {isAudioReady && <div style={{color: 'red'}}>音频已经就绪，可以开始播放</div>}
        </div>
    );
};

