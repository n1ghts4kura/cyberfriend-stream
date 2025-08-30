import Live2DCanvas from './live2d/components/Live2DCanvas';

function App() {
  return (
    <div className="w-screen h-screen overflow-hidden bg-black text-white">
      <Live2DCanvas modelPath="live2d/models/Haru" modelJson="Haru.model3.json" className="absolute inset-0" />
    </div>
  );
}

export default App;
