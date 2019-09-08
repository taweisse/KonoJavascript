class Game {
    /**
     * @description Constructs a new Game object with the given parameters.
     * @param {Player} p1 The Player object representing player 1 in this game.
     * @param {Player} p2 The Player object representing player 2 in this game.
     * @param {Number} curPlayer The first player to move in this game.
     * @param {Board} board The Board object on which this game will be played.
     */
    constructor(p1, p2, curPlayer, board){
        this._players = new Array(2);
        this._players[0] = (p1 ? p1 : null);
        this._players[1] = (p2 ? p2 : null);
        this._curPlayer = (curPlayer ? curPlayer - 1 : null);
        this._secondMove = false;
        this._board = (board ? board : null);
        this._winner = null;
    }

    /**
     * @description Gets the Board object that this game is played on.
     * @returns {Board} The Board object that this game is played on.
     */
    GetBoard(){
        return this._board;
    }

    GetPlayer(num){
        return this._players[num - 1];
    }

    // Finds the winner of the game, if there is one.
    GetWinner(){
        return this._winner;
    }

    /**
     * @description Gets the next Player object to make a move in this game.
     * @returns {Player} The next Player to move.
     */
    GetNextPlayer(){
        return this._players[this._curPlayer];
    }

    GetNextPlayerNumber(){
        return this._curPlayer + 1;
    }

    GetMoveNumber(){
        return this._secondMove ? 2 : 1;
    }

    /**
     * @description Calls PrePlay() on whichever player is up next using the given Move.
     * @param {Move} move The Move object that the player would like to execute. Can be 
     * null for the computer player, since it will override this object with its own Move.
     * @returns {Move} The Move object that the player responded with.
     */
    PrePlay(move){
        return this._players[this._curPlayer].PrePlay(move, this._board);
    }

    /**
     * @description Calls Play() on whichever player is up next using the given Move.
     * @param {Move} move The Move object that the player would like to execute.
     */
    Play(move){
        // Do nothing if there is already a winner for this game.
        if (this._winner !== null){
            return false;
        }
        // If a player quits, subtract 5 points from their score and end the game.
        if (move.GetAction() == MoveAction.Quit){
            var p1Pts = this._board.GetPlayerScore(this._players[0].GetColor());
            var p2Pts = this._board.GetPlayerScore(this._players[1].GetColor());

            if (this._curPlayer == 0){
                p1Pts -= 5;
            }
            else {
                p2Pts -= 5;
            }

            this.AddPoints(p1Pts, p2Pts);

            this._winner = Object.freeze({
                p1Score: p1Pts,
                p2Score: p2Pts
            });
        }
        // Attempt to play the move for whichever player is up next.
        var result = this._players[this._curPlayer].Play(move, this._board);

        // If the move was successful, switch the turn to the other player.
        if (result === true){
            // Test if there was a winner after that move.
            if (this._board.IsWinner()){
                var p1Pts = this._board.GetPlayerScore(this._players[0].GetColor());
                var p2Pts = this._board.GetPlayerScore(this._players[1].GetColor());

                this.AddPoints(p1Pts, p2Pts);
                this._winner = Object.freeze({
                    p1Score: p1Pts,
                    p2Score: p2Pts
                })
            }

            if (this._secondMove == true){
                // Switch to the other player's turn if both moves have been made.
                this._curPlayer = (this._curPlayer === 0 ? 1 : 0);
                this._secondMove = false;
            }
            else{
                this._secondMove = true;
            }
        }
        return result;
    }

    // Adds the correct number of points for winning a game to the correct player.
    AddPoints(p1Pts, p2Pts){
        var earnedPts = Math.abs(p1Pts - p2Pts);
        if (p1Pts > p2Pts){
            this._players[0].AddPoints(earnedPts);
        }
        else if (p2Pts > p1Pts){
            this._players[1].AddPoints(earnedPts);
        }

        this._winner = Object.freeze({
            p1Score: p1Pts,
            p2Score: p2Pts
        })
    }
}