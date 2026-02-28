// ScoreKeeper.ts
// Listens for 'hole-scored' and appends a new UI row per hole.
// Sets UI on the cloned instances (not the prefabs) and logs the gameStatus subtree for debugging.

import * as ecs from '@8thwall/ecs'

ecs.registerComponent({
  name: 'Score Keeper',

  schema: {
    // @label Prefab: HoleEntryRow
    holeEntryPrefab: ecs.eid,  // Container row prefab
    // @label Prefab: HoleEntryText
    holeEntryText: ecs.eid,  // Prefab UI element to display current hole number
    // @label Prefab: ParEntryText
    parEntryText: ecs.eid,  // Prefab UI element to display par value
    // @label Prefab: ScoreEntryText
    scoreEntryText: ecs.eid,  // Prefab UI element to display score
    // @label UI: GameStatus
    gameStatus: ecs.eid,  // Parent entity for appended rows
  },

  stateMachine: ({world, eid, schemaAttribute}) => {
    ecs.defineState('default')
      .initial()
      // Listen for the score event emitted by Hole Score
      .listen(world.events.globalId, 'hole-scored', (event) => {
        const schema = schemaAttribute.get(eid)

        // 1) Create a new row instance from the row prefab
        const row = world.createEntity(schema.holeEntryPrefab)

        // 2) Parent the new row under the gameStatus container
        world.getEntity(schema.gameStatus).addChild(row)

        // 3) Clone and attach text elements to THIS row, not the prefab
        // Hole #
        const holeText = world.createEntity(schema.holeEntryText)
        world.getEntity(row).addChild(holeText)
        ecs.Ui.set(world, holeText, {width: '85', text: event.data.hole?.toString?.() ?? `${event.data.hole}`})

        // Par
        const parText = world.createEntity(schema.parEntryText)
        world.getEntity(row).addChild(parText)
        ecs.Ui.set(world, parText, {width: '85', text: event.data.par?.toString?.() ?? `${event.data.par}`})

        // Score (with color)
        const scoreText = world.createEntity(schema.scoreEntryText)
        world.getEntity(row).addChild(scoreText)
        const color =
          event.data.score < event.data.par
            ? '#00FF00'
            : event.data.score > event.data.par
              ? '#FF0000'
              : '#FFFFFF'
        ecs.Ui.set(world, scoreText, {
          width: '85',
          text: event.data.score?.toString?.() ?? `${event.data.score}`,
          color,
        })

        // 4) Debug: print current children under gameStatus, with any Ui text/color found
        const parentEntity = world.getEntity(schema.gameStatus)
        const childrenIter = parentEntity.getChildren()
        const childIds = Array.from(childrenIter as Iterable<number>)
        console.log('[ScoreKeeper] Added new row', row, 'Total rows:', childIds.length)
      })
  },
})
