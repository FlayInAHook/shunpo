import { Button, Input } from "@chakra-ui/react";
import { useEffect, useState } from "react";


function TestLogin() {

  const [username, setUsername] = useState("username");
  const [password, setPassword] = useState("password");


  function handleLogin() {
    window.electron.ipcRenderer.send("riotLogin", username, password);
  }

  useEffect(() => {
    //riotDataUpdate
    window.electron.ipcRenderer.on("riotDataUpdate", (event, data) => {
      console.log("Received Riot data update:", data);
    });
    // Cleanup the listener on component unmount
    return () => {
      window.electron.ipcRenderer.removeAllListeners("riotDataUpdate");
    };
  }, []);

  return (<>
    <Input value={username} onChange={(e) => setUsername(e.target.value)} />
    <Input value={password} onChange={(e) => setPassword(e.target.value)} />
    <Button colorPalette={"riot"} onClick={handleLogin}>
      Login
    </Button>
  </>)
}

export default TestLogin;