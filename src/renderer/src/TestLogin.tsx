import { Button, Input } from "@chakra-ui/react";
import { useState } from "react";


function TestLogin() {

  const [username, setUsername] = useState("username");
  const [password, setPassword] = useState("password");


  function handleLogin() {
    window.electron.ipcRenderer.send("riotLogin", username, password);
  }


  return (<>
    <Input value={username} onChange={(e) => setUsername(e.target.value)} />
    <Input value={password} onChange={(e) => setPassword(e.target.value)} />
    <Button colorPalette={"riot"} onClick={handleLogin}>
      Login
    </Button>
  </>)
}

export default TestLogin;