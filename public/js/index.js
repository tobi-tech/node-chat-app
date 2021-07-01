const socket = io()

//Elements
const $roomDropdown = document.querySelector("#active-rooms")
const $activeRooms = document.querySelector("#active-rooms")
const $room = document.querySelector("#room")

//Templates
const roomsTemplate = document.querySelector("#rooms-template").innerHTML

socket.emit("activeRooms", (activeRooms) => {
    if (activeRooms[0] === undefined) {
        activeRooms[0] = "No active rooms"
    }

    activeRooms.forEach((room) => {
        const html = Mustache.render(roomsTemplate, { room })
         $roomDropdown.insertAdjacentHTML("beforeend", html)
    })
})

//listener for active rooms to set value for rooms equal to selected active room
$activeRooms.addEventListener("change", () => {
    $room.value = $activeRooms.value
})