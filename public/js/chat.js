//is needed for the connection to the server
const socket = io()

//Elements
const $messageForm = document.querySelector("#message-form")
const $messageFormInput = $messageForm.querySelector("input")
const $messageFormButton = $messageForm.querySelector("button")
const $sendLocationButton = document.querySelector("#send-location")
const $messages = document.querySelector("#messages")

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML
const locationTemplate = document.querySelector("#location-template").innerHTML
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML

// Options
const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    const $newMessage = $messages.lastElementChild
    
    const newMessageStyle = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyle.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    const visibleHeight = $messages.offsetHeight

    const containerHeight = $messages.scrollHeight

    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset + 30) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

//listen for the message event on the server
socket.on("message", (message) => {
    console.log(message)

    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        // Moment lib - time format
        createdAt: moment(message.createdAt).format("H:mm [Uhr]")
    })
    $messages.insertAdjacentHTML("beforeend", html)
    autoscroll()
})

// listen for the locationMessage event on the server
socket.on("locationMessage", (location) => {
    const html = Mustache.render(locationTemplate, {
        username: location.username,
        location: location.url,
        createdAt: moment(location.createdAt).format("H:mm [Uhr]")
    })
    $messages.insertAdjacentHTML("beforeend", html)
    autoscroll()
})

socket.on("roomData", ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })

    document.querySelector("#sidebar").innerHTML = html
})

//emits an event that is sending a message from the client to the server
$messageForm.addEventListener("submit", (e) => {
    e.preventDefault()

    $messageFormButton.setAttribute("disabled", "disabled")

    const message = e.target.elements.message.value

    socket.emit("sendMessage", message, (error) => {
       $messageFormButton.removeAttribute("disabled")
       $messageFormInput.value = ""
       $messageFormInput.focus()

        if (error) {
            return console.log(error)
        }

        console.log("Message delivered!")
    })
})

$sendLocationButton.addEventListener("click", () => {
    if (!navigator.geolocation) {
        return alert("Geolocation is not supported by your browser.")
    }
    $sendLocationButton.setAttribute("disabled", "disabled")

    navigator.geolocation.getCurrentPosition((position) => {

        socket.emit("sendLocation", {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            $sendLocationButton.removeAttribute("disabled")
            console.log("Location sended!")
        })
    })
})

socket.emit("join", { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = "/"
    }
})