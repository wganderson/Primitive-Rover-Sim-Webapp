import React, { useState, useContext } from 'react';
import { mapContext } from './MapSelector';

function MineMenu() {
    const { mapData, setMapData } = useContext(mapContext);
    const [mine_id, setMineID] = useState(0)
    const [x_pos, setX] = useState(0)
    const [y_pos, setY] = useState(0)
    const [serial, setSerial] = useState("")

    //let url = ""; //for deployment
    let url = "http://localhost:8000";
    
    const getMap = async function () {
        let resp = await fetch('/map',
            {
                method: 'GET',
                mode: 'cors'
            })

        let json = await resp.json()
        setMapData(json)
    }

    const handleSubmit = function () {
        const minejson = { "mine_id": mine_id, "xpos": x_pos, "ypos": y_pos, "serial": serial }
        fetch(url + '/mines/' + String(mine_id) + '?' + new URLSearchParams(minejson),
            {
                method: 'PUT',
                mode: 'cors'
            })
        setTimeout(() => {
            getMap()
        }, 250)
    }

    return (
        <div className="MineMenu">
            <div>
                <h2>Modify Mine</h2>
            </div>
            <form id="modify-mine">
                <input type="number" id="mine_id" placeholder='ID' onChange={(e) => setMineID(e.target.value)}></input><br />
                <input type="number" id="xpos" placeholder='X Position' onChange={(e) => setX(e.target.value)}></input><br />
                <input type="number" id="ypos" placeholder='X Position' onChange={(e) => setY(e.target.value)}></input><br />
                <input type="text" id="serial" placeholder='Serial Code' onChange={(e) => setSerial(e.target.value)}></input><br />
                <input type="submit" value="Submit" onClick={handleSubmit} />
            </form>
        </div>
    );
}

export default MineMenu;
