require('dotenv').config()
const { ApolloServer } = require('apollo-server-express')
const { ApolloServerPluginDrainHttpServer } = require('apollo-server-core')
const { createContext } = require('./context')
const { schema } = require('./schema')
const express = require('express')
const http = require('http')
const cors = require('cors')
const bodyParser = require('body-parser')

const cloudinary = require('cloudinary').v2
const multer = require('multer')
const { CloudinaryStorage } = require('multer-storage-cloudinary')

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'soundfuck',
    resource_type: 'auto',
    allowedFormats: ['jpeg', 'png', 'jpg', 'mp3', 'wav', 'flac'],
  },
})

const parser = multer({ storage: storage })

// const storage = multer.diskStorage({
//   destination: './files',
//   filename(req, file, cb) {
//     cb(null, `${new Date()}-${file.originalname}`)
//   },
// })

// const upload = multer({ storage })

const corsOptions = {
  origin: '*',
  credentials: true,
}

async function startApolloServer() {
  const app = express()
  const httpServer = http.createServer(app)
  const server = new ApolloServer({
    schema,
    context: createContext,
    cors: cors(corsOptions),
    // resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  })

  app.use(
    cors({
      origin: '*',
      credentials: true,
    }),
  )
  await server.start()

  app.post('/files', parser.single('file'), (req, res) => {
    res.status(200).json({ path: req.file.path })
  })

  app.use(bodyParser.json({ limit: '50mb', type: 'application/json' }))

  // server.applyMiddleware({ app, path: '/', cors: cors(corsOptions) })
  server.applyMiddleware({ app, path: '/' })
  await new Promise((resolve) => httpServer.listen({ port: 8080 }, resolve))
  console.log(`\
    🚀 Server ready at: http://localhost:8080
    ⭐️ See sample queries: http://pris.ly/e/js/graphql-auth#using-the-graphql-api`)
  return { server, app }
}

startApolloServer()
