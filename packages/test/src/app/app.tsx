// Uncomment this line to use CSS modules
// import styles from './app.module.scss';
import {Mp3AudioPlayer} from './mp3';
import {WavAudioPlayer} from './wav';
import {PCMAudioPlayer} from './pcm';

import {Tabs} from 'antd';

const items = [
    {
        key: 'mp3',
        label: 'MP3',
        children: <Mp3AudioPlayer />
    },
    {
        key: 'wav',
        label: 'Wav',
        children: <WavAudioPlayer />
    },
    {
        key: 'pcm',
        label: 'PCM',
        children: <PCMAudioPlayer />
    }
];

export function App() {
    return (
        <div>
            <h1>流式音频播放在线demo</h1>
            <a href="https://www.npmjs.com/package/stream-audio-player" target="_blank">
                npm地址
            </a>
            <a href="https://github.com/xiaozhen123321/stream-audio-player" target="_blank">
                github地址
            </a>
            <Tabs defaultActiveKey="mp3" items={items} />
        </div>
    );
}

export default App;
