import Recorder from './components/Recorder';
import SingleFileUploader from './components/SingleFileUploader';
import FileUploader from './components/FileUploader';
import VoiceRecorderUploader from './components/VoiceRecorderUploader';

export default function Home() {
  return (
    <div
      className="bg-cover bg-center min-h-screen"
      style={{ backgroundImage: "url('/Assitant.png')" }}
    >
      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5 p-10">
        {/* Recorder Component */}
        <div className="bg-white bg-opacity-80 rounded-2xl shadow-lg w-full p-5">
          <Recorder />
        </div>

        {/* VoiceRecorderUploader Component */}
        <div className="bg-white bg-opacity-80 rounded-2xl shadow-lg w-full p-5">
          <VoiceRecorderUploader />
        </div>

        {/* FileUploader Component */}
        <div className="bg-white bg-opacity-80 rounded-2xl shadow-lg w-full p-5">
          <FileUploader />
        </div>

        {/* SingleFileUploader Component */}
        <div className="bg-white bg-opacity-80 rounded-2xl shadow-lg w-full p-5">
          <SingleFileUploader />
        </div>
      </main>
    </div>
  );
}