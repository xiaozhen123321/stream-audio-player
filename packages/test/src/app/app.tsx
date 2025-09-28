// Uncomment this line to use CSS modules
// import styles from './app.module.scss';
import {Mp3AudioPlayer} from './mp3'
import {WavAudioPlayer} from './wav'
import {PCMAudioPlayer} from './pcm'
import '@ant-design/v5-patch-for-react-19';

import {Tabs} from 'antd';

const items = [
  {
    key: 'mp3',
    label: 'MP3',
    children: <Mp3AudioPlayer />,
  },
  {
    key: 'wav',
    label: 'Wav',
    children: <WavAudioPlayer />,
  },
  {
    key: 'pcm',
    label: 'PCM',
    children: <PCMAudioPlayer />
  },
];

export function App() {
  return (
    <div>
        <Tabs defaultActiveKey="mp3" items={items} />
    </div>
  );
}

export default App;
