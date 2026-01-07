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
        const [assignments] = await connection.query('SELECT project_id, personnel_id FROM project_assignments');

        console.log('Projects:', JSON.stringify(projects, null, 2));
        console.log('Assignments:', JSON.stringify(assignments, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

checkProjects();
