var _tournament;

var _startPt = null;
var _targetPt = null;
var _lastPt = null;

// Execute once the DOM is completely loaded.
$(document).ready(function(){

    // Display the welcome page on load.
    $('#newTournamentPage, #playGamePage, #gameWinnerPage, #tournamentWinnerPage, #afterRoll, #playAgainOptions').hide();

    /////////////////////////////
    // welcomePage UI Handlers //
    /////////////////////////////

    // Show the new tournament setup page if the user clicks the new tournament button.
    $('#newButton').click(function(){
        $('#newTournamentPage').show();
        $('#welcomePage').hide();
    });

    // React to a tournament file being loaded.
    $('#loadButton').change(function(){
        var reader = new FileReader();
        reader.onload = (function(file){
            var newTournament = Serializer.DeserializeFromFile(reader.result);
            if (newTournament != null){
                _tournament = newTournament;
                UpdateBoard();

                // Register board click handlers.
                SetBoardHandlers();

                $('#playGamePage').show();
                $('#welcomePage').hide();

                // Write to the log to signal the start of the game.
                WriteLogMessage('Tournament loaded successfully.');
            }
        });
        reader.readAsText($(this)[0].files[0]);
    });

    ///////////////////////////////////
    // newTournamentPage UI Handlers //
    ///////////////////////////////////

    $('#rollDiceButton').click(function(){
        // Perform a check to be sure that all required options are selected.
        if (!$("input[name='boardSizeRadio']:checked").val()) {
            return;
        }
        else if (!$("input[name='p1Type']:checked").val()){
            return;
        }
        else if (!$("input[name='p2Type']:checked").val()){
            return;
        }
        
        // If necessary options are selected, roll dice to see who plays first.
        var rolls = Array(4)
        do {
            for (var i = 0; i < 4; i++){
                rolls[i] = Tournament.RollDice();
            }
        }
        while(rolls[0] + rolls[1] === rolls[2] + rolls[3]);

        // Do not allow the user to change parameters once entered.
        $('input[name="boardSizeRadio"], input[name="p1Type"], input[name="p2Type"], #rollDiceButton').prop('disabled', true);

        // Show the user who rolled what.
        var rollWinner = rolls[0] + rolls[1] > rolls[2] + rolls[3] ? 1 : 2;
        var rollsInfo = `Player 1 rolls ${rolls[0]} and ${rolls[1]}. 
                         Player 2 rolls ${rolls[2]} and ${rolls[3]}.
                         Player ${rollWinner} wins and moves first.`;

        var winnerText = `Pick a color, Player ${rollWinner}:`;

        // If a computer player won the dice roll, it should automatically pick a color.
        var p1;
        $('input[name="p1Type"]').each(function(){
            if ($(this).prop('checked')){
                p1 = $(this).val()
            }
        });
        var p2;
        $('input[name="p2Type"]').each(function(){
            if ($(this).prop('checked')){
                p2 = $(this).val();
            }
        });
        if ((rollWinner === 1 && p1 === PlayerType.Computer) || (rollWinner === 2 && p2 === PlayerType.Computer)){
            $('input[name="pickColor"]').prop('disabled', true);
        }

        // Store which player won the dice roll in the hidden input.
        $('#hiddenWinner').val(rollWinner);

        $('#rollResults').html(rollsInfo);
        $('#rollWinner').html(winnerText);
        $('#afterRoll').show();
    });

    // Create and start a new tournament when the button is pressed.
    $('#createTournamentButton').click(function(){

        // Determine which board size the user picked.
        var boardSizeRadios = $('input[name="boardSizeRadio"]')
        var boardSize;
        boardSizeRadios.each(function(){
            if ($(this).prop('checked')){
                boardSize = parseInt($(this).val())
            }
        });

        // Determine the types for players 1 and 2. Create the proper Player objects.
        var p1;
        $('input[name="p1Type"]').each(function(){
            if ($(this).prop('checked')){
                if ($(this).val() === PlayerType.Human){
                    p1 = new Human(0);
                }
                else {
                    p1 = new Computer(0);
                }
            }
        });
        var p2;
        $('input[name="p2Type"]').each(function(){
            if ($(this).prop('checked')){
                if ($(this).val() === PlayerType.Human){
                    p2 = new Human(0);
                }
                else {
                    p2 = new Computer(0);
                }
            }
        });

        // Determine which player moves first based on the dice roll.
        var firstPlayer = parseInt($('#hiddenWinner').val());

        // Determine which color the winner wants to be.
        var winnerColor;
        $('input[name="pickColor"]').each(function(){
            if ($(this).prop('checked')){
                winnerColor = $(this).val();
            }
        });

        // Set the players' colors correctly.
        if ((firstPlayer === 1 && winnerColor === PlayerColor.White) || (firstPlayer === 2 && winnerColor === PlayerColor.Black)){
            p1.SetColor(PlayerColor.White);
            p2.SetColor(PlayerColor.Black);
        } 
        else{
            p1.SetColor(PlayerColor.Black);
            p2.SetColor(PlayerColor.White);
        }

        // Create the first Game object that will be played in this tournament.
        var newGame = new Game(p1, p2, firstPlayer, new Board(boardSize));

        // Assign our tournament object to the newly created tournament.
        _tournament = new Tournament(p1, p2, newGame, 1);

        // Switch to the PlayGame view.
        $('#newTournamentPage').hide();
        $('#playGamePage').show();
        UpdateBoard();

        // Set the board's click handlers.
        SetBoardHandlers();

        // Write to the log to signal the start of the game.
        WriteLogMessage('New tournament created.');
    });

    //////////////////////////////
    // playGamePage UI Handlers //
    //////////////////////////////

    // Handle the 'Move' button click, available to move the computer player.
    $('#moveBtn').click(function(){
        // If we have to move the same piece, pass the location of that piece.
        if (_tournament.GetGame().GetMoveNumber() === 2){
            ExecuteMove(new Move(_lastPt));
        }
        else {
            // If we can move any piece, pass a null move.
            ExecuteMove(null);
        }
    });

    // Save the current tournament to a file when the button is clicked.
    // From https://codepen.io/anon/pen/ZoBbrd
    $('#saveBtn').click(function(){
        var text = Serializer.SerializeToFile(_tournament);
        var blob = new Blob([text], {type: "text/plain;charset=UTF-8"});
        saveAs(blob, 'tournament.txt');

        ResetPage();
    })

    // Skip the 2nd turn that the player gets if they do not want to move.
    $('#skipBtn').click(function(){
        ExecuteMove(new Move(null, null, MoveAction.Skip));
        $('#board td').removeClass('selected move-option');
    });

    // Lets the human user quit the current game.
    $('#quitBtn').click(function(){
        ExecuteMove(new Move(null, null, MoveAction.Quit));
    });

    // Suggests a move to the user using the computer's AI.
    $('#helpBtn').click(function(){
        var curGame = _tournament.GetGame();
        var nextPlayer = curGame.GetNextPlayer();
        var suggestion;
        if (_tournament.GetGame().GetMoveNumber() === 2){
            suggestion = nextPlayer.FindBestMove(curGame.GetBoard(), nextPlayer, _lastPt);
        }
        else {
            suggestion = nextPlayer.FindBestMove(curGame.GetBoard(), nextPlayer);
        }
        // Highlight the suggested move to the user.
        if (suggestion.GetAction() !== MoveAction.Skip){
            $('#board td').removeClass('selected move-option');

            // Set the starting point to the suggested move.
            _startPt = suggestion.GetLocation();

            var id = curGame.GetBoard().PointToNumber(suggestion.GetLocation());
            $('#' + id).addClass('selected');

            // Show where the computer wants the user to move.
            id = curGame.GetBoard().PointToNumber(curGame.GetBoard().GetPointFromDirection(suggestion.GetLocation(), suggestion.GetDirection()));
            $('#' + id).addClass('move-option');
            
            // Explain what the computer wants the user to do.
            WriteLogMessage(`The computer suggests ${suggestion.ToString()}.`);
        }
        else {
            // Explain that the computer thinks the user should skip the 2nd move.
            WriteLogMessage(`The computer suggests skipping the 2nd move.`);
        }
    });

    // End the current tournament and display the results.
    $('#endTournamentBtn').click(function(){
        $('#gameWinnerPage').hide();
        $('#tournamentWinnerPage').show();

        // Build a string describing the outcome of the tournament.
        var p1Score = _tournament.GetGame().GetPlayer(1).GetOverallPoints();
        var p2Score = _tournament.GetGame().GetPlayer(2).GetOverallPoints();
        var winner = null;

        if (p1Score > p2Score){
            winner = 1;
        }
        else if (p2Score > p1Score){
            winner = 2;
        }

        var infoStr;
        if (winner === null){
            infoStr = `The tournament was a tie! Both players scored ${p1Score} points. Thanks for playing!`;
        }
        else {
            infoStr = `Player ${winner} wins the tournament ${winner === 1 ? p1Score : p2Score} to ${winner === 1 ? p2Score : p1Score}! Thanks for playing!`;
        }

        // Display the string to the user.
        $('#tournamentWinInfo').html(infoStr);
    });
    
    // Refresh the page to start the whole thing over.
    $('#backToHomeBtn').click(function(){
        location.reload();
    });

    // Display options for a new game within the tournament.
    $('#anotherGameBtn').click(function(){
        $('#playAgainOptions').show();
        $('#endTournamentBtn').prop('disabled', true);

        var lastWinner = $('#lastGameWinner').val();
        if (lastWinner < 1){
            $('#lastGameWinner').val(1);
            lastWinner = 1;
        }
        $('#lastWinnerColorPicker').html(`Pick a color, Player ${lastWinner}:`); 

        // Have the computer auto-select his color.
        if (_tournament.GetGame().GetPlayer(lastWinner) instanceof Computer){
            $('input[name="continuePickColor"]').prop('disabled', true);
        }
    });

    // Create a new game based on the new inputs and start playing it.
    $('#continueTournamentBtn').click(function(){
        var boardSizeRadios = $('input[name="continueBoardSizeRadio"]')
        var boardSize;
        boardSizeRadios.each(function(){
            if ($(this).prop('checked')){
                boardSize = parseInt($(this).val())
            }
        });

        // Determine which color the winner wants to be.
        var winnerColor;
        $('input[name="continuePickColor"]').each(function(){
            if ($(this).prop('checked')){
                winnerColor = $(this).val();
            }
        });

        var lastWinner = $('#lastGameWinner').val();
        var p1 = _tournament.GetGame().GetPlayer(1);
        var p2 = _tournament.GetGame().GetPlayer(2);
        if ((lastWinner == 1 && winnerColor == PlayerColor.White) || (lastWinner == 2 && winnerColor == PlayerColor.Black)){
            p1.SetColor(PlayerColor.White);
            p2.SetColor(PlayerColor.Black);
        }
        else{
            p1.SetColor(PlayerColor.Black);
            p2.SetColor(PlayerColor.White);
        }

        // Update the tournament and start playing.
        _tournament.AddGame(new Game(p1, p2, lastWinner, new Board(boardSize)));
        $('#gameWinnerPage').hide();
        $('#playGamePage').show();

        ResetGamePage();
        UpdateBoard();
        SetBoardHandlers();
    });
});

function SetBoardHandlers(){
    // Set up click handlers for the board so the human can make a move.
    $('#board td').click(function(){

        function HighlightOptions(){
            var moves = _tournament.GetGame().GetBoard().GetSurroundingPoints(_startPt);
            moves.forEach(function(move){
                var curOccupant = _tournament.GetGame().GetBoard().GetOccupant(move);
                if (curOccupant === null){
                    var id = _tournament.GetGame().GetBoard().PointToNumber(move);
                    $('#' + id).addClass('move-option');
                }
                else if (curOccupant.color === PlayerColor.Opponent(_tournament.GetGame().GetNextPlayer().GetColor()) && _tournament.GetGame().GetBoard().GetOccupant(_startPt).canCapture){
                    var id = _tournament.GetGame().GetBoard().PointToNumber(move);
                    $('#' + id).addClass('move-option');
                }
            });
        }

        // If the player clicks the currently selected cell again, deselect it.
        if ($(this).hasClass('selected') && _tournament.GetGame().GetMoveNumber() === 1){
            $('#board td').removeClass('selected move-option');
            return;
        }
        else if ($(this).hasClass('selected') && _tournament.GetGame().GetMoveNumber() === 2){
            HighlightOptions();
        }

        // If the player clicks an option to move, execute the move.
        if ($(this).hasClass('move-option')){
            _targetPt = _tournament.GetGame().GetBoard().NumberToPoint($(this).attr('id'));
            var thisMove = new Move(_startPt, _tournament.GetGame().GetBoard().GetMoveDirection(_startPt, _targetPt), MoveAction.Play);
            ExecuteMove(thisMove);

            // Remove the highlighted cells when the move is executed.
            $('#board td').removeClass('selected move-option');

            // Select the location that the piece was moved if we have another turn left.
            if ($(this).hasClass(_tournament.GetGame().GetNextPlayer().GetColor()) && _tournament.GetGame().GetNextPlayer() instanceof Human){
                var id = _tournament.GetGame().GetBoard().PointToNumber(_targetPt);
                $('#' + id).addClass('selected');
                _startPt = _targetPt;
    
                HighlightOptions();
            }
            return;
        }

        // Allow the current player to select one of his own cells.
        if ($(this).hasClass(_tournament.GetGame().GetNextPlayer().GetColor()) && _tournament.GetGame().GetMoveNumber() == 1 && _tournament.GetGame().GetNextPlayer() instanceof Human){
            $('#board td').removeClass('selected move-option');
            $(this).addClass('selected');
            _startPt = _tournament.GetGame().GetBoard().NumberToPoint($(this).attr('id'));

            HighlightOptions();
        }
    });
}

function UpdateBoard(){
    BoardView.DrawBoard(_tournament.GetGame().GetBoard());

    // Disable the help and quit button if the next player is a computer.
    // Hide the move button for human players.
    if (_tournament.GetGame().GetNextPlayer() instanceof Computer){
        $('#helpBtn, #quitBtn').prop('disabled', true);
        $('#moveBtn').show();
        $('#skipBtn').hide();
    }
    else {
        $('#helpBtn, #quitBtn').prop('disabled', false);
        $('#skipBtn').show();
        $('#moveBtn').hide();
    }

    // Disable the skip button if we are on our first move.
    if (_tournament.GetGame().GetMoveNumber() == 1){
        $('#skipBtn').prop('disabled', true);
    }
    else {
        $('#skipBtn').prop('disabled', false);
    }

    // Display current scores for each player.
    $('#p1Score').html(_tournament.GetGame().GetBoard().GetPlayerScore(_tournament.GetGame().GetPlayer(1).GetColor()));
    $('#p2Score').html(_tournament.GetGame().GetBoard().GetPlayerScore(_tournament.GetGame().GetPlayer(2).GetColor()));
}

function ExecuteMove(move){
    var selectedMove = _tournament.GetGame().PrePlay(move);
    var player = _tournament.GetGame().GetNextPlayerNumber();

    var result = _tournament.GetGame().Play(selectedMove);
    if (result && selectedMove.GetAction() !== MoveAction.Skip){
        WriteLogMessage(`Player ${player} executes ${selectedMove.ToString()}.`);
        _lastPt = _tournament.GetGame().GetBoard().GetPointFromDirection(selectedMove.GetLocation(), selectedMove.GetDirection());
    }
    else if (selectedMove.GetAction() === MoveAction.Skip){
        WriteLogMessage(`Player ${player} forfeits their 2nd move.`);
    }
    else if (selectedMove.GetAction() === MoveAction.Quit){
        WriteLogMessage(`Player ${player} quits the game.`)
    }
    UpdateBoard()

    // Check if the last move resulted in a winner of the game.
    var winner = _tournament.GetGame().GetWinner();
    if (winner !== null){
        DisplayWinner(winner);
    }
}

// Display the winner of the game to the user, and allow them to start another or quit.
function DisplayWinner(w){
    // Build a string to explain the outcome of the game to the user.
    var player = null;
    var infoStr;
    if (w.p1Score > w.p2Score){
        player = 1;
    }
    else if (w.p1Score < w.p2Score){
        player = 2;
    }
    if (player === null){
        infoStr = 'The game was a tie! Neither player will receive any points this round.';
    }
    else {
        infoStr = `Player ${player} wins the game ${w.p1Score > w.p2Score ? w.p1Score : w.p2Score} to ${w.p1Score > w.p2Score ? w.p2Score : w.p1Score}, `;
        infoStr += `and will receive ${Math.abs(w.p1Score - w.p2Score)} points this round. `;
        infoStr += `Player ${player} has ${_tournament.GetGame().GetPlayer(player).GetOverallPoints()} points so far this tournament. `;
        infoStr += `Player ${player === 1 ? 2 : 1} has ${_tournament.GetGame().GetPlayer(player === 1 ? 2 : 1).GetOverallPoints()}.`;
    }

    $('#gameWinnerPage #gameWinInfo').html(infoStr);
    $('#playGamePage').hide();
    $('#gameWinnerPage').show();
    $('#lastGameWinner').val(player !== null ? player : 0);
}

function WriteLogMessage(message){
    var curText = $('#gameLog').val();
    var log = $('#gameLog')
    log.val(curText + message + '\n\n');
    if(log.length)
       log.scrollTop(log[0].scrollHeight - log.height());
}

// Resets the playGamePage to accept a new tournament.
function ResetGamePage(){
    $('#gameLog').val('');
    $('#board').html('');
}

// Resets the page back to how it started without refreshing. This is necessary to save a file.
function ResetPage(){
    $('input, button').prop('disabled', false);
    $('#afterRoll').hide();
    $('#gameLog').val('');
    $('#board').html('');

    // Show the welcome page again.
    $('#playGamePage, #newTournamentPage, #gameWinnerPage, #tournamentWinnerPage, #afterRoll, #playAgainOptions').hide();
    $('#welcomePage').show();
}