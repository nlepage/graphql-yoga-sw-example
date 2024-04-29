import { delegateToSchema } from '@graphql-tools/delegate'
import { buildHTTPExecutor } from '@graphql-tools/executor-http'
import { stitchSchemas } from '@graphql-tools/stitch'
import { schemaFromExecutor } from '@graphql-tools/wrap'
import { GraphQLError } from 'graphql'
import { createSchema } from 'graphql-yoga'

export async function getSchema() {
  const rickAndMortyExecutor = buildHTTPExecutor({
    endpoint: 'https://rickandmortyapi.com/graphql',
  })

  const rickAndMortySubschema = {
    schema: await schemaFromExecutor(rickAndMortyExecutor),
    executor: rickAndMortyExecutor,
  }

  const userSubschema = createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        me: User!
      }

      type Mutation {
        toggleFavoriteCharacter(userId: ID!, characterId: ID!): User!
      }

      type User {
        id: ID!
        favoriteCharactersIds: [ID!]!
      }
    `,
    resolvers: {
      Query: {
        me(_, __, { userStore }) {
          return userStore.get('me');
        },
      },

      Mutation: {
        async toggleFavoriteCharacter(_, { userId, characterId }, { userStore }) {
          if (userId !== 'me') throw new GraphQLError(`unknown userId ${userId}`);

          const me = await userStore.get('me');

          const index = me.favoriteCharactersIds.indexOf(characterId)
          if (index === -1) {
            me.favoriteCharactersIds.push(characterId)
          } else {
            me.favoriteCharactersIds.splice(index, 1)
          }

          await userStore.set('me', me);

          return me
        }
      },
    },
  })

  return stitchSchemas({
    subschemas: [rickAndMortySubschema, userSubschema],
    typeDefs: /* GraphQL */ `
      extend type User {
        favoriteCharacters: [Character!]!
      }
    `,
    resolvers: {
      User: {
        favoriteCharacters: {
          selectionSet: `{ favoriteCharactersIds }`,
          resolve({ favoriteCharactersIds: ids }, _args, context, info) {
            if (ids.length === 0) return []
            return delegateToSchema({
              schema: rickAndMortySubschema,
              operation: 'query',
              fieldName: 'charactersByIds',
              args: { ids },
              context,
              info,
            })
          },
        },
      },
    },
  })
}
