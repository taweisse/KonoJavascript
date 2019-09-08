class Player {
    /**
     * @description Constructs a new player with a given number of points.
     * @param {Number} overallPoints 
     */
    constructor(overallPoints){
        this._points = overallPoints ? overallPoints : 0;
        this._color = null;
    }

    AddPoints(pts){
        this._points += pts;
    }

    GetOverallPoints(){
        return this._points;
    }

    GetColor(){
        return this._color;
    }

    /**
     * @description Set the color of this player, IE for a new game.
     * @param {PlayerColor} color 
     */
    SetColor(color){
        this._color = color;
    }

    // Overridden in children.
    PrePlay(move, board){
        // If the board is null, we have free reign over the board.
        // If there is location in the Move object, we must move that piece.
        if (move === null){
            // Find the best move to play on this board.
            return this.FindBestMove(board, this)
        }
        else{
            return this.FindBestMove(board, this, move.GetLocation());
        }
    }

    FindBestMove(board, parent, start){
        // If a starting point is passed, we must move that piece.
        if (start !== undefined){
            var chosenMove =  FindMove(start); 
            if (chosenMove === null || chosenMove.GetReason() === MoveReason.Random){
                return new Move(null, null, MoveAction.Skip);
            }
            return chosenMove;
        }

        // Will hold the best move found for each piece on the board.
        var moves = Array();

        // Loop through each cell on the board.
        for (var i = 0; i < Math.pow(board.GetSize(), 2); i++){
            var curPt = board.NumberToPoint(i);

            // If we have a piece at this location, find the best move for it.
            if (board.GetOccupant(curPt) !== null && board.GetOccupant(curPt).color === parent._color){
                moves.push(FindMove(curPt));
            }
        }
        // Remove any null moves that may have ended up in the moves list.
        moves = moves.filter(move => move !== null);

        // Rank the moves based on their 'importance'.
        var highestRank = -1;
        moves.forEach(function(move){
            if (MoveReason.GetWeight(move.GetReason()) > highestRank){
                highestRank = MoveReason.GetWeight(move.GetReason());
            }
        })

        // Remove all but the highest ranked moves.
        moves = moves.filter(move => MoveReason.GetWeight(move.GetReason()) === highestRank);

        // If there were no moves left to play, return a random move to progress the game.
        if (moves.length === 0){
            // Find a random move for every piece we have on the board.
            for (var i = 0; i < Math.pow(board.GetSize(), 2); i++){
                curPt = board.NumberToPoint(i);
                if (board.GetOccupant(curPt) !== null && board.GetOccupant(curPt).color === parent._color){
                    moves.push(MoveToEmptySpace(board, curPt));
                }
            }
            // Remove any null moves that ended up in the list.
            moves = moves.filter(move => move !== null);

            // If there still isn't anything left to play, return a move to quit.
            if (moves.length === 0){
                return new Move(null, null, MoveAction.Quit)
            }
        }
        // Return a random move from the remaining list.
        return moves[Math.floor(Math.random() * moves.length)]

        // Finds the best move for a specific point.
        function FindMove(curPt){
            if (board.GetOccupant(curPt) !== null && board.GetOccupant(curPt).color === parent._color){
                // If the piece is going to be captured, avoid as the first priority.
                if (CanBeCaptured(board, curPt, parent)){
                    return EscapeCapture(board, curPt, parent);
                }
                // Try to block the opponent from reaching a home location. If this is
                // possible, a valid move will be returned. If not, blocking isn't an option.
                var tmpMove = BlockOpponent(board, curPt, parent);
                if (tmpMove !== null){
                    return tmpMove;
                }
                // Capture a neighboring opponent if possible.
                tmpMove = CaptureOpponent(board, curPt, parent);
                if (tmpMove !== null){
                    return tmpMove;
                }
                // If nothing above works, we will advance towards a home location, assuming
                // we can leave our own home location without it being captured.
                if (!ShouldStayBlocking(board, curPt, parent)){
                    return MoveTowardsHomeLocation(board, curPt, parent);
                }
                // If all else fails.
                return MoveToEmptySpace(board, curPt);
            }
        }

        function CanBeCaptured(board, start, parent){
            // If we have capture ability, we don't need to worry about being captured.
            // (We will capture the opponent before they capture us, most likely.)
            if (board.GetOccupant(start) !== null && board.GetOccupant(start).canCapture){
                return false;
            }
            var points = GetSurroundingPoints(board, start);
    
            for (var i = 0; i < points.length; i++){
                if (board.GetOccupant(points[i].target) !== null 
                    && board.GetOccupant(points[i].target).canCapture 
                    && board.GetOccupant(points[i].target).color !== parent._color){
                    return true;
                }
            }
        }
    
        function EscapeCapture(board, start, parent){
            var points = GetSurroundingPoints(board, start);
    
            for (var i = 0; i < points.length; i++){
                // If a neighboring cell is empty and out of capture risk, move there.
                if (board.GetOccupant(points[i].target) === null && !CanBeCaptured(board, points[i].target, parent)){
                    return new Move(start, points[i].direction, MoveAction.Play, MoveReason.EscapeCapture, null);
                }
            }
            return MoveTowardsHomeLocation(board, start, parent);
        }
    
        function BlockOpponent(board, start, parent){
            // Get a list of all surrounding points. If any are our home locations, and empty, check to
            // see if there are any opponents around it that will try to capture.
            var points = GetSurroundingPoints(board, start);
    
            for (var i = 0; i < points.length; i++){
                var curOccupant = board.GetOccupant(points[i].target);
                // If we have an empty location around us, make sure nobody will try to capture it.
                if (curOccupant === null && board.GetOwner(points[i].target) === parent._color){
                    // Find any potential opponents around the empty home location.
                    var aroundHome = GetSurroundingPoints(board, points[i].target);
                    for (var j = 0; j < aroundHome.length; j++){
                        // If there is an opponent that can be blocked, move to the home location.
                        var enemy = board.GetOccupant(aroundHome[j].target);
                        if (enemy !== null && enemy.color !== parent._color && !enemy.canCapture){
                            return new Move(start, points[i].direction, MoveAction.Play, MoveReason.BlockOpponent, aroundHome[j].target);
                        }
                    }
                }
            }
            return null;
        }
    
        function CaptureOpponent(board, start, parent){
            // Make sure we can even capture in the first place.
            if (!board.GetOccupant(start).canCapture){
                return null;
            }
            var points = GetSurroundingPoints(board, start);
    
            for (var i = 0; i < points.length; i++){
                var curOccupant = board.GetOccupant(points[i].target);
                // See if there are any opponent pieces around that we can capture.
                if (curOccupant !== null && curOccupant.color !== parent._color){
                    // Don't capture if we are going to be captured as a result.
                    if (!CanBeCaptured(board, points[i].target, parent)){
                        return new Move(start, points[i].direction, MoveAction.Play, MoveReason.Capture, points[i].target);
                    }
                }
            }
            return null;
        }
    
        function ShouldStayBlocking(board, start, parent){
            // Make sure we are even in a home location.
            if (board.GetOwner(start) !== parent._color){
                return false;
            }
            // If there is an opponent neighboring us and we are in a home location, stay put.
            var points = GetSurroundingPoints(board, start);
    
            for (var i = 0; i < points.length; i++){
                if (board.GetOccupant(points[i].target) !== null && board.GetOccupant(points[i].target).color !== parent._color){
                    return true;
                }
            }
            // Else return false. We are safe to leave this location.
            return false;
        }
    
        function MoveTowardsHomeLocation(board, start, parent){
            // Make sure we aren't already in a home location.
            var startColor = board.GetOccupant(start).color;
            var ownerColor = board.GetOwner(start);
            if (ownerColor !== null && startColor !== ownerColor){
                return null;
            }
            // Test to see if there are any home locations next to us already. Use them first.
            var points = GetSurroundingPoints(board, start);
            for (var i = 0; i < points.length; i++){
                if (board.GetOwner(points[i].target) === PlayerColor.Opponent(parent._color) && board.GetOccupant(points[i].target) === null){
                    return new Move(start, points[i].direction, MoveAction.Play, MoveReason.Advance, points[i].target);
                }
            }

            // Loop through every cell on the board to find the home locations.
            for (var i = 0; i < Math.pow(board.GetSize(), 2); i++){
                var curPt = board.NumberToPoint(i);
    
                // If this point is owned by the opponent, and we aren't already there, lets try to move to it.
                if (board.GetOwner(curPt) === PlayerColor.Opponent(parent._color) && board.GetOccupant(curPt) !== null && board.GetOccupant(curPt).color !== parent._color){
                    // First see if it is possible to reach the point.
                    if (CanReach(start, curPt)){
                        // If we can reach the point, return a move towards it.
                        var move = MoveTowardsPoint(board, start, curPt, parent);
                        if (move !== null){
                            return new Move(move.GetLocation(), move.GetDirection(), MoveAction.Play, MoveReason.Advance, curPt);
                        }
                    }
                }
            }
            return MoveToEmptySpace(board, start);
        }
    
        function MoveToEmptySpace(board, start){
            var points = GetSurroundingPoints(board, start);
            for (var i = 0; i < points.length; i++){
                if (board.GetOccupant(points[i].target) === null){
                    return new Move(start, points[i].direction, points[i].direction, MoveReason.Random, null);
                }
            }
            return null;
        }
    
        function MoveTowardsPoint(board, start, end, parent){
            var initHorDist = Math.abs(start.c - end.c);
            var initVertDist = Math.abs(start.r - end.r);
    
            var points = GetSurroundingPoints(board, start);
    
            for (var i = 0; i < points.length; i++){
                // Make sure we wont get captured by moving here.
                if (CanBeCaptured(board, points[i].target, parent)){
                    continue;
                }
    
                var curHorDist = Math.abs(points[i].target.c - end.c);
                var curVertDist = Math.abs(points[i].target.r - end.r);
    
                // Figure out how to move towards the point we want to. This differs depending
                // on if we need to move horizontally or vertically.
                var curMove = null;
                if (initHorDist <= initVertDist){
                    if (curVertDist < initVertDist && curHorDist <= curVertDist){
                        curMove = new Move(start, points[i].direction, MoveAction.Play, null, end);
                    }
                }
                else {
                    if (curHorDist < initHorDist && curVertDist <= curHorDist){
                        curMove = new Move(start, points[i].direction, MoveAction.Play, null, end);
                    }
                }
    
                // If nothing is in our way, return this move.
                if (curMove !== null){
                    var startOccupant = board.GetOccupant(start);
                    var endOccupant = board.GetOccupant(points[i].target);
    
                    if (endOccupant === null){
                        return curMove;
                    }
                    else if (endOccupant.color != startOccupant.color && startOccupant.canCapture){
                        return curMove;
                    }
                    else {
                        continue;
                    }
                }
            }
            // If all else fails.
            return MoveToEmptySpace(board, start);
        }
    
        function CanReach(start, end){
            var pt1 = start.r + start.c;
            var pt2 = end.r + end.c;
    
            // If the sum of both components of each point are either both odd or both even, the
            // end point can be reached by moving diagonally.
            if (pt1 % 2 === 0 && pt2 % 2 === 0){
                return true;
            }
            else if (pt1 % 2 !== 0 && pt2 % 2 !== 0){
                return true;
            }
            return false;
        }
    
        /**
         * @description Returns an array of the points diagonal to a given point.
         * @param {Board} board 
         * @param {Object} start 
         */
        function GetSurroundingPoints(board, start){
            var surroundingPoints = Array();
            
            // Loop through the points around the given start point.
            for (var i = -1; i <= 1; i++){
                for (var j = -1; j <= 1; j++){
                    if (i === 0 || j === 0){
                        // Skip non-diagonal locations.
                        continue;
                    }
                    // Decide what direction each move is.
                    var dir;
                    if (i === -1 && j === -1){
                        dir = MoveDirection.NW;
                    }
                    else if (i === -1 && j === 1){
                        dir = MoveDirection.NE;
                    }
                    else if (i === 1 && j === 1){
                        dir = MoveDirection.SE;
                    }
                    else {
                        dir = MoveDirection.SW;
                    }
    
                    var newRow = start.r + i;
                    var newCol = start.c + j;
                    var movePt = Object({r: newRow, c: newCol});
                    if (board.IsValidLocation(movePt)){
                        surroundingPoints.push(Object.freeze({
                            target: movePt,
                            direction: dir
                        }));
                    }
                }
            }
            return surroundingPoints;
        }
    }

    Play(move, board){
        // If the player wants to skip his 2nd turn.
        if (move.GetAction() === MoveAction.Skip){
            return true;
        }

        // Execute the move.
        var result = board.MakeMove(move, this);
        return result;
    }
}