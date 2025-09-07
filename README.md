# Warehouse Data to PowerPoint Generation Service

## Description

This is a web-based utility designed to automate the creation of Microsoft PowerPoint (.pptx) presentations from warehouse data stored in a Supabase (PostgreSQL) database. The service consists of a Node.js backend API and a static HTML/JavaScript frontend. It enables users to dynamically generate customized, multi-slide presentations for one or more warehouse properties by providing their corresponding IDs.

## Features

  * **Dynamic Presentation Generation:** Creates complete PowerPoint files from database entries.
  * **Multi-Warehouse Support:** Accepts a comma-separated list of warehouse IDs to generate a single presentation with a dedicated slide for each property.
  * **Structured Slide Content:** Each warehouse is presented on a professionally formatted slide that includes:
      * A sidebar with detailed information organized into tables (Property Information, Specifications, Commercials).
      * A dynamic grid for up to four images with unique layouts based on the number of images.
  * **Interactive Web Portal:** A simple frontend provides a two-step workflow:
    1.  Fetch and preview warehouse details.
    2.  Select specific images for inclusion in the presentation.
    3.  Input custom data (Client Name, Requirements, Point of Contact) to personalize the final document.
    4.  Confirm details and download the generated `.pptx` file.
  * **Robust Image Handling:** The backend fetches images from their URLs, converts them to Base64, and embeds them directly into the PowerPoint file to prevent broken links and security warnings.

## Technology Stack

  * **Backend:**
      * Node.js
      * Express.js
      * Prisma ORM
      * `pptxgenjs`
      * `axios`
  * **Database:**
      * Supabase (PostgreSQL)
  * **Frontend:**
      * HTML5
      * CSS3
      * Vanilla JavaScript

## Prerequisites

Before you begin, ensure you have the following installed on your local machine:

  * Node.js (LTS version, e.g., v18.x or newer)
  * npm (or an equivalent package manager)
  * Access to a Supabase project with a configured database.

## Setup and Installation

To set up the project for local development, follow these steps:

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/WareOnGo/Warehouse-Proposal-Engine.git
    cd Warehouse-Proposal-Engine
    ```

2.  **Install backend dependencies:**
    Navigate to the backend project directory and run:

    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the root of the backend directory and add the required variables.

    ```env
    # Your PostgreSQL connection string from Supabase
    DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:5432/postgres"

    # The URL of your deployed frontend (for CORS)
    FRONTEND_URL="https://your-frontend-service-url.netlify.app"
    ```

4.  **Generate Prisma Client:**
    Ensure your `prisma/schema.prisma` file is correctly configured, then run:

    ```bash
    npx prisma generate
    ```

## Running the Application

  * **Backend (Development Mode):**
    To run the server with hot-reloading using `nodemon`, use the following command:

    ```bash
    npm run dev
    ```

    The server will start on the port defined in your code (default: 3001).

  * **Backend (Production Mode):**
    To run the server in a production environment, use:

    ```bash
    npm start
    ```

  * **Frontend:**
    To run the frontend locally, simply open the `index.html` file from your frontend directory in a web browser.

## API Endpoints

The backend server exposes the following API endpoints:

  * **`GET /health`**

      * Checks the health of the server and its connection to the database.
      * **Success Response (200 OK):** `{ "status": "ok", "message": "..." }`
      * **Error Response (503 Service Unavailable):** `{ "status": "error", "message": "..." }`

  * **`GET /api/warehouses`**

      * Fetches data for one or more warehouses.
      * **Query Parameters:** `ids` (comma-separated string of warehouse IDs).
      * **Example:** `/api/warehouses?ids=101,102`
      * **Success Response (200 OK):** An array of warehouse objects in JSON format.

  * **`POST /api/generate-ppt`**

      * Generates and returns a `.pptx` file.
      * **Request Body (JSON):**
        ```json
        {
          "ids": "101,102",
          "selectedImages": {
            "101": ["url1.jpg", "url2.jpg"],
            "102": ["url3.jpg"]
          },
          "customDetails": {
            "clientName": "Client Corp",
            "clientRequirement": "Location - 50000 sqft",
            "pocName": "Contact Person",
            "pocContact": "+91 1234567890"
          }
        }
        ```
      * **Success Response (200 OK):** A file stream of the generated `.pptx` presentation.

## Deployment

  * **Backend:** The Node.js application is configured for deployment on services like **Render**. Ensure the **Build Command** is set to `npm install && npx prisma generate` and all required environment variables (`DATABASE_URL`, `FRONTEND_URL`) are configured in the Render dashboard.
  * **Frontend:** The static frontend can be deployed on services like **Netlify**, **Vercel**, or **Render Static Sites**. Set the **Publish Directory** to the name of your frontend folder.
