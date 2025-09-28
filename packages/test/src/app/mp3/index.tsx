import React, { useEffect, useMemo, useRef, useState } from "react";
import { StreamAudioPlayer } from 'stream-audio-player';

export const Mp3AudioPlayer: React.FC = () => {
    const audioContextRef = useRef<AudioContext | null>(null);
    const [audioBuffer, setAudioBuffer] = useState<ArrayBuffer | null>(null);
    const [audioBuffer1, setAudioBuffer1] = useState<ArrayBuffer | null>(null);
    const [isAudioReady, setIsAudioReady] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    const audioPlayer = useMemo(() => {
        return new StreamAudioPlayer({
            type: 'mp3',
            useAudioContext: true
        });
    }, []);

    // 加载并解码 mp3 文件
    useEffect(() => {
        const loadAudio = async () => {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            const response = await fetch('https://bucket123321.bj.bcebos.com/Record%20(online-voice-recorder.com)%20(2).mp3');
            const response1 = await fetch('https://bucket123321.bj.bcebos.com/Record%20(online-voice-recorder.com)%20(1).mp3');
            const arrayBuffer = await response.arrayBuffer();
            const arrayBuffer1 = await response1.arrayBuffer();
            console.log('arrayBuffer', arrayBuffer);
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
        setIsPlaying(true);
    };

    const audioPlayEnd = () => {
        console.log('音频播放结束');
        setIsPlaying(false);
    };

    const audioResumePlay = () => {
        console.log('音频恢复播放');
        setIsPlaying(true);
    }

    useEffect(() => {
        audioPlayer.on('audioReadyToPlay', audioReadyToPlay);

        audioPlayer.on('audioPlayStart', audioPlayStart)

        audioPlayer.on('audioPlayEnd', audioPlayEnd)

        audioPlayer.on('audioResumePlay', audioResumePlay)

        return () => {
            audioPlayer.off('audioReadyToPlay', audioReadyToPlay);
            audioPlayer.off('audioPlayStart', audioPlayStart);
            audioPlayer.off('audioPlayEnd', audioPlayEnd);
            audioPlayer.off('audioResumePlay', audioResumePlay);
        }
    }, []);


    if (!audioBuffer || !audioBuffer1) return null;

    return (
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div>
                <button
                    onClick={
                        () => {
                            if (audioBuffer) {
                                audioPlayer.appendBuffer({
                                    buffer: audioBuffer
                                });
                            }
                        }
                    }
                >
                    添加第一段buffer音频
                </button>
                <button
                    onClick={
                        () => {
                            if (audioBuffer) {
                                audioPlayer.appendBuffer({
                                    buffer: audioBuffer1
                                });
                            }
                        }
                    }
                >
                    添加第二段buffer音频
                </button>
                <button onClick={() => audioPlayer.play()}>播放</button>
                <button onClick={() => audioPlayer.pause()}>暂停</button>
                <button onClick={() => audioPlayer.resume()}>恢复播放</button>
            </div>
            {isPlaying ? <div style={{color: 'red'}}>音频正在播放</div> : <div style={{color: 'red'}}>音频未播放</div>}
            {isAudioReady && <div style={{color: 'red'}}>音频已经就绪，可以开始播放</div>}
        </div>
    );
};

