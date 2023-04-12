import './App.css';
import React, { useState } from 'react';
import MapSelector from './MapSelector';
import RoverMenu from './RoverMenu';
import MineMenu from './MineMenu';

function App() {
  return (
    <div className="App">
            <div className = "split left">
        <div className = "centeredleft">
          <RoverMenu/>
          <MineMenu/>
        </div>
      </div>
      <div className="split right">
        <div className="centeredright">
          <MapSelector/>
        </div>
      </div>

    </div>
  );
}

export default App;
