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
        const [utilization] = await connection.query(`
            SELECT p.name, COUNT(pa.project_id) as project_count
            FROM personnel p
            LEFT JOIN project_assignments pa ON p.id = pa.personnel_id
            LEFT JOIN projects proj ON pa.project_id = proj.id
            WHERE proj.status = 'Active' OR proj.status IS NULL
            GROUP BY p.id
            ORDER BY project_count DESC
            LIMIT 10
        `);

        console.log('Utilization Data:');
        console.log(JSON.stringify(utilization, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

checkData();
