
import VoiceRecorder from './components/VoiceRecorder';

export default function Home() {
  return (
    <div
      className="bg-cover bg-center min-h-screen"
      style={{ backgroundImage: "url('/Assitant.png')" }}
    >
      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 p-10">
        

        {/* VoiceRecorderUploader Component */}
        <div className="bg-white bg-opacity-80 rounded-2xl shadow-lg w-full p-5">
          <VoiceRecorder />
        </div>


      </main>
    </div>
  );
}