import * as ecs from '@8thwall/ecs'

ecs.registerComponent({
  name: 'Random Quote',
  schema: {
  },
  schemaDefaults: {
  },
  data: {
    quote: ecs.string,
    author: ecs.string,
  },
  stateMachine: ({world, eid, schemaAttribute, dataAttribute}) => {
    ecs.defineState('default')
      .initial()
      .onEnter(() => {
        fetch('https://dummyjson.com/quotes/random')
          .then((res) => {
            res.json()
              .then((data) => {
                dataAttribute.set(eid, {
                  quote: data.quote,
                  author: data.author,
                })

                ecs.Ui.mutate(world, eid, (cursor) => {
                  const {quote, author} = dataAttribute.get(eid)
                  const text = `${quote} - ${author}`

                  cursor.text = text
                  cursor.width = `${text.length * cursor.fontSize * 0.2}`

                  return false
                })
              })
          })
          .catch((e) => {
            alert(e)
          })
      })
  },
})
