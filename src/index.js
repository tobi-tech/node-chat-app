const express = require("express")
const http = require("http")
const socketio = require("socket.io")
const path = require("path")
const Filter = require("bad-words")
const { generateMessage, generateLocationMessage } = require("./utils/messages")
const { addUser, removeUser, getUser, getUsersInRoom, getActiveRooms } = require("./utils/users")

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, "../public")

app.use(express.static(publicDirectoryPath))

//creates a "new connection" event listener, where everything else is happening inside
io.on("connection", (socket) => {
    console.log("New Websocket connection!")

    socket.on("join", ({ username, room }, callback) => {

        const { error, user } = addUser({ id: socket.id, username, room })

        if (error) {
            return callback(error)
        }

        socket.join(user.room)

        //emits an event to the user who is logging in
        socket.emit("message", generateMessage("Admin", "Welcome!"))

        //emits a message to every user except the new logged in user
        socket.broadcast.to(user.room).emit("message", generateMessage("Admin", `${user.username} has joined!`))
        io.to(user.room).emit("roomData", {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    //listen for the "sendMessage" event on the client side
    socket.on("sendMessage", (messageSended, callback) => {
        const filter = new Filter()

        if (filter.isProfane(messageSended)) {
            return callback("Profanity is not allowed!")
        }

        const user = getUser(socket.id)

        if (user) {
            io.to(user.room).emit("message", generateMessage(user.username, messageSended))
            callback()
        }
    })

    // listen for sendLocation event on the client side
    socket.on("sendLocation", (location, callback) => {
        const user = getUser(socket.id)

        if (user) {
            io.to(user.room).emit("locationMessage", generateLocationMessage(user.username, `https://google.com/maps?q=${location.latitude},${location.longitude}`))
            callback()
        }
    })

    //listen for acitveRooms event on the index page
    socket.on("activeRooms", (callback) => {
        callback(getActiveRooms())
    })

    //emits a message to all users if a user disconnect from the chat room
    socket.on("disconnect", () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit("message", generateMessage("Admin", `${user.username} has left!`))
            io.to(user.room).emit("roomData", {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(port, () => {
    console.log("Server is up on port " + port)
})