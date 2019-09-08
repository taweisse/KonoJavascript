class Serializer{

    static SerializeToFile(tournament){
        // Extract the necessary data from the tournament.
        var round = tournament.GetRound();
        var p1 = tournament.GetGame().GetPlayer(1);
        var p2 = tournament.GetGame().GetPlayer(2);

        var board = tournament.GetGame().GetBoard();
        var boardString = '';
        for (var i = 0; i < Math.pow(board.GetSize(), 2); i++){
            var cellText = '';

            // Insert indentations where necessary.
            if (i % tournament.GetGame().GetBoard().GetSize() === 0){
                cellText += '   ';
            }

            var curOccupant = board.GetOccupant(board.NumberToPoint(i));
            if(curOccupant === null){
                cellText += 'O';
            }
            else if (curOccupant.color === PlayerColor.White){
                cellText += 'W';
            }
            else if (curOccupant.color === PlayerColor.Black){
                cellText += 'B';
            }

            if (curOccupant !== null && curOccupant.canCapture){
                cellText += cellText;
            }
            cellText += ' ';
            // Insert new lines where necessary.
            if ((i + 1) % tournament.GetGame().GetBoard().GetSize() === 0){
                cellText += '\r\n';
            }
            boardString += cellText;
        }

        var p1Name;
        var p2Name;
        if ((p1 instanceof Human) && (p2 instanceof Human)){
            p1Name = 'Human1';
            p2Name = 'Human2';
        }
        else if ((p1 instanceof Computer) && (p2 instanceof Computer)){
            p1Name = 'Computer1';
            p2Name = 'Computer2';
        }
        else if ((p1 instanceof Human) && (p2 instanceof Computer)){
            p1Name = 'Human';
            p2Name = 'Computer';
        }
        else{
            p1Name = 'Computer';
            p2Name = 'Human';
        }
        var nextPlayer = tournament.GetGame().GetNextPlayer() === 1 ? p1Name : p2Name;

        var p1Color = p1.GetColor() === PlayerColor.White ? 'White' : 'Black';
        var p2Color = p2.GetColor() === PlayerColor.White ? 'White' : 'Black';
        var p1Pts = p1.GetOverallPoints();
        var p2Pts = p2.GetOverallPoints();

        return `Round: ${round}\r\n\r\n${p2Name}:\r\n   Score: ${p2Pts}\r\n   Color: ${p2Color}\r\n\r\n${p1Name}:\r\n   Score: ${p1Pts}\r\n   Color: ${p1Color}\r\n\r\nBoard:\r\n${boardString}\r\nNext Player: ${nextPlayer}`;
    }

    static DeserializeFromFile(data){
        
        // Splits a line of text into words.
        function SplitWords(text){
            return text.trim().split(/[\n\s\r\t]+|$/gm);
        }

        // Parses player data from the serialized file string.
        function ReadPlayerData(data, type){
            
            var color = null;
            var points = null;

            data.forEach(function(line){
                var words = SplitWords(line);
                if (words[0] === 'Score:' && Number.isInteger(Number(words[1]))){
                    points = words[1]
                }
                else if(words[0] === 'Color:'){
                    if (words[1] == 'White'){
                        color = PlayerColor.White;
                    }
                    else {
                        color = PlayerColor.Black;
                    }   
                }
            });

            if (color !== null && points !== null){
                var thisPlayer = null;
                if (type === PlayerType.Human){
                    thisPlayer = new Human(points);
                }
                else {
                    thisPlayer = new Computer(points);
                }
                thisPlayer.SetColor(color);
                return thisPlayer;
            }
            else{
                return null;
            } 
        }

        // Parses board data from the serialized file string.
        function ReadBoardData(data){
            var boardData = new Array();

            data.forEach(function(line){
                var elems = SplitWords(line);
                elems.forEach(function(elem){
                    boardData.push(elem);
                });
            });

            return new Board(boardData);
        }

        var round = null;
        var p1 = null;
        var p2 = null;
        var board = null;
        var next = null;
        var secondPlayer = true;

        var lines = data.match(/^.*([\n\r]+|$)/gm);
        lines.forEach(function(line, index, array){
            var words = SplitWords(line);
            
            // Skip blank lines.
            if (words.length === 0){
                return;
            }

            // Parse the current round number.
            else if (words[0] === 'Round:' && Number.isInteger(Number(words[1]))){
                round = words[1];
            }

            // Parse player data.
            else if (words[0] === 'Human:'){
                if (secondPlayer === true){
                    p2 = ReadPlayerData(array.slice(index + 1, index + 3), PlayerType.Human);
                    secondPlayer = false;
                }
                else {
                    p1 = ReadPlayerData(array.slice(index + 1, index + 3), PlayerType.Human);
                }
            }
            else if (words[0] === 'Computer:'){
                if (secondPlayer === true){
                    p2 = ReadPlayerData(array.slice(index + 1, index + 3), PlayerType.Computer);
                    secondPlayer = false;
                }
                else {
                    p1 = ReadPlayerData(array.slice(index + 1, index + 3), PlayerType.Computer);
                }
            }
            else if (words[0] === 'Human1:'){
                p1 = ReadPlayerData(array.slice(index + 1, index + 3), PlayerType.Human);
            }
            else if (words[0] === 'Human2:'){
                p2 = ReadPlayerData(array.slice(index + 1, index + 3), PlayerType.Human);
            }
            else if (words[0] === 'Computer1:'){
                p1 = ReadPlayerData(array.slice(index + 1, index + 3), PlayerType.Computer);
            }
            else if (words[0] === 'Computer2:'){
                p2 = ReadPlayerData(array.slice(index + 1, index + 3), PlayerType.Computer);
            }
        
            // Parse board data.
            else if (words[0] === 'Board:'){
                var boardSize = SplitWords(array[index + 1]).length;
                board = ReadBoardData(array.slice(index + 1, index + boardSize + 1));
            }

            // Parse the next player in the current game.
            else if (words[0] === 'Next' && words[1] === 'Player:'){
                if (words[2] === 'Human'){
                    if (p1 instanceof Human){
                        next = 1;
                    }
                    else{
                        next = 2;
                    }
                }
                else if (words[2] === 'Computer'){
                    if (p1 instanceof Computer){
                        next = 1;
                    }
                    else{
                        next = 2;
                    }
                }
                else if (words[2] === 'Human1' || words[2] === 'Computer1'){
                    next = 1;
                }
                else{
                    next = 2;
                }
            }
        });

        if (round === null || p1 === null || p2 === null || board === null || next === null){
            return null;
        }
        else {
            var newGame = new Game(p1, p2, next, board);
            return new Tournament(p1, p2, newGame, round);
        }
    }
}