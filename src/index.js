const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
    console.log('New WebSocket connection')

    socket.on('join', ({ username, Room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, Room })

        if (error) {
            return callback(error)
        }

        socket.join(user.room)


        socket.emit('message', generateMessage('Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined the room!`))
        callback()
    })
    socket.on('sendMessage', (input, callback) => {
        const filter = new Filter()
        if (filter.isProfane(input)) {
            return callback('Profanity is not allowed')
        }
        io.emit('message', generateMessage(input))
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMessage(`${user.username} has left`))
        }
    })

    socket.on('location', (position, callback) => {
        io.emit('locationMessage', generateLocationMessage(`https://google.com/maps?q=${position.latitude},${position.longitude}`))
        callback()
    })
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})