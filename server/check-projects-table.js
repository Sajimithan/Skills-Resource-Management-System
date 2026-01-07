const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function checkProjects() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const [projects] = await connection.query('SELECT id, name, status FROM projects');
        console.table(projects);
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

checkProjects();
