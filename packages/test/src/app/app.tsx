// Uncomment this line to use CSS modules
// import styles from './app.module.scss';
import {Mp3AudioPlayer} from './mp3'

export function App() {
  const a = 1;
  return (
    <div>
        <h1>Mp3播放</h1>
        <Mp3AudioPlayer />
    </div>
  );
}

export default App;
