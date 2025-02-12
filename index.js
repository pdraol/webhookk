const express = require('express')
const body_parser = require('body-parser')
const axios = require('axios')

const app = express().use(body_parser.json())
const port = process.env.PORT || 8000
const my_token = process.env.MYTOKEN
const API_token = process.env.API_TOKEN

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
      res.status(403)
    }
  } else {
    res.status(403)
  }
})

app.post('/webhook', (req, res) => {
  let bodyMess = req.body
  console.log(JSON.stringify(bodyMess, null, 2))
  if (bodyMess.object) {
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
  }
})

app.listen(port , ()=>{
    console.log('webhook is listening on srver')
})
