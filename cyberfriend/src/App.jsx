import Live2DMinimalCanvas from './live2d/components/Live2DMinimalCanvas';

export default function App() {
  return (
    <div className="w-screen h-screen bg-black overflow-hidden">
      <Live2DMinimalCanvas className="w-full h-full" modelJson="Haru.model3.json" margin={0.97} placeholder="" debug />
    </div>
  );
}
