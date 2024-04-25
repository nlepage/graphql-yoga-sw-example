import { createSchema } from 'graphql-yoga'

export const schema = createSchema({
  typeDefs: /* GraphQL */ `
    type Query {
      hello: String
    }
  `,
  resolvers: {
    Query: {
      hello() {
        return 'Hello World!'
      },
    },
  },
})
