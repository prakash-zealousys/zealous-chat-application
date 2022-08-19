const app = require("express")();
const http = require("http").Server(app);
const io = require("socket.io")(http);
let rooms = [];
let users = [];

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/pages/index.html");
});

io.on("connection", function (socket) {
  socket.on("createChatRoom", (data) => {
    let roomId = data.roomId;
    if (rooms.some((item) => item === roomId)) {
      console.log("Room is already added");
    } else {
      rooms.push(roomId);
    }
    socket.emit("storeRoom", rooms);
    socket.broadcast.emit("storeRoom", rooms);
  });

  socket.on("joinRoom", (data) => {
    let roomId = data.roomId;
    let userName = data.userName;
    let socketId = socket.id;

    if (!rooms.some((item) => item === roomId)) {
      console.log("Room not found");
    } else {
      if (users.some((item) => item.userName === userName)) {
        console.log("User is already added");
      } else {
        users.push({ roomId, userName, socketId });
        socket.emit("addUserSuccess");
      }
    }
    socket.join(roomId);
    socket.emit("addUserSuccess");
  });

  socket.on("getOnlinePeople", (data) => {
    let roomId = data.roomId;
    let onlinePeople = users.filter((item) => item.roomId === roomId);
    io.to(roomId).emit("onlinePeopleSuccess", {
      noOfPeopleOnline: onlinePeople.length,
      peopleOnline: onlinePeople,
    });
  });

  socket.on("leaveRoom", (data) => {
    let roomId = data.roomId;
    let socketId = socket.id;
    if (!rooms.some((item) => item === roomId)) {
      console.log("Room not found");
    } else {
      let userIndex = users.findIndex((item) => item.socketId === socketId);
      users.splice(userIndex, 1);
    }
    socket.leave(roomId);
    let onlinePeople = users.filter((item) => item.roomId === roomId);
    io.to(roomId).emit("onlinePeopleSuccess", {
      noOfPeopleOnline: onlinePeople.length,
      peopleOnline: onlinePeople,
    });
  });

  socket.on("listRooms", () => {
    socket.emit("storeRoom", rooms);
  });

  socket.on("sendMessage", (data) => {
    let roomId = data.roomId;
    let msg = data.msg;
    let socketId = socket.id;
    const userDetails = users.filter((user) => user.socketId === socketId);
    // msg = `${userDetails[0].userName}: ${msg}`;
    io.to(roomId).emit("receiveMessage", {
      msg,
      currentUser: userDetails[0].userName,
    });
  });
});

http.listen(3001, () => {
  console.log("Listening on port *: 3001");
});
