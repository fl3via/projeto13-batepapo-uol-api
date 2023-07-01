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
const mensagem = joi.object({
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
		text: 'entrar na sala...',
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
	  const participants = await participants.find({}, { _id: 0, name: 1 }).toArray()
	} catch (error) {
	  return res.status(500).send()
	}
  })

  // Rota POST /messages
  app.post('/messages', async (req, res) => {
	const { to, text, type } = req.body
	const from = req.headers['user']
  
	try {
	  const { error } = mensagem.validate({ to, text, type })
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

//inicia o servidor 
app.listen(5000, () => {
	console.log('Servidor iniciado na porta 5000')
})