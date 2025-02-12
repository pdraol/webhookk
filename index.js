const express = require('express')
const body_parser = require('body-parser')
const axios = require('axios')

const app = express().use(body_parser.json())
const port = process.env.PORT || 8000
const my_token = process.env.MYTOKEN
const API_token = process.env.API_TOKEN

// Store message statuses in memory
const messageStatusMap = {}

// Webhook verification
app.get('/', (req, res) => {
  res.send('Webhook')
})

app.get('/webhook', (req, res) => {
  let mode = req.query['hub.mode']
  let challenge = req.query['hub.challenge']
  let token = req.query['hub.verify_token']

  if (mode && token) {
    if (mode === 'subscribe' && token === my_token) {
      res.status(200).send(challenge)
    } else {
      res.status(403).send('Forbidden')
    }
  } else {
    res.status(403).send('Forbidden')
  }
})

// Handle incoming messages
app.post('/webhook', (req, res) => {
  let bodyMess = req.body
  console.log(JSON.stringify(bodyMess, null, 2))

  if (bodyMess.object) {
    // If receiving a message
    if (
      bodyMess.entry &&
      bodyMess.entry[0].changes &&
      bodyMess.entry[0].changes[0].value.messages &&
      bodyMess.entry[0].changes[0].value.messages[0]
    ) {
      let from = bodyMess.entry[0].changes[0].value.messages[0].from
      let mess = bodyMess.entry[0].changes[0].value.messages[0].text.body
      let phone_number_id =
        bodyMess.entry[0].changes[0].value.metadata.phone_number_id

      var data = JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: from,
        type: 'text',
        text: {
          preview_url: false,
          body: mess,
        },
      })

      var config = {
        method: 'post',
        url: `https://graph.facebook.com/v15.0/${phone_number_id}/messages`,
        headers: {
          authorization: `Bearer ${API_token}`,
          'Content-Type': 'application/json',
        },
        data: data,
      }

      axios(config)
        .then(function (response) {
          console.log(JSON.stringify(response.data))
          res.sendStatus(200)
        })
        .catch(function (error) {
          console.log(error)
          res.sendStatus(403)
        })
    }

    // If receiving a message status update
    if (
      bodyMess.entry &&
      bodyMess.entry[0].changes &&
      bodyMess.entry[0].changes[0].value.statuses &&
      bodyMess.entry[0].changes[0].value.statuses[0]
    ) {
      let statusUpdate = bodyMess.entry[0].changes[0].value.statuses[0]
      let messageId = statusUpdate.id
      let status = statusUpdate.status // delivered, read, failed, etc.

      // Store in memory
      messageStatusMap[messageId] = status

      console.log('Message Status Update ')
      console.log('Message ID:', messageId)
      console.log('Status:', status)
      console.log('------------------------------------')
    }
  }

  res.sendStatus(200)
})

// API to get message status by ID
app.get('/message-status', (req, res) => {
  let messageId = req.query.message_id

  if (!messageId) {
    return res.status(400).json({ error: 'message_id is required' })
  }

  let status = messageStatusMap[messageId]

  if (status) {
    res.json({ message_id: messageId, status: status })
  } else {
    res.status(404).json({ error: 'Message ID not found or no status yet' })
  }
})

// Start the server
app.listen(port, () => {
  console.log('Webhook is listening on server')
})
