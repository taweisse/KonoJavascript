class Move {

    constructor (pt, dir, act, reason, tar) {
        this._loc = pt ? pt : null;
        this._dir = dir ? dir : null;
        this._action = act ? act : null;
        this._reason = reason ? reason : null;
        this._target = tar ? tar : null;
    }

    GetLocation(){
        return this._loc;
    }

    GetDirection(){
        return this._dir;
    }

    GetAction(){
        return this._action;
    }

    GetReason(){
        return this._reason;
    }

    ToString(){
        if (this._action === MoveAction.Skip){
            return `skips their turn.`;
        }
        
        var message =  `a move ${this._dir} from (${this._loc.r}, ${this._loc.c})`;
        if (this._reason !== null){
            message += (` ${this._reason}`);
        }
        if (this._target !== null){
            message += (` at (${this._target.r}, ${this._target.c})`);
        }
        return message;
    }
}