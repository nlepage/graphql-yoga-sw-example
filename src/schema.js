import { delegateToSchema } from '@graphql-tools/delegate'
import { buildHTTPExecutor } from '@graphql-tools/executor-http'
import { stitchSchemas } from '@graphql-tools/stitch'
import { schemaFromExecutor, FilterObjectFields } from '@graphql-tools/wrap'
import { userSchema } from './user-schema.js'

export async function getSchema() {
  const rickAndMortyExecutor = buildHTTPExecutor({
    endpoint: 'https://rickandmortyapi.com/graphql',
  })

  const rickAndMortySubschema = {
    schema: await schemaFromExecutor(rickAndMortyExecutor),
    executor: rickAndMortyExecutor,
  }

  const userSubschema = {
    schema: userSchema,
    transforms: [
      new FilterObjectFields((typeName, fieldName) => !(typeName === 'User' && fieldName === 'favoriteCharactersIds')),
    ],
  }

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
