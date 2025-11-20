import React, {useEffect, useMemo, useRef, useState} from 'react';
import {StreamAudioPlayer} from 'stream-audio-player';
import {Spin} from 'antd';

import audio1 from './1759030174184.mp3';
import audio2 from './1759030216055.mp3';

export const Mp3AudioPlayer: React.FC = () => {
    const audioContextRef = useRef<AudioContext | null>(null);
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
            type: 'mp3'
        });
    }, []);

    // 加载并解码 mp3 文件
    useEffect(() => {
        const loadAudio = async () => {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext ||
                    (window as any).webkitAudioContext)();
            }
            try {
                const response = await fetch(audio1);
                const response1 = await fetch(audio2);
                const arrayBuffer = await response.arrayBuffer();
                const arrayBuffer1 = await response1.arrayBuffer();
                console.log('arrayBuffer', arrayBuffer);
                setAudioBuffer(arrayBuffer);
                setAudioBuffer1(arrayBuffer1);
            } catch (error) {
                console.error('Error loading audio:', error);
            }
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
    };

    const audioPause = () => {
        console.log('音频暂停');
        setIsPlaying(false);
        setPauseButDisabled(true);
        setResumeButDisabled(false);
    };

    useEffect(() => {
        audioPlayer.on('audioReadyToPlay', audioReadyToPlay);

        audioPlayer.on('audioPlayStart', audioPlayStart);

        audioPlayer.on('audioPlayEnd', audioPlayEnd);

        audioPlayer.on('audioResumePlay', audioResumePlay);

        audioPlayer.on('audioPause', audioPause);

        return () => {
            audioPlayer.off('audioReadyToPlay', audioReadyToPlay);
            audioPlayer.off('audioPlayStart', audioPlayStart);
            audioPlayer.off('audioPlayEnd', audioPlayEnd);
            audioPlayer.off('audioResumePlay', audioResumePlay);
            audioPlayer.off('audioPause', audioPause);
        };
    }, []);

    if (!audioBuffer || !audioBuffer1) return <Spin />;

    return (
        <div>
            <h1>Mp3音频流式播放</h1>
            <div>请依次添加第一段音频和第二段音频，并点击播放</div>
            <div>
                当前使用的播放方案：
                {audioPlayer.audioPlayMode
                    ? audioPlayer.audioPlayMode === 'mse'
                        ? 'mediaSource'
                        : 'audioContext'
                    : ''}
            </div>
            <div style={{display: 'flex', gap: '10px', alignItems: 'center', marginBottom: 20}}>
                <button
                    disabled={firstAppendButtonDisabled}
                    onClick={() => {
                        if (audioBuffer) {
                            audioPlayer.appendBuffer(audioBuffer);
                            setFirstAppendButtonDisabled(true);
                            setSecondAppendButtonDisabled(false);
                        }
                    }}
                >
                    添加第一段buffer音频
                </button>
                <button
                    disabled={secondAppendButtonDisabled}
                    onClick={() => {
                        if (audioBuffer) {
                            audioPlayer.appendBuffer(audioBuffer1);
                            setSecondAppendButtonDisabled(true);
                            setPlayButDisabled(false);
                        }
                    }}
                >
                    添加第二段buffer音频
                </button>
                <button
                    disabled={playButDisabled}
                    onClick={() => {
                        audioPlayer.play();
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
                <button disabled={resumeButDisabled} onClick={() => audioPlayer.resume()}>
                    恢复播放
                </button>
                {audioPlayer.audioPlayMode === 'mse' && (
                    <button
                        disabled={!isPlaying}
                        onClick={() => {
                            audioPlayer.audioElement!.currentTime += 3;
                        }}
                    >
                        快进3s
                    </button>
                )}
            </div>
            {isPlaying ? (
                <div style={{color: 'red'}}>音频正在播放</div>
            ) : (
                <div style={{color: 'red'}}>音频未播放</div>
            )}
            {isAudioReady && <div style={{color: 'red'}}>音频已经就绪，可以开始播放</div>}
        </div>
    );
};
