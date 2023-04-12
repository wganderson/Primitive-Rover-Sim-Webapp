import requests
import json
import numpy as np
import threading
from threading import Thread
from time import sleep, perf_counter
from hashlib import sha256
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware

import shutil

import logging
import grpc

app = FastAPI()

origins = ["http://localhost:3000", "http://localhost:8000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#Objects for serving
class RoverModel(BaseModel):
    id: int
    status: str
    xpos: int
    ypos: int
    commands: str

rovers_list = {}
rover_counter = 1

class MineModel(BaseModel):
    id: int
    status: str #Armed, Defused, Exploded
    serial: str
    xpos: int
    ypos: int

mines_list = {}
mine_counter = 1

class Map(BaseModel):
    rows: int
    cols: int
    content: str

#Rover FastAPI functions

#GET To retrieve the list of all rovers
@app.get('/rovers')
def getRoverList():
    return list(rovers_list.values())

#GET To retrieve a rover with the “:id”, the response should
# include the ID, status (“Not Started”, “Finished”, “Moving”, or
# “Eliminated”), latest position and list of commands of the
# rover.
@app.get('/rovers/{rover_id}')
def getRover(rover_id: int):
    if rover_id not in rovers_list:
        raise HTTPException(status_code=404, detail="Rover not found")
    return rovers_list[rover_id]

#POST To create a rover. The list of commands as a String should
# be required in the body of the request. The ID of the rover
# should be returned in the response upon successful
# creation
@app.post('/rovers')
def postRover(commands: str):
    global rover_counter
    class RoverModel():
        id: int
        status: str
        xpos: int
        ypos: int
        commands: str

    new_rover = RoverModel()
    new_rover.id = rover_counter
    rover_counter += 1
    new_rover.status = "Not Started"
    new_rover.xpos = 0
    new_rover.ypos = 0
    new_rover.commands = commands
    rovers_list[new_rover.id] = new_rover
    return {"message": f"Rover {new_rover.id} created"}

#DELETE To delete a rover with the “:id”
@app.delete('/rovers/{rover_id}')
def deleteRover(rover_id: int):
    if rover_id not in rovers_list:
        raise HTTPException(status_code=404, detail="Rover not found")
    
    del rovers_list[rover_id]
    return {"message": f"Rover {rover_id} has been deleted"}

#PUT To send the list of commands to a rover as a String. Note if
# the rover status is not “Not Started” nor “Finished”, a failure
# response should be returned
@app.put('/rovers/{rover_id}')
def putRoverCommand(rover_id: int, commands: str):
    if rover_id not in rovers_list:
        raise HTTPException(status_code=404, detail="Rover not found")
    elif rovers_list[rover_id].status != "Not Started" and rovers_list[rover_id].status != "Finished":
        raise HTTPException(status_code=405, detail="Rover may not accept commands right now")

    rovers_list[rover_id].commands = commands

#POST To dispatch a rover with the “:id”, the response should
# include the ID, status, latest position and list of the executed
# commands of the rover.
@app.post('/rovers/{rover_id}/dispatch')
def postDispatchRover(rover_id: int):
    if rover_id not in rovers_list:
        raise HTTPException(status_code=404, detail="Rover not found")
    elif rovers_list[rover_id].status != "Not Started":
        raise HTTPException(status_code=405, detail="Rover is already dispatched")
    
    rovers_list[rover_id].status = "Moving"

    pathFind(rovers_list[rover_id])
    return {"message": f"Rover {rover_id} has been dispatched."}

#Mine FastAPI functions

#GET To retrieve the list of all mines, the response should include
# the serial number of the mines, and coordinates
@app.get('/mines')
def getMines():
    return list(mines_list.values())

#GET To retrieve a mine with the “:id”, the response should
# include the serial number of the mine, and coordinates.
@app.get('/mines/{mine_id}')
def getMine(mine_id: int):
    if mine_id not in mines_list:
        raise HTTPException(status_code=404, detail="Mine not found")
    
    return mines_list[mine_id]

#DELTE To delete a mine with the “:id”
@app.delete('/mines/{mine_id}')
def deleteMine(mine_id: int):
    if mine_id not in mines_list:
        raise HTTPException(status_code=404, detail="Mine not found")
    
    del mines_list[mine_id]
    
    writeMap()
    return {"message": f"Mine {mine_id} has been successfully deleted"}

#POST To create a mine. The coordinates (X and Y), along with the
# serial number should be required in the body of the request.
# The ID of the mine should be returned in the response upon
# successful creation
@app.post('/mines')
def createMine(xpos: int, ypos: int, serial: str):
    print("adding mine at:(", xpos, ", ", ypos, ")" )
    global mine_counter
    class Mine():
        id: int
        status: str
        serial: str
        xpos: int
        ypos: int

    for i in mines_list:
        if mines_list[i].xpos == xpos and mines_list[i].ypos == ypos:
            print("mine already there")
            return {"error": "A mine already exists in that position"}
        
    new_mine = Mine()
    new_mine.id = mine_counter
    mine_counter += 1
    new_mine.xpos = xpos
    new_mine.ypos = ypos
    new_mine.serial = serial
    new_mine.status = "Armed"
    mines_list[new_mine.id] = new_mine
    writeMap()
    return {"message": f"Mine {new_mine.id} created successfully"}

#PUT To update a mine. The coordinates (X and Y), along with
# the serial number should be optional in the body of the
# request. Only the included parameters should get updated
# upon receiving the request. The response must include the
# full updated mine object.
@app.put('/mines/{mine_id}')
def putMineData(mine_id: int, xpos: int, ypos: int, serial: str):
    if mine_id not in mines_list:
        raise HTTPException(status_code=404, detail="Mine not found")
    elif mines_list[mine_id].status != "Armed":
        raise HTTPException(status_code=405, detail="Mine has been disabled")
    for i in mines_list:
        if mines_list[i].xpos == xpos and mines_list[i].ypos == ypos:
            print("mine already there")
            raise HTTPException(status_code=405, detail="A mine already exists in that position")
        
    if xpos > 0:
        mines_list[mine_id].xpos = xpos
    if ypos > 0:
        mines_list[mine_id].ypos = ypos
    if len(serial) > 0:
        mines_list[mine_id].serial = serial
    writeMap()

#Map FastAPI functions

#GET To retrieve the 2D array of the field.
@app.get('/map')
def getMap():
    class Map():
        rows = 0
        cols = 0
        content = []
    
    new_map = Map()

    with open("map.txt", 'r') as fp:
        dim = fp.readline().split()
        new_map.rows = int(dim[0])
        new_map.cols = int(dim[1])

        mapArr = [[0]*new_map.cols]*new_map.rows
        for i in range(new_map.rows):
            mapArr[i] = fp.readline().split()

        new_map.content = mapArr
    return new_map

#write the current mines to the map file
def writeMap():
    mapData = getMap()
    rows = mapData.rows
    cols = mapData.cols
    arr = np.zeros((rows,cols), dtype = int)
    with open("map.txt", 'w') as fp:
        fp.write(str(rows) + " " + str(cols) + "\n")
        for i in range(rows):
            for j in range(cols):
                flag = False
                for k in mines_list:
                    if mines_list[k].xpos == j and mines_list[k].ypos == i:
                        print("HIT!")
                        fp.write(str(mines_list[k].id))
                        fp.write(" ")
                        flag = True
                if not flag:
                    fp.write("0")
                    fp.write(" ")

            fp.write("\n")

#reset map to original default
def resetMap():
    source = "original.txt"
    dest = "map.txt"
    shutil.copyfile(source, dest)
resetMap() # run

#PUT To update the height and width of the field
@app.put('/map')
def putMap(cols: int, rows: int):
    mapArr = [[0]*rows]*cols

    with open("map.txt", "w") as f:
        f.write(f"{rows} {cols}\n")

        for row in mapArr:
            print()
            f.write(" ".join(str(x) for x in row) + "\n")
    writeMap()
    return {"Message": "Map updated"}


class RoverNav:
    def __init__(self):
        self.position = [0, 0]
        self.direction = "S"

    def leftTurn(self):
        if self.direction == "S":
            self.direction = "E"
        elif self.direction == "W":
            self.direction = "S"
        elif self.direction == "N":
            self.direction = "W"
        elif self.direction == "E":
            self.direction = "N"

    def rightTurn(self):
        if self.direction == "S":
            self.direction = "W"
        elif self.direction == "W":
            self.direction = "N"
        elif self.direction == "N":
            self.direction = "E"
        elif self.direction == "E":
            self.direction = "S"

    def forward(self):
        map = getMap()

        if self.direction == "S" and self.position[1] < map.rows - 1:
            self.position[1] += 1
        elif self.direction == "W" and self.position[0] > 0:
            self.position[0] -= 1
        elif self.direction == "N" and self.position[1] > 0:
            self.position[1] -= 1
        elif self.direction == "E" and self.position[0] < map.cols - 1:
            self.position[0] += 1


def dig(id):
    mine = mines_list[id]
    print("digging at: (", mine.xpos, ",", mine.ypos, ")")
    serial = mine.serial
    print("serial: ", serial)
    count = 0
    while (count < 10000):
        pinstr = format(count, "04d")
        hash = sha256((pinstr + serial).encode('utf-8')).hexdigest()
        leading = len(hash) - len(hash.lstrip("0"))
        if leading >= 6:
            print("------------------------")
            print("leading: " + str(leading))
            print("pin: " + pinstr)
            break
        else:
            count += 1


def pathFind(rover):

    command = rover.commands
    print("commands: " + command)

    mars = RoverNav()

    mapData = getMap()
    mapArr = mapData.content
    rows = mapData.rows
    cols = mapData.cols

    pathArr = np.zeros((rows, cols), str)
    pathArr.fill("0")
    pathArr[0, 0] = "*"

    for i in range(len(command)):
        defuseflag = 0
        digSpotID = int(mapArr[mars.position[1]][mars.position[0]])
        if command[i] == "M":
            mars.forward()
            pathArr[mars.position[1], mars.position[0]] = "*"
        elif command[i] == "L":
            mars.leftTurn()
        elif command[i] == "R":
            mars.rightTurn()
        elif command[i] == "D":
            if digSpotID != 0:
                print("digging mine... ")
                dig(digSpotID)
                defuseflag = 1
            else:
                print("no mine to dig")
        if (i < len(command) - 1):
            if command[i + 1] == "M" and digSpotID != 0 and defuseflag == 0:
                print("EXPLOSION!")
                break
        else:
            print("success")

    fp = open("path_" + str(rover.id) + ".txt", "w+")
    for i in range(rows):
        fp.write(" ".join(pathArr[i]) + "\n")

def testMineCreateEdit():
    resetMap()
    createMine(5, 6, "abcdevtxkw")
    writeMap()

def testRoverCreateDispatch():
    postRover(1, "MMMMRMLRRRLRMLMRMLMMMLMMRMMLDMLMMMMMLRLLRDMMMLDMLRDMRLMRMRMRRMLRLLRMDRMRDLMDLM")
    postDispatchRover(1)

if __name__ == "__main__":
    testMineCreateEdit()
    testRoverCreateDispatch()