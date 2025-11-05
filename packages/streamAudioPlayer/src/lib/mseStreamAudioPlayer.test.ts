/**
 * @file MseStreamAudioPlayer 单元测试
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MseStreamAudioPlayer } from './mseStreamAudioPlayer';
import { IAppendBufferParams } from './type';

describe('MseStreamAudioPlayer', () => {
  let player: MseStreamAudioPlayer;
  let mockMediaSource: any;
  let mockSourceBuffer: any;
  let mockAudioElement: any;

  beforeEach(() => {
    // Mock SourceBuffer
    mockSourceBuffer = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      appendBuffer: vi.fn(),
      updating: false,
    };

    // Mock MediaSource
    mockMediaSource = {
      readyState: 'open',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addSourceBuffer: vi.fn().mockReturnValue(mockSourceBuffer),
      endOfStream: vi.fn(),
    };

    global.MediaSource = function MediaSourceMock() {
      return mockMediaSource;
    } as any;

    // Mock Audio element
    mockAudioElement = {
      src: '',
      currentTime: 0,
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    global.Audio = function AudioMock() {
      return mockAudioElement;
    } as any;

    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');

    player = new MseStreamAudioPlayer();
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
      expect(player.sourceBufferUpdating).toBe(false);
      expect(player.arrayBufferQueue).toEqual([]);
      expect(player.eventEmitter).toBeInstanceOf(EventTarget);
    });

    it('should create MediaSource and Audio element on init', () => {
      player.init();

      expect(player.mediaSource).toBeDefined();
      expect(player.audioElement).toBeDefined();
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    it('should bind events on init', () => {
      player.init();

      expect(mockMediaSource.addEventListener).toHaveBeenCalledWith('sourceopen', expect.any(Function));
      expect(mockAudioElement.addEventListener).toHaveBeenCalledWith('canplay', expect.any(Function));
      expect(mockAudioElement.addEventListener).toHaveBeenCalledWith('ended', expect.any(Function));
    });
  });

  describe('sourceOpen event', () => {
    beforeEach(() => {
      player.init();
    });

    it('should create sourceBuffer when sourceopen event fires', () => {
      player.sourceOpen();

      expect(mockMediaSource.addSourceBuffer).toHaveBeenCalledWith('audio/mpeg');
      expect(player.sourceBuffer).toBe(mockSourceBuffer);
    });

    it('should bind sourceBuffer events', () => {
      player.sourceOpen();

      expect(mockSourceBuffer.addEventListener).toHaveBeenCalledWith('updatestart', expect.any(Function));
      expect(mockSourceBuffer.addEventListener).toHaveBeenCalledWith('updateend', expect.any(Function));
    });

    it('should not create sourceBuffer if it already exists', () => {
      player.sourceOpen();
      mockMediaSource.addSourceBuffer.mockClear();
      player.sourceOpen();

      expect(mockMediaSource.addSourceBuffer).not.toHaveBeenCalled();
    });

    it('should throw error if mediaSource is null', () => {
      player.mediaSource = null;

      expect(() => player.sourceOpen()).toThrow('MediaSource is null');
    });
  });

  describe('appendBuffer', () => {
    beforeEach(() => {
      player.init();
      player.sourceOpen();
    });

    it('should append buffer when not updating', () => {
      const mockBuffer: IAppendBufferParams = {
        buffer: new ArrayBuffer(8),
        bufferId: 'test-id',
      };

      player.appendBuffer(mockBuffer);

      expect(mockSourceBuffer.appendBuffer).toHaveBeenCalledWith(mockBuffer.buffer);
      expect(player.sourceBufferUpdating).toBe(true);
    });

    it('should queue buffer when sourceBuffer is updating', () => {
      player.sourceBufferUpdating = true;
      const mockBuffer: IAppendBufferParams = {
        buffer: new ArrayBuffer(8),
        bufferId: 'test-id',
      };

      player.appendBuffer(mockBuffer);

      expect(player.arrayBufferQueue).toHaveLength(1);
      expect(player.arrayBufferQueue[0]).toBe(mockBuffer);
      expect(mockSourceBuffer.appendBuffer).not.toHaveBeenCalled();
    });

    it('should queue buffer when sourceBuffer.updating is true', () => {
      mockSourceBuffer.updating = true;
      const mockBuffer: IAppendBufferParams = {
        buffer: new ArrayBuffer(8),
        bufferId: 'test-id',
      };

      player.appendBuffer(mockBuffer);

      expect(player.arrayBufferQueue).toHaveLength(1);
    });

    it('should queue buffer when arrayBufferQueue has items', () => {
      player.arrayBufferQueue.push({
        buffer: new ArrayBuffer(4),
        bufferId: 'existing-id',
      });

      const mockBuffer: IAppendBufferParams = {
        buffer: new ArrayBuffer(8),
        bufferId: 'test-id',
      };

      player.appendBuffer(mockBuffer);

      expect(player.arrayBufferQueue).toHaveLength(2);
    });

    it('should do nothing if sourceBuffer is null', () => {
      player.sourceBuffer = null;
      const mockBuffer: IAppendBufferParams = {
        buffer: new ArrayBuffer(8),
        bufferId: 'test-id',
      };

      player.appendBuffer(mockBuffer);

      expect(player.arrayBufferQueue).toHaveLength(0);
    });
  });

  describe('sourceBufferUpdateStart', () => {
    it('should set sourceBufferUpdating to true', () => {
      player.sourceBufferUpdating = false;

      player.sourceBufferUpdateStart();

      expect(player.sourceBufferUpdating).toBe(true);
    });
  });

  describe('sourceBufferUpdateEnd', () => {
    beforeEach(() => {
      player.init();
      player.sourceOpen();
    });

    it('should set sourceBufferUpdating to false', () => {
      player.sourceBufferUpdating = true;

      player.sourceBufferUpdateEnd();

      expect(player.sourceBufferUpdating).toBe(false);
    });

    it('should process next buffer in queue if available', () => {
      const nextBuffer: IAppendBufferParams = {
        buffer: new ArrayBuffer(8),
        bufferId: 'next-id',
      };
      player.arrayBufferQueue.push(nextBuffer);
      player.sourceBufferUpdating = true;

      player.sourceBufferUpdateEnd();

      expect(player.arrayBufferQueue).toHaveLength(0);
      expect(mockSourceBuffer.appendBuffer).toHaveBeenCalledWith(nextBuffer.buffer);
    });

    it('should call endOfStream when no more buffers and not updating', () => {
      mockSourceBuffer.updating = false;
      mockMediaSource.readyState = 'open';
      player.sourceBufferUpdating = true;

      player.sourceBufferUpdateEnd();

      expect(mockMediaSource.endOfStream).toHaveBeenCalled();
    });

    it('should not call endOfStream if sourceBuffer is still updating', () => {
      mockSourceBuffer.updating = true;
      mockMediaSource.readyState = 'open';

      player.sourceBufferUpdateEnd();

      expect(mockMediaSource.endOfStream).not.toHaveBeenCalled();
    });

    it('should not call endOfStream if readyState is not open', () => {
      mockSourceBuffer.updating = false;
      mockMediaSource.readyState = 'closed';

      player.sourceBufferUpdateEnd();

      expect(mockMediaSource.endOfStream).not.toHaveBeenCalled();
    });

    it('should throw error if mediaSource is null', () => {
      player.mediaSource = null;

      expect(() => player.sourceBufferUpdateEnd()).toThrow('MediaSource is null');
    });
  });

  describe('play', () => {
    beforeEach(() => {
      player.init();
    });

    it('should call audio play and dispatch events', async () => {
      const eventSpy = vi.spyOn(player.eventEmitter, 'dispatchEvent');

      player.play();

      expect(mockAudioElement.play).toHaveBeenCalled();
      expect(mockAudioElement.currentTime).toBe(0);
      expect(eventSpy).toHaveBeenCalledWith(expect.any(CustomEvent));

      // Wait for promise to resolve
      await mockAudioElement.play();

      expect(player.isPlaying).toBe(true);
    });
  });

  describe('pause', () => {
    beforeEach(() => {
      player.init();
      player.isPlaying = true;
    });

    it('should pause audio and dispatch event', () => {
      const eventSpy = vi.spyOn(player.eventEmitter, 'dispatchEvent');

      player.pause();

      expect(mockAudioElement.pause).toHaveBeenCalled();
      expect(player.isPlaying).toBe(false);
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'audioPause',
        })
      );
    });
  });

  describe('resume', () => {
    beforeEach(() => {
      player.init();
      player.isPlaying = false;
    });

    it('should resume audio playback and dispatch event', async () => {
      const eventSpy = vi.spyOn(player.eventEmitter, 'dispatchEvent');

      player.resume();

      await mockAudioElement.play();

      expect(mockAudioElement.play).toHaveBeenCalled();
      expect(player.isPlaying).toBe(true);
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'audioResumePlay',
        })
      );
    });
  });

  describe('audioReadyToPlay', () => {
    beforeEach(() => {
      player.init();
    });

    it('should dispatch audioReadyToPlay event when not playing', () => {
      const eventSpy = vi.spyOn(player.eventEmitter, 'dispatchEvent');
      player.isPlaying = false;

      player.audioReadyToPlay();

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'audioReadyToPlay',
        })
      );
    });

    it('should not dispatch event if already playing', () => {
      const eventSpy = vi.spyOn(player.eventEmitter, 'dispatchEvent');
      player.isPlaying = true;

      player.audioReadyToPlay();

      expect(eventSpy).not.toHaveBeenCalled();
    });
  });

  describe('audioEnd', () => {
    beforeEach(() => {
      player.init();
      player.isPlaying = true;
    });

    it('should set isPlaying to false and dispatch event', () => {
      const eventSpy = vi.spyOn(player.eventEmitter, 'dispatchEvent');

      player.audioEnd();

      expect(player.isPlaying).toBe(false);
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'audioPlayEnd',
        })
      );
    });
  });

  describe('dispose', () => {
    beforeEach(() => {
      player.init();
      player.sourceOpen();
      player.isPlaying = true;
    });

    it('should clean up resources', () => {
      player.dispose();

      expect(player.isPlaying).toBe(false);
      expect(mockAudioElement.src).toBe('');
      expect(player.sourceBuffer).toBeNull();
    });

    it('should unbind events', () => {
      player.dispose();

      expect(mockMediaSource.removeEventListener).toHaveBeenCalledWith('sourceopen', expect.any(Function));
      expect(mockAudioElement.removeEventListener).toHaveBeenCalledWith('canplay', expect.any(Function));
      expect(mockAudioElement.removeEventListener).toHaveBeenCalledWith('ended', expect.any(Function));
    });
  });

  describe('Event lifecycle', () => {
    beforeEach(() => {
      player.init();
    });

    it('should properly bind events', () => {
      player.bindEvent();

      expect(mockMediaSource.addEventListener).toHaveBeenCalled();
      expect(mockAudioElement.addEventListener).toHaveBeenCalled();
    });

    it('should properly unbind events', () => {
      player.sourceOpen();
      player.unbindEvent();

      expect(mockMediaSource.removeEventListener).toHaveBeenCalled();
      expect(mockSourceBuffer.removeEventListener).toHaveBeenCalled();
      expect(mockAudioElement.removeEventListener).toHaveBeenCalled();
    });

    it('should handle unbind when sourceBuffer is null', () => {
      player.sourceBuffer = null;

      expect(() => player.unbindEvent()).not.toThrow();
    });
  });
});
