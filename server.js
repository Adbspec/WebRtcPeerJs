const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
const path = require("path");


const dotenv = require('dotenv');
dotenv.config();


const io = require("socket.io")(server, {
  cors: {
    origin: '*'
  }
});
const { ExpressPeerServer } = require("peer");
const opinions = {
  debug: true,
}

app.use("/peerjs", ExpressPeerServer(server, opinions));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

app.get("/:room", (req, res) => {
  const filePath = path.join(__dirname, 'public', 'room.html');
  res.sendFile(filePath, { roomId: req.params.room });
});

io.on("connection", (socket) => {

  socket.on("join-room", (roomId, userId, userName) => {
    socket.join(roomId);

    setTimeout(()=>{
      socket.to(roomId).broadcast.emit("user-connected", userId,userName);
      console.log(userName + " connected to room " + roomId + " with id " + userId)
    }, 1000)

    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message, userName);
    });

    socket.on("disconnect", () => {
      io.to(roomId).emit("user-disconnected", userId);
    });


    socket.on("whiteboard-data", (data) => {
      socket.to(roomId).broadcast.emit("receive-whiteboard-data", data);
    });
    

  });
  
});


server.listen(process.env.PORT || 3000,()=>{
  console.log(`server is running on port ${process.env.PORT || 3000}`)
});
