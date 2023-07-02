import express from 'express'
import { MongoClient } from "mongodb"
import cors from 'cors'
import dotenv from 'dotenv'
import joi from 'joi'
import dayjs from 'dayjs'

// config express
const app = express()
app.use(express.json())
app.use(cors())
dotenv.config()

//conexão com mongo 
const mongoClient = new MongoClient(process.env.DATABASE_URL)

try {
	await mongoClient.connect()
	console.log('conectado')
} catch (err) {
	console.log(err.message)
}

const db = mongoClient.db()

// joi
const participantes = joi.object({ name: joi.string().required() })
const message = joi.object({
	from: joi.string().required(),
	to: joi.string().required(),
	text: joi.string().required(),
	type: joi.string().required().valid('message', 'private_message')
})

//
app.post("/participants", async (req, res) => {
	const { name } = req.body
  
	try {
	  const { error } = participantes.validate(req.body, { abortEarly: false })
	  if (error) {
		const errorMessages = error.details.map((detail) => detail.message);
		return res.status(422).send(errorMessages)
	  }
  
	  const existingParticipant = await db.collection('participants').findOne({ name })
	  if (existingParticipant) {
		return res.sendStatus(409)
	  }
  
	  await db.collection('participants').insertOne({ name, lastStatus: Date.now() })
  
	  const message = {
		from: name,
		to: 'Todos',
		text: 'entra na sala...',
		type: 'status',
		time: dayjs().format('HH:mm:ss')
	  }
  
	  await db.collection('messages').insertOne(message)
  
	  return res.sendStatus(201)
	} catch (err) {
	  return res.status(500).send(err.message)
	}
  })
  
  app.get('/participants', async (req, res) => {
	try {
	  const participants = await db.collection('participants').find({}, { _id: 0, name: 1 }).toArray();
	  return res.json(participants);
	} catch (error) {
	  return res.status(500).send();
	}
  })
  

  // Rota POST /messages
  app.post('/messages', async (req, res) => {
	const { to, text, type } = req.body
	const from = req.headers['user']
  
	try {
	  const { error } = message.validate({ to, text, type })
	  if (error) {
		const errorMessages = error.details.map((detail) => detail.message)
		return res.status(422).send(errorMessages)
	  }
  
	  const existingParticipant = await db.collection('participants').findOne({ name: from })
	  if (!existingParticipant) {
		return res.sendStatus(422)
	  }
  
	  const message = {
		from,
		to,
		text,
		type,
		time: dayjs().format('HH:mm:ss')
	  }
  
	  await db.collection('messages').insertOne(message)
  
	  return res.sendStatus(201)
	} catch (err) {
	  return res.status(500).send(err.message)
	}
  }) 

  // GET messages
  app.get('/messages', async (req, res) => {
	try {
	  const user = req.headers['user']
	  const limit = req.query
	  const numLimit = Number(limit)
  
	  if (limit !== undefined && (numLimit <= 0 || isNaN(numLimit))) 
	  return res.sendStatus(422)
	  
  
	  const messages = await db.collection('messages')
		.find({
		  $or: [
			{ to: user },
			{ from: user },
			{ to: {$in: ['Todos', user]} },
			{ type: 'message' }
		  ]
		})
		.sort(({ $natural: -1 }))
		.limit(limit === undefined ? 0 : numLimit)
		.toArray()
  
	  return res.json(messages)
	} catch (error) {
	  console.log(error)
	  return res.status(500).send(err.message)
	}
  })

  // STATUS
  app.post('/status', async (req, res) => {
	const { user } = req.headers 

	if (!user) return res.sendStatus(400) 

	try {
		const result = await db.collection('participants').updateOne(
			{name: user}, {$set: { lastStatus: Date.now() }}
		)

		if (result.matchedCount === 0 ) return res.sendStatus(404)
		await removeInactiveParticipants()
		res.sendStatus(200)
	}
	catch (err) {
		res.status(500).send(err.massage)
	}
  })

  // Função para remover participantes inativos e salvar mensagens
const removeInactiveParticipants = async () => {
	const threshold = Date.now() - 10000
	const inactiveParticipants = await db.collection('participants')
	  .find({ lastStatus: { $lt: threshold } })
	  .toArray()
  
	if (inactiveParticipants.length > 0) {
	  await db.collection('participants').deleteMany({ lastStatus: { $lt: threshold } })
  
	  const removalMessages = inactiveParticipants.map(participant => ({
		from: participant.name,
		to: 'Todos',
		text: 'saiu da sala...',
		type: 'status',
		time: dayjs().format('HH:mm:ss')
	  }))
  
	  await db.collection('messages').insertMany(removalMessages)
	}
  }
  
  //remoção a cada 15 segundos
  setInterval(removeInactiveParticipants, 15000)

//inicia o servidor 
app.listen(5000, () => {
	console.log('Servidor iniciado na porta 5000')
})