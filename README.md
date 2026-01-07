# Skills & Resource Management System

## Project Title and Description
**Skills & Resource Management System** is a comprehensive web application designed to help organizations manage their personnel, skills, and projects effectively. It allows for tracking of employee skills, assigning them to projects based on capability and availability, and visualizing resource utilization through dynamic dashboards.

The system features a **Smart Matching Algorithm** that recommends the best candidates for projects based on skill proficiency, availability, and historical performance ratings.

## Additional Feature: Advanced Skill Matching with Performance & Utilization

**Problem Solved**:
In traditional resource management, assigning personnel solely based on "skill matching" (e.g., "Person A knows React") often leads to failure because it ignores two critical factors:
1.  **Availability**: Is the person already overloaded with 3 other projects?
2.  **Performance**: They might "know" React, but have they performed well with it in past projects?

**My Solution**:
I went beyond simple keyword matching and built a **Weighted Efficiency Scoring System** that calculates a `Fit Score`, `Availability Score`, and `Performance Score` to generate an aggregate **"Overall Match %"**.

*   **Fit Score (60%)**: Checks if the candidate meets the *minimum proficiency level* required for each skill (not just if they have it). Gaps are highlighted as "Upskill Opportunities".
*   **Availability Score (20%)**: Calculates a "Time-Weighted Utilization" based on date overlaps with active projects. If a user is busy during the proposed project dates, their score drops.
*   **Performance Score (20%)**: Dynamically fetches the user's average rating for the *specific skills* required by the project from the `project_skill_ratings` table.

This creates a realistic "Best Fit" recommendation rather than just a list of names.

## Technology Stack

### Frontend
*   **Framework**: React.js 18 (Vite)
*   **Styling**: Tailwind CSS + Custom CSS Variables (Theme-Aware)
*   **State Management**: React Hooks (`useState`, `useEffect`, `useContext`)
*   **Routing**: React Router DOM 6
*   **Icons**: Lucide React
*   **Animations**: GSAP (GreenSock Animation Platform) for Magic Bento cards and transitions.
*   **Visualization**: Recharts for dashboard analytics.

### Backend
*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **Database Client**: `mysql2` (with connection pooling)
*   **Environment**: Dockerized Service

### Database
*   **DBMS**: MySQL 8.0+
*   **Structure**: Relational (3NF)

## Prerequisites
Before running the application, ensure you have the following installed:

*   **Node.js**: v18.0.0 or higher
*   **MySQL**: v8.0 or higher
*   **npm**: v9.0.0 or higher

## How to Run the Applications

### 1. Database Setup
1.  Open your MySQL client (Workbench, Command Line, etc.).
2.  Create a new database or use the default name `resource_management_db`.
3.  Import the `database/schema.sql` file to create all tables and seed initial data.

### 2. Backend Setup
You can run the backend either locally or via Docker.

**Option A: Local Node.js**
1.  Navigate to the server directory:
    ```bash
    cd server
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure environment variables:
    *   Create a `.env` file in the `server` directory.
    *   Add your DB credentials:
        ```
        DB_HOST=localhost
        DB_USER=root
        DB_PASSWORD=yourpassword
        DB_NAME=resource_management_db
        PORT=5000
        ```
4.  Start the server:
    ```bash
    npm run dev
    ```

**Option B: Docker**
1.  Build the image:
    ```bash
    cd server
    docker build -t skill-matrix-backend .
    ```
2.  Run the container (ensure your MySQL is accessible):
    ```bash
    docker run -p 5000:5000 --env-file .env -e DB_HOST=host.docker.internal skill-matrix-backend
    ```

### 3. Frontend Setup
1.  Navigate to the client directory:
    ```bash
    cd client
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
4.  Open your browser at `http://localhost:5173`.
