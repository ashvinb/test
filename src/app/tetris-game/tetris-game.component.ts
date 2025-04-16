import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import CommonModule

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BLOCK_SIZE = 30; // pixels

const COLORS = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500']; // Color for empty, and the 7 tetrominoes

const TETROMINOES = {
  'I': [[1, 1, 1, 1]],
  'L': [[1, 0, 0], [1, 1, 1]],
  'J': [[0, 0, 1], [1, 1, 1]],
  'O': [[1, 1], [1, 1]],
  'T': [[0, 1, 0], [1, 1, 1]],
  'S': [[0, 1, 1], [1, 1, 0]],
  'Z': [[1, 1, 0], [0, 1, 1]]
};

interface Piece {
  x: number;
  y: number;
  shape: number[][];
  colorIndex: number;
}

@Component({
  selector: 'app-tetris-game',
  standalone: true,
  imports: [CommonModule], // Add CommonModule here
  templateUrl: './tetris-game.component.html',
  styleUrls: ['./tetris-game.component.css']
})
export class TetrisGameComponent implements OnInit {
  board: number[][] = [];
  currentPiece!: Piece;
  gameInterval: any;
  isGameOver = false;
  score = 0;
  level = 1;
  linesCleared = 0;

  readonly boardWidth = BOARD_WIDTH;
  readonly boardHeight = BOARD_HEIGHT;

  ngOnInit(): void {
    this.resetGame();
  }

  resetGame(): void {
    this.board = this.createBoard();
    this.score = 0;
    this.level = 1;
    this.linesCleared = 0;
    this.isGameOver = false;
    this.spawnPiece();
    this.startGameLoop();
  }

  createBoard(): number[][] {
    return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));
  }

  getRandomTetromino(): Piece {
    const keys = Object.keys(TETROMINOES);
    const randKey = keys[Math.floor(Math.random() * keys.length)] as keyof typeof TETROMINOES;
    const shape = TETROMINOES[randKey];
    const colorIndex = keys.indexOf(randKey) + 1; // +1 because 0 is empty
    return {
      x: Math.floor(BOARD_WIDTH / 2) - Math.floor(shape[0].length / 2),
      y: 0,
      shape: shape,
      colorIndex: colorIndex
    };
  }

  spawnPiece(): void {
    this.currentPiece = this.getRandomTetromino();
    if (this.checkCollision(this.currentPiece.x, this.currentPiece.y, this.currentPiece.shape)) {
      this.gameOver();
    }
  }

   checkCollision(x: number, y: number, shape: number[][]): boolean {
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const boardX = x + col;
          const boardY = y + row;

          // Check boundaries
          if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) {
            return true;
          }
          // Check if the cell is already occupied (and not part of the current piece moving)
          if (boardY >= 0 && this.board[boardY] && this.board[boardY][boardX] !== 0) {
             return true;
          }
        }
      }
    }
    return false;
  }


  mergePiece(): void {
    this.currentPiece.shape.forEach((row, r) => {
      row.forEach((value, c) => {
        if (value) {
          const boardX = this.currentPiece.x + c;
          const boardY = this.currentPiece.y + r;
          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
             this.board[boardY][boardX] = this.currentPiece.colorIndex;
          }
        }
      });
    });
  }

  clearLines(): void {
    let linesClearedThisTurn = 0; // Corrected variable name
    for (let r = BOARD_HEIGHT - 1; r >= 0; r--) {
      if (this.board[r].every(cell => cell !== 0)) {
        // Line is full
        linesClearedThisTurn++;
        this.linesCleared++;
        // Remove the line and add an empty line at the top
        this.board.splice(r, 1);
        this.board.unshift(Array(BOARD_WIDTH).fill(0));
        r++; // Re-check the current row index as the board shifted down
      }
    }
    // Update score based on lines cleared
    if (linesClearedThisTurn > 0) {
        this.score += [0, 100, 300, 500, 800][linesClearedThisTurn] * this.level;
        // Update level based on total lines cleared
        this.level = Math.floor(this.linesCleared / 10) + 1;
        // Update game speed
        this.updateGameSpeed();
    }
  }

  movePiece(dx: number, dy: number): boolean {
    if (this.isGameOver) return false;
    const newX = this.currentPiece.x + dx;
    const newY = this.currentPiece.y + dy;
    if (!this.checkCollision(newX, newY, this.currentPiece.shape)) {
      this.currentPiece.x = newX;
      this.currentPiece.y = newY;
      return true; // Move successful
    }
    return false; // Move failed
  }

  dropPiece(): void {
      if (this.isGameOver) return;
       if (!this.movePiece(0, 1)) {
        // If moving down results in collision, merge the piece and spawn a new one
        this.mergePiece();
        this.clearLines();
        this.spawnPiece();
       }
  }

  rotatePiece(): void {
    if (this.isGameOver) return;

    const shape = this.currentPiece.shape;
    const N = shape.length;
    const M = shape[0].length; // Assuming rectangular shape, transpose needs careful handling for non-square

    // Basic rotation for simplicity (transpose and reverse rows)
    // More complex rotation logic (like SRS) is needed for a full Tetris experience
    let newShape: number[][] = Array.from({ length: M }, () => Array(N).fill(0));

    for (let r = 0; r < N; r++) {
        for (let c = 0; c < M; c++) {
            newShape[c][N - 1 - r] = shape[r][c];
        }
    }


    // Wall kick logic (simplified: just check if rotation is valid, try shifting left/right)
    if (!this.checkCollision(this.currentPiece.x, this.currentPiece.y, newShape)) {
        this.currentPiece.shape = newShape;
    } else if (!this.checkCollision(this.currentPiece.x - 1, this.currentPiece.y, newShape)) { // Try move left
        this.currentPiece.x--;
        this.currentPiece.shape = newShape;
    } else if (!this.checkCollision(this.currentPiece.x + 1, this.currentPiece.y, newShape)) { // Try move right
         this.currentPiece.x++;
         this.currentPiece.shape = newShape;
    }
     // Add more sophisticated wall kick checks if needed
  }


  startGameLoop(): void {
    clearInterval(this.gameInterval); // Clear existing interval if any
    const baseSpeed = 1000; // milliseconds
    this.gameInterval = setInterval(() => {
        if (!this.isGameOver) {
           this.dropPiece();
        }
    }, Math.max(100, baseSpeed - (this.level - 1) * 50)); // Speed increases with level, minimum 100ms
  }

   updateGameSpeed(): void {
        this.startGameLoop(); // Restart loop with new speed
   }

  gameOver(): void {
    this.isGameOver = true;
    clearInterval(this.gameInterval);
    console.log("Game Over!");
    // Maybe display a game over message on the screen
  }

  // --- Keyboard Controls ---
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (this.isGameOver) return;

    switch (event.key) {
      case 'ArrowLeft':
      case 'a': // Support WASD
        this.movePiece(-1, 0);
        event.preventDefault();
        break;
      case 'ArrowRight':
      case 'd': // Support WASD
        this.movePiece(1, 0);
        event.preventDefault();
        break;
      case 'ArrowDown':
      case 's': // Support WASD
        this.dropPiece();
        event.preventDefault();
        break;
      case 'ArrowUp':
      case 'w': // Support WASD for rotation
         this.rotatePiece();
         event.preventDefault();
         break;
       case ' ': // Space for hard drop (optional)
        // Implement hard drop logic if desired
        while(this.movePiece(0, 1)) { /* Keep moving down */ }
        this.mergePiece();
        this.clearLines();
        this.spawnPiece();
        event.preventDefault();
        break;
       case 'r': // Restart game
        this.resetGame();
        event.preventDefault();
        break;
    }
  }

   // Helper to get color for rendering
   getBlockColor(cellValue: number): string {
     return COLORS[cellValue];
   }

    // Helper to get cell style for dynamic styling in the template
   getCellStyle(cellValue: number): { [key: string]: string } {
        const color = this.getBlockColor(cellValue);
        return {
            'width': `${BLOCK_SIZE}px`,
            'height': `${BLOCK_SIZE}px`,
            'background-color': color,
            'border': cellValue !== 0 ? '1px solid #333' : '1px solid #eee' // Border for blocks, lighter for empty
        };
   }

    // Helper to get piece style for dynamic positioning in the template
    getPieceBlockStyle(rowIndex: number, colIndex: number): { [key: string]: string } | null {
         if (this.currentPiece.shape[rowIndex][colIndex]) {
             const color = this.getBlockColor(this.currentPiece.colorIndex);
             const boardX = this.currentPiece.x + colIndex;
             const boardY = this.currentPiece.y + rowIndex;
             // Only return style if the block is within the visible board area
             if (boardY >= 0) {
                 return {
                     'position': 'absolute',
                     'left': `${boardX * BLOCK_SIZE}px`,
                     'top': `${boardY * BLOCK_SIZE}px`,
                     'width': `${BLOCK_SIZE}px`,
                     'height': `${BLOCK_SIZE}px`,
                     'background-color': color,
                     'border': '1px solid #333'
                 };
             }
         }
         return null; // Return null if the block shouldn't be displayed or is empty
     }
}
