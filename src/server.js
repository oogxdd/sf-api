const { ApolloServer } = require('apollo-server-express')
const { ApolloServerPluginDrainHttpServer } = require('apollo-server-core')
const { createContext } = require('./context')
const { schema } = require('./schema')
const express = require('express')
const multer = require('multer')
const http = require('http')
const cors = require('cors')
const bodyParser = require('body-parser')

const storage = multer.diskStorage({
  destination: './files',
  filename(req, file, cb) {
    cb(null, `${new Date()}-${file.originalname}`)
  },
})

const upload = multer({ storage })

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

  app.use('/files', express.static('files'))
  app.post('/files', upload.single('file'), (req, res) => {
    const file = req.file // file passed from client
    const meta = req.body // all other values passed from the client, like name, etc..

    res.status(200).json({ path: file.path })
  })

  app.use(express.static('files'))
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
