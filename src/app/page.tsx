import VoiceRecorder from './components/VoiceRecorder';


export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-green-400 to-blue-500 relative">
      {/* Logo in the top right, adjusted for mobile */}
     

      <main className="grid grid-cols-1 gap-5 p-5 md:p-10">
        {/* VoiceRecorder Frame with 3D shadow effect */}
        <div className="border-2 border-gray-300 rounded-lg shadow-2xl p-5 mb-5 bg-white text-blue-900 mt-10 transform transition-transform hover:scale-105">
          <h2 className="text-xl font-semibold mb-4 text-center">Inicio Turno</h2>
          <VoiceRecorder />
        </div>
        
      
  

      </main>
    </div>
  );
}
