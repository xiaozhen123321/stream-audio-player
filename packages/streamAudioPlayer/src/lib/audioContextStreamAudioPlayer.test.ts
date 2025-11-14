/**
 * @file AudioContextStreamAudioPlayer 单元测试
 */
import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';
import {AudioContextStreamAudioPlayer} from './audioContextStreamAudioPlayer';
import {AudioType, IAppendBufferParams} from './type';

describe('AudioContextStreamAudioPlayer', () => {
    let player: AudioContextStreamAudioPlayer;
    let mockAudioContext: any;
    let mockSourceNode: any;

    beforeEach(() => {
        // Mock AudioBufferSourceNode
        mockSourceNode = {
            buffer: null,
            connect: vi.fn(),
            disconnect: vi.fn(),
            start: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn()
        };

        // Mock AudioContext
        mockAudioContext = {
            createBuffer: vi.fn().mockImplementation((channels, length, sampleRate) => ({
                numberOfChannels: channels,
                length: length,
                sampleRate: sampleRate,
                getChannelData: vi.fn().mockReturnValue(new Float32Array(length))
            })),
            createBufferSource: vi.fn().mockReturnValue(mockSourceNode),
            destination: {},
            decodeAudioData: vi.fn().mockImplementation(buffer => {
                return Promise.resolve({
                    numberOfChannels: 1,
                    length: buffer.byteLength / 2,
                    sampleRate: 24000,
                    getChannelData: vi.fn().mockReturnValue(new Float32Array(buffer.byteLength / 2))
                });
            }),
            suspend: vi.fn().mockResolvedValue(undefined),
            resume: vi.fn().mockResolvedValue(undefined)
        };

        global.AudioContext = function AudioContextMock() {
            return mockAudioContext;
        } as any;
        (global as any).webkitAudioContext = function WebkitAudioContextMock() {
            return mockAudioContext;
        };

        player = new AudioContextStreamAudioPlayer();
    });

    afterEach(() => {
        if (player) {
            player.dispose();
        }
        vi.clearAllMocks();
    });

    describe('Initialization', () => {
        it('should initialize with default values', () => {
            expect(player.isPlaying).toBe(false);
            expect(player.sampleRate).toBe(8000);
            expect(player.channels).toBe(1);
            expect(player.bitDepth).toBe(16);
            expect(player.type).toBe(AudioType.MP3);
            expect(player.isBufferFull).toBe(false);
            expect(player.audioBufferQueue).toEqual([]);
        });

        it('should create AudioContext instance', () => {
            expect(player.audioContext).toBeDefined();
            expect(player.audioContext).toBe(mockAudioContext);
        });

        it('should have eventEmitter', () => {
            expect(player.eventEmitter).toBeInstanceOf(EventTarget);
        });
    });

    describe('appendBuffer - PCM format', () => {
        beforeEach(() => {
            player.type = AudioType.PCM;
            player.sampleRate = 16000;
            player.channels = 1;
            player.bitDepth = 16;
        });

        it('should convert PCM buffer and add to queue', () => {
            const mockBuffer: IAppendBufferParams = {
                buffer: new ArrayBuffer(1024),
                bufferId: 'test-id'
            };

            player.appendBuffer(mockBuffer);

            expect(player.audioBufferQueue).toHaveLength(1);
            expect(player.audioBufferQueue[0].id).toBe('test-id');
            expect(mockAudioContext.createBuffer).toHaveBeenCalled();
        });

        it('should dispatch audioReadyToPlay event for first buffer', () => {
            const eventSpy = vi.spyOn(player.eventEmitter, 'dispatchEvent');
            const mockBuffer: IAppendBufferParams = {
                buffer: new ArrayBuffer(1024),
                bufferId: 'test-id'
            };

            player.appendBuffer(mockBuffer);

            expect(eventSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'audioReadyToPlay'
                })
            );
        });

        it('should not dispatch audioReadyToPlay event if queue already has buffers', () => {
            player.audioBufferQueue.push({
                audioBuffer: {} as AudioBuffer,
                id: 'existing'
            });

            const eventSpy = vi.spyOn(player.eventEmitter, 'dispatchEvent');
            const mockBuffer: IAppendBufferParams = {
                buffer: new ArrayBuffer(1024),
                bufferId: 'test-id'
            };

            player.appendBuffer(mockBuffer);

            expect(eventSpy).not.toHaveBeenCalled();
        });

        it('should handle 8-bit PCM data', () => {
            player.bitDepth = 8;
            const mockBuffer: IAppendBufferParams = {
                buffer: new ArrayBuffer(512),
                bufferId: 'test-id'
            };

            player.appendBuffer(mockBuffer);

            expect(player.audioBufferQueue).toHaveLength(1);
        });

        it('should handle 32-bit PCM data', () => {
            player.bitDepth = 32;
            const mockBuffer: IAppendBufferParams = {
                buffer: new ArrayBuffer(2048),
                bufferId: 'test-id'
            };

            player.appendBuffer(mockBuffer);

            expect(player.audioBufferQueue).toHaveLength(1);
        });

        it('should handle multi-channel PCM data', () => {
            player.channels = 2;
            const mockBuffer: IAppendBufferParams = {
                buffer: new ArrayBuffer(2048),
                bufferId: 'test-id'
            };

            player.appendBuffer(mockBuffer);

            expect(player.audioBufferQueue).toHaveLength(1);
            expect(mockAudioContext.createBuffer).toHaveBeenCalledWith(
                2,
                expect.any(Number),
                16000
            );
        });

        it('should throw error for unsupported bit depth', () => {
            player.bitDepth = 24; // Unsupported
            const mockBuffer: IAppendBufferParams = {
                buffer: new ArrayBuffer(1024),
                bufferId: 'test-id'
            };

            expect(() => player.appendBuffer(mockBuffer)).toThrow('Unsupported bit depth');
        });
    });

    describe('appendBuffer - MP3/WAV format', () => {
        beforeEach(() => {
            player.type = AudioType.MP3;
        });

        it('should decode audio data and add to queue', async () => {
            const mockBuffer: IAppendBufferParams = {
                buffer: new ArrayBuffer(1024),
                bufferId: 'test-id'
            };

            player.appendBuffer(mockBuffer);

            await vi.waitFor(() => {
                expect(mockAudioContext.decodeAudioData).toHaveBeenCalledWith(mockBuffer.buffer);
            });

            await vi.waitFor(() => {
                expect(player.audioBufferQueue).toHaveLength(1);
            });
        });

        it('should dispatch audioReadyToPlay event for first decoded buffer', async () => {
            const eventSpy = vi.spyOn(player.eventEmitter, 'dispatchEvent');
            const mockBuffer: IAppendBufferParams = {
                buffer: new ArrayBuffer(1024),
                bufferId: 'test-id'
            };

            player.appendBuffer(mockBuffer);

            await vi.waitFor(() => {
                expect(eventSpy).toHaveBeenCalledWith(
                    expect.objectContaining({
                        type: 'audioReadyToPlay'
                    })
                );
            });
        });
    });

    describe('play', () => {
        it('should start playing if not already playing', () => {
            player.isPlaying = false;
            player.audioBufferQueue.push({
                audioBuffer: {
                    numberOfChannels: 1,
                    length: 1024,
                    sampleRate: 8000
                } as AudioBuffer,
                id: 'test-id'
            });

            const eventSpy = vi.spyOn(player.eventEmitter, 'dispatchEvent');

            player.play();

            expect(eventSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'audioPlayStart'
                })
            );
        });

        it('should not start playing if already playing', () => {
            player.isPlaying = true;
            const eventSpy = vi.spyOn(player.eventEmitter, 'dispatchEvent');

            player.play();

            expect(eventSpy).not.toHaveBeenCalled();
        });
    });

    describe('playNextBuffer', () => {
        it('should play the next buffer in queue', () => {
            const mockAudioBuffer = {
                numberOfChannels: 1,
                length: 1024,
                sampleRate: 8000
            } as AudioBuffer;

            player.audioBufferQueue.push({
                audioBuffer: mockAudioBuffer,
                id: 'test-id'
            });

            player['playNextBuffer']();

            expect(player.isPlaying).toBe(true);
            expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
            expect(mockSourceNode.buffer).toBe(mockAudioBuffer);
            expect(mockSourceNode.connect).toHaveBeenCalledWith(mockAudioContext.destination);
            expect(mockSourceNode.start).toHaveBeenCalled();
            expect(player.audioBufferQueue).toHaveLength(0);
        });

        it('should dispatch audioPlayEnd event when queue is empty', () => {
            player.isPlaying = true;
            const eventSpy = vi.spyOn(player.eventEmitter, 'dispatchEvent');

            player['playNextBuffer']();

            expect(player.isPlaying).toBe(false);
            expect(eventSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'audioPlayEnd'
                })
            );
        });

        it('should disconnect previous source node before playing next', () => {
            player.audioSourceNode = mockSourceNode;
            player.audioBufferQueue.push({
                audioBuffer: {} as AudioBuffer,
                id: 'test-id'
            });

            player['playNextBuffer']();

            expect(mockSourceNode.disconnect).toHaveBeenCalled();
            expect(mockSourceNode.removeEventListener).toHaveBeenCalledWith(
                'ended',
                expect.any(Function)
            );
        });

        it('should bind ended event to play next buffer', () => {
            player.audioBufferQueue.push({
                audioBuffer: {} as AudioBuffer,
                id: 'test-id'
            });

            player['playNextBuffer']();

            expect(mockSourceNode.addEventListener).toHaveBeenCalledWith(
                'ended',
                expect.any(Function)
            );
        });
    });

    describe('pause', () => {
        it('should suspend audio context and dispatch event', async () => {
            player.isPlaying = true;
            const eventSpy = vi.spyOn(player.eventEmitter, 'dispatchEvent');

            player.pause();

            await mockAudioContext.suspend();

            expect(mockAudioContext.suspend).toHaveBeenCalled();
            expect(player.isPlaying).toBe(false);
            expect(eventSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'audioPause'
                })
            );
        });
    });

    describe('resume', () => {
        it('should resume audio context and dispatch event', async () => {
            player.isPlaying = false;
            const eventSpy = vi.spyOn(player.eventEmitter, 'dispatchEvent');

            player.resume();

            await mockAudioContext.resume();

            expect(mockAudioContext.resume).toHaveBeenCalled();
            expect(player.isPlaying).toBe(true);
            expect(eventSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'audioResumePlay'
                })
            );
        });
    });

    describe('dispose', () => {
        it('should clean up resources', () => {
            player.isPlaying = true;
            player.audioSourceNode = mockSourceNode;
            player.audioBufferQueue.push({
                audioBuffer: {} as AudioBuffer,
                id: 'test-id'
            });

            player.dispose();

            expect(player.isPlaying).toBe(false);
            expect(player.audioSourceNode).toBeNull();
            expect(player.audioBufferQueue).toEqual([]);
        });
    });

    describe('convertBufferToAudioBuffer - PCM conversion', () => {
        it('should correctly convert 16-bit PCM to AudioBuffer', () => {
            player.type = AudioType.PCM;
            player.bitDepth = 16;
            player.channels = 1;
            player.sampleRate = 16000;

            const pcmData = new Int16Array([0, 16384, -16384, 32767, -32768]);
            const mockBuffer: IAppendBufferParams = {
                buffer: pcmData.buffer,
                bufferId: 'test-id'
            };

            player.appendBuffer(mockBuffer);

            expect(mockAudioContext.createBuffer).toHaveBeenCalledWith(1, pcmData.length, 16000);
        });

        it('should handle 8-bit PCM conversion', () => {
            player.type = AudioType.PCM;
            player.bitDepth = 8;
            player.channels = 1;
            player.sampleRate = 8000;

            const pcmData = new Int8Array([0, 64, -64, 127, -128]);
            const mockBuffer: IAppendBufferParams = {
                buffer: pcmData.buffer,
                bufferId: 'test-id'
            };

            player.appendBuffer(mockBuffer);

            expect(mockAudioContext.createBuffer).toHaveBeenCalledWith(1, pcmData.length, 8000);
        });

        it('should handle 32-bit PCM conversion', () => {
            player.type = AudioType.PCM;
            player.bitDepth = 32;
            player.channels = 1;
            player.sampleRate = 24000;

            const pcmData = new Int32Array([0, 1073741824, -1073741824]);
            const mockBuffer: IAppendBufferParams = {
                buffer: pcmData.buffer,
                bufferId: 'test-id'
            };

            player.appendBuffer(mockBuffer);

            expect(mockAudioContext.createBuffer).toHaveBeenCalledWith(1, pcmData.length, 24000);
        });

        it('should handle stereo PCM data correctly', () => {
            player.type = AudioType.PCM;
            player.bitDepth = 16;
            player.channels = 2;
            player.sampleRate = 16000;

            // Interleaved stereo data: [L, R, L, R, L, R]
            const pcmData = new Int16Array([100, 200, 300, 400, 500, 600]);
            const mockBuffer: IAppendBufferParams = {
                buffer: pcmData.buffer,
                bufferId: 'test-id'
            };

            player.appendBuffer(mockBuffer);

            expect(mockAudioContext.createBuffer).toHaveBeenCalledWith(2, pcmData.length, 16000);
        });
    });

    describe('Configuration', () => {
        it('should allow setting custom sampleRate', () => {
            player.sampleRate = 24000;
            expect(player.sampleRate).toBe(24000);
        });

        it('should allow setting custom channels', () => {
            player.channels = 2;
            expect(player.channels).toBe(2);
        });

        it('should allow setting custom bitDepth', () => {
            player.bitDepth = 32;
            expect(player.bitDepth).toBe(32);
        });

        it('should allow setting audio type', () => {
            player.type = AudioType.WAV;
            expect(player.type).toBe(AudioType.WAV);
        });
    });
});
