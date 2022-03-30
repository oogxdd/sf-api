const { permissions } = require('./permissions')
const { APP_SECRET, getUserId } = require('./utils')
const { compare, hash } = require('bcryptjs')
const { sign } = require('jsonwebtoken')
const { applyMiddleware } = require('graphql-middleware')
const { nexusPrisma } = require('nexus-plugin-prisma')
const {
  intArg,
  makeSchema,
  nonNull,
  objectType,
  stringArg,
  inputObjectType,
  arg,
  asNexusMethod,
  enumType,
} = require('nexus')
const { DateTimeResolver } = require('graphql-scalars')

const DateTime = asNexusMethod(DateTimeResolver, 'date')

const Query = objectType({
  name: 'Query',
  definition(t) {
    t.crud.user()
    t.crud.users()
    t.crud.song()
    t.crud.songs({ ordering: true })
    // t.crud.donation()
    // t.crud.donations()
  },
})

const Mutation = objectType({
  name: 'Mutation',
  definition(t) {
    t.crud.createOneUser()
    // t.crud.updateOneUser()
    // t.crud.deleteOneUser()

    t.crud.createOneSong()
    t.crud.updateOneSong()
    t.crud.deleteOneSong()

    // t.crud.createOneDonation()
    // t.crud.updateOneDonation()
    // t.crud.deleteOneDonation()

    t.field('signup', {
      type: 'AuthPayload',
      args: {
        nickname: stringArg(),
        email: nonNull(stringArg()),
        password: nonNull(stringArg()),
        country: stringArg(),
      },
      resolve: async (_parent, args, context) => {
        const hashedPassword = await hash(args.password, 10)
        const user = await context.prisma.user.create({
          data: {
            nickname: args.nickname,
            email: args.email,
            password: hashedPassword,
          },
        })
        return {
          token: sign({ userId: user.id }, APP_SECRET),
          user,
        }
      },
    })

    t.field('login', {
      type: 'AuthPayload',
      args: {
        email: nonNull(stringArg()),
        password: nonNull(stringArg()),
      },
      resolve: async (_parent, { email, password }, context) => {
        const user = await context.prisma.user.findUnique({
          where: {
            email,
          },
        })
        if (!user) {
          throw new Error(`No user found for email: ${email}`)
        }
        const passwordValid = await compare(password, user.password)
        if (!passwordValid) {
          throw new Error('Invalid password')
        }
        return {
          token: sign({ userId: user.id }, APP_SECRET),
          user,
        }
      },
    })
  },
})

const User = objectType({
  name: 'User',
  definition(t) {
    t.nonNull.int('id')
    t.string('nickname')
    t.nonNull.string('email')
    t.nonNull.string('country')
    t.nonNull.string('password')
    t.nonNull.list.nonNull.field('songs', {
      type: 'Song',
      resolve: (parent, _, context) => {
        return context.prisma.user
          .findUnique({
            where: { id: parent.id || undefined },
          })
          .songs()
      },
    })
  },
})

const Song = objectType({
  name: 'Song',
  definition(t) {
    t.nonNull.int('id')
    t.nonNull.field('createdAt', { type: 'DateTime' })
    t.nonNull.field('updatedAt', { type: 'DateTime' })
    t.nonNull.string('title')
    t.nonNull.string('url')
    t.string('url2')
    t.string('cover')
    t.nonNull.int('sum')
    t.string('timeToComplete')
    t.field('author', {
      type: 'User',
      resolve: (parent, _, context) => {
        return context.prisma.song
          .findUnique({
            where: { id: parent.id || undefined },
          })
          .author()
      },
    })
  },
})

const AuthPayload = objectType({
  name: 'AuthPayload',
  definition(t) {
    t.string('token')
    t.field('user', { type: 'User' })
  },
})

const schemaWithoutPermissions = makeSchema({
  types: [Query, Mutation, User, Song, AuthPayload, DateTime],

  plugins: [
    nexusPrisma({
      experimentalCRUD: true,
    }),
  ],
  outputs: {
    schema: __dirname + '/../schema.graphql',
    typegen: __dirname + '/generated/nexus.ts',
  },
  contextType: {
    module: require.resolve('./context'),
    export: 'Context',
  },
  sourceTypes: {
    modules: [
      {
        module: '@prisma/client',
        alias: 'prisma',
      },
    ],
  },
})

const schema = applyMiddleware(schemaWithoutPermissions, permissions)

module.exports = {
  schema: schema,
}
