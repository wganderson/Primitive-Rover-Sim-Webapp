import React, { useState, useContext } from 'react';
import {mapContext} from './MapSelector';

function MineMenu() {
    const {mapData, setMapData} = useContext(mapContext);

    const getMap = async function () {
        let resp = await fetch('http://localhost:8000/map',
            {
                method: 'GET',
                mode: 'cors'
            })

        let json = await resp.json()
        setMapData(json)
    }

    const form = document.getElementById("modify-mine");
    if (form != null) {
        form.addEventListener("submit", function (event) {
            event.preventDefault();
            let id = Number(document.getElementById("mine_id").value);
            let x = document.getElementById("xpos").value;
            let y = document.getElementById("ypos").value;
            let serial = document.getElementById("serial").value;
            console.log(id)
            const minejson = { "mine_id": id, "xpos": x, "ypos": y, "serial": serial }
            fetch('http://localhost:8000/mines/' + String(id) + '?' + new URLSearchParams(minejson),
                {
                    method: 'PUT',
                    mode: 'cors'
                })
            setTimeout(() => {
                getMap()
            }, 250)
        })
    }

    return (
        <div className="MineMenu">
            <div>
                <h2>Modify Mine</h2>
            </div>
            <form id="modify-mine">
                <input type="number" id="mine_id" placeholder='ID'></input><br />
                <input type="number" id="xpos" placeholder='X Position'></input><br />
                <input type="number" id="ypos" placeholder='X Position'></input><br />
                <input type="text" id="serial" placeholder='Serial Code'></input><br />
                <input type="submit" value="Submit" />
            </form>
        </div>
    );
}

export default MineMenu;
