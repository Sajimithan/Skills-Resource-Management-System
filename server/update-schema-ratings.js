const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function updateSchema() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true
    });

    try {
        const schema = `
        CREATE TABLE IF NOT EXISTS project_skill_ratings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            project_id INT NOT NULL,
            personnel_id INT NOT NULL,
            skill_id INT NOT NULL,
            rating INT CHECK (rating BETWEEN 1 AND 5),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY (personnel_id) REFERENCES personnel(id) ON DELETE CASCADE,
            FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
            UNIQUE KEY unique_rating (project_id, personnel_id, skill_id)
        );
        `;

        console.log('Updating schema...');
        await connection.query(schema);
        console.log('Schema updated successfully.');
    } catch (err) {
        console.error('Error updating schema:', err);
    } finally {
        await connection.end();
    }
}

updateSchema();
