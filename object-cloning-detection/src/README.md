Object Cloning and Detection
Overview
This project demonstrates:

Object Cloning: Cloning existing scene objects (sushi) multiple times and making them fall from the top of the screen.

Collision Detection: Using colliders and events to detect when sushi touches a plate. This interaction increases the score and updates UI elements.

Controls
This demo runs automatically—there are no active controls for the player.

After pressing Start, sushi falls every 2 seconds.

When sushi reaches a plate at the bottom of the screen, it disappears, and the score and UI are updated accordingly.

Sushi Types:

Regular Sushi: Worth between 1 and 3 points (randomly assigned).
Super Sushi: Always worth 10 points.
Sushi spawns at random positions (left or right) and is selected randomly between regular and super types.

Components
ObjectSpawner
Description: Spawns sushi every 2 seconds for collection by the plates.

Schema:

objectToSpawn: (ecs.eid) Sushi object to clone.
objectToSpawnSuper: (ecs.eid) Super sushi object to clone.
spawnY: (ecs.f32) Y-axis position to spawn the sushi.
spawnZ: (ecs.f32) Z-axis position to spawn the sushi.
Functionality: Automatically creates clones of sushi objects at regular intervals once the game starts.

UIRewardController
Description: Listens for events from the ScoreArea and updates the score UI using HTML.
GameManager
Description: Implements a state machine for transitioning between the Title Screen and Gameplay states.
Sushi
Description: Moves sushi downward after spawning and destroys itself when it moves off-screen or collides with a plate.
ScoreArea
Description: Detects collisions when sushi reaches a plate and triggers events to update the score and UI.
Project Setup
Scene Objects:

GameManager, UIRewardController, and ObjectSpawner: These are separate objects in the scene to manage game flow, UI, and sushi spawning.
Sushi Objects:

Two sushi objects (regular and super) exist in the scene with attached Sushi scripts.
Both objects must have colliders for collision detection and are connected to the ObjectSpawner for cloning.
Score Areas:

Two objects, ScoreAreaLeft and ScoreAreaRight, represent the areas where sushi falls to trigger score updates.
Notes
This project is modular, allowing you to easily modify the sushi spawning behavior, add new object types, or change scoring rules.

Ensure colliders are correctly set up on all relevant objects for proper functionality.