import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TetrisGameComponent } from './tetris-game/tetris-game.component'; // Import the Tetris component

@Component({
  selector: 'app-root',
  standalone: true, // Make sure app-root is standalone
  imports: [
    RouterOutlet, 
    TetrisGameComponent // Add TetrisGameComponent to imports
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Angular Tetris'; // Updated title
}
