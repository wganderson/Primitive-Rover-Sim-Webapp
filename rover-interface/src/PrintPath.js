import React, { useState } from 'react';

function PrintPath() {
    const [path, setPath] = useState("")
    const [rover_id, setRoverID] = useState(0)

    //let url = ""; //for deployment
    let url = "http://localhost:8000";
    
    const handleSubmit = async function () {
        let resp = await fetch('/rovers/' + String(rover_id) + '/path',
            {
                method: 'GET',
                mode: 'cors'
            })
        let pathway = await resp.json()
        console.log(pathway)
        setTimeout(() => {
            setPath(pathway)
        }, 250)
        console.log(path)
    }

    return (
        <div className="PrintPath">
            <div>
                <h2>Path Display</h2>
            </div>
                <input type="number" id="rover_id" placeholder='ID' onChange={(e) => setRoverID(e.target.value)}></input><br />
                <button onClick={handleSubmit} >Submit</button>
            <div id="just-line-break">
                {path}
            </div>
        </div>
    );
}

export default PrintPath;
