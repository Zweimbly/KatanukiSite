let canvasL = document.getElementById('c1');
let cL = canvasL.getContext("2d");

let canvasR = document.getElementById('c2');
let cR = canvasR.getContext("2d");

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

let keystate = {left: false, up: false, right: false, down: false, space: false, r: false};

class Board {
    startPos;
    pos;
    vel = {dx: 0, dy: 0};
    velModifier;
    //keystate = {left: false, up: false, right: false, down: false, space: false, r: false};
    resetShape = true;
    menuScreen = true;
    outOfBounds = false;
    score = 100;
    scoreModifier = 0.1;
    maxEdges;
    xMax;
    xMin;
    yMax;
    yMin;

    shape = [];

    constructor(startPos, maxEdges, velModifier) {
        this.startPos = {x: startPos.x, y: startPos.y};
        this.maxEdges = maxEdges;
        this.pos = {x: this.startPos.x, y: this.startPos.y};
        this.velModifier = velModifier;
        this.xMax = canvasL.width - 4;
        this.xMin = this.pos.x + 50;
        this.yMax = canvasL.height - 4;
        this.yMin = this.pos.y + 50;
    }

    /****** SHAPE GENERATION ******/

    generateShape() {
        this.shape = [];
        let secondPoint = {x: Math.random() * (this.xMax - this.xMin) + this.xMin, y: Math.random() * (this.yMax - this.yMin) + this.yMin};
        let tempXMin = this.pos.x;
        let tempXMax = this.pos.x + ((canvasL.width - this.pos.x) / ((this.maxEdges - 2) / 2));
        let tempYMin = 5;
        let tempYMax = secondPoint.y;

        let tempPoint = {x: this.pos.x, y: this.pos.y};
        let newPoint = {x: Math.random() * (tempXMax - tempXMin) + tempXMin, y: Math.random() * (tempYMax - tempYMin) + tempYMin};
        this.shape.push({Ax: tempPoint.x, Ay: tempPoint.y, Bx: newPoint.x, By: newPoint.y});

        for (let i = 0; i < (this.maxEdges - 2) / 2; i++) {
            tempPoint = newPoint;
            tempXMin = tempPoint.x;
            tempXMax = tempPoint.x + ((canvasL.width - tempPoint.x) / ((this.maxEdges - 2) / 2));
            newPoint = {x: Math.random() * (tempXMax - tempXMin) + tempXMin, y: Math.random() * (tempYMax - tempYMin) + tempYMin};
            this.shape.push({Ax: tempPoint.x, Ay: tempPoint.y, Bx: newPoint.x, By: newPoint.y});
        }

        this.shape.push({Ax: newPoint.x, Ay: newPoint.y, Bx: secondPoint.x, By: secondPoint.y});
        tempXMin = secondPoint.x - ((secondPoint.x / ((this.maxEdges - 2) / 2)));
        tempXMax = secondPoint.x;
        tempYMin = secondPoint.y;
        tempYMax = canvasL.height - 5;

        tempPoint = secondPoint;
        newPoint = {x: Math.random() * (tempXMax - tempXMin) + tempXMin, y: Math.random() * (tempYMax - tempYMin) + tempYMin};
        this.shape.push({Ax: tempPoint.x, Ay: tempPoint.y, Bx: newPoint.x, By: newPoint.y});

        for (let i = 0; i < (this.maxEdges - 2) / 2; i++) {
            tempPoint = newPoint;
            tempXMin = tempPoint.x - (tempPoint.x / ((this.maxEdges - 2) / 2));
            tempXMax = tempPoint.x;
            newPoint = {x: Math.random() * (tempXMax - tempXMin) + tempXMin, y: Math.random() * (tempYMax - tempYMin) + tempYMin};
            this.shape.push({Ax: tempPoint.x, Ay: tempPoint.y, Bx: newPoint.x, By: newPoint.y});
        }

        this.shape.push({Ax: newPoint.x, Ay: newPoint.y, Bx: this.pos.x, By: this.pos.y});
    }

/****** DISTANCE CHECKING FUNCTIONS FOR SCORING ******/

    distanceSquared(a, b) {
        return (((a.x - b.x) * (a.x - b.x)) + ((a.y - b.y) * (a.y - b.y)));
    }

    getDistanceFromLine(curPoint, line) {
        let l2 = this.distanceSquared({x: line.Ax, y: line.Ay}, {x: line.Bx, y: line.By});
        let t = ((curPoint.x - line.Ax) * (line.Bx - line.Ax) + (curPoint.y - line.Ay) * (line.By - line.Ay)) / l2;
        t = Math.max(0, Math.min(1, t));
        let dSquare = this.distanceSquared(curPoint, {x: line.Ax + t * (line.Bx - line.Ax), y: line.Ay + t * (line.By - line.Ay)});
        return Math.sqrt(dSquare);
    }

    checkKeystate() {
        if (keystate.left) {
            this.vel.dx = -this.velModifier;
        }
        if (keystate.up) {
            this.vel.dy = -this.velModifier;
        }
        if (keystate.right) {
            this.vel.dx = this.velModifier;
        }
        if (keystate.down) {
            this.vel.dy = this.velModifier;
        }
        if (!keystate.left && !keystate.right) {
            this.vel.dx = 0;
        }
        if (!keystate.up && !keystate.down) {
            this.vel.dy = 0;
        }
        if (keystate.space) {
            this.menuScreen = false;
            this.resetBoard();
            keystate.space = false;
        }
        if (keystate.r) {
            this.menuScreen = false;
            this.resetShape = true;
            this.resetBoard();
            keystate.r = false;
        }
    }

    /****** DRAW FUNCTIONS ******/

    checkCanvasBounds() {
        this.pos.x += this.vel.dx;
        this.pos.y += this.vel.dy;
        this.pos.x = Math.max(0, Math.min(canvasL.width, this.pos.x));
        this.pos.y = Math.max(0, Math.min(canvasL.height, this.pos.y));
    }

    checkShapeBounds(curPoint) {
        const results = this.shape.map(this.getDistanceFromLine.bind(this, curPoint));
        let closestDelta = Math.min.apply(null, results);
        if (closestDelta > 3) {
            cL.strokeStyle = "red";
            this.modifyScore();
        }
    }

    drawPlayerPath() {
        cL.beginPath();
        cL.lineWidth = "2";
        cL.strokeStyle = "black";
        this.checkKeystate();
        cL.moveTo(this.pos.x, this.pos.y);
        this.checkCanvasBounds();
        this.checkShapeBounds(this.pos);
        cL.lineTo(this.pos.x, this.pos.y);
        cL.stroke();
    }

    generalStageSetup() {
        cL.fillStyle = "rgba(256,256,256,1)";
        cL.clearRect(0, 0, canvasL.width, canvasL.height);
        cR.fillStyle = "rgba(256,256,256,1)";
        cR.clearRect(0, 0, canvasR.width, canvasR.height);
        cL.fillStyle = "red";
        cL.fillRect(this.pos.x - 1, this.pos.y - 1, 2, 2);
        cL.fillStyle = "black";
        cL.strokeStyle = "rgba(0,0,0,0.1)";
        cR.strokeStyle = "rgba(0,0,0,1)";
        cR.beginPath();
        cL.beginPath();
        cL.moveTo(this.shape[0].Ax, this.shape[0].Ay);
        cR.moveTo(this.shape[0].Ax, this.shape[0].Ay);
    
        for (let i = 0; i < this.shape.length; i++) {
            cL.lineTo(this.shape[i].Bx, this.shape[i].By);
            cR.lineTo(this.shape[i].Bx, this.shape[i].By);
        }
    
        cL.stroke();
        cR.stroke();
    }

    modifyScore() {
        this.score -= this.scoreModifier;
        if (this.score > 30) {
            document.getElementById('score-text').innerHTML = "Score: " + this.score.toFixed(1);
        }
        else if (this.score <= 30 && this.score > 0) {
            document.getElementById('score-text').style.color = "red";
            document.getElementById('score-text').style.backgroundColor = "#8e8a92";
            document.getElementById('score-text').innerHTML = "Score: " + this.score.toFixed(1);
        }
        else {
            document.getElementById('score-text').innerHTML = "Score: 0";
        }
    }

    /****** GAME LOOP CONTROL FUNCTIONS ******/

    resetBoard() {
        this.pos = {x: this.startPos.x, y: this.startPos.y};
        this.score = 100;
        
        document.getElementById('score-text').style.color = "black";
        document.getElementById('score-text').innerHTML = "Score: " + this.score;
    
        if (this.resetShape) {
            this.resetShape = false;
            this.generateShape();
        }
    
        this.generalStageSetup();
    }

    drawMenu() {
        cL.font = "40px Verdana";
        cL.fillStyle = "black";
        cL.textAlign = "center";
        cL.fillText("Press Spacebar or R to start!", canvasL.width/2, canvasL.height/2, canvasL.width);
        
        document.getElementById('score-text').style.backgroundColor = "#f5f5f5";
        document.getElementById('score-text').style.paddingLeft = "1vw";
        document.getElementById('score-text').style.paddingRight = "1vw";
        document.getElementById('score-text').style.paddingTop = "0.5vw";
        document.getElementById('score-text').style.paddingBottom = "0.5vw";
        document.getElementById('score-text').style.marginTop = "1vh";
        document.getElementById('score-text').style.borderRadius = "5px";

    }

    gameHandler() {
        window.requestAnimationFrame(this.gameHandler.bind(this));

        cL.fillStyle = "rgba(0,0,0,0.1)";
        
        if (!this.menuScreen) {
            this.drawPlayerPath();
        }
        else {
            this.checkKeystate();
        }
    }

    Start() {
        this.drawMenu();
        this.gameHandler();
    }
}

/****** KEYBOARD BEHAVIOR FUNCTIONS ******/

function keyDownHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") {
        keystate.right = true;
    } 
    else if (e.key === "Left" || e.key === "ArrowLeft") {
        keystate.left = true;
    }
    else if (e.key === "Up" || e.key === "ArrowUp") {
        keystate.up = true;
    }
    else if (e.key === "Down" || e.key === "ArrowDown") {
        keystate.down = true;
    }
    else if (e.key === " ") {
        keystate.space = true;
    }
    else if (e.key === "r") {
        keystate.r = true;
    }
}

function keyUpHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") {
        keystate.right = false;
    } 
    else if (e.key === "Left" || e.key === "ArrowLeft") {
        keystate.left = false;
    }
    else if (e.key === "Up" || e.key === "ArrowUp") {
        keystate.up = false;
    }
    else if (e.key === "Down" || e.key === "ArrowDown") {
        keystate.down = false;
    }
}

/****** MAIN FUNCTION ******/

function main() {
    canvasL.width = (window.innerWidth / 2) - (window.innerWidth / 33);
    canvasL.height = (window.innerHeight / 4) * 3;
    canvasR.width = (window.innerWidth / 2) - (window.innerWidth / 33);
    canvasR.height = (window.innerHeight / 4) * 3;

    const curBoard = new Board({x: 200, y: 50}, 6, 0.8);

    curBoard.Start();
}

main();