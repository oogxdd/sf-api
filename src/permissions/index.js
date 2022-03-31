const { rule, shield, allow, deny, or } = require('graphql-shield')
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
          id: Number(args.where.id),
        },
      })
      .author()
    return userId === author.id
  }),
  isAdmin: rule()((_parent, _args, context) => {
    const userId = getUserId(context)
    return false
    // return Boolean(userId)
  }),
}

const permissions = shield({
  Query: {
    donations: rules.isAdmin,
  },
  Mutation: {
    // createOneUser: rules.isAdmin,
    updateOneUser: rules.isAdmin,
    deleteOneUser: rules.isAdmin,

    createSong: rules.isAuthenticatedUser,
    createOneSong: rules.isAuthenticatedUser,
    updateOneSong: or(rules.isSongOwner, rules.isAdmin),
    deleteOneSong: or(rules.isSongOwner, rules.isAdmin),

    createOneDonation: rules.isAdmin,
    updateOneDonation: rules.isAdmin,
    deleteOneDonation: rules.isAdmin,

    signup: allow,
  },
  User: {
    email: rules.isAdmin,
    password: deny,
  },
})

module.exports = {
  permissions: permissions,
}
