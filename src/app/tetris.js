const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
canvas.width = 300;
canvas.height = 600;
document.body.appendChild(canvas);

const grid = 20;
const colors = [
  null, 'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'cyan'
];

const tetrominos = [
  null,
  [
    [0, 1, 0, 0],
    [0, 1, 0, 0],
    [0, 1, 0, 0],
    [0, 1, 0, 0]
  ],
  [
    [2, 2, 0],
    [0, 2, 2],
    [0, 0, 0]
  ],
  [
    [0, 3, 3],
    [3, 3, 0],
    [0, 0, 0]
  ],
  [
    [0, 4, 0],
    [4, 4, 4],
    [0, 0, 0]
  ],
  [
    [5, 0, 0],
    [5, 5, 5],
    [0, 0, 0]
  ],
  [
    [0, 0, 6],
    [6, 6, 6],
    [0, 0, 0]
  ],
  [
    [7, 7],
    [7, 7]
  ]
];

function createMatrix() {
  const matrix = [];
  for (let i = 0; i < canvas.height / grid; i++) {
    matrix.push(new Array(canvas.width / grid).fill(0));
  }
  return matrix;
}

const matrix = createMatrix();

function createTetromino() {
  const type = Math.floor(Math.random() * (tetrominos.length - 1)) + 1;
  return {
    shape: tetrominos[type],
    color: colors[type],
    x: 3,
    y: -2
  }
}

let tetromino = createTetromino();

function draw() {
  context.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix[y].length; x++) {
      if (matrix[y][x]) {
        context.fillStyle = colors[matrix[y][x]];
        context.fillRect(x * grid, y * grid, grid, grid);
      }
    }
  }

  for (let y = 0; y < tetromino.shape.length; y++) {
    for (let x = 0; x < tetromino.shape[y].length; x++) {
      if (tetromino.shape[y][x]) {
        context.fillStyle = tetromino.color;
        context.fillRect((tetromino.x + x) * grid, (tetromino.y + y) * grid, grid, grid);
      }
    }
  }
}

function merge() {
  for (let y = 0; y < tetromino.shape.length; y++) {
    for (let x = 0; x < tetromino.shape[y].length; x++) {
      if (tetromino.shape[y][x]) {
        matrix[tetromino.y + y][tetromino.x + x] = tetromino.shape[y][x];
      }
    }
  }
}

function collision(x, y, rotation) {
    for (let row = 0; row < rotation.length; row++){
        for (let col = 0; col < rotation[row].length; col++){
            if (rotation[row][col]){
                const nextX = x + col;
                const nextY = y + row;
                if (nextX < 0 || nextX >= matrix[0].length || nextY >= matrix.length || matrix[nextY][nextX]){
                    return true;
                }
            }
        }
    }
    return false;
}

function rotate() {
    const newRotation = [];
    const shape = tetromino.shape;
    for (let col = 0; col < shape[0].length; col++){
        const row = [];
        for (let row = shape.length-1; row >= 0; row--){
            row.push(shape[row][col]);
        }
        newRotation.push(row);
    }
    if(!collision(tetromino.x, tetromino.y, newRotation)){
        tetromino.shape = newRotation;
    }

}

function clearRows(){
    const rowsToClear = [];
    for (let row = 0; row < matrix.length; row++){
        if (matrix[row].every(val => val)){
            rowsToClear.push(row);
        }
    }

    for (const row of rowsToClear){
        matrix.splice(row, 1);
        matrix.unshift(new Array(matrix[0].length).fill(0));
    }
}

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

function update(time = 0) {
  const deltaTime = time - lastTime;
  lastTime = time;
  dropCounter += deltaTime;
  if (dropCounter > dropInterval) {
    tetromino.y++;
    if (collision(tetromino.x, tetromino.y, tetromino.shape)) {
        tetromino.y--;
        merge();
        clearRows();
        tetromino = createTetromino();
        if (collision(tetromino.x, tetromino.y, tetromino.shape)){
            matrix.forEach(row => row.fill(0));
        }
      }
    dropCounter = 0;
  }
  draw();
  requestAnimationFrame(update);
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') {
      if (!collision(tetromino.x - 1, tetromino.y, tetromino.shape)){
        tetromino.x--;
      }
  } else if (event.key === 'ArrowRight') {
    if (!collision(tetromino.x + 1, tetromino.y, tetromino.shape)){
        tetromino.x++;
    }
  } else if (event.key === 'ArrowDown') {
    tetromino.y++;
    if (collision(tetromino.x, tetromino.y, tetromino.shape)) {
        tetromino.y--;
        merge();
        clearRows();
        tetromino = createTetromino();
        if (collision(tetromino.x, tetromino.y, tetromino.shape)){
            matrix.forEach(row => row.fill(0));
        }
      }
  } else if (event.key === 'ArrowUp') {
      rotate();
  }
});

update();