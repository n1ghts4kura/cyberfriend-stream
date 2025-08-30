import logo from './logo.svg';

function App() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gray-800 text-white select-none">
      <img src={logo} className="h-40 animate-spin-slow pointer-events-none" alt="logo" />
      <p className="mt-6 text-sm text-gray-300">Edit <code className="text-brand">src/App.js</code> and save to reload.</p>
      <a
        className="mt-4 text-brand hover:underline -webkit-app-region-no-drag"
        href="https://reactjs.org"
        target="_blank"
        rel="noopener noreferrer"
      >Learn React</a>
    </div>
  );
}

export default App;
