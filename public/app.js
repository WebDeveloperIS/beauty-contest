const socket = io();
const laserSound = new Audio("sounds/laser.mp3");
const winSound = new Audio("sounds/win.mp3");
const rulesSound = document.getElementById("rulesSound");

function join() {
  const username = document.getElementById("username").value;
  const room = document.getElementById("room").value;
  if(!username || !room) return alert("Ism va xona kiriting!");

  socket.emit("joinRoom",{username,room});
  
  document.getElementById("login").style.display="none";
  document.getElementById("rules").style.display="block"; // Qoidalar
  document.getElementById("roomName").innerText = room;

} 

function startGame() {
  document.getElementById("rules").style.display="none";
  document.getElementById("game").style.display="block";

  rulesSound.pause();   // O‘yin boshlanishida to‘xtatish
  rulesSound.currentTime = 0;
}

function sendNumber(){
  const num=parseInt(document.getElementById("num").value);
  if(num<1||num>100) return alert("1–100 oralig‘ida!");
  socket.emit("submitNumber", num);
}

function sendChat(){
  const msg=document.getElementById("chatInput").value;
  if(msg==="") return;
  socket.emit("chat", msg);
  document.getElementById("chatInput").value="";
}

socket.on("players", list => document.getElementById("players").innerText=list.join(", "));
socket.on("timer", t => document.getElementById("timer").innerText=t);

socket.on("result", d=>{
  laserSound.play();
  document.getElementById("result").innerHTML=`Target: ${d.target}<br>Winner: ${d.winner}`;
});

socket.on("scores", scores=>{
  const ul=document.getElementById("scores");
  ul.innerHTML="";
  for(let p in scores){
    ul.innerHTML+=`<li>${p}: ${scores[p]}</li>`;
  }
});

socket.on("chat", d=>{
  document.getElementById("chat").innerHTML+=`<p><b>${d.name}:</b> ${d.msg}</p>`;
});

socket.on("gameOver", w=>{
  winSound.play();
  alert("Winner: "+w);
});