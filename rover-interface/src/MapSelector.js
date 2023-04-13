import React, { useState, createContext } from 'react';

export const mapContext = createContext("");

function MapSelector() {
    const [mapData, setMapData] = useState(null)
    const [mode, setMode] = useState("")

    let map = [];

    const handleCreateEvent = function (xpos, ypos) {
        return function () {
            let serial = prompt("Enter Serial Number", "");
            if (serial == null) {
                return
            }
            const minejson = { "xpos": xpos, "ypos": ypos, "serial": serial }
            fetch('/mines?' + new URLSearchParams(minejson),
                {
                    method: 'POST',
                    mode: 'cors'
                })
            setTimeout(() => {
                getMap()
            }, 250)
        }
    }

    const handleDeleteEvent = function (mine_id) {
        return function () {
            const minejson = { "mine_id": mine_id }
            fetch('/mines/' + String(mine_id),
                {
                    method: 'Delete',
                    mode: 'cors'
                })
            setTimeout(() => {
                getMap()
            }, 250)
        }
    }

    const handleUndefEvent = function () {
        return function () { alert("Please select a map function"); }
    }

    const handleRowButton = function (diff, rows, cols) {
        return function () {
            if (!(rows + diff < 1 || rows + diff > 25)) {
                rows += diff
            }
            const mapjson = { "rows": rows, "cols": cols }
            fetch('/map?' + new URLSearchParams(mapjson),
                {
                    method: 'PUT',
                    mode: 'cors'
                })
            setTimeout(() => {
                getMap()
            }, 250)
        }
    }

    const handleColButton = function (diff, rows, cols) {
        return function () {
            if (!(cols + diff < 1 || cols + diff > 25)) {
                cols += diff
            }
            const mapjson = { "rows": rows, "cols": cols }
            fetch('/map?' + new URLSearchParams(mapjson),
                {
                    method: 'PUT',
                    mode: 'cors'
                })
            setTimeout(() => {
                getMap()
            }, 250)
        }
    }


    const getMap = async function () {
        let resp = await fetch('/map',
            {
                method: 'GET',
                mode: 'cors'
            })

        let json = await resp.json()
        setMapData(json)
    }

    if (mapData == null) {
        getMap()

        return <div>Loading...</div>
    }

    let mapRows = mapData.rows
    let mapCols = mapData.cols
    for (let i = 0; i < mapRows; i++) {
        let buttons = [];
        for (let j = 0; j < mapCols; j++) {
            let str = "O"
            if (mapData.content[i][j] != "0") {
                str = String(mapData.content[i][j])
            }
            if (mode == "Create") {
                buttons.push(<button key={j} width="75px" height="75px" onClick={handleCreateEvent(j, i)}>{str}</button>)
            }
            else if (mode == "Delete") {
                let mine_id = 0;
                if (str != "O") {
                    mine_id = parseInt(str)
                }
                buttons.push(<button key={j} width="75px" height="75px" onClick={handleDeleteEvent(mine_id)}>{str}</button>)
            }
            else {
                buttons.push(<button key={j} width="75px" height="75px" onClick={handleUndefEvent()}>{str}</button>)
            }
        }
        map.push(<div key={i}>{buttons}</div>)
    }


    return (
        <mapContext.Provider value={{mapData, setMapData}}>
            <div className="MapSelector">
                <div>
                    <h1>Mine Map</h1>
                </div>
                <div>
                    <strong>Mine Functions:</strong>
                </div>
                <div>
                    Column Adjust:&nbsp;&nbsp;
                    <button onClick={handleColButton(1, mapRows, mapCols)}>+</button>
                    <button onClick={handleColButton(-1, mapRows, mapCols)}>-</button>
                </div>
                <div>
                    Row Adjust:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    <button onClick={handleRowButton(1, mapRows, mapCols)}>+</button>
                    <button onClick={handleRowButton(-1, mapRows, mapCols)}>-</button>
                </div>
                <div>
                    Create:<input type="radio" value="Create" name="minesel" onClick={() => setMode("Create")}></input>
                    Delete<input type="radio" value="Delete" name="minesel" onClick={() => setMode("Delete")}></input>
                </div>
                <div>
                    {map}
                </div>
            </div>
        </mapContext.Provider>
    );
}

export default MapSelector;
