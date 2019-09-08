class Board {

    // Constructor.
    constructor(param){
        // Default constructor.
        if (param === null){
            this._size = null;
            this._boardArray = null;
        }
        // Create a new Board object of given size.
        else if (Number.isInteger(param)){
            this._InitializeBoard(param);
        }
        // Create a new Board object from serialized data.
        else if (Array.isArray(param)){
            
            var numCells = param.length;
            if (numCells === 25 || numCells === 49 || numCells === 81){
                this._InitializeBoard(Math.sqrt(numCells));
            }
            else {
                throw Error('Bad board data.');
            }

            // Iterate through each cell in the array. Map it to the boardArray.
            for (var i = 0; i < numCells; i++){
                var curColor = null;
                var canCapture = false;

                // Set this piece's color based on the data.
                switch(param[i].charAt(0)){
                    case 'O':
                        break;
                    case 'W':
                        curColor = PlayerColor.White;
                        break;
                    case 'B':
                        curColor = PlayerColor.Black;
                        break;
                    default:
                        throw Error('Bad board data.');
                }

                // Set this piece's ability to capture. A double character represents
                // capture ability in the serialized file.
                if (param[i].length === 2){
                    canCapture = true;
                }

                var curPt = this.NumberToPoint(i);
                if (curColor !== null){
                    this._boardArray[curPt.r - 1][curPt.c - 1].occupant = Object.freeze({
                        color: curColor,
                        canCapture: canCapture
                    });
                }
                else {
                    this._boardArray[curPt.r - 1][curPt.c - 1].occupant = null;
                }
            }
        }
    }

    // Gets the size of the board.
    GetSize(){
        return this._size;
    }

    // Gets the cell at a given point.
    _GetCell(pt){
        return this._boardArray[pt.r - 1][pt.c - 1];
    }

    /**
     * @description Executes a move on this board.
     * @param {Move} move The Move object the player wishes to play.
     * @param {Player} player The Player object making the move.
     * @returns {Boolean} Weather or not the move was successful.
     */
    MakeMove(move, player){
        // Save the color of the player executing the move.
        var color = player.GetColor();

        // If the player wants to quit.
        if (move.GetAction() === MoveAction.Quit){
            return false;
        }

        // Get the cell that we want to mov from.
        var moveCell = this._GetCell(move.GetLocation());

        // Make sure that this location has a piece in it.
        if (moveCell.occupant === null){
            return false;
        }

        // Make sure the piece is the player's own.
        if (moveCell.occupant.color !== color){
            return false;
        }

        // Make sure the target is not occupied by one of the player's own pieces.
        var targetCell = this._GetCell(this.FindTarget(move.GetLocation(), move.GetDirection()));
        if (targetCell.occupant === null){
            // Skip the rest of the if-else.
        }
        else if (targetCell.occupant.color === color){
            return false;
        }
        // Also make sure that if occupied by an opponent, we have the ability to capture.
        else if (targetCell.occupant.color !== color && !moveCell.occupant.canCapture){
            return false;
        }

        // If we have made it this far, we are allowed to execute the move.
        // Allow the piece to capture if we reach the opponent's home location.
        if (targetCell.owner === PlayerColor.Opponent(color)){
            moveCell.occupant = Object.freeze({
                color: moveCell.occupant.color,
                canCapture: true
            });
        }
        targetCell.occupant = moveCell.occupant;
        moveCell.occupant = null;
        
        // Return a successful move result.
        return true;
    }

    // Returns the score of a player on the board by color.
    GetPlayerScore(color){
        var numOpponents = 0;
        var pts = 0;

        for (var i = 0; i < Math.pow(this._size, 2); i++){
            var curCell = this._GetCell(this.NumberToPoint(i));
            if (curCell.occupant === null){
                continue;
            }
            else if (curCell.occupant.color === color){
                if (curCell.owner === PlayerColor.Opponent(color)){
                    pts += curCell.value;
                }
            }
            else if (curCell.occupant.color === PlayerColor.Opponent(color)){
                numOpponents += 1;
            }
        }
        // Add the necessary points to reflect capturing opponents.
        var numPieces = this._size + 2;
        pts += 5 * (numPieces - numOpponents);
        return pts;
    }

    // Determine if one of the players have ended the game.
    IsWinner(){
        // If one player's pieces are completely gone, the other wins.
        var whiteCount = 0;
        var blackCount = 0;
        var whiteWin = true;
        var blackWin = true;
        for (var i = 0; i < Math.pow(this._size, 2); i++){
            var curCell = this._GetCell(this.NumberToPoint(i));
            // Check each cell to see if there are any with pieces not in an 
            // opponents home location. In this case, there is no winner yet.
            if (curCell.occupant === null){
                continue;
            }
            if (curCell.occupant.color === PlayerColor.White && curCell.owner !== PlayerColor.Black){
                whiteWin = false;
            }
            else if (curCell.occupant.color === PlayerColor.Black && curCell.owner !== PlayerColor.White){
                blackWin = false;
            }

            // Count the total number of black and white pieces still on the board.
            if (curCell.occupant.color === PlayerColor.White){
                whiteCount++;
            }
            else if (curCell.occupant.color === PlayerColor.Black){
                blackCount++;
            }
        }
        if (whiteCount === 0 || blackCount === 0){
            return true;
        }
        else if (whiteWin === true || blackWin === true){
            return true;
        }
        return false;
    }

    // Tests a point to see if it falls on the board.
    IsValidLocation(pt){
        if (pt.r < 1 || pt.r > this._size || pt.c < 1 || pt.c > this._size){
            return false;
        }
        return true;
    }

    // Finds a target based on a starting point and a direction.
    FindTarget(pt, dir){
        switch(dir){
            case MoveDirection.NW:
                return Object.freeze({ r: pt.r - 1, c: pt.c - 1 });
            case MoveDirection.NE:
                return Object.freeze({ r: pt.r - 1, c: pt.c + 1 });
            case MoveDirection.SE:
                return Object.freeze({ r: pt.r + 1, c: pt.c + 1 });
            case MoveDirection.SW:
                return Object.freeze({ r: pt.r + 1, c: pt.c - 1 });
        }
    }

    NumberToPoint(num){
        var row = Math.floor(num / this._size) + 1;
        var col = Math.floor(num % this._size) + 1;
        return Object.freeze({ r: row, c: col });
    }

    PointToNumber(pt){
        return (pt.r - 1) * this._size + pt.c - 1;
    } 

    GetPointFromDirection(pt, dir){
        var points = this.GetSurroundingPoints(pt);
        for (var i = 0; i < points.length; i++){
            if (this.GetMoveDirection(pt, points[i]) === dir){
                return points[i];
            }
        }
    }

    GetOccupant(pt){
        return this._GetCell(pt).occupant;
    }

    GetOwner(pt){
        return this._GetCell(pt).owner;
    }

    GetSurroundingPoints(pt){
        var points = new Array();
        for (var i = -1; i <= 1; i++){
            for (var j = -1; j <= 1; j++){
                if (i === 0 || j === 0){
                    continue;
                }
                var curPt = Object.freeze({ r: pt.r + i, c: pt.c + j })
                if (this.IsValidLocation(curPt)){
                    points.push(curPt);
                }
            }
        }
        return points;
    }

    GetMoveDirection(start, end){
        if (end.r < start.r && end.c < start.c){
            return MoveDirection.NW;
        }
        else if (end.r < start.r && end.c > start.c){
            return MoveDirection.NE;
        }
        else if (end.r > start.r && end.c > start.c){
            return MoveDirection.SE;
        }
        else if (end.r > start.r && end.c < start.c){
            return MoveDirection.SW;
        }
        else {
            return null;
        }
    }

    /**
     * @description Creates and initializes a game board of given size to default parameters.
     * @param {Number} size The integer size of the board. Must be 5, 7, or 9.
     * @throws An exception is thrown if an invalid board size is given.
     */
    _InitializeBoard(size){
        // Check to be sure a valid board size was passed.
        if (size !== 5 && size !== 7 && size !== 9){
            throw "Invalid board size.";
        }
        this._size = size;

        // Create the board array.
        this._boardArray = Array(this._size);
        for (var i = 0; i < this._size; i++){
            this._boardArray[i] = Array(this._size);
        }

        // Loop through each row to assign cell values.
        for (var row = 0; row < this._size; row++){
            // Default values. We'll use these unless conditions are met below.
            var cellColor = null;
            var onEdge = false;

            // If we are on the first 2 rows, the color will get set to white.
            if (row <= 1){
                cellColor = PlayerColor.White;
                if (row == 0){
                    onEdge = true;
                }
            }
            // If we are on the last 2 rows, the color will be set to black.
            if (row >= this._size - 2){
                cellColor = PlayerColor.Black;
                if (row == this._size - 1){
                    onEdge = true;
                }
            }
            // Loop through each column and assign cells correctly.
            for (var col = 0; col < this._size; col++){
                // Build a new cell location for the board.
                var thisLoc = Object({ 
                    owner: null, 
                    occupant: null, 
                    value: 0 
                });
                
                if ((onEdge || col === 0 || col === this._size - 1) && cellColor !== null){
                    thisLoc.owner = cellColor;
                    thisLoc.occupant = Object.freeze({ 
                        color: cellColor, 
                        canCapture: false 
                    });
    
                    // Assign the correct point value to each location.
                    var thisValue;
                    if (!onEdge || col === 1 || col === this._size - 2){
                        thisValue = 1;
                    }
                    else if (col === 0 || col === this._size - 1){
                        thisValue = 3;
                    }
                    else {
                        thisValue = ((Math.min(col, this._size - 1 - col) + 1) * 2) - 1;
                    }
                    thisLoc.value = thisValue;
                }
                // Assign the new board location to the board.
                this._boardArray[row][col] = thisLoc;
            }
        }
        // Remove bad values from the middle of the board.
        for (var row = 2; row < this._size - 2; row++){
            this._boardArray[row][0].value = 0;
            this._boardArray[row][this._size - 1].value = 0;
        }
    }
}