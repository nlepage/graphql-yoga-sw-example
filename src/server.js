import { createServer } from 'node:http'
import { createYoga } from 'graphql-yoga'
import { getSchema } from './schema.js'
import { getMemoryUserStore } from './user-store.js'

const userStore = getMemoryUserStore();

const yoga = createYoga({
  schema: getSchema(),
  context: {
    userStore,
  },
})

const server = createServer(yoga)

server.listen({
  host: 'localhost',
  port: 0,
}, () => {
  console.log(`Listening at http://localhost:${server.address().port}${yoga.graphqlEndpoint}`)
})
