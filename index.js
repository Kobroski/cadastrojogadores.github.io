// declaração de constantes e utilização das dependências necessárias
const mysql = require('mysql2');
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // o diretório onde as imagens serão armazenadas
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // nome do arquivo no momento do upload
    }
});
const upload = multer({ storage: storage });

// constante que recebe todas as funções da dependência express
const app = express();
app.use('/uploads', express.static('uploads'));
app.use(express.static('public'));

// armazena os dados da conexão
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'cadastros'
});

// cria a conexão e emite mensagem indicando seu status
connection.connect(function (err) {
    if (err) {
        console.error('Erro ', err);
        return;
    }
    console.log("Conexão ok");
});

// bodyParser serve para capturar os dados do formulário html
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", function (req, res) {
    res.send(`
    <html>
    <head>
        <title>Home</title>
    </head>
    <body>
        <h1>Sistema de Gerenciamento de Usuários</h1>
        <p><a href="http://localhost:8081/cadastros" >Cadastrar</a></p>
        <p><a href="http://localhost:8081/listar" >Listar</a></p>
    </body>
    </html>
    `);
});

// cria uma rota para direcionamento do formulário html
app.get("/cadastros", function (req, res) {
    res.sendFile(__dirname + "/cadastros.html");
});

// cria rota contendo a função que adiciona os dados ao banco
app.post('/adicionar', upload.single('imagem'), (req, res) => {

    if (!req.file) {
        console.log("Nenhum arquivo enviado");
        return res.json({
            success: false,
            error: "Nenhum arquivo enviado",
        });
    }

    const usuario = req.body.name; // Alteração: usar req.body.name em vez de req.body.usuario
    const senha = req.body.senha;
    const nick = req.body.name; // Alteração: usar req.body.name em vez de req.body.nick
    const bio = req.body.text; // Alteração: usar req.body.text em vez de req.body.bio
    const cidade = req.body.cidade;
    const estado = req.body.estado;
    const pais = req.body.pais;

    const imagemPath = req.file.filename;

    const values = [usuario, senha, nick, bio, cidade, estado, pais, imagemPath];
    const insert = "INSERT INTO jogadores(usuario, senha, nick, bio, cidade, estado, pais, imagem_path) VALUES(?,?,?,?,?,?,?,?)";

    connection.query(insert, values, function (err, result) {
        if (!err) {
            console.log("Inserido!");
            res.json({ success: true });
        } else {
            console.error("Erro ao inserir dados:", err);
            res.json({
                success: false,
                error: "Erro ao cadastrar",
            });
        }
    });
});

// Crie uma rota para listar os dados do banco de dados
app.get("/listar", function (req, res) {

    // Consulta SQL para selecionar todos os registros da tabela "jogadores"
    const selectAll = "SELECT * FROM jogadores";

    // Executa a consulta SQL
    connection.query(selectAll, function (err, rows) {
        if (!err) {

            // Envie os resultados como resposta para o jogador
            res.send(`
            <html>
            <head>
                <title>Perfil</title>
                <link rel="stylesheet" href="style.css">
            </head>
            <body>
            <p><a href="http://localhost:8081/cadastros">
            <h1>Perfil do Jogador</h1>
                <table>
                    <tr>
                        <th>usuario</th>
                        <th>nick</th>
                        <th>senha</th>
                        <th>bio</th>
                        <th>cidade</th>
                        <th>estado</th>
                        <th>pais</th>
                        <th>imagem_path</th>
                        <th>Ação</th>
                        <th>Deletar</th>
                    </tr>
                    ${rows.map(row => `
                        <tr>
                            <td>${row.usuario}</td>
                            <td>${row.nick}</td>
                            <td>${row.senha}</td>
                            <td>${row.bio}</td>
                            <td>${row.cidade}</td>
                            <td>${row.estado}</td>
                            <td>${row.pais}</td>
                            <td><img src="/uploads/${row.imagem_path}"
                            alt="Imagem de Perfil" style="width: 48px; height: 48px;"></td>
                            <td><a href="/atualizar-form/${row.codigo}">Editar</a></td>
                            <td><a href="/deletar/${row.codigo}">Deletar</a></td>
                        </tr>
                    `).join('')}
                </table>
            </body>
            </html>
        `);

        } else {
            console.log("Erro ao listar dados: ", err);
            res.status(500).send("Erro ao listar dados");
        }
    });
});

// ... (seu código anterior para outras rotas)

// cria a função que "ouve" a porta do servidor
app.listen(8081, function () {
    console.log("Servidor rodando na url http://localhost:8081");
});
