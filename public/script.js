const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
const showChat = document.querySelector("#showChat");
const myId = document.querySelector("#myId");
const copyButton = document.querySelector("#copyButton");
const toUser = document.querySelector("#toUser");
const callButton = document.querySelector("#callButton");
const endButton = document.querySelector("#disconnectCallButton");
const showMoreOptions = document.querySelector("#showMoreOptions");
const mainDiv = document.querySelector(".main");
const mainRight = document.querySelector(".main__right");
const closeChat = document.querySelector("#closeChat");
const path = window.location.pathname.split("/");
const ROOM_ID = path[path.length - 1];

console.log(ROOM_ID);

showMoreOptions.addEventListener('click', () => {
  if (window.innerWidth <= 910) {
    mainRight.classList.toggle('main-right-floating');
  }
  else
  {
    mainDiv.classList.toggle("main-min");
  }
})

closeChat.addEventListener('click', () => {
  mainRight.classList.remove("main-right-floating");
})



const clock = () => {
  let date = new Date();
  let hours = date.getHours().toString().padStart(2, "0");
  let minutes = date.getMinutes().toString().padStart(2, "0");
  let seconds = date.getSeconds().toString().padStart(2, "0");
  let time = hours + ":" + minutes + ":" + seconds;
  document.querySelector("#currentTime").innerText = time;
}

setInterval(clock, 1000);

const user = prompt("Enter your name");

var peer = new Peer({
  host: 'localhost',
  port: 5000,
  path: '/peerjs',
  config: {
    'iceServers': [
      { url: 'stun:stun01.sipphone.com' },
      { url: 'stun:stun.ekiga.net' },
      { url: 'stun:stunserver.org' },
      { url: 'stun:stun.softjoys.com' },
      { url: 'stun:stun.voiparound.com' },
      { url: 'stun:stun.voipbuster.com' },
      { url: 'stun:stun.voipstunt.com' },
      { url: 'stun:stun.voxgratia.org' },
      { url: 'stun:stun.xten.com' },
      {
        url: 'turn:192.158.29.39:3478?transport=udp',
        credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
        username: '28224511:1379330808'
      },
      {
        url: 'turn:192.158.29.39:3478?transport=tcp',
        credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
        username: '28224511:1379330808'
      }
    ]
  },

  debug: 3
});

let chat = false
let myVideoStream;
navigator.mediaDevices
  .getUserMedia({
    audio: true,
    video: true,
  })
  .then((stream) => {
    
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    peer.on("call", (call) => {

      myVideoStream.getVideoTracks()[0].enabled = true;
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream, call.peer);

      });
    });

    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
    });
  });



callButton.addEventListener("click", () => {
  const receiverId = toUser.value;

 
  navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  }).then((stream) => {
   
    const call = peer.call(receiverId, stream);
    const video = document.createElement("video");

    call.on("stream", (userVideoStream) => {
      
      addVideoStream(video, userVideoStream);
    });

    call.on("close", () => {
      video.remove();
    });

    
  });
});

endButton.addEventListener("click", () => {
  peer.destroy();
  destroyVideo(myVideo, myVideoStream);
})

myVideo.muted = true;

copyButton.addEventListener("click", () => {
  myId.select();
  navigator.clipboard.writeText(myId.value);
});


const connectToNewUser = (userId, stream) => {
  const call = peer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
};


peer.on("open", (id) => {
  console.log('my id is' + id);
  socket.emit("join-room", ROOM_ID, id, user);
  myId.value = id;
});

const addVideoStream = (video, stream, divId = "") => {
  if(chat) showMoreOptions.classList.remove("hidden");
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
    video.setAttribute("id", divId);
    videoGrid.append(video);
  });
};


const destroyVideo = (video, stream) => {
  peer.destroy();
  socket.disconnect();
};


//Chat Section
let text = document.querySelector("#chat_message");
let send = document.getElementById("send");
let messages = document.querySelector(".messages");

send.addEventListener("click", (e) => {
  if (text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
  }
});

text.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
  }
});

const inviteButton = document.querySelector("#inviteButton");
const muteButton = document.querySelector("#muteButton");
const stopVideo = document.querySelector("#stopVideo");

muteButton.addEventListener("click", () => {
  
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    html = `<i class="fas fa-microphone-slash"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true;
    html = `<i class="fas fa-microphone"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  }
});

stopVideo.addEventListener("click", () => {
  
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    html = `<i class="fas fa-video-slash"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;
    html = `<i class="fas fa-video"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  }
});

inviteButton.addEventListener("click", (e) => {
  prompt(
    "Copy this link and send it to people you want to meet with",
    window.location.href
  );
});

socket.on("createMessage", (message, userName) => {
  messages.innerHTML =
    messages.innerHTML +
    `<div class="message">
        <b><i class="far fa-user-circle"></i> <span> ${userName === user ? "me" : userName
    }</span> </b>
        <span>${message}</span>
    </div>`;
});


socket.on("receive-whiteboard-data", (data) => {
  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 0, 0);
  };
  img.src = data;
});


function sendWhiteboardData() {
  const data = canvas.toDataURL();
  socket.emit("whiteboard-data", data);
}


//Whiteboard Section
let showWhiteBoard = document.getElementById("showWhiteBoard");
let whiteboardContainer = document.getElementById("whiteboardContainer");
let canvas = document.getElementById("whiteboard");
let chatmessages = document.getElementById("chatmessages");
let showWhiteBoardFlag = false;
let strokeColor = document.getElementById("strokeColor");
let undoDraw = document.getElementById("undoDraw");
let closeWhiteBoard = document.getElementById("closeWhiteBoard");
let downloadWhiteBoardImage = document.getElementById("downloadWhiteBoardImage");



downloadWhiteBoardImage.addEventListener("click", () => {
  var link = document.createElement('a');
  link.download = 'whiteboard.png';
  link.href = canvas.toDataURL()
  link.click();
  link.delete;
})

undoDraw.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
})

showWhiteBoard.addEventListener("click", () => {

  whiteboardContainer.classList.remove("hidden");

})

closeWhiteBoard.addEventListener("click", () => {
  whiteboardContainer.classList.add("hidden");
})



let ctx = whiteboard.getContext("2d");



ctx.fillRect(0, 0, canvas.width, canvas.height);


const resizeCanvas = () => {
  const tempImage = new Image();
  tempImage.src = canvas.toDataURL();

  const canvasOffsetX = canvas.offsetLeft;
  const canvasOffsetY = canvas.offsetTop;
  canvas.height = window.innerHeight - canvasOffsetY;
  canvas.width = window.innerWidth - canvasOffsetX;

  ctx.drawImage(tempImage, 0, 0, canvas.width, canvas.height);
};

window.addEventListener('resize', resizeCanvas);

const canvasOffsetX = canvas.offsetLeft;
const canvasOffsetY = canvas.offsetTop;
canvas.height = window.innerHeight - canvasOffsetY;
canvas.width = window.innerWidth - canvasOffsetX;
let isPainting = false;
let startX;
let startY;
let drawColor = 'black';
let lineCap = 'round';
let drawWidth = "5"


let undoArray = [];

const undoButton = document.getElementById("undoDraw");
undoButton.addEventListener("click", undo);




function undo() {
  if (undoArray.length > 1) {
    undoArray.pop();
    ctx.putImageData(undoArray[undoArray.length - 1], 0, 0);
  }
}


strokeColor.addEventListener("change", () => {
  drawColor = strokeColor.value;
})

const start = (e) => {
  isPainting = true;
  const rect = canvas.getBoundingClientRect();
  startX = e.clientX - rect.left;
  startY = e.clientY - rect.top;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  e.preventDefault();
}

const draw = (e) => {
  console.log(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop);
  if (isPainting) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.lineTo(x, y)
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = drawColor;
    ctx.lineCap = lineCap;
    ctx.lineJoin = 'round';
    ctx.stroke();
    sendWhiteboardData();
  }

}





function stop(e) {
  if (isPainting) {
    ctx.stroke();
    ctx.closePath();
    isPainting = false;
    undoArray.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  }

  e.preventDefault();
  sendWhiteboardData()
}



canvas.addEventListener('touchstart', start, false);
canvas.addEventListener('touchmove', draw, false);
canvas.addEventListener('mousedown', start, false);
canvas.addEventListener('mousemove', draw, false);

canvas.addEventListener('touchend', stop, false);
canvas.addEventListener('mouseup', stop, false);
canvas.addEventListener('touchend', stop, false);


