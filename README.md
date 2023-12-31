# **API Bate-Papo UOL!**

## **Principais Funcionalidades**
- Criar participantes;
- Retornar uma lista de participantes atuais do chat;
- Permitir o envio de mensagens no chat, incluindo mensagens privadas;
- Retornar mensagens do chat;
- Atualizar o status do participante para indicar atividade recente no chat da sala.
  
## **Rotas Utilizadas por Entidades**
**POST** `/participants`

- Recebe um body contendo o nome do participante a ser cadastrado na sala:

       {
         name: "João"
       }

**GET** `/participants`

- Retornar a lista de todos os participantes.
- Caso não haja nenhum participante na sala, o retorno é vazio.

**POST** `/messages`

- Recebe um body com os parâmetros:
  
       {
         to: "Maria",
         text: "oi sumida rs",
         type: "private_message"
       }

**GET** `/messages`
- O back-end só entrega as mensagens que aquele usuário poderia ver. Ou seja: deve entregar todas as mensagens *públicas,* todas as mensagens com o remetente ***“Todos”*** e todas as mensagens privadas enviadas para ele (to) ou por ele (from).

**POST** `/status`
- Atualiza o status do participante para indicar sua atividade recente na sala de chat.

## **Tecnologias Utilizadas**
- axios;
- cors;
- dayjs;
- dotenv;
- express;
- joi;
- mongodb.
