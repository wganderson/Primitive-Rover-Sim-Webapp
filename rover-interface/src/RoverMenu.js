import React, { useState } from 'react';

function RoverMenu() {
    const [roverData, setRoverData] = useState(null)

    let rovers = []
    const handleCreateButton = function () {
        return function () {
            let commands = prompt("Enter Command List", "");
            if (commands == null) {
                return
            }
            const roverjson = {"commands": commands }
            fetch('/rovers?' + new URLSearchParams(roverjson),
            {
                method: 'POST',
                mode: 'cors'
            })
            setTimeout(() => {
                getRovers()
            }, 250)
        }
    }

    const handleDeleteButton = function (id) {
        return function () {
            const idjson = {"rover_id": id}
            fetch('/rovers/' + id + '?' + new URLSearchParams(idjson),
            {
                method: 'DELETE',
                mode: 'cors'
            })
            setTimeout(() => {
                getRovers()
            }, 250)
        }
    }

    const handleDispatchButton = function (id) {
        return function () {
            const idjson = {"rover_id": id}
            fetch('/rovers/' + id + '/dispatch?' + new URLSearchParams(idjson),
            {
                method: 'POST',
                mode: 'cors'
            })
            setTimeout(() => {
                getRovers()
            }, 250)
        }
    }

    const handleMofifyButton = function (id) {
        return function () {
            let commands = prompt("Enter New Command List", "");
            if (commands == null) {
                return
            }
            const roverjson = {"rover_id": id, "commands": commands }
            fetch('/rovers/' + id + '?' + new URLSearchParams(roverjson),
            {
                method: 'PUT',
                mode: 'cors'
            })
            setTimeout(() => {
                getRovers()
            }, 250)
        }
    }

    const getRovers = async function () {
        let resp = await fetch('/rovers',
            {
                method: 'GET',
                mode: 'cors'
            })
        
        let json = await resp.json()
        setRoverData(json)
    }

    if (roverData == null) {
        getRovers()

        return <div>Loading...</div>
    }

    let roverFormat = [];
    for(let i = 0; i < Object.keys(roverData).length; i++) {
        let rover = roverData[i];
        roverFormat.push(
            <div key = {i}>
                <b>|Rover {rover.id}|</b>
                {rover.status}
                <b>|</b>({rover.xpos}, {rover.ypos})<b>|</b>
                &nbsp;&nbsp;
                <button onClick = {handleDispatchButton(rover.id)}>Dispatch</button>
                <button onClick = {handleMofifyButton(rover.id)}>Modify</button>
                <button onClick = {handleDeleteButton(rover.id)}>Delete</button>
            </div>
        )
    }

    return (
        <div className="RoverMenu">
            <div>
                <h1>Rover Menu</h1>
            </div>
            {roverFormat}
            <div>
                <button onClick = {handleCreateButton()}>Create New Rover</button>
            </div>
        </div>
    );
}

export default RoverMenu;
