const { rule, shield, allow, deny } = require('graphql-shield')
const { getUserId } = require('../utils')

const rules = {
  isAuthenticatedUser: rule()((_parent, _args, context) => {
    const userId = getUserId(context)
    return Boolean(userId)
  }),
  isSongOwner: rule()(async (_parent, args, context) => {
    const userId = getUserId(context)
    const author = await context.prisma.song
      .findUnique({
        where: {
          id: Number(args.id),
        },
      })
      .author()
    return userId === author.id
  }),
}

const permissions = shield({
  Query: {
    // me: rules.isAuthenticatedUser,
  },
  Mutation: {
    // updateOneUser: rules.isAdmin,
    // deleteOneUser: rules.isAdmin,
    createOneSong: rules.isAuthenticatedUser,
    updateOneSong: rules.isSongOwner,
    deleteOneSong: rules.isSongOwner,
  },
  User: {
    email: deny,
    password: deny,
  },
})

module.exports = {
  permissions: permissions,
}
