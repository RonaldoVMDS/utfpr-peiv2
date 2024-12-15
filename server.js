const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
        db.run(`
            CREATE TABLE IF NOT EXISTS confirmations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                aluno TEXT NOT NULL,
                ra TEXT NOT NULL,
                professor TEXT NOT NULL
            )
        `);
    }
});

app.get('/', (req, res) => {
    const aluno = req.query.Aluno;
    const ra = req.query.RA;

    if (!aluno || !ra) {
        return res.status(400).send(`
            <h1>Erro!</h1>
            <p>Os parâmetros "Aluno" e "RA" são obrigatórios na URL.</p>
        `);
    }

    res.sendFile(__dirname + '/public/index.html');
});

app.post('/submit', (req, res) => {
    const { aluno, ra, nome_professor } = req.body;

    if (!aluno || !ra || !nome_professor) {
        return res.status(400).send('<h1>Erro: Dados incompletos!</h1>');
    }

    db.run(
        `INSERT INTO confirmations (aluno, ra, professor) VALUES (?, ?, ?)`,
        [aluno, ra, nome_professor],
        (err) => {
            if (err) {
                console.error(err.message);
                return res.status(500).send('<h1>Erro ao salvar no banco de dados.</h1>');
            }

            res.redirect('/feedback.html?status=success&aluno=' + aluno + '&ra=' + ra + '&nome_professor=' + nome_professor);
        }
    );
});

app.get('/feedback.html', (req, res) => {
    const status = req.query.status;
    const professor = req.query.nome_professor || 'Professor';

    if (status === 'success') {
        res.send(`
            <!DOCTYPE html>
            <html lang="pt-br">
            
            <head>
                <title>Confirmação de Leitura</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
                <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>
                <link rel="stylesheet" href="css/styles.css">
            </head>
            
            <body>
                <div class="container d-flex align-items-center justify-content-center vh-100">
                    <div class="confirm-card text-center">
                        <div class="text-center mb-3">
                            <a href="#">
                                <img src="../img/UTFPR_logo.png" alt="Logo UTFPR" width="250" height="96">
                            </a>
                        </div>
                        <h3 class="mb-4">Obrigado!</h3>
                        <div class="alert alert-success">
                            <p>Obrigado, ${professor}, por confirmar a leitura!</p>
                        </div>
                    </div>
                </div>
            </body>
            
            </html>
        `);
    } else {
        res.send(`
            <!DOCTYPE html>
            <html lang="pt-br">
            
            <head>
                <title>Erro na Confirmação</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
                <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>
                <link rel="stylesheet" href="css/styles.css">
            </head>
            
            <body>
                <div class="container d-flex align-items-center justify-content-center vh-100">
                    <div class="confirm-card text-center">
                        <div class="text-center mb-3">
                            <a href="#">
                                <img src="../img/UTFPR_logo.png" alt="Logo UTFPR" width="250" height="96">
                            </a>
                        </div>
                        <h3 class="mb-4">Erro!</h3>
                        <div class="alert alert-danger">
                            <p>Ocorreu um erro ao registrar a confirmação. Tente novamente mais tarde.</p>
                        </div>
                    </div>
                </div>
            </body>
            
            </html>
        `);
    }
});

app.get('/historico', async (req, res) => {
    try {
        // Consultar os dados do banco
        db.all('SELECT aluno, ra, professor FROM confirmations', [], (err, rows) => {
            if (err) {
                console.error('Erro ao buscar dados do histórico:', err);
                return res.status(500).send('Erro ao carregar o histórico.');
            }

            // Gerar o HTML da tabela
            let tableRows = rows.map(row => `
                <tr>
                    <td>${row.aluno}</td>
                    <td>${row.ra}</td>
                    <td>${row.professor}</td>
                </tr>
            `).join('');

            // Enviar o HTML completo
            res.send(`
                <!DOCTYPE html>
                <html lang="pt-br">
                <head>
                    <title>Histórico de Confirmações</title>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
                    <link rel="stylesheet" href="css/styles.css">
                </head>
                <body>
                    <div class="container mt-5">
                        <h1 class="mb-4 text-center">Histórico de Confirmações</h1>
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Aluno</th>
                                    <th>RA</th>
                                    <th>Professor</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tableRows}
                            </tbody>
                        </table>
                    </div>
                </body>
                </html>
            `);
        });
    } catch (error) {
        console.error('Erro ao buscar dados do histórico:', error);
        res.status(500).send('Erro ao carregar o histórico.');
    }
});



app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
