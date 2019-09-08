class BoardView {

    // Draws the board in the board div.
    static DrawBoard(board){

        // Create our table element if it doesn't already exist.
        if ($('#board table').length === 0){
            $('#board').append('<table>');

            // Create each board cell with a unique numeric id.
            for (var i = 0; i < board.GetSize(); i++){
                $('#board table').append('<tr>')
                for (var j = 0; j < board.GetSize(); j++){
                    
                    // Create each table data element.
                    var $cell = $('<td><div>').addClass('piece');
                    $cell.attr('id', i * board.GetSize() + j);
                    $('#board table tr:last-child').append($cell);
                }
            }
        }

        // Clear all preexisting color classes.
        $('#board td').removeClass('color-white color-black color-blank super');

        // Loop through each cell on the board and display its data.
        for (var i = 0; i < board.GetSize() * board.GetSize(); i++){

            // Get the cell at the current point.
            var thisOccupant = board.GetOccupant(board.NumberToPoint(i));

            // Variables to hold the parameters of this cell for table construction.
            var thisColor = 'color-blank';
            var thisCapture = '';
            if (thisOccupant != null){
                thisColor = thisOccupant.color;

                if (thisOccupant.canCapture === true){
                    thisCapture = ' super'
                }
                else {
                    thisCapture = '';
                }
            }
            // Alter each table data element based off of the board data.
            $('#' + i).addClass(thisColor + thisCapture);
        }
    }
}