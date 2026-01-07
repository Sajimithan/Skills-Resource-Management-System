const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function checkData() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const [pCount] = await connection.query('SELECT COUNT(*) as count FROM personnel');
        const [sCount] = await connection.query('SELECT COUNT(*) as count FROM skills');
        const [projCount] = await connection.query('SELECT COUNT(*) as count FROM projects');
        const [asgnCount] = await connection.query('SELECT COUNT(*) as count FROM project_assignments');
        const [reqCount] = await connection.query('SELECT COUNT(*) as count FROM project_requirements');

        console.log('Personnel:', pCount[0].count);
        console.log('Skills:', sCount[0].count);
        console.log('Projects:', projCount[0].count);
        console.log('Assignments:', asgnCount[0].count);
        console.log('Requirements:', reqCount[0].count);

    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

checkData();
