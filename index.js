// index.js (BACK-END)

const express = require("express");
const ejs = require("ejs");
const http = require("http");
const path = require("path");
const socketIo = require("socket.io");
const mongoose = require("mongoose");

// Criando aplicação express e servidor HTTP
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Configuração de arquivos estáticos e EJS
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "public"));
app.engine("html", ejs.renderFile);
app.set("view engine", "html");

// Rota principal
app.get("/", (req, res) => {
  res.render("index.html");
});

// Conectar ao MongoDB
async function connectDB() {
  try {
    await mongoose.connect(
      "mongodb+srv://Giovana:aJn1CsroNtY6x0fY@cluster0.zsrgpf1.mongodb.net/"
    );
    console.log("✅ Conexão com o banco feita com sucesso!");
  } catch (err) {
    console.error("❌ Erro na conexão com o banco:", err);
  }
}

// Modelo de Post
const Post = mongoose.model("Post", {
  usuario: String,
  data_hora: String,
  post: String,
});

// Array local de posts
let posts = [];

// Conecta ao banco e carrega posts antigos
connectDB().then(() => {
  Post.find({})
    .then((previousMessages) => {
      posts = previousMessages;
      console.log("📌 Posts carregados:", posts.length);
    })
    .catch((err) => console.log(err));
});

// Conexão do Socket.IO
io.on("connection", (socket) => {
  console.log("👤 Novo usuário conectado: " + socket.id);

  // Envia posts antigos para o usuário novo
  socket.emit("previousMessages", posts);

  // Recebe um post novo
  socket.on("sendMessage", (data) => {
    const newPost = new Post(data);

    newPost
      .save()
      .then(() => {
        posts.push(newPost);
        // Manda para todos os outros usuários
        socket.broadcast.emit("receivedMessage", data);
        console.log("✅ Post salvo e enviado:", data);
      })
      .catch((err) => console.log(err));
  });
});

// Inicia servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});