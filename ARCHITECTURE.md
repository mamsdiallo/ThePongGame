# Pong Game Architecture Documentation

This document provides comprehensive architecture diagrams for the enhanced Pong game implementation.

## Component Diagram

```mermaid
graph TB
    subgraph "Pong Game Application"
        subgraph "Presentation Layer"
            HTML[HTML Interface]
            CSS[CSS Styling]
            UI[UI Components]
            
            HTML --> UI
            CSS --> UI
        end
        
        subgraph "Game Engine"
            GL[Game Loop]
            RM[Render Manager]
            PM[Physics Manager]
            IM[Input Manager]
            
            GL --> RM
            GL --> PM
            GL --> IM
        end
        
        subgraph "Game Objects"
            PL[Player Paddle]
            AI[AI Paddle]
            BALL[3D Ball]
            GAME[Game State]
            
            PM --> PL
            PM --> AI
            PM --> BALL
            GL --> GAME
        end
        
        subgraph "Data Management"
            LB[Leaderboard System]
            LS[Local Storage]
            SC[Score Controller]
            
            LB --> LS
            SC --> LB
            GAME --> SC
        end
        
        subgraph "Rendering System"
            CV[Canvas 2D Context]
            GR[Gradient Renderer]
            DR[Drawing Functions]
            
            RM --> CV
            CV --> GR
            CV --> DR
            DR --> BALL
        end
    end
    
    subgraph "External APIs"
        BROWSER[Browser APIs]
        STORAGE[localStorage API]
        RAF[requestAnimationFrame]
        
        LS --> STORAGE
        GL --> RAF
        IM --> BROWSER
    end
    
    UI --> GL
    IM --> GAME
    RM --> UI
```

## Game Flow Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant GameEngine
    participant Leaderboard
    participant LocalStorage
    participant Canvas
    
    User->>UI: Load page
    UI->>Leaderboard: Initialize display
    Leaderboard->>LocalStorage: Load saved scores
    LocalStorage-->>Leaderboard: Return scores data
    Leaderboard->>UI: Update leaderboard display
    UI->>User: Show name input modal
    
    User->>UI: Enter name and start game
    UI->>GameEngine: startGame(playerName)
    GameEngine->>GameEngine: resetGameState()
    GameEngine->>Canvas: Initialize rendering context
    GameEngine->>GameEngine: Start game loop
    
    loop Game Loop
        GameEngine->>GameEngine: updatePlayerPaddle()
        GameEngine->>GameEngine: updateAIPaddle()
        GameEngine->>GameEngine: updateBall()
        GameEngine->>Canvas: render()
        Canvas->>Canvas: draw3DBall()
        Canvas->>Canvas: drawRect() for paddles
        Canvas->>Canvas: drawDashedLine()
    end
    
    alt Player/AI Scores
        GameEngine->>GameEngine: Check win condition
        alt Game Over (10 points reached)
            GameEngine->>GameEngine: endGame()
            GameEngine->>Leaderboard: addScore(name, score, duration)
            Leaderboard->>LocalStorage: Save new score
            Leaderboard->>UI: Update display
            GameEngine->>User: Show game over dialog
            User->>UI: Choose to play again
            UI->>GameEngine: Restart game flow
        end
    end
    
    alt User Quits
        User->>GameEngine: Press ESC/Q
        GameEngine->>GameEngine: endGame()
        GameEngine->>Leaderboard: addScore(name, score, duration)
        Leaderboard->>LocalStorage: Save score
        GameEngine->>User: Show results
    end
```

## Game State Diagram

```mermaid
stateDiagram-v2
    [*] --> Initial
    
    Initial --> NameInput : Page Load
    NameInput --> GameRunning : Player enters name and starts
    
    state GameRunning {
        [*] --> Playing
        Playing --> Playing : Game loop continues
        Playing --> Scoring : Ball goes off screen
        Scoring --> Playing : Score < 10 for both players
        Scoring --> GameOver : Player or AI reaches 10 points
        Playing --> Paused : User presses L (toggle leaderboard)
        Paused --> Playing : User presses L again
        Playing --> GameOver : User quits (ESC/Q)
    }
    
    GameOver --> ResultsDisplay : Calculate final score
    ResultsDisplay --> LeaderboardUpdate : Add score to leaderboard
    LeaderboardUpdate --> NameInput : User chooses to play again
    LeaderboardUpdate --> [*] : User closes/quits application
    
    state "Game Objects State" as GameObjects {
        state "Player Paddle" as PlayerPaddle {
            [*] --> Idle
            Idle --> MovingUp : Arrow Up / Mouse Wheel Up
            Idle --> MovingDown : Arrow Down / Mouse Wheel Down
            MovingUp --> Idle : Key Released / Wheel Stopped
            MovingDown --> Idle : Key Released / Wheel Stopped
            MovingUp --> Boundary : Reach top edge
            MovingDown --> Boundary : Reach bottom edge
            Boundary --> Idle : Stop at boundary
        }
        
        state "AI Paddle" as AIPaddle {
            [*] --> Tracking
            Tracking --> MovingUp : Ball above paddle + deadzone
            Tracking --> MovingDown : Ball below paddle + deadzone
            Tracking --> Idle : Ball within deadzone
            MovingUp --> Tracking : Continue tracking
            MovingDown --> Tracking : Continue tracking
            Idle --> Tracking : Ball moves outside deadzone
        }
        
        state "Ball" as Ball {
            [*] --> Center
            Center --> Moving : Game starts
            Moving --> Moving : Normal movement
            Moving --> Collision : Hit paddle or wall
            Collision --> Moving : Bounce with new trajectory
            Moving --> Scored : Go off left/right edge
            Scored --> Center : Reset after score
        }
    }
```

## Input Handling State Diagram

```mermaid
stateDiagram-v2
    [*] --> Listening
    
    state Listening {
        [*] --> WaitingForInput
        WaitingForInput --> ProcessingKey : Key pressed
        WaitingForInput --> ProcessingMouse : Mouse wheel
        WaitingForInput --> ProcessingSpecial : Special key (ESC/Q/L)
        
        ProcessingKey --> PlayerMovement : Arrow keys during game
        ProcessingKey --> WaitingForInput : Other keys
        
        ProcessingMouse --> PlayerMovement : Wheel scroll during game
        ProcessingMouse --> WaitingForInput : No game running
        
        ProcessingSpecial --> GameAction : ESC/Q (quit)
        ProcessingSpecial --> UIToggle : L (leaderboard)
        ProcessingSpecial --> WaitingForInput : Invalid context
        
        PlayerMovement --> WaitingForInput : Movement processed
        GameAction --> WaitingForInput : Action completed
        UIToggle --> WaitingForInput : UI toggled
    }
    
    state "Key State Tracking" as KeyTracking {
        [*] --> Released
        Released --> Pressed : keydown event
        Pressed --> Released : keyup event
        Pressed --> Pressed : Key held down
    }
```

## Leaderboard System Sequence Diagram

```mermaid
sequenceDiagram
    participant Game
    participant LeaderboardSystem
    participant LocalStorage
    participant UI
    
    Note over Game,UI: Game Initialization
    Game->>LeaderboardSystem: Initialize
    LeaderboardSystem->>LocalStorage: getData()
    LocalStorage-->>LeaderboardSystem: Return stored scores array
    LeaderboardSystem->>UI: updateDisplay()
    UI->>UI: Render leaderboard list
    
    Note over Game,UI: During Gameplay
    Game->>Game: Track game duration
    Game->>Game: Track player score
    
    Note over Game,UI: Game End
    Game->>LeaderboardSystem: addScore(name, score, duration)
    LeaderboardSystem->>LeaderboardSystem: Create score object
    LeaderboardSystem->>LocalStorage: getData()
    LocalStorage-->>LeaderboardSystem: Current scores
    LeaderboardSystem->>LeaderboardSystem: Add new score to array
    LeaderboardSystem->>LeaderboardSystem: Sort by score desc, time asc
    LeaderboardSystem->>LeaderboardSystem: Keep top 10 scores
    LeaderboardSystem->>LocalStorage: saveData(topScores)
    LeaderboardSystem->>UI: updateDisplay()
    UI->>UI: Render updated leaderboard
    LeaderboardSystem-->>Game: Return final leaderboard
```

## Rendering Pipeline Diagram

```mermaid
graph TD
    A[Game Loop Tick] --> B[Clear Canvas]
    B --> C[Draw Background Elements]
    C --> D[Draw Center Dashed Line]
    D --> E[Draw Player Paddle]
    E --> F[Draw AI Paddle]
    F --> G[Draw 3D Ball]
    
    subgraph "3D Ball Rendering"
        G --> G1[Save Canvas Context]
        G1 --> G2[Enable High-Quality Smoothing]
        G2 --> G3[Create Primary Radial Gradient]
        G3 --> G4[Draw Main Ball with Gradient]
        G4 --> G5[Draw Rim Shadows]
        G5 --> G6[Draw Primary Highlight]
        G6 --> G7[Draw Secondary Sparkle]
        G7 --> G8[Draw Reflection]
        G8 --> G9[Restore Canvas Context]
    end
    
    G9 --> H[Update Score Display]
    H --> I[Update Player Name Display]
    I --> J[Schedule Next Frame]
    J --> A
```

## Data Flow Diagram

```mermaid
graph LR
    subgraph "Input Sources"
        KB[Keyboard Events]
        MS[Mouse Events]
        UI_Events[UI Events]
    end
    
    subgraph "Input Processing"
        IM[Input Manager]
        KS[Key State Tracker]
    end
    
    subgraph "Game Logic"
        GS[Game State]
        PP[Player Paddle Logic]
        AP[AI Paddle Logic]
        BP[Ball Physics]
        SC[Score Controller]
    end
    
    subgraph "Rendering"
        RM[Render Manager]
        CV[Canvas 2D Context]
        GR[3D Graphics Renderer]
    end
    
    subgraph "Data Persistence"
        LB[Leaderboard Manager]
        LS[Local Storage]
    end
    
    subgraph "Output"
        DISPLAY[Visual Display]
        UI_Updates[UI Updates]
    end
    
    KB --> IM
    MS --> IM
    UI_Events --> IM
    IM --> KS
    KS --> PP
    IM --> GS
    
    GS --> PP
    GS --> AP
    GS --> BP
    GS --> SC
    
    PP --> RM
    AP --> RM
    BP --> RM
    SC --> UI_Updates
    SC --> LB
    
    RM --> CV
    CV --> GR
    GR --> DISPLAY
    
    LB --> LS
    LB --> UI_Updates
    LS --> LB
```

## Technology Stack Overview

```mermaid
graph TB
    subgraph "Frontend Technologies"
        HTML5[HTML5 Canvas]
        CSS3[CSS3 Styling]
        JS[Vanilla JavaScript ES6+]
    end
    
    subgraph "Browser APIs"
        CANVAS[Canvas 2D API]
        STORAGE[Web Storage API]
        DOM[DOM API]
        EVENTS[Event API]
        RAF[requestAnimationFrame]
    end
    
    subgraph "Game Architecture Patterns"
        GAMELOOP[Game Loop Pattern]
        STATE[State Management]
        OBSERVER[Event-Driven Pattern]
        COMPONENT[Component Pattern]
    end
    
    HTML5 --> CANVAS
    CSS3 --> DOM
    JS --> STORAGE
    JS --> EVENTS
    JS --> RAF
    
    CANVAS --> GAMELOOP
    STORAGE --> STATE
    EVENTS --> OBSERVER
    DOM --> COMPONENT
```

---

## Architecture Notes

### Key Design Decisions

1. **Vanilla JavaScript**: No frameworks to maintain simplicity and performance
2. **Component-based Architecture**: Separated concerns for rendering, physics, input, and data
3. **Canvas 2D Rendering**: Chosen for 2D game graphics with 3D visual effects
4. **Local Storage**: Persistent leaderboard without requiring server infrastructure
5. **Game Loop Pattern**: Standard pattern for real-time game updates
6. **Event-driven Input**: Responsive controls using browser event system

### Performance Considerations

- Uses `requestAnimationFrame` for smooth 60fps rendering
- Efficient collision detection with bounding box calculations
- Gradient caching within render functions
- Minimal DOM manipulation during gameplay

### Extensibility

The modular architecture allows for easy extension:
- New game modes can be added by extending the game state
- Additional rendering effects can be integrated into the graphics pipeline
- Different AI algorithms can replace the current tracking system
- Multiplayer support could be added through the input management system