import Versions from './components/Versions'
import TestLogin from './TestLogin'

function App(): React.JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  return (
    <>
      <TestLogin />
      <Versions></Versions>
    </>
  )
}

export default App
