import './App.css';
import React, { useState } from 'react';

function App() {
  const [xpos, setxpos] = useState(0)
  const [ypos, setypos] = useState(0)
  const [serial, setserial] = useState("")

  const onSubmit = function(){
    fetch('http://------------:8080/', {  // Enter your IP address here

      method: 'POST', 
      mode: 'cors', 
      body: JSON.stringify(jsonData) // body data type must match "Content-Type" header

    })
  }

  return (
    <div className="App">
      <div>
        <label>x coordinate: </label>
        <input type="number" value={xpos} onChange={(e) => setxpos(e.target.value)}/>
      </div>
      <div>
        <label>y coordinate: </label>
        <input type="number" value={ypos} onChange={(e) => setypos(e.target.value)}/>
      </div>
      <div>
        <label>serial code: </label>
        <input value={serial} onChange={(e) => setserial(e.target.value)}/>
      </div>
      <div>
        <button type="button" onClick={onSubmit}>
          submit
        </button>
      </div>
    </div>
  );
}

export default App;
