import express, { application } from 'express'
import { MongoClient } from "mongodb"

// config express
const app = express()
app.use(express.json)

//conexão com mongo 
const mongoClient = new MongoClient(process.env.DATABASE_URL)
let db

mongoClient.connect()
 .then(() => db = mongoClient.db())
 .catch((err) => console.log(err.message));

 app.get("/usuarios", (req, res) => {
	// buscando usuários
	db.collection("users").find().toArray()
		.then(users => res.send(users))  // array de usuários
		.catch(err => res.status(500).send(err.message))  // mensagem de erro
});

app.post("/usuarios", (req, res) => {
	// inserindo usuário
	db.collection("users").insertOne({
		email: "joao@email.com",
		password: "minha_super_senha"
	}).then(users => res.sendStatus(201))
		.catch(err => res.status(500).send(err.message))
});


//inicia o servidor 
app.listen(5000, () => {
    console.log('Servidor iniciado na porta 5000');
  });