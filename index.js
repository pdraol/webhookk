const express = require('express')
const bodyParser = require('body-parser')
const axios = require('axios')

const app = express().use(bodyParser.json())
const port = process.env.PORT || 8000
const my_token = process.env.MYTOKEN
const API_token = process.env.API_TOKEN

// Webhook verification
app.get('/webhook', (req, res) => {
  let mode = req.query['hub.mode']
  let challenge = req.query['hub.challenge']
  let token = req.query['hub.verify_token']

  if (mode && token) {
    if (mode === 'subscribe' && token === my_token) {
      res.status(200).send(challenge)
    } else {
      res.status(403).send('Forbidden: Invalid Token')
    }
  } else {
    res.status(403).send('Forbidden: Missing Parameters')
  }
})

// Handle incoming messages
app.post('/webhook', async (req, res) => {
  let bodyMess = req.body
  console.log(JSON.stringify(bodyMess, null, 2))

  if (!bodyMess.object) {
    return res.sendStatus(400)
  }

  try {
    if (
      bodyMess.entry &&
      bodyMess.entry[0].changes &&
      bodyMess.entry[0].changes[0].value.messages &&
      bodyMess.entry[0].changes[0].value.messages[0]
    ) {
      let from = bodyMess.entry[0].changes[0].value.messages[0].from
      let mess = bodyMess.entry[0].changes[0].value.messages[0].text.body
      let phone_number_id = bodyMess.entry[0].changes[0].value.metadata.phone_number_id

      // Ensure phone_number_id exists
      if (!phone_number_id) {
        console.error('Error: Missing phone_number_id')
        return res.sendStatus(400)
      }

      let data = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: from,
        type: 'text',
        text: { preview_url: false, body: mess },
      }

      let config = {
        method: 'post',
        url: `https://graph.facebook.com/v18.0/${phone_number_id}/messages`,
        headers: {
          authorization: `Bearer ${API_token}`,
          'Content-Type': 'application/json',
        },
        data: JSON.stringify(data),
      }

      // Send message via WhatsApp API
      const response = await axios(config)
      console.log('Message Sent Successfully:', response.data)
      res.sendStatus(200)
    }
  } catch (error) {
    console.error('Axios Error:', error.response ? error.response.data : error.message)
    res.status(error.response?.status || 500).json({
      error: error.response?.data || 'Internal Server Error',
    })
  }
})

// Start server
app.listen(port, () => {
  console.log(`Webhook is listening on port ${port}`)
})
