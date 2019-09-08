PlayerColor = Object.freeze({ 
    White: 'color-white', 
    Black: 'color-black', 
    Opponent: function(color){
        if (color === this.White){
            return this.Black;
        }
        else if (color === this.Black){
            return this.White;
        }
    }});

PlayerType = Object.freeze({ Human: 'human', Computer: 'computer' });

MoveDirection = Object.freeze({ NW: 'NW', NE: 'NE', SE: 'SE', SW: 'SW' });

MoveAction = Object.freeze({ Play: 'play', Skip: 'skip', Quit: 'quit', Help: 'help' });

MoveReason = Object.freeze({
    Random: "to continue the game",
    Advance: "to advance towards the opponent's home location",
    Capture: "to capture the opponent",
    Block: "to block the opponent",
    Escape: "to escape being captured by the opponent",

    GetWeight: function(reason){
        switch(reason){
            case this.Random:
                return 0;
            case this.Advance:
                return 1;
            case this.Capture:
                return 2;
            case this.Block:
                return 3;
            case this.Escape:
                return 4;
            default:
                return null;
        }
    }
});

// MoveError = Object.freeze({
//     Empty: "There is no piece at that location",
//     Occupied: "You can not capture your own piece",
//     NoCapture: "This piece does not have the ability to capture",
//     InvalidColor: "You can not move the opponent's piece",
//     InvalidDirection: "You can not move off of the board",
//     NoQuit: "The computer would like to keep playing"
// });