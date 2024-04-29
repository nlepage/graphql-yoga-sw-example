import { GraphQLError } from 'graphql'
import { createSchema } from 'graphql-yoga'

export const userSchema = createSchema({
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
