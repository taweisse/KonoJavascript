var _diceRolls = [4, 3, 2, 2, 5, 4, 2, 6];

class Tournament{

    constructor(p1, p2, curGame, curRound){
        this._p1 = p1 ? p1 : null;
        this._p2 = p2 ? p2 : null;
        this._curGame = curGame ? curGame : null;
        this._curRound = curRound ? curRound : null;
    }

    GetRound(){
        return this._curRound;
    }

    GetGame(){
        return this._curGame;
    }

    // Adds a new game to the tournament, replacing the old.
    AddGame(game){
        this._curRound++;
        this._curGame = game;
    }

    static RollDice(){
        // If there is no dice rolls file specified, generate a random roll.
        if (_diceRolls === null){
            return Math.floor(Math.random() * 6 + 1)
        }
        // If there is a list of dice rolls specified, return a value from it.
        else if (this._rollPtr === undefined){
            this._rollPtr = 1;
            return _diceRolls[0];
        }
        else{
            if (this._rollPtr < _diceRolls.length){
                this._rollPtr++;
                return _diceRolls[this._rollPtr - 1];
                
            }
            else {
                this._rollPtr = 1;
                return _diceRolls[0];
            }
        }
    }
}