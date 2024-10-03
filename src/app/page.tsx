import VoiceRecorder from './components/VoiceRecorder';
import PesoBiochar from './components/PesoBiochar';

export default function Home() {
  return (
    <div
      className="bg-cover bg-center min-h-screen flex items-center justify-center"
      style={{ backgroundImage: "url('/Assitant.png')" }}
    >
      <main className="grid grid-cols-1 gap-5 p-10">
        {/* VoiceRecorderUploader Component */}
        <div className="rounded-2xl shadow-lg w-full p-5">
          <VoiceRecorder />
          <PesoBiochar />
        </div>
      </main>
    </div>
  );
}
