const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function check() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const [rows] = await connection.query('DESCRIBE project_skill_ratings');
        console.log('Project Skill Ratings Table:');
        console.table(rows);

        const [data] = await connection.query('SELECT * FROM project_skill_ratings');
        console.log('Current Ratings Data:');
        console.table(data);
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await connection.end();
    }
}

check();
