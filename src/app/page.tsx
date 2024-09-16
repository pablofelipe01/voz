// app/page.tsx
import Recorder from './components/Recorder';

export default function Home() {
  return (
    <main className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white rounded-2xl shadow-lg w-11/12 max-w-md p-5">
        <Recorder />
      </div>
    </main>
  );
}
